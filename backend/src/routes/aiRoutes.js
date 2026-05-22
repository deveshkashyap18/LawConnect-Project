import { Router } from "express";
import { handleChat } from "../controllers/aiController.js";
import { authRequired } from "../middleware/auth.js";

const aiRoutes = Router();

aiRoutes.post("/chat", authRequired, handleChat);

export { aiRoutes };
