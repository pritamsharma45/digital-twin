const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMeterReadingEmail = async (userEmail, meterData) => {
  const msg = {
    to: userEmail,
    from: "your-verified-sender@yourdomain.com", // Change this to your verified sender email
    subject: "Your Energy Meter Reading Details",
    text: `Here are your meter reading details for ${meterData.id}:
    Current Reading: ${meterData.reading} kWh
    Supplier: ${meterData.supplier}
    Tariff: ${meterData.tariff}
    Cost per kWh: ${meterData.cost}p
    Total Cost: £${meterData.total}`,
    html: `
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
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("SendGrid error:", error);
    if (error.response) {
      console.error("Error response:", error.response.body);
    }
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
};

module.exports = { sendMeterReadingEmail };
