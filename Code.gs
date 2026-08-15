/**
 * Combat Fitness Garage — Free Demo Booking Notifier
 * ---------------------------------------------------
 * Receives a booking payload from the website's booking form
 * (via a fetch() call in script.js) and emails the gym owner.
 * Optionally also logs each booking to a Google Sheet.
 *
 * SETUP
 * 1. Go to https://script.google.com and create a New project.
 * 2. Delete the default code in Code.gs and paste this whole file in.
 * 3. Set OWNER_EMAIL below to the real inbox that should get notified.
 * 4. (Optional) To also log bookings to a Sheet:
 *      - Create a Google Sheet, copy its ID from the URL
 *        (…/spreadsheets/d/<THIS_PART>/edit)
 *      - Paste it into SHEET_ID below and set LOG_TO_SHEET = true.
 * 5. Click Deploy → New deployment → select type "Web app".
 *      - Description: anything, e.g. "CFG booking notifier"
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click Deploy, authorize the requested permissions, then copy the
 *    Web app URL it gives you.
 * 6. Paste that URL into APPS_SCRIPT_URL near the top of script.js
 *    (in the "Google Apps Script — free-demo notification" section).
 *
 * That's it — every free demo booking on the site will now email you.
 * Re-deploying: if you edit this file later, use Deploy → Manage
 * deployments → edit (pencil icon) → New version, so the same URL
 * keeps working without needing to update script.js again.
 */

// ---- CONFIG — edit these two lines ----
var OWNER_EMAIL = "coach@combatfitnessgarage.in"; // TODO: replace with the real owner inbox
var LOG_TO_SHEET = false;                          // set true once SHEET_ID below is filled in
var SHEET_ID = "";                                 // paste your Google Sheet ID here if LOG_TO_SHEET is true

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var subject = "New Free Demo Booking — " + (data.name || "Unknown");
    var body = [
      "A new free demo has been booked on the Combat Fitness Garage website.",
      "",
      "Name:              " + (data.name || "—"),
      "Phone:             " + (data.phone || "—"),
      "Email:             " + (data.email || "—"),
      "Interested in:     " + (data.package || "—"),
      "Preferred date:    " + (data.date || "—"),
      "Time slot:         " + (data.slot || "—"),
      "Notes:             " + (data.message || "—"),
      "",
      "Give them a call to confirm the slot."
    ].join("\n");

    MailApp.sendEmail(OWNER_EMAIL, subject, body);

    if (LOG_TO_SHEET && SHEET_ID) {
      var sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
      sheet.appendRow([
        new Date(),
        data.name || "",
        data.phone || "",
        data.email || "",
        data.package || "",
        data.date || "",
        data.slot || "",
        data.message || ""
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Lets you sanity-check the deployment by opening the Web app URL
 * directly in a browser — should show a small confirmation message.
 */
function doGet(e) {
  return ContentService.createTextOutput(
    "CFG booking notifier is live. This endpoint expects POST requests from the website."
  );
}
