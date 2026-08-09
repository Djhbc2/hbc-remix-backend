const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", protect, async (req, res) => {
  if (req.isAdmin) return res.json([]);
  const user = await User.findById(req.user._id).populate("savedSongs");
  res.json(user.savedSongs);
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
