const express = require("express");
const Song = require("../models/Song");

const router = express.Router();

const SITE = (process.env.SITE_URL || "https://djhbc.ir").replace(/\/$/, "");

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// صفحه‌ی اشتراک‌گذاری یک آهنگ: برای ربات‌های تلگرام/اینستاگرام/واتساپ کارت زیبا (کاور + اسم) می‌سازه
// و برای آدم‌ها فوراً به خود سایت می‌ره
router.get("/:id", async (req, res) => {
  let song = null;
  if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) song = await Song.findById(req.params.id).catch(() => null);
  const target = song ? `${SITE}/?song=${song._id}` : SITE + "/";
  const title = song ? `${song.title} | HBC REMIX` : "HBC REMIX";
  const desc = song ? `${song.artist} — گوش بده و دانلود کن 🎧` : "ریمیکس‌های DJ HBC";
  const image = song ? song.cover : `${SITE}/logo.png`;
  res.set("Cache-Control", "public, max-age=300");
  res.type("html").send(`<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta property="og:type" content="music.song">
<meta property="og:site_name" content="HBC REMIX">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(target)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0;url=${esc(target)}">
</head><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;text-align:center;padding:40px">
<p>در حال انتقال به <a style="color:#f5a623" href="${esc(target)}">HBC REMIX</a>…</p>
<script>location.replace(${JSON.stringify(target)})</script>
</body></html>`);
});

module.exports = router;
