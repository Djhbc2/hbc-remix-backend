const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@hbcremix.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ارسال نوتیفیکیشن به همه‌ی کاربرایی که مشترک شدن
async function notifyAll(payload) {
  const subs = await PushSubscription.find();
  const data = JSON.stringify(payload);
  await Promise.all(
    subs.map((sub) =>
      webpush.sendNotification(sub, data).catch(async (err) => {
        // اگه اشتراک منقضی/نامعتبر شده بود، پاکش کن
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      })
    )
  );
}

module.exports = { webpush, notifyAll };
