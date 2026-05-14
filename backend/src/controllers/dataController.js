import { Booking } from "../models/Booking.js";
import { Case } from "../models/Case.js";
import { Lawyer } from "../models/Lawyer.js";
import { Message } from "../models/Message.js";
import { Review } from "../models/Review.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { getIo } from "../socket.js";

const toSlotDto = (slot) => ({
  id: slot._id?.toString(),
  lawyerId: slot.lawyerId?.toString() || "",
  bookingId: slot.bookingId?.toString() || "",
  day: slot.day || "",
  date: slot.date || "",
  startTime: slot.startTime,
  endTime: slot.endTime,
  duration: slot.duration || 30,
  status: slot.status || (slot.isBooked ? "booked" : "available"),
  isBooked: Boolean(slot.isBooked || slot.status === "booked"),
});

const toLawyerDto = (lawyer) => ({
  id: lawyer._id.toString(),
  userId: lawyer.userId?.toString() || "",
  email: lawyer.email,
  name: lawyer.name,
  role: lawyer.role,
  membershipTier: lawyer.membershipTier,
  specialization: lawyer.specialization,
  experience: lawyer.experience,
  hourlyRate: lawyer.hourlyRate || 1000,
  rating: lawyer.rating,
  totalReviews: lawyer.totalReviews,
  location: lawyer.location || "India",
  bio: lawyer.bio || `${lawyer.name} is available on LAWCONNECT for legal consultation and case support.`,
  verified: lawyer.verified,
  reputationScore: lawyer.reputationScore,
  barId: lawyer.barId,
  availability: lawyer.availability,
  avatar: lawyer.avatar,
  isPriority: lawyer.isPriority,
  isSponsored: lawyer.isSponsored,
  consultationSlots: (lawyer.consultationSlots || []).map(toSlotDto),
  verificationStatus: lawyer.verified ? "verified" : "pending",
});

const toUserDto = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone || "",
  location: user.location || "",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const toCaseDto = (caseItem) => ({
  id: caseItem._id.toString(),
  clientId: caseItem.clientId?.toString(),
  lawyerId: caseItem.lawyerId?.toString(),
  title: caseItem.title,
  description: caseItem.description,
  status: caseItem.status,
  createdAt: caseItem.createdAt,
  updatedAt: caseItem.updatedAt,
  hearingDates: (caseItem.hearingDates || []).map((h) => ({
    id: h._id?.toString(),
    date: h.date,
    title: h.title,
    location: h.location,
    notes: h.notes,
  })),
  documents: (caseItem.documents || []).map((d) => ({
    id: d._id?.toString(),
    name: d.name,
    type: d.type,
    size: d.size,
    uploadedAt: d.uploadedAt,
    uploadedBy: d.uploadedBy,
    url: d.url,
  })),
  timeline: (caseItem.timeline || []).map((t) => ({
    id: t._id?.toString(),
    date: t.date,
    title: t.title,
    description: t.description,
    type: t.type,
    addedByRole: t.addedByRole || (["Progress Update", "Client Update"].includes(t.title) ? "client" : "lawyer"),
  })),
});

const toReviewDto = (review) => ({
  id: review._id.toString(),
  clientId: review.clientId?.toString(),
  clientName: review.clientName,
  lawyerId: review.lawyerId?.toString(),
  rating: review.rating,
  comment: review.comment,
  date: review.date,
});

const toMessageDto = (message) => ({
  id: message._id.toString(),
  senderId: message.senderId?.toString(),
  senderName: message.senderName,
  receiverId: message.receiverId?.toString(),
  content: message.content,
  attachment: message.attachment,
  bookingId: message.bookingId?.toString() || "",
  timestamp: message.timestamp,
  read: message.read,
});

const toTransactionDto = (transaction) => ({
  id: transaction._id.toString(),
  bookingId: transaction.bookingId?.toString() || "",
  clientId: transaction.clientId?.toString(),
  clientName: transaction.clientName,
  lawyerId: transaction.lawyerId?.toString(),
  lawyerName: transaction.lawyerName,
  caseTitle: transaction.caseTitle,
  amount: transaction.amount,
  currency: transaction.currency,
  status: transaction.status,
  paidAt: transaction.paidAt,
  method: transaction.method,
});

const toBookingDto = (b) => ({
  id: b._id.toString(),
  clientId: (b.clientId?._id || b.clientId)?.toString(),
  lawyerId: (b.lawyerId?._id || b.lawyerId)?.toString(),
  caseId: b.caseId?.toString() || null,
  slotId: b.slotId || "",
  clientName: b.clientName,
  clientAvatar: b.clientId?.avatar || "",
  lawyerName: b.lawyerName,
  lawyerAvatar: b.lawyerId?.avatar || "",
  date: b.date,
  timeSlot: b.timeSlot,
  status: b.status,
  notes: b.notes,
  amount: b.amount,
  paymentStatus: b.paymentStatus,
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});

const emitLawyerSlotsUpdated = (lawyer) => {
  try {
    const io = getIo();
    io.emit("lawyer_slots_updated", {
      lawyerId: lawyer._id.toString(),
      userId: lawyer.userId?.toString() || "",
      slots: lawyer.consultationSlots.map(toSlotDto),
    });
  } catch (error) {
    console.error("Socket emission failed:", error);
  }
};

const emitBookingUpdated = (booking) => {
  try {
    const io = getIo();
    io.to(booking.clientId?.toString()).emit("booking_updated", toBookingDto(booking));
    io.to(booking.lawyerId?.toString()).emit("booking_updated", toBookingDto(booking));
  } catch (error) {
    console.error("Socket emission failed:", error);
  }
};

const timeToMinutes = (timeValue) => {
  const [hours, minutes] = String(timeValue || "").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return NaN;
  }

  return hours * 60 + minutes;
};

const getSlotValidation = ({ startTime, endTime }) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;

  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
    return { error: "Invalid start or end time." };
  }

  if (startMinutes < 10 * 60 || endMinutes > 16 * 60) {
    return { error: "Slots must stay between 10:00 AM and 4:00 PM." };
  }

  if (duration <= 0) {
    return { error: "End time must be after start time." };
  }

  if (duration !== 45) {
    return { error: "Each consultation slot must be exactly 45 minutes." };
  }

  return { duration };
};

const getLawyers = async (req, res) => {
  const {
    q = "",
    specialization = "",
    location = "",
    verified = "",
    minExperience = "",
    maxExperience = "",
    minRating = "",
    minPrice = "",
    maxPrice = "",
  } = req.query;
  const filters = {};

  if (specialization) {
    filters.specialization = { $regex: String(specialization), $options: "i" };
  }
  if (location) {
    filters.location = { $regex: String(location), $options: "i" };
  }
  if (verified === "true") {
    filters.verified = true;
  }
  if (minExperience || maxExperience) {
    filters.experience = {};
    if (minExperience) filters.experience.$gte = Number(minExperience);
    if (maxExperience) filters.experience.$lte = Number(maxExperience);
  }
  if (minRating) {
    filters.rating = { ...(filters.rating || {}), $gte: Number(minRating) };
  }
  if (minPrice || maxPrice) {
    filters.hourlyRate = {};
    if (minPrice) filters.hourlyRate.$gte = Number(minPrice);
    if (maxPrice) filters.hourlyRate.$lte = Number(maxPrice);
  }

  const viewerRole = req.user?.role;
  if (viewerRole !== "admin") {
    filters.verified = true;
  }

  let lawyers = await Lawyer.find(filters).lean();

  if (q) {
    const normalizedQuery = String(q).trim().toLowerCase();
    lawyers = lawyers.filter(
      (lawyer) =>
        lawyer.name.toLowerCase().includes(normalizedQuery) ||
        lawyer.specialization.some((item) => item.toLowerCase().includes(normalizedQuery)) ||
        lawyer.location.toLowerCase().includes(normalizedQuery),
    );
  }

  return res.status(200).json({ lawyers: lawyers.map(toLawyerDto) });
};

const getLawyerById = async (req, res) => {
  const lawyer = await Lawyer.findById(req.params.id).lean();
  if (!lawyer) {
    return res.status(404).json({ message: "Lawyer not found." });
  }

  const isAdmin = req.user?.role === "admin";
  const isOwner = req.user?._id && lawyer.userId?.toString() === req.user._id.toString();
  if (!lawyer.verified && !isAdmin && !isOwner) {
    return res.status(404).json({ message: "Lawyer not found." });
  }

  const reviews = await Review.find({ lawyerId: req.params.id }).lean();
  return res.status(200).json({
    lawyer: toLawyerDto(lawyer),
    reviews: reviews.map(toReviewDto),
  });
};

const getCases = async (req, res) => {
  const { role, _id: userId } = req.user;
  let filter = {};

  if (role === "client") {
    filter = { clientId: userId };
  } else if (role === "lawyer") {
    filter = { lawyerId: userId };
  }

  const cases = await Case.find(filter).sort({ createdAt: -1 }).lean();
  return res.status(200).json({ cases: cases.map(toCaseDto) });
};

const createCase = async (req, res) => {
  const { lawyerId, title, description } = req.body;
  if (!lawyerId || !title || !description) {
    return res.status(400).json({ message: "lawyerId, title and description required." });
  }

  const lawyer = await Lawyer.findById(lawyerId).select("verified").lean();
  if (!lawyer || !lawyer.verified) {
    return res.status(404).json({ message: "Verified lawyer not found." });
  }

  const newCase = await Case.create({
    clientId: req.user._id,
    lawyerId,
    title,
    description,
    status: "pending",
    timeline: [
      {
        date: new Date().toISOString().split("T")[0],
        title: "Consultation Request Sent",
        description: "Awaiting lawyer acceptance.",
        type: "update",
      },
    ],
  });

  return res.status(201).json({ caseItem: toCaseDto(newCase.toObject()) });
};

const updateCaseStatus = async (req, res) => {
  const { status } = req.body;
  if (!["pending", "active", "closed", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  const caseItem = await Case.findById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ message: "Case not found." });
  }

  if (req.user.role === "client") {
    return res.status(403).json({ message: "Clients cannot change case status." });
  }

  if (req.user.role === "lawyer") {
    if (!req.user.verified) {
      return res.status(403).json({ message: "Your lawyer account is pending verification." });
    }

    if (req.user._id.toString() !== caseItem.lawyerId.toString()) {
      return res.status(403).json({ message: "You can only update your assigned cases." });
    }
  }

  caseItem.status = status;
  caseItem.timeline.push({
    date: new Date().toISOString().split("T")[0],
    title: `Case Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    description: `The case status was successfully updated to ${status}.`,
    type: "update",
  });

  await caseItem.save();
  const dto = toCaseDto(caseItem.toObject());

  try {
    const io = getIo();
    io.to(caseItem.clientId.toString()).emit("case_update", dto);
    io.to(caseItem.lawyerId.toString()).emit("case_update", dto);
  } catch (error) {
    console.error("Socket emission failed:", error);
  }

  return res.status(200).json({ caseItem: dto });
};

const addCaseTimelineEvent = async (req, res) => {
  const { title, description, type } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: "title and description are required." });
  }

  const caseItem = await Case.findById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ message: "Case not found." });
  }

  if (req.user.role === "client" && caseItem.clientId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only update your own cases." });
  }

  if (req.user.role === "lawyer") {
    if (!req.user.verified) {
      return res.status(403).json({ message: "Your lawyer account is pending verification." });
    }

    if (req.user._id.toString() !== caseItem.lawyerId.toString()) {
      return res.status(403).json({ message: "You can only update your assigned cases." });
    }
  }

  caseItem.timeline.push({
    date: new Date().toISOString().split("T")[0],
    title,
    description,
    type: type || "update",
    addedByRole: req.user.role,
  });
  await caseItem.save();

  const dto = toCaseDto(caseItem.toObject());

  try {
    const io = getIo();
    io.to(caseItem.clientId.toString()).emit("timeline_update", dto);
    io.to(caseItem.lawyerId.toString()).emit("timeline_update", dto);
  } catch (error) {
    console.error("Socket emission failed:", error);
  }

  return res.status(200).json({ caseItem: dto });
};

const getMessages = async (req, res) => {
  const userId = req.user._id;
  const messages = await Message.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  })
    .sort({ createdAt: 1 })
    .lean();

  return res.status(200).json({ messages: messages.map(toMessageDto) });
};

const createMessage = async (req, res) => {
  const { receiverId, content, attachment, bookingId } = req.body;
  if (!receiverId || (!content && !attachment)) {
    return res.status(400).json({ message: "receiverId and content (or attachment) are required." });
  }

  const sender = req.user;
  let linkedBooking = null;

  if (bookingId) {
    linkedBooking = await Booking.findById(bookingId).lean();
  }

  if (!linkedBooking) {
    if (sender.role === "client") {
      linkedBooking = await Booking.findOne({
        clientId: sender._id,
        lawyerId: receiverId,
        status: { $in: ["pending", "approved", "completed"] },
      }).lean();
    } else if (sender.role === "lawyer") {
      linkedBooking = await Booking.findOne({
        clientId: receiverId,
        lawyerId: sender._id,
        status: { $in: ["pending", "approved", "completed"] },
      }).lean();
    }
  }

  if (!linkedBooking) {
    return res.status(403).json({
      message: "Messaging is available only after a consultation booking exists.",
    });
  }

  const message = await Message.create({
    senderId: sender._id,
    senderName: sender.name,
    receiverId,
    content: content ? String(content).trim() : "",
    attachment: attachment || null,
    bookingId: linkedBooking._id,
    timestamp: new Date().toISOString(),
    read: false,
  });

  const dto = toMessageDto(message.toObject());
  return res.status(201).json({ message: dto });
};

const getLawyerSlots = async (req, res) => {
  return res.status(200).json({ slots: (req.user.consultationSlots || []).map(toSlotDto) });
};

const createLawyerSlot = async (req, res) => {
  const { date, startTime, endTime } = req.body;
  if (!date || !startTime || !endTime) {
    return res.status(400).json({ message: "date, startTime, and endTime are required." });
  }

  const slotValidation = getSlotValidation({ startTime, endTime });
  if (slotValidation.error) {
    return res.status(400).json({ message: slotValidation.error });
  }

  const lawyer = await Lawyer.findById(req.user._id);
  if (!lawyer) {
    return res.status(404).json({ message: "Lawyer profile not found." });
  }

  const duplicate = lawyer.consultationSlots.find(
    (slot) => slot.date === date && slot.startTime === startTime && slot.endTime === endTime,
  );
  if (duplicate) {
    return res.status(409).json({ message: "A slot already exists for this date and time." });
  }

  lawyer.consultationSlots.push({
    lawyerId: lawyer._id,
    date,
    startTime,
    endTime,
    duration: slotValidation.duration,
    status: "available",
    isBooked: false,
  });
  await lawyer.save();
  emitLawyerSlotsUpdated(lawyer);

  return res.status(201).json({
    slot: toSlotDto(lawyer.consultationSlots[lawyer.consultationSlots.length - 1]),
    slots: lawyer.consultationSlots.map(toSlotDto),
  });
};

const updateLawyerSlot = async (req, res) => {
  const { date, startTime, endTime } = req.body;
  if (!date || !startTime || !endTime) {
    return res.status(400).json({ message: "date, startTime, and endTime are required." });
  }

  const slotValidation = getSlotValidation({ startTime, endTime });
  if (slotValidation.error) {
    return res.status(400).json({ message: slotValidation.error });
  }

  const lawyer = await Lawyer.findById(req.user._id);
  if (!lawyer) {
    return res.status(404).json({ message: "Lawyer profile not found." });
  }

  const slot = lawyer.consultationSlots.id(req.params.slotId);
  if (!slot) {
    return res.status(404).json({ message: "Slot not found." });
  }
  if (slot.status === "booked" || slot.isBooked) {
    return res.status(400).json({ message: "Booked slots cannot be edited." });
  }

  slot.date = date;
  slot.startTime = startTime;
  slot.endTime = endTime;
  slot.duration = slotValidation.duration;
  await lawyer.save();
  emitLawyerSlotsUpdated(lawyer);

  return res.status(200).json({
    slot: toSlotDto(slot),
    slots: lawyer.consultationSlots.map(toSlotDto),
  });
};

const deleteLawyerSlot = async (req, res) => {
  const lawyer = await Lawyer.findById(req.user._id);
  if (!lawyer) {
    return res.status(404).json({ message: "Lawyer profile not found." });
  }

  const slot = lawyer.consultationSlots.id(req.params.slotId);
  if (!slot) {
    return res.status(404).json({ message: "Slot not found." });
  }
  if (slot.status === "booked" || slot.isBooked) {
    return res.status(400).json({ message: "Booked slots cannot be deleted." });
  }

  slot.deleteOne();
  await lawyer.save();
  emitLawyerSlotsUpdated(lawyer);

  return res.status(200).json({ slots: lawyer.consultationSlots.map(toSlotDto) });
};

const getAdminOverview = async (_req, res) => {
  const [users, lawyers, cases, messages, reviews, transactions, bookings] = await Promise.all([
    User.find({}).lean(),
    Lawyer.find({}).lean(),
    Case.find({}).lean(),
    Message.find({}).lean(),
    Review.find({}).lean(),
    Transaction.find({}).sort({ createdAt: -1 }).lean(),
    Booking.find({}).sort({ createdAt: -1 }).lean(),
  ]);

  const totalRevenue = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  return res.status(200).json({
    stats: {
      totalUsers: users.filter((u) => u.role === "client").length,
      totalLawyers: lawyers.filter((l) => l.verified).length,
      pendingLawyers: lawyers.filter((l) => !l.verified).length,
      totalTransactions: transactions.length,
      totalBookings: bookings.length,
      totalRevenue,
      activeCases: cases.filter((c) => c.status === "active").length,
      openDisputes: transactions.filter((t) => t.status === "disputed").length,
      totalMessages: messages.length,
      totalReviews: reviews.length,
    },
    users: users.filter((u) => u.role === "client").map(toUserDto),
    lawyers: lawyers.map(toLawyerDto),
    bookings: bookings.map(toBookingDto),
    transactions: transactions.map(toTransactionDto),
  });
};

const updateLawyerVerification = async (req, res) => {
  const { verified } = req.body;
  const lawyer = await Lawyer.findById(req.params.id);
  if (!lawyer) {
    return res.status(404).json({ message: "Lawyer not found." });
  }

  lawyer.verified = Boolean(verified);
  await lawyer.save();

  return res.status(200).json({ lawyer: toLawyerDto(lawyer.toObject()) });
};

const deleteLawyerSlotByAdmin = async (req, res) => {
  const lawyer = await Lawyer.findById(req.params.id);
  if (!lawyer) {
    return res.status(404).json({ message: "Lawyer not found." });
  }

  const slot = lawyer.consultationSlots.id(req.params.slotId);
  if (!slot) {
    return res.status(404).json({ message: "Slot not found." });
  }
  if (slot.status === "booked" || slot.isBooked) {
    return res.status(400).json({ message: "Booked slots cannot be removed." });
  }

  slot.deleteOne();
  await lawyer.save();

  return res.status(200).json({ lawyer: toLawyerDto(lawyer.toObject()) });
};

const deleteLawyerByAdmin = async (req, res) => {
  const lawyer = await Lawyer.findById(req.params.id);
  if (!lawyer) {
    return res.status(404).json({ message: "Lawyer not found." });
  }

  if (lawyer.userId) {
    await User.deleteOne({ _id: lawyer.userId });
  }
  await Booking.deleteMany({ lawyerId: lawyer._id });
  await Case.deleteMany({ lawyerId: lawyer._id });
  await Review.deleteMany({ lawyerId: lawyer._id });
  await Transaction.deleteMany({ lawyerId: lawyer._id });
  await Lawyer.deleteOne({ _id: lawyer._id });

  return res.status(200).json({ success: true });
};

const updateTransactionStatus = async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["completed", "pending", "disputed", "refunded"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid transaction status." });
  }

  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found." });
  }

  transaction.status = status;
  await transaction.save();

  const booking = await Booking.findById(transaction.bookingId);
  if (booking) {
    if (status === "completed") {
      booking.paymentStatus = "paid";
    } else if (status === "refunded") {
      booking.paymentStatus = "refunded";
      if (booking.status !== "cancelled") {
        booking.status = "cancelled";
      }

       if (booking.slotId) {
         const lawyer = await Lawyer.findById(booking.lawyerId);
         const slot = lawyer?.consultationSlots.id(booking.slotId);
         if (slot) {
           slot.status = "available";
           slot.isBooked = false;
           slot.clientId = null;
           slot.bookingId = null;
           await lawyer.save();
           emitLawyerSlotsUpdated(lawyer);
         }
       }
    } else {
      booking.paymentStatus = "unpaid";
    }
    await booking.save();
    emitBookingUpdated(booking.toObject());
  }

  return res.status(200).json({ transaction: toTransactionDto(transaction.toObject()) });
};

const submitReview = async (req, res) => {
  const { lawyerId, rating, comment } = req.body;

  if (!lawyerId || !rating || !comment) {
    return res.status(400).json({ message: "Lawyer ID, rating, and comment are required." });
  }

  const lawyer = await Lawyer.findById(lawyerId);
  if (!lawyer || !lawyer.verified) {
    return res.status(404).json({ message: "Lawyer not found." });
  }

  const completedBooking = await Booking.findOne({
    clientId: req.user._id,
    lawyerId,
    status: "completed",
  }).lean();
  if (!completedBooking) {
    return res.status(403).json({
      message: "You can only review a lawyer after a completed consultation.",
    });
  }

  const existingReview = await Review.findOne({
    clientId: req.user._id,
    lawyerId,
  }).lean();
  if (existingReview) {
    return res.status(409).json({ message: "You have already reviewed this lawyer." });
  }

  const review = await Review.create({
    clientId: req.user._id,
    lawyerId,
    clientName: req.user.name,
    rating,
    comment,
    date: new Date().toISOString().split("T")[0],
  });

  const allReviews = await Review.find({ lawyerId });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  lawyer.rating = Number(avgRating.toFixed(1));
  lawyer.totalReviews = allReviews.length;
  await lawyer.save();

  return res.status(201).json({ review: toReviewDto(review.toObject()) });
};

const getLawyerEarnings = async (req, res) => {
  if (req.user.role !== "lawyer") {
    return res.status(403).json({ message: "Access denied." });
  }

  const transactions = await Transaction.find({
    lawyerId: req.user._id,
    status: "completed",
  });

  const totalEarnings = transactions.reduce((sum, t) => sum + t.amount, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const thisMonthEarnings = transactions
    .filter((t) => t.paidAt >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0);

  return res.status(200).json({ totalEarnings, thisMonthEarnings, transactionsCount: transactions.length });
};

const updateCaseTimelineEvent = async (req, res) => {
  const { eventId } = req.params;
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "title and description are required." });
  }

  const caseItem = await Case.findById(req.params.id);
  if (!caseItem) {
    return res.status(404).json({ message: "Case not found." });
  }

  // Permission check
  if (req.user.role === "client" && caseItem.clientId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only update your own cases." });
  }
  if (req.user.role === "lawyer" && req.user._id.toString() !== caseItem.lawyerId.toString()) {
    return res.status(403).json({ message: "You can only update your assigned cases." });
  }

  const event = caseItem.timeline.id(eventId);
  if (!event) {
    return res.status(404).json({ message: "Timeline event not found." });
  }

  // Role-based restriction: Only the creator role can edit
  if (event.addedByRole !== req.user.role) {
    return res.status(403).json({ message: `Only the ${event.addedByRole} can edit this event.` });
  }

  event.title = title;
  event.description = description;
  await caseItem.save();

  const dto = toCaseDto(caseItem.toObject());
  try {
    const io = getIo();
    io.to(caseItem.clientId.toString()).emit("timeline_update", dto);
    io.to(caseItem.lawyerId.toString()).emit("timeline_update", dto);
  } catch (error) {
    console.error("Socket emission failed:", error);
  }

  return res.status(200).json({ caseItem: dto });
};

export {
  addCaseTimelineEvent,
  createCase,
  createLawyerSlot,
  createMessage,
  deleteLawyerByAdmin,
  deleteLawyerSlot,
  deleteLawyerSlotByAdmin,
  getAdminOverview,
  getCases,
  getLawyerById,
  getLawyerEarnings,
  getLawyerSlots,
  getLawyers,
  getMessages,
  submitReview,
  updateCaseStatus,
  updateCaseTimelineEvent,
  updateLawyerSlot,
  updateLawyerVerification,
  updateTransactionStatus,
};
