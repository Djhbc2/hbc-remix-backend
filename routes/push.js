const express = require("express");
const PushSubscription = require("../models/PushSubscription");

const router = express.Router();

// کلید عمومی VAPID (برای فرانت‌اند لازمه)
router.get("/vapid-public-key", (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

// ثبت اشتراک پوش (نیازی به لاگین نداره)
router.post("/subscribe", async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ message: "اطلاعات اشتراک ناقص است" });
  }
  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { endpoint, keys },
    { upsert: true, new: true }
  );
  res.json({ message: "اشتراک ثبت شد" });
});

// لغو اشتراک پوش
router.post("/unsubscribe", async (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) await PushSubscription.deleteOne({ endpoint });
  res.json({ message: "اشتراک لغو شد" });
});

module.exports = router;
