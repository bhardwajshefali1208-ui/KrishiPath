require('dotenv').config();
const twilio = require('twilio');
const pool = require('../db');

async function sendSMS(bookingId, mobile, message) {
  let status = 'DEMO_ONLY';
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: `+91${mobile}` });
      status = 'SENT';
    } else {
      console.log(`[SMS DEMO] +91${mobile}: ${message}`);
    }
  } catch (err) {
    console.error('SMS error:', err.message);
    status = 'FAILED';
  }
  await pool.execute('INSERT INTO notification_logs (booking_id,type,message,status) VALUES (?,\'SMS\',?,?)', [bookingId, message, status]);
  return status;
}

module.exports = { sendSMS };
