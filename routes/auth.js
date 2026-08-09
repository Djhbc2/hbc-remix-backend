const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

function makeToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "نام، ایمیل و رمز عبور الزامی است" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "رمز عبور باید حداقل ۶ کاراکتر باشد" });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "این ایمیل قبلاً ثبت شده است" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
    res.status(201).json({
      token: makeToken(user),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "خطای سرور", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(400).json({ message: "ایمیل یا رمز عبور اشتباه است" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "ایمیل یا رمز عبور اشتباه است" });
    res.json({
      token: makeToken(user),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "خطای سرور", error: err.message });
  }
});

router.put("/profile", protect, async (req, res) => {
  if (req.isAdmin) {
    return res.status(403).json({ message: "پنل مدیریت پروفایل کاربری ندارد" });
  }
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (name && name.trim()) user.name = name.trim();

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "برای تغییر رمز، رمز فعلی را وارد کنید" });
      }
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ message: "رمز فعلی اشتباه است" });
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "رمز جدید باید حداقل ۶ کاراکتر باشد" });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({ user: { id: user._id, name: user.name, email: user.email, savedSongs: user.savedSongs } });
  } catch (err) {
    res.status(500).json({ message: "خطای سرور", error: err.message });
  }
});

router.get("/me", protect, async (req, res) => {
  if (req.isAdmin) return res.json({ role: "admin" });
  res.json({ user: req.user });
});

router.post("/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token });
  }
  res.status(401).json({ message: "نام کاربری یا رمز عبور مدیر اشتباه است" });
});

module.exports = router;
