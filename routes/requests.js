const express = require("express");
const Request = require("../models/Request");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ثبت درخواست ریمیکس (نیاز به ورود). هر کاربر روزی حداکثر ۵ درخواست
router.post("/", protect, async (req, res) => {
  if (req.isAdmin) return res.status(403).json({ message: "با حساب کاربری وارد شو" });
  const text = String((req.body && req.body.text) || "").trim();
  if (text.length < 3) return res.status(400).json({ message: "اسم آهنگ یا توضیح درخواستت رو بنویس" });
  if (text.length > 300) return res.status(400).json({ message: "متن درخواست حداکثر ۳۰۰ کاراکتر است" });
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await Request.countDocuments({ user: req.user._id, createdAt: { $gte: since } });
  if (count >= 5) return res.status(429).json({ message: "امروز به اندازه‌ی کافی درخواست دادی، فردا دوباره امتحان کن" });
  await Request.create({ user: req.user._id, name: req.user.name, text });
  res.status(201).json({ message: "درخواستت ثبت شد 🎧" });
});

module.exports = router;
