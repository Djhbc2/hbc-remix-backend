const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "لطفاً ابتدا وارد حساب کاربری شوید" });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === "admin") {
      req.isAdmin = true;
      return next();
    }
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "کاربر یافت نشد" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "توکن نامعتبر یا منقضی شده است" });
  }
}

function adminOnly(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "دسترسی غیرمجاز" });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "فقط مدیر سایت اجازه دسترسی دارد" });
    }
    req.isAdmin = true;
    next();
  } catch (err) {
    return res.status(401).json({ message: "توکن نامعتبر یا منقضی شده است" });
  }
}

module.exports = { protect, adminOnly };
