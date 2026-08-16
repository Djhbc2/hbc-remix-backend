const express = require("express");
const Song = require("../models/Song");
const Rating = require("../models/Rating");
const { protect } = require("../middleware/auth");

const router = express.Router();

// لیست همه آهنگ‌ها (sort: newest | trending)
router.get("/", async (req, res) => {
  const q = req.query.q;
  const sort = req.query.sort;
  const filter = q
    ? { $or: [{ title: new RegExp(q, "i") }, { artist: new RegExp(q, "i") }] }
    : {};
  const sortBy = sort === "trending" ? { downloads: -1, plays: -1 } : { createdAt: -1 };
  const songs = await Song.find(filter).sort(sortBy);
  res.json(songs);
});

// پرطرفدارترین آهنگ‌ها (برای نمودار) - بر اساس مجموع پخش و دانلود
router.get("/top/chart", async (req, res) => {
  const songs = await Song.find()
    .sort({ downloads: -1, plays: -1 })
    .limit(5)
    .select("title artist cover downloads plays");
  res.json(songs);
});

// دریافت یک آهنگ
router.get("/:id", async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ message: "آهنگ یافت نشد" });
  res.json(song);
});

// ثبت دانلود و دریافت لینک فایل
router.get("/:id/download", async (req, res) => {
  const song = await Song.findByIdAndUpdate(
    req.params.id,
    { $inc: { downloads: 1 } },
    { new: true }
  );
  if (!song) return res.status(404).json({ message: "آهنگ یافت نشد" });
  res.json({ url: song.src, title: song.title });
});

// ثبت پخش
router.post("/:id/play", async (req, res) => {
  await Song.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } });
  res.json({ ok: true });
});

// ثبت یا ویرایش امتیاز کاربر به یک آهنگ (۱ تا ۵ ستاره)
router.post("/:id/rate", protect, async (req, res) => {
  if (req.isAdmin) {
    return res.status(403).json({ message: "پنل مدیریت امتیازدهی ندارد" });
  }
  const value = Number(req.body.value);
  if (!value || value < 1 || value > 5) {
    return res.status(400).json({ message: "امتیاز باید بین ۱ تا ۵ باشد" });
  }
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ message: "آهنگ یافت نشد" });

  const existing = await Rating.findOne({ song: song._id, user: req.user._id });
  if (existing) {
    song.ratingSum += value - existing.value;
    existing.value = value;
    await existing.save();
  } else {
    song.ratingSum += value;
    song.ratingCount += 1;
    await Rating.create({ song: song._id, user: req.user._id, value });
  }
  await song.save();

  res.json({
    ratingAvg: song.ratingCount ? +(song.ratingSum / song.ratingCount).toFixed(1) : 0,
    ratingCount: song.ratingCount,
    myRating: value,
  });
});

// دریافت امتیاز کاربر لاگین‌شده به یک آهنگ
router.get("/:id/rate/mine", protect, async (req, res) => {
  if (req.isAdmin) return res.json({ myRating: 0 });
  const existing = await Rating.findOne({ song: req.params.id, user: req.user._id });
  res.json({ myRating: existing?.value || 0 });
});

module.exports = router;
