const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

function makeToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

// ---------- ورود با گوگل ----------
// توکنی که دکمه‌ی گوگل به مرورگر می‌ده (ID token) اینجا با کلیدهای عمومی خود گوگل بررسی می‌شه.
// فقط از ابزارهای داخلی Node استفاده شده، پس پکیج تازه‌ای لازم نیست.
const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];
let googleKeys = { map: new Map(), expires: 0, lastForced: 0 };

async function loadGoogleKeys(force) {
  if (!force && googleKeys.map.size && Date.now() < googleKeys.expires) return googleKeys.map;
  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) throw new Error("دریافت کلیدهای گوگل ناموفق بود");
  const { keys } = await res.json();
  const map = new Map();
  for (const jwk of keys || []) {
    if (jwk.kid && jwk.kty === "RSA") map.set(jwk.kid, crypto.createPublicKey({ key: jwk, format: "jwk" }));
  }
  const maxAge = /max-age=(\d+)/.exec(res.headers.get("cache-control") || "");
  googleKeys = {
    map,
    expires: Date.now() + (maxAge ? Number(maxAge[1]) : 3600) * 1000,
    lastForced: googleKeys.lastForced,
  };
  return map;
}

async function verifyGoogleIdToken(idToken, clientId) {
  if (typeof idToken !== "string" || idToken.length > 4096) throw new Error("توکن نامعتبر");
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("توکن نامعتبر");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  // فقط RS256 قبول می‌شه (جلوی alg=none و حمله‌ی جعل الگوریتم)
  if (header.alg !== "RS256" || !header.kid) throw new Error("الگوریتم نامعتبر");

  let key = (await loadGoogleKeys(false)).get(header.kid);
  // کلید ناشناس: ممکنه گوگل کلیدها رو عوض کرده باشه. حداکثر دقیقه‌ای یک بار دوباره می‌گیریم
  if (!key && Date.now() - googleKeys.lastForced > 60 * 1000) {
    googleKeys.lastForced = Date.now();
    key = (await loadGoogleKeys(true)).get(header.kid);
  }
  if (!key) throw new Error("کلید ناشناس");

  const valid = crypto.verify("RSA-SHA256", Buffer.from(parts[0] + "." + parts[1]), key, Buffer.from(parts[2], "base64url"));
  if (!valid) throw new Error("امضا نامعتبر");

  const now = Math.floor(Date.now() / 1000);
  if (!GOOGLE_ISSUERS.includes(payload.iss)) throw new Error("صادرکننده نامعتبر");
  if (payload.aud !== clientId) throw new Error("مخاطب نامعتبر");
  if (typeof payload.exp !== "number" || payload.exp < now - 30) throw new Error("توکن منقضی شده");
  if (!payload.sub || !payload.email) throw new Error("اطلاعات ناقص");
  if (payload.email_verified !== true && payload.email_verified !== "true") throw new Error("ایمیل تأیید نشده");
  return payload;
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

router.post("/google", async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ message: "ورود با گوگل هنوز فعال نشده است" });

  let payload;
  try {
    payload = await verifyGoogleIdToken(req.body && req.body.credential, clientId);
  } catch (err) {
    return res.status(401).json({ message: "ورود با گوگل ناموفق بود. دوباره تلاش کن" });
  }

  try {
    const email = payload.email.toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // حساب قدیمی با همین ایمیل (که گوگل تأییدش کرده) به گوگل وصل می‌شه و آهنگ‌های ذخیره‌شده‌اش می‌مونن
        user.googleId = payload.sub;
        await user.save();
      } else {
        const name = (payload.name || email.split("@")[0]).trim() || "کاربر";
        user = await User.create({ name, email, googleId: payload.sub });
      }
    }
    res.json({
      token: makeToken(user),
      user: { id: user._id, name: user.name, email: user.email, savedSongs: user.savedSongs },
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
    if (!user.password) {
      return res.status(400).json({ message: "این حساب با گوگل ساخته شده؛ با دکمه‌ی «ادامه با گوگل» وارد شو" });
    }
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
      // حساب‌های گوگلی رمز ندارن، پس برای گذاشتن اولین رمز نیازی به «رمز فعلی» نیست
      if (user.password) {
        if (!currentPassword) {
          return res.status(400).json({ message: "برای تغییر رمز، رمز فعلی را وارد کنید" });
        }
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ message: "رمز فعلی اشتباه است" });
      }
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
