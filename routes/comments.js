const express = require("express");
const Comment = require("../models/Comment");
const { protect } = require("../middleware/auth");

const router = express.Router();

// نظرات یک آهنگ (شامل تعداد لایک و اینکه کاربر لایک کرده یا نه)
router.get("/:songId", async (req, res) => {
  const comments = await Comment.find({ song: req.params.songId }).sort({ createdAt: -1 });
  res.json(
    comments.map((c) => ({
      _id: c._id,
      name: c.name,
      text: c.text,
      createdAt: c.createdAt,
      likeCount: c.likes.length,
    }))
  );
});

// ثبت نظر جدید (نیاز به لاگین)
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
  res.status(201).json({
    _id: comment._id,
    name: comment.name,
    text: comment.text,
    createdAt: comment.createdAt,
    likeCount: 0,
  });
});

// لایک / حذف لایک روی یک نظر
router.post("/:songId/:commentId/like", protect, async (req, res) => {
  if (req.isAdmin) {
    return res.status(403).json({ message: "پنل مدیریت لایک ندارد" });
  }
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "نظر یافت نشد" });

  const idx = comment.likes.findIndex((id) => id.toString() === req.user._id.toString());
  let liked;
  if (idx === -1) {
    comment.likes.push(req.user._id);
    liked = true;
  } else {
    comment.likes.splice(idx, 1);
    liked = false;
  }
  await comment.save();
  res.json({ liked, likeCount: comment.likes.length });
});

module.exports = router;
