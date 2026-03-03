const nodemailer = require('nodemailer');
const config = require('../config/env');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    /**
     * Send gift card details to customer
     * @param {object} order - Mongoose order object
     */
    async sendGiftCardEmail(order) {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Skipping email.');
            return;
        }

        const isVirtualCard = order.brand.category === 'Virtual Cards';
        let cardDetailsHtml = '';

        if (isVirtualCard) {
            const [number, cvv, expiry] = order.giftCardCode.split('|');
            cardDetailsHtml = `
                <div style="background: #1a1f71; color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="font-size: 1.2rem; letter-spacing: 2px; margin-bottom: 20px;">${number || '**** **** **** ****'}</p>
                    <div style="display: flex; gap: 20px;">
                        <div>
                            <span style="font-size: 0.7rem; opacity: 0.7;">VALID THRU</span><br/>
                            <span>${expiry || 'MM/YY'}</span>
                        </div>
                        <div>
                            <span style="font-size: 0.7rem; opacity: 0.7;">CVV</span><br/>
                            <span>${cvv || '***'}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            cardDetailsHtml = `
                <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px dashed #ccc;">
                    <p style="font-size: 1.2rem; font-weight: bold; color: #333;">Code: ${order.giftCardCode}</p>
                    ${order.giftCardPin ? `<p style="color: #666;">PIN: ${order.giftCardPin}</p>` : ''}
                </div>
            `;
        }

        const mailOptions = {
            from: `"CryptoGift" <${process.env.EMAIL_USER}>`,
            to: order.email,
            subject: `Your ${order.brand.name} ${isVirtualCard ? 'Virtual Card' : 'Gift Card'} is Ready!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                    <h1 style="color: #6366f1;">Thank you for your purchase!</h1>
                    <p>Your payment has been successfully verified, and your ${order.brand.name} is now ready to use.</p>
                    
                    ${cardDetailsHtml}
                    
                    <p><strong>Order ID:</strong> ${order.orderId}</p>
                    <p><strong>Value:</strong> ${order.currency === 'INR' ? '₹' : '$'}${order.amount}</p>
                    <hr/>
                    <p style="font-size: 0.8rem; color: #999;">If you have any issues, please reply to this email.</p>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('Failed to send email:', error.message);
            throw error;
        }
    }
}

module.exports = new EmailService();
