const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", protect, async (req, res) => {
  if (req.isAdmin) return res.json([]);
  const user = await User.findById(req.user._id).populate("savedSongs");
  res.json(user.savedSongs);
});

// پلی‌لیست عمومی یک کاربر (برای اشتراک‌گذاری با لینک). فقط اسم و آهنگ‌ها نشون داده می‌شه
router.get("/public/:userId", async (req, res) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.userId)) return res.status(404).json({ message: "پلی‌لیست یافت نشد" });
  const user = await User.findById(req.params.userId).populate("savedSongs");
  if (!user) return res.status(404).json({ message: "پلی‌لیست یافت نشد" });
  res.json({ name: user.name, songs: user.savedSongs.filter(Boolean) });
});

router.post("/:songId", protect, async (req, res) => {
  if (req.isAdmin) {
    return res.status(403).json({ message: "پنل مدیریت پلی‌لیست شخصی ندارد" });
  }
  const user = await User.findById(req.user._id);
  const idx = user.savedSongs.findIndex((id) => id.toString() === req.params.songId);
  let saved;
  if (idx === -1) {
    user.savedSongs.push(req.params.songId);
    saved = true;
  } else {
    user.savedSongs.splice(idx, 1);
    saved = false;
  }
  await user.save();
  res.json({ saved });
});

module.exports = router;
