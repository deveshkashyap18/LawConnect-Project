import jwt from "jsonwebtoken";
import { Lawyer } from "../models/Lawyer.js";
import { User } from "../models/User.js";

const authRequired = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Model = decoded.role === "lawyer" ? Lawyer : User;
    const user = await Model.findById(decoded.userId).lean();
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("[AUTH ERROR]", error.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

const requireVerifiedLawyer = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "lawyer") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (!req.user.verified) {
    return res.status(403).json({ 
      message: "Access denied. Lawyer profile pending verification.",
      code: "LAWYER_VERIFICATION_PENDING" 
    });
  }

  req.lawyerProfile = req.user;
  next();
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied." });
  }
  next();
};

export { adminOnly, authRequired, requireRole, requireVerifiedLawyer };
