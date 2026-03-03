import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { HiArrowLeft, HiOutlineClipboardCopy, HiOutlineCheck, HiOutlineMail } from 'react-icons/hi';
import api from '../services/api';
import './CheckoutPage.css';

export default function CheckoutPage() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [step, setStep] = useState('payment'); // payment | processing | success
    const [email, setEmail] = useState('');
    const [copied, setCopied] = useState(false);
    const [giftCode, setGiftCode] = useState('');
    const [giftPin, setGiftPin] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [cryptoPayAmount, setCryptoPayAmount] = useState('');
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(5);
    const pollRef = useRef(null);

    // If no state, redirect
    useEffect(() => {
        if (!state) navigate('/catalog');
    }, [state, navigate]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const handleConfirmPayment = async () => {
        if (!email) return;
        setLoading(true);
        setError('');

        try {
            // 1. Create order on backend
            const orderData = await api.createOrder({
                brandId: brand.id,
                brandName: brand.name,
                amount: amount,
                currency: brand.currency,
                discountPercent: brand.discount || 0,
                cryptoCurrency: crypto.symbol,
                email,
            });

            setOrderId(orderData.orderId);
            setWalletAddress(orderData.payment.address);
            setCryptoPayAmount(orderData.payment.amount);

            // 2. Switch to processing state (wait for real payment)
            setStep('processing');
            setCountdown(600); // Set a longer timeout (e.g., 10 mins) for real payment

            // 3. Poll for order completion
            let pollCount = 0;
            pollRef.current = setInterval(async () => {
                pollCount++;
                setCountdown(prev => Math.max(0, prev - 1));

                try {
                    const updatedOrder = await api.getOrder(orderData.orderId);

                    if (updatedOrder.status === 'completed') {
                        clearInterval(pollRef.current);
                        setGiftCode(updatedOrder.giftCardCode);
                        setStep('success');
                    } else if (updatedOrder.status === 'failed') {
                        clearInterval(pollRef.current);
                        setError('Payment or fulfillment failed. Please contact support.');
                        setStep('payment');
                    }
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 5000); // Poll every 5 seconds for production

        } catch (err) {
            console.error('Order creation failed:', err);
            setError('Failed to initiate order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    function generateFallbackCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 16; i++) {
            if (i > 0 && i % 4 === 0) code += '-';
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    const handleCopyCode = () => {
        navigator.clipboard.writeText(giftCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!state) return null;

    const { brand, amount, discountedAmount, crypto, cryptoAmount } = state;

    // Use backend wallet address if available, otherwise from state
    const displayAddress = walletAddress || '0xa0507a6017425937d5e0fde532f21e009b4d6d4b';
    const displayCryptoAmount = cryptoPayAmount || cryptoAmount;

    return (
        <main className="checkout-page">
            <div className="container">
                {step !== 'success' && (
                    <button className="detail__back" onClick={() => navigate(-1)}>
                        <HiArrowLeft /> Back
                    </button>
                )}

                {/* Error display */}
                {error && (
                    <div className="checkout__error animate-fade-in">
                        <p>{error}</p>
                    </div>
                )}

                {/* Payment Step */}
                {step === 'payment' && (
                    <div className="checkout__layout animate-fade-in-up">
                        <div className="checkout__main glass-card">
                            <h2 className="checkout__title">Complete Payment</h2>

                            <div className="checkout__order-summary">
                                <div className="checkout__brand-row">
                                    <div
                                        className="checkout__brand-logo"
                                        style={{ background: brand.bgGradient }}
                                    >
                                        <span style={{
                                            fontFamily: 'var(--font-heading)',
                                            fontSize: '1.2rem',
                                            fontWeight: 700,
                                            color: brand.color === '#1b2838' || brand.color === '#000000' ? '#fff' : brand.color,
                                        }}>
                                            {brand.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3>{brand.name} Gift Card</h3>
                                        <p className="checkout__brand-amount">
                                            {brand.currency === 'INR' ? '₹' : '$'}{amount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Crypto payment address */}
                            <div className="checkout__payment-box">
                                <div className="checkout__payment-header">
                                    <span className="checkout__crypto-icon" style={{ color: crypto.color }}>
                                        {crypto.icon}
                                    </span>
                                    <span>Send exactly</span>
                                </div>

                                <div className="checkout__crypto-amount">
                                    {displayCryptoAmount} {crypto.symbol}
                                </div>

                                <p className="checkout__payment-label">to this address:</p>

                                <div className="checkout__wallet-address">
                                    <code>{displayAddress}</code>
                                    <button
                                        className="checkout__copy-addr"
                                        onClick={() => navigator.clipboard.writeText(displayAddress)}
                                    >
                                        <HiOutlineClipboardCopy />
                                    </button>
                                </div>

                                {/* Real QR Code */}
                                <div className="checkout__qr">
                                    <div className="checkout__qr-placeholder">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${displayAddress}`}
                                            alt="Payment QR Code"
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                    <p className="checkout__qr-label">Scan to pay</p>
                                </div>
                            </div>

                            {/* Email input */}
                            <div className="checkout__email-section">
                                <label className="detail__label">
                                    <HiOutlineMail style={{ marginRight: '6px' }} />
                                    Email for gift card delivery
                                </label>
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="detail__input"
                                    id="checkout-email"
                                />
                            </div>

                            <button
                                className="btn btn-primary btn-lg checkout__confirm-btn"
                                onClick={handleConfirmPayment}
                                disabled={!email || loading}
                                id="confirm-payment-btn"
                            >
                                {loading ? 'Creating Order...' : "I've Sent the Payment"}
                            </button>

                            <p className="checkout__disclaimer">
                                Demo mode — payment is simulated for testing purposes.
                            </p>
                        </div>
                    </div>
                )}

                {/* Processing Step */}
                {step === 'processing' && (
                    <div className="checkout__processing animate-fade-in-up">
                        <div className="glass-card checkout__processing-card">
                            <div className="checkout__spinner"></div>
                            <h2>Verifying Payment...</h2>
                            <p>Confirming your {crypto.symbol} transaction</p>
                            {orderId && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                    Order: {orderId}
                                </p>
                            )}
                            <div className="checkout__countdown">
                                <span className="checkout__countdown-num">{countdown}</span>
                                <span className="checkout__countdown-label">seconds remaining</span>
                            </div>
                            <div className="checkout__progress-bar">
                                <div
                                    className="checkout__progress-fill"
                                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Step */}
                {step === 'success' && (
                    <div className="checkout__success animate-fade-in-up">
                        <div className="glass-card checkout__success-card">
                            <div className="checkout__success-check">✓</div>
                            <h2 className="checkout__success-title">Payment Confirmed!</h2>
                            <p className="checkout__success-subtitle">
                                Your {brand.name} is ready
                            </p>

                            {brand.category === 'Virtual Cards' ? (
                                <div className="virtual-card-container">
                                    <div className="v-card" style={{ background: brand.bgGradient }}>
                                        <div className="v-card__chip"></div>
                                        <div className="v-card__brand-name">{brand.name}</div>
                                        <div className="v-card__number">
                                            {giftCode.split('|')[0] || '**** **** **** ****'}
                                        </div>
                                        <div className="v-card__footer">
                                            <div className="v-card__info">
                                                <span className="v-card__label">VALID THRU</span>
                                                <span className="v-card__value">{giftCode.split('|')[2] || 'MM/YY'}</span>
                                            </div>
                                            <div className="v-card__info">
                                                <span className="v-card__label">CVV</span>
                                                <span className="v-card__value">{giftCode.split('|')[1] || '***'}</span>
                                            </div>
                                        </div>
                                        <div className="v-card__networks">
                                            {brand.name.toLowerCase().includes('visa') ? 'VISA' : 'Mastercard'}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-secondary sm checkout__gift-code-copy"
                                        onClick={() => {
                                            const [num, cvv, exp] = giftCode.split('|');
                                            const text = `Card: ${num}\nCVV: ${cvv}\nExpiry: ${exp}`;
                                            navigator.clipboard.writeText(text);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                    >
                                        {copied ? <HiOutlineCheck /> : <HiOutlineClipboardCopy />}
                                        {copied ? 'Copied All Details' : 'Copy Card Info'}
                                    </button>
                                </div>
                            ) : (
                                <div className="checkout__gift-code-box">
                                    <label className="checkout__gift-code-label">Your Gift Card Code</label>
                                    <div className="checkout__gift-code">
                                        <code className="checkout__gift-code-text">{giftCode}</code>
                                        <button
                                            className="checkout__gift-code-copy"
                                            onClick={handleCopyCode}
                                            id="copy-code-btn"
                                        >
                                            {copied ? <HiOutlineCheck /> : <HiOutlineClipboardCopy />}
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="checkout__success-details">
                                <div className="checkout__success-detail">
                                    <span>Order ID</span>
                                    <span>{orderId}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Product</span>
                                    <span>{brand.name}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Value</span>
                                    <span>{brand.currency === 'INR' ? '₹' : '$'}{amount}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Paid</span>
                                    <span>{displayCryptoAmount} {crypto.symbol}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Delivered to</span>
                                    <span>{email}</span>
                                </div>
                            </div>

                            <div className="checkout__success-actions">
                                <Link to="/catalog" className="btn btn-primary">
                                    Buy Another Card
                                </Link>
                                <Link to="/orders" className="btn btn-secondary">
                                    View My Orders
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
