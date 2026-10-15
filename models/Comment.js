const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    song: { type: mongoose.Schema.Types.ObjectId, ref: "Song", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null }, // پاسخ به یک نظر
    isDj: { type: Boolean, default: false }, // پاسخ/نظر خود DJ HBC
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
