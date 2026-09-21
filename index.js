const {onSchedule} = require("firebase-functions/v2/scheduler");
const {defineSecret} = require("firebase-functions/params");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
const RESEND_FROM_EMAIL = defineSecret("RESEND_FROM_EMAIL");

exports.sendDailyApplyReminders = onSchedule({
  schedule: "0 8 * * *",
  timeZone: "Asia/Manila",
  secrets: [RESEND_API_KEY, RESEND_FROM_EMAIL]
}, async () => {
  const snapshot = await db.collection("users").where("emailReminders.enabled", "==", true).get();
  if (snapshot.empty) return;
  const jobs = snapshot.docs.map(async doc => {
    const user = doc.data();
    if (!user.email) return;
    const tracked = user.trackerSummary || {};
    const applied = Number(tracked.applied || 0);
    const interviews = Number(tracked.interview || 0);
    const offers = Number(tracked.offer || 0);
    const body = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172334"><h2>Good morning from VA CONNECT 👋</h2><p>Keep your momentum going today. A few more quality applications can create more opportunities.</p><p><b>Your tracker:</b> ${applied} Applied · ${interviews} Interview · ${offers} Offers</p><p>Open your VA CONNECT tracker, review your saved opportunities, and keep applying.</p><p style="color:#6b7c8f">Daily reminder: 8:00 AM (Asia/Manila)</p></div>`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {"Authorization": `Bearer ${RESEND_API_KEY.value()}`, "Content-Type": "application/json"},
      body: JSON.stringify({from: RESEND_FROM_EMAIL.value(), to: [user.email], subject: "VA CONNECT — Your 8:00 AM Application Reminder", html: body})
    });
    if (!response.ok) throw new Error(`Resend failed for ${user.email}: ${response.status}`);
  });
  await Promise.all(jobs);
});
