const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    get isConfigured() {
        return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    }

    /**
     * Send gift card code to customer after fulfillment
     */
    async sendGiftCardEmail(order) {
        if (!this.isConfigured) {
            console.warn('Email not configured. Skipping customer email.');
            return;
        }

        const isVirtualCard = order.brand.category === 'Virtual Cards';
        let cardDetailsHtml = '';

        if (isVirtualCard) {
            const [number, cvv, expiry] = order.giftCardCode.split('|');
            cardDetailsHtml = `
                <div style="background:#1a1f71;color:white;padding:20px;border-radius:10px;margin:20px 0;">
                    <p style="font-size:1.2rem;letter-spacing:2px;margin-bottom:20px;">${number || '**** **** **** ****'}</p>
                    <div style="display:flex;gap:20px;">
                        <div><span style="font-size:0.7rem;opacity:0.7;">VALID THRU</span><br/><span>${expiry || 'MM/YY'}</span></div>
                        <div><span style="font-size:0.7rem;opacity:0.7;">CVV</span><br/><span>${cvv || '***'}</span></div>
                    </div>
                </div>`;
        } else {
            cardDetailsHtml = `
                <div style="background:#f4f4f4;padding:20px;border-radius:10px;margin:20px 0;border:2px dashed #6366f1;">
                    <p style="font-size:0.85rem;color:#666;margin:0 0 8px;">Your Gift Card Code</p>
                    <p style="font-size:1.4rem;font-weight:bold;color:#333;letter-spacing:2px;margin:0;">${order.giftCardCode}</p>
                    ${order.giftCardPin ? `<p style="color:#666;margin:8px 0 0;">PIN: ${order.giftCardPin}</p>` : ''}
                </div>`;
        }

        const mailOptions = {
            from: `"CryptoGift" <${process.env.EMAIL_USER}>`,
            to: order.email,
            subject: `✅ Your ${order.brand.name} Gift Card is Ready!`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;line-height:1.6;background:#f9f9f9;padding:30px;border-radius:12px;">
                    <h1 style="color:#6366f1;margin:0 0 10px;">Payment Confirmed! 🎉</h1>
                    <p>Your ${order.brand.name} gift card is ready to use.</p>
                    ${cardDetailsHtml}
                    <div style="background:#fff;padding:16px;border-radius:8px;margin:16px 0;">
                        <p style="margin:4px 0;"><strong>Order ID:</strong> ${order.orderId}</p>
                        <p style="margin:4px 0;"><strong>Card Value:</strong> ${order.currency === 'INR' ? '₹' : '$'}${order.amount}</p>
                    </div>
                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
                    <p style="font-size:0.8rem;color:#999;">Questions? Reply to this email. Thank you for using CryptoGift!</p>
                </div>`,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Customer email sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Failed to send customer email:', error.message);
        }
    }

    /**
     * Notify admin when a new payment is received and needs fulfillment
     */
    async sendAdminOrderNotification(order) {
        if (!this.isConfigured) {
            console.warn('Email not configured. Skipping admin notification.');
            return;
        }

        const adminEmail = 'support.cryptogift@proton.me';
        const adminDashboardUrl = process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/admin`
            : 'https://cryptogift-murex.vercel.app/admin';

        const mailOptions = {
            from: `"CryptoGift System" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `🔔 New Order Received — ${order.brand.name} $${order.amount} — Action Required`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;line-height:1.6;background:#f9f9f9;padding:30px;border-radius:12px;">
                    <h1 style="color:#f59e0b;margin:0 0 10px;">⚡ New Payment Received!</h1>
                    <p>A customer has sent cryptocurrency payment and is waiting for their gift card.</p>

                    <div style="background:#fff;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #6366f1;">
                        <p style="margin:6px 0;"><strong>Order ID:</strong> ${order.orderId}</p>
                        <p style="margin:6px 0;"><strong>Customer Email:</strong> ${order.email}</p>
                        <p style="margin:6px 0;"><strong>Gift Card:</strong> ${order.brand.name}</p>
                        <p style="margin:6px 0;"><strong>Value:</strong> ${order.currency === 'INR' ? '₹' : '$'}${order.amount}</p>
                        <p style="margin:6px 0;"><strong>Crypto Paid:</strong> ${order.crypto?.amount || 'N/A'} ${order.crypto?.currency || ''}</p>
                    </div>

                    <div style="text-align:center;margin:24px 0;">
                        <a href="${adminDashboardUrl}" style="background:#6366f1;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem;">
                            Go to Admin Dashboard →
                        </a>
                    </div>

                    <p style="font-size:0.85rem;color:#666;">
                        <strong>Action needed:</strong> Buy a ${order.brand.name} ${order.currency === 'INR' ? '₹' : '$'}${order.amount} gift card 
                        and enter the code in the Admin Dashboard to fulfill this order.
                    </p>
                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
                    <p style="font-size:0.75rem;color:#999;">CryptoGift automated notification</p>
                </div>`,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Admin notification sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Failed to send admin notification:', error.message);
        }
    }
}

module.exports = new EmailService();
