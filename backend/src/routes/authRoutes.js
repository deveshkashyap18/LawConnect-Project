import { Router } from "express";

import {
  login,
  logout,
  me,
  signup,
  updateMe,
} from "../controllers/authController.js";
import { authRequired } from "../middleware/auth.js";

const authRoutes = Router();

authRoutes.get("/demo-credentials", (_req, res) => {
  res.status(200).json({
    credentials: [
      { role: "client", email: "client@example.com", password: "client123" },
      { role: "lawyer", email: "lawyer@example.com", password: "lawyer123" },
      { role: "admin", email: "admin@lawconnect.com", password: "admin123" },
    ],
  });
});

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/logout", authRequired, logout);
authRoutes.get("/me", authRequired, me);
authRoutes.patch("/me", authRequired, updateMe);

export { authRoutes };
