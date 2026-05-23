import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { toEmail, subject, html, secret } = req.body;

  // Simple security check
  if (secret !== 'lawconnect_super_secret_jwt_key_2024') {
    return res.status(401).json({ error: 'Unauthorized proxy access' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.VITE_EMAIL_USER || "deveshkashyap528@gmail.com",
        pass: process.env.VITE_EMAIL_PASS || "ysxhtxbfpomqwjex",
      },
    });

    const mailOptions = {
      from: `"LawConnect Support" <${process.env.VITE_EMAIL_USER || "deveshkashyap528@gmail.com"}>`,
      to: toEmail,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Vercel proxy email error:", error);
    return res.status(500).json({ error: error.message });
  }
}
