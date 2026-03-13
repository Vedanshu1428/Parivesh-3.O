"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.sendWhatsApp = exports.sendSms = void 0;
const logger_1 = require("../utils/logger");
/**
 * STUB: Twilio / SendGrid Notifications Integration
 *
 * Replace these console logs with actual SDK calls:
 * e.g., const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 */
const sendSms = async (phone, message) => {
    logger_1.logger.info(`[Twilio Stub] SMS to ${phone}: ${message}`);
    // twilioClient.messages.create({ body: message, from: process.env.TWILIO_PHONE, to: phone });
};
exports.sendSms = sendSms;
const sendWhatsApp = async (phone, message) => {
    logger_1.logger.info(`[Twilio Stub] WhatsApp to ${phone}: ${message}`);
    // twilioClient.messages.create({ body: message, from: `whatsapp:${process.env.TWILIO_WA_SENDER}`, to: `whatsapp:${phone}` });
};
exports.sendWhatsApp = sendWhatsApp;
const sendEmail = async (email, subject, htmlContent) => {
    logger_1.logger.info(`[SendGrid Stub] Email to ${email} | Subject: ${subject}`);
    // sgMail.send({ to: email, from: 'noreply@cecb.cg.gov.in', subject, html: htmlContent });
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=notifications.js.map