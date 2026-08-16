const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    time: { type: String, default: "00:00" },
    cover: { type: String, required: true }, // Cloudinary URL
    src: { type: String, required: true }, // Cloudinary URL (mp3)
    audioPublicId: { type: String }, // برای حذف بعدی از Cloudinary
    coverPublicId: { type: String },
    downloads: { type: Number, default: 0 },
    plays: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Song", songSchema);
