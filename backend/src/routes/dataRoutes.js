import { Router } from "express";

import {
  createCase,
  createLawyerSlot,
  createMessage,
  deleteLawyerByAdmin,
  deleteLawyerSlot,
  deleteLawyerSlotByAdmin,
  getAdminOverview,
  getCases,
  getLawyerById,
  getLawyerSlots,
  getLawyers,
  getMessages,
  addCaseTimelineEvent,
  updateCaseStatus,
  updateLawyerSlot,
  updateLawyerVerification,
  updateTransactionStatus,
  submitReview,
  getLawyerEarnings,
} from "../controllers/dataController.js";
import { authRequired, requireRole, requireVerifiedLawyer } from "../middleware/auth.js";

const dataRoutes = Router();

dataRoutes.get("/lawyers", getLawyers);
dataRoutes.get("/lawyers/:id", getLawyerById);
dataRoutes.get("/cases", authRequired, getCases);
dataRoutes.post("/cases", authRequired, requireRole("client"), createCase);
dataRoutes.patch("/cases/:id/status", authRequired, updateCaseStatus);
dataRoutes.post("/cases/:id/timeline", authRequired, addCaseTimelineEvent);
dataRoutes.get("/messages", authRequired, getMessages);
dataRoutes.post("/messages", authRequired, createMessage);
dataRoutes.get("/lawyers/me/slots", authRequired, requireRole("lawyer"), requireVerifiedLawyer, getLawyerSlots);
dataRoutes.post("/lawyers/me/slots", authRequired, requireRole("lawyer"), requireVerifiedLawyer, createLawyerSlot);
dataRoutes.patch("/lawyers/me/slots/:slotId", authRequired, requireRole("lawyer"), requireVerifiedLawyer, updateLawyerSlot);
dataRoutes.delete("/lawyers/me/slots/:slotId", authRequired, requireRole("lawyer"), requireVerifiedLawyer, deleteLawyerSlot);
dataRoutes.get("/admin/overview", authRequired, requireRole("admin"), getAdminOverview);
dataRoutes.patch(
  "/admin/lawyers/:id/verification",
  authRequired,
  requireRole("admin"),
  updateLawyerVerification,
);
dataRoutes.patch(
  "/admin/transactions/:id/status",
  authRequired,
  requireRole("admin"),
  updateTransactionStatus,
);
dataRoutes.delete("/admin/lawyers/:id", authRequired, requireRole("admin"), deleteLawyerByAdmin);
dataRoutes.delete(
  "/admin/lawyers/:id/slots/:slotId",
  authRequired,
  requireRole("admin"),
  deleteLawyerSlotByAdmin,
);

dataRoutes.post("/reviews", authRequired, requireRole("client"), submitReview);
dataRoutes.get("/lawyers/me/earnings", authRequired, requireRole("lawyer"), requireVerifiedLawyer, getLawyerEarnings);

export { dataRoutes };
