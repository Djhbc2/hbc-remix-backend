const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // حساب‌هایی که با گوگل ساخته می‌شن رمز عبور ندارن
    password: { type: String, required: function () { return !this.googleId; } },
    googleId: { type: String, unique: true, sparse: true },
    savedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
