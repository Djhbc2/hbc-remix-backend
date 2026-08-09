const express = require("express");
const Song = require("../models/Song");

const router = express.Router();

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

router.get("/:id", async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ message: "آهنگ یافت نشد" });
  res.json(song);
});

router.get("/:id/download", async (req, res) => {
  const song = await Song.findByIdAndUpdate(
    req.params.id,
    { $inc: { downloads: 1 } },
    { new: true }
  );
  if (!song) return res.status(404).json({ message: "آهنگ یافت نشد" });
  res.json({ url: song.src, title: song.title });
});

router.post("/:id/play", async (req, res) => {
  await Song.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } });
  res.json({ ok: true });
});

module.exports = router;
