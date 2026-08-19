const mongoose = require("mongoose");

const pushSubSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // اختیاری، ممکنه کاربر لاگین نکرده باشه
  },
  { timestamps: true }
);

module.exports = mongoose.model("PushSubscription", pushSubSchema);
