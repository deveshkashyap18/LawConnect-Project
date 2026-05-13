import fs from "fs";
import multer from "multer";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.trim().replace(/\s+/g, '-'));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single("document");

const uploadDocument = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: "File upload failed.", error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    return res.status(200).json({
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
};

export { uploadDocument };
