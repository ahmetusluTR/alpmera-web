// Code.gs - Deploy as Web App
// This is the code that should be in your Google Apps Script

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // Replace with your actual Sheet ID

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data = JSON.parse(e.postData.contents);

    // Honeypot check - if filled, it's a bot
    if (data.website && data.website !== '') {
      // Return success but don't save (fool the bot)
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(data.sheet);

    if (data.sheet === 'Early Access') {
      sheet.appendRow([
        data.email,
        data.interests || '',
        data.notes || '',
        data.notify || false,
        new Date().toISOString(),
        data.source || 'landing'
      ]);
    } else if (data.sheet === 'Demand Suggestions') {
      sheet.appendRow([
        data.product_name,
        data.sku || '',
        data.reference_url || '',
        data.reason || '',
        data.city || '',
        data.state || '',
        data.email || '',
        data.notify || false,
        new Date().toISOString()
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Alpmera Forms API')
    .setMimeType(ContentService.MimeType.TEXT);
}
