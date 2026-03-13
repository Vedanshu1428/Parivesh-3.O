/**
 * STUB: Twilio / SendGrid Notifications Integration
 *
 * Replace these console logs with actual SDK calls:
 * e.g., const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 */
export declare const sendSms: (phone: string, message: string) => Promise<void>;
export declare const sendWhatsApp: (phone: string, message: string) => Promise<void>;
export declare const sendEmail: (email: string, subject: string, htmlContent: string) => Promise<void>;
//# sourceMappingURL=notifications.d.ts.map