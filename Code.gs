function doPost(e) {
    try {
    const data = JSON.parse(e.postData.contents);
    const { userEmail, meterData } = data;
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

    GmailApp.sendEmail(userEmail, subject, "", {
      htmlBody: htmlBody
    });
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Email sent successfully"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
