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

            // 2. Simulate payment (demo mode)
            await api.simulatePayment(orderData.orderId);

            // 3. Switch to processing state
            setStep('processing');
            setCountdown(5);

            // 4. Poll for order completion
            let pollCount = 0;
            pollRef.current = setInterval(async () => {
                pollCount++;
                setCountdown(prev => Math.max(0, prev - 1));

                try {
                    const updatedOrder = await api.getOrder(orderData.orderId);

                    if (updatedOrder.status === 'completed') {
                        clearInterval(pollRef.current);
                        setGiftCode(updatedOrder.giftCardCode || generateFallbackCode());
                        setStep('success');
                    } else if (updatedOrder.status === 'failed') {
                        clearInterval(pollRef.current);
                        setError('Payment failed. Please try again.');
                        setStep('payment');
                    }
                } catch (err) {
                    // If polling fails, use fallback after timeout
                    if (pollCount >= 8) {
                        clearInterval(pollRef.current);
                        setGiftCode(generateFallbackCode());
                        setStep('success');
                    }
                }
            }, 1000);

        } catch (err) {
            console.error('Order creation failed:', err);
            // Fallback to demo mode if backend is unavailable
            setStep('processing');
            setCountdown(5);

            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setGiftCode(generateFallbackCode());
                        setOrderId('ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase());
                        setStep('success');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
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
    const displayAddress = walletAddress || (() => {
        const chars = '0123456789abcdef';
        let addr = '0x';
        for (let i = 0; i < 40; i++) addr += chars.charAt(Math.floor(Math.random() * chars.length));
        return addr;
    })();
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

                                {/* Simulated QR */}
                                <div className="checkout__qr">
                                    <div className="checkout__qr-placeholder">
                                        <div className="checkout__qr-grid">
                                            {Array.from({ length: 64 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="checkout__qr-cell"
                                                    style={{
                                                        background: Math.random() > 0.4 ? '#fff' : 'transparent',
                                                    }}
                                                />
                                            ))}
                                        </div>
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
                                Your {brand.name} gift card is ready
                            </p>

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

                            <div className="checkout__success-details">
                                <div className="checkout__success-detail">
                                    <span>Order ID</span>
                                    <span>{orderId}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Brand</span>
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
