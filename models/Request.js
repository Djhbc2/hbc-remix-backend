const mongoose = require("mongoose");

// درخواست ریمیکس از طرف کاربرها
const requestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 300 },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
