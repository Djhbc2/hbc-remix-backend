const express = require("express");
const Setting = require("../models/Setting");
const { adminOnly } = require("../middleware/auth");

const router = express.Router();

// خواندن متن «درباره ریمیکس» (عمومی، همه می‌بینن)
router.get("/about", async (req, res) => {
  const setting = await Setting.findOne({ key: "about" });
  res.json({ text: setting?.value || "" });
});

// ویرایش متن «درباره ریمیکس» (فقط مدیر سایت)
router.put("/about", adminOnly, async (req, res) => {
  const { text } = req.body;
  const setting = await Setting.findOneAndUpdate(
    { key: "about" },
    { value: text || "" },
    { upsert: true, new: true }
  );
  res.json({ text: setting.value });
});

// خواندن پروفایل عمومی DJ (عمومی)
router.get("/dj-profile", async (req, res) => {
  const setting = await Setting.findOne({ key: "djProfile" });
  let data = { bio: "", photo: "", instagram: "", telegram: "" };
  if (setting?.value) {
    try {
      data = { ...data, ...JSON.parse(setting.value) };
    } catch (e) {}
  }
  res.json(data);
});

// ویرایش پروفایل عمومی DJ (فقط مدیر سایت)
router.put("/dj-profile", adminOnly, async (req, res) => {
  const { bio, photo, instagram, telegram } = req.body;
  const value = JSON.stringify({ bio: bio || "", photo: photo || "", instagram: instagram || "", telegram: telegram || "" });
  await Setting.findOneAndUpdate({ key: "djProfile" }, { value }, { upsert: true, new: true });
  res.json({ bio, photo, instagram, telegram });
});

module.exports = router;
