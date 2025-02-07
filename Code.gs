function doPost(e) {
  // Set CORS headers
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (e.method === "OPTIONS") {
    return ContentService.createTextOutput("")
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeaders(headers);
  }

  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    const { userEmail, meterData } = data;

    // Create email content
    const subject = "Your Energy Meter Reading Details";
    const htmlBody = `
      <h2>Energy Meter Reading Details</h2>
      <p>Here are your meter reading details for ${meterData.id}:</p>
      
      <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
        <h3>Current Reading: ${meterData.reading} kWh</h3>
        <p><strong>Supplier:</strong> ${meterData.supplier}</p>
        <p><strong>Tariff:</strong> ${meterData.tariff}</p>
        <p><strong>Cost per kWh:</strong> ${meterData.cost}p</p>
        <p><strong>Total Cost:</strong> £${meterData.total}</p>
      </div>
      
      <p>Thank you for using our service!</p>
    `;

    // Send email
    GmailApp.sendEmail(userEmail, subject, "", {
      htmlBody: htmlBody,
    });

    // Return success response with CORS headers
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
      })
    )
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  } catch (error) {
    // Return error response with CORS headers
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.message,
      })
    )
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

// Test function to verify deployment
function doGet(e) {
  // Set CORS headers
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "Service is running",
    })
  )
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}
