const express = require("express");
const Comment = require("../models/Comment");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/:songId", async (req, res) => {
  const comments = await Comment.find({ song: req.params.songId }).sort({ createdAt: -1 });
  res.json(comments);
});

router.post("/:songId", protect, async (req, res) => {
  if (req.isAdmin) {
    return res.status(403).json({ message: "برای ثبت نظر باید با حساب کاربری وارد شوید" });
  }
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: "متن نظر خالی است" });
  }
  const comment = await Comment.create({
    song: req.params.songId,
    user: req.user._id,
    name: req.user.name,
    text: text.trim(),
  });
  res.status(201).json(comment);
});

module.exports = router;
