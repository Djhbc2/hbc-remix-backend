const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    song: { type: mongoose.Schema.Types.ObjectId, ref: "Song", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

ratingSchema.index({ song: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
