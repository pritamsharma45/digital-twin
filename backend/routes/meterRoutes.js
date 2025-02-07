const express = require("express");
const router = express.Router();
const { sendMeterReadingEmail } = require("../services/emailService");

router.post("/send-reading", async (req, res) => {
  try {
    const { userEmail, meterData } = req.body;

    if (!userEmail || !meterData) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const result = await sendMeterReadingEmail(userEmail, meterData);

    if (result.success) {
      res.json({ message: "Email sent successfully" });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error("Email route error:", error);
    res.status(500).json({
      error: error.message || "Failed to send email",
    });
  }
});

module.exports = router;
