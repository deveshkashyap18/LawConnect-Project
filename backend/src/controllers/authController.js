import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { Lawyer } from "../models/Lawyer.js";
import { User } from "../models/User.js";

import { getAvatar } from "../lib/avatarUtils.js";
import { sendOtpEmail } from "../lib/emailService.js";

const sanitizeUser = (user) => {
  const nextUser = { ...user };
  delete nextUser.passwordHash;
  return nextUser;
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing required environment variable: JWT_SECRET");
  }

  return process.env.JWT_SECRET;
};

const generateToken = (user) =>
  jwt.sign({ userId: user._id.toString(), role: user.role }, getJwtSecret(), {
    expiresIn: "24h",
  });

const hydrateUser = async (userDocument) => {
  const baseUser = sanitizeUser(userDocument.toObject ? userDocument.toObject() : userDocument);
  baseUser.id = baseUser._id.toString();

  // If it's already a lawyer profile, just return it as is (hydrated)
  if (baseUser.role === "lawyer") {
    return {
      ...baseUser,
      lawyerProfileId: baseUser.id,
      verified: baseUser.verified || false,
    };
  }

  return baseUser;
};

const otpStorage = new Map();

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Check if user exists in either collection
    const [userExists, lawyerExists] = await Promise.all([
      User.findOne({ email: normalizedEmail }).lean(),
      Lawyer.findOne({ email: normalizedEmail }).lean(),
    ]);

    if (userExists || lawyerExists) {
      return res.status(400).json({ message: "A user with this email already exists." });
    }

    // Generate secure 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    
    // Store OTP in-memory with 5 minutes expiry
    otpStorage.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log("\n========================================");
    console.log(`📨 VERIFICATION OTP FOR ${normalizedEmail} IS: ${otp}`);
    console.log("========================================\n");

    // Send email via Gmail transporter
    sendOtpEmail(normalizedEmail, otp).catch((err) => {
      console.error("Failed to send OTP email asynchronously:", err);
    });

    return res.status(200).json({ 
      message: "Verification OTP has been sent to your email."
    });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const signup = async (req, res) => {
  const { name, email, password, role, otp, ...rest } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const nextRole = role || "client";

  // Validate OTP
  const otpRecord = otpStorage.get(normalizedEmail);
  if (!otpRecord) {
    return res.status(400).json({ message: "OTP not found. Please request a new OTP." });
  }

  if (Date.now() > otpRecord.expiresAt) {
    otpStorage.delete(normalizedEmail);
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  if (String(otpRecord.otp) !== String(otp || "").trim()) {
    return res.status(400).json({ message: "Incorrect OTP. Please enter the correct verification code." });
  }

  // Clear OTP upon success
  otpStorage.delete(normalizedEmail);

  // Check if user exists in either collection
  const [userExists, lawyerExists] = await Promise.all([
    User.findOne({ email: normalizedEmail }).lean(),
    Lawyer.findOne({ email: normalizedEmail }).lean(),
  ]);

  if (userExists || lawyerExists) {
    return res.status(400).json({ message: "A user with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const avatar = getAvatar(name);

  let newUser;
  if (nextRole === "lawyer") {
    newUser = await Lawyer.create({
      name,
      email: normalizedEmail,
      role: "lawyer",
      passwordHash,
      avatar,
      ...rest,
    });
  } else {
    newUser = await User.create({
      name,
      email: normalizedEmail,
      role: nextRole,
      passwordHash,
      avatar,
      ...rest,
    });
  }

  const token = generateToken(newUser);
  return res.status(201).json({ user: await hydrateUser(newUser), token });
};

const login = async (req, res) => {
  const { email, password, role } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  let user;
  if (role === "lawyer") {
    user = await Lawyer.findOne({ email: normalizedEmail });
  } else {
    user = await User.findOne({ email: normalizedEmail, role });
  }

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  // Safety check: ensure passwordHash exists to prevent bcrypt crash
  if (!user.passwordHash) {
    console.error(`Login failed: Password hash missing for user ${normalizedEmail}`);
    return res.status(401).json({ message: "Password not set for this account. Please use Google Login or reset your password." });
  }

  const matches = await bcrypt.compare(String(password || ""), user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = generateToken(user);
  return res.status(200).json({ user: await hydrateUser(user), token });
};

const me = async (req, res) => res.status(200).json({ user: await hydrateUser(req.user) });

const logout = async (_req, res) => res.status(204).send();

const updateMe = async (req, res) => {
  const { name, phone, location, bio, avatar, email, currentPassword, newPassword } = req.body;
  const role = req.user.role;
  const Model = role === "lawyer" ? Lawyer : User;

  const user = await Model.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const [existingUser, existingLawyer] = await Promise.all([
      User.findOne({ email: normalizedEmail, _id: { $ne: user._id } }).lean(),
      Lawyer.findOne({ email: normalizedEmail, _id: { $ne: user._id } }).lean(),
    ]);

    if (existingUser || existingLawyer) {
      return res.status(400).json({ message: "This email is already in use." });
    }
    user.email = normalizedEmail;
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (location !== undefined) user.location = location;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required." });
    }

    const matches = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!matches) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  }

  await user.save();
  return res.status(200).json({ user: await hydrateUser(user) });
};

export { login, logout, me, signup, updateMe, sendOtp };
