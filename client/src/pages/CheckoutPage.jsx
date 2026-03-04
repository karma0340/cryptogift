import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { HiArrowLeft, HiOutlineClipboardCopy, HiOutlineCheck, HiOutlineMail } from 'react-icons/hi';
import api from '../services/api';
import './CheckoutPage.css';

export default function CheckoutPage() {
    const { state } = useLocation();
    const navigate = useNavigate();

    // Steps: 'email' → 'address' → 'processing' → 'success'
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [copied, setCopied] = useState(false);
    const [giftCode, setGiftCode] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [cryptoPayAmount, setCryptoPayAmount] = useState('');
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(600);
    const pollRef = useRef(null);

    useEffect(() => {
        if (!state) navigate('/catalog');
    }, [state, navigate]);

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    if (!state) return null;

    const { brand, amount, totalAmount, processingFee, crypto } = state;

    // STEP 1: User enters email → Click "Pay with crypto"
    const handleGenerateAddress = async () => {
        if (!email) return;
        setLoading(true);
        setError('');

        try {
            const orderData = await api.createOrder({
                brandId: brand.id,
                brandName: brand.name,
                amount: amount,
                totalAmount: totalAmount || amount,
                processingFee: processingFee || 0,
                currency: brand.currency || 'USD',
                cryptoCurrency: crypto.symbol,
                email,
            });

            setOrderId(orderData.orderId);
            setWalletAddress(orderData.payment.address);
            setCryptoPayAmount(orderData.payment.amount);
            setStep('address');
        } catch (err) {
            console.error('Order creation failed:', err);
            setError(err.message || 'Failed to generate payment address. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: User sees REAL address, scans QR, sends payment
    // Click "I've Sent the Payment" → start polling for confirmation
    const handleConfirmPayment = () => {
        setStep('processing');
        setCountdown(600);

        pollRef.current = setInterval(async () => {
            setCountdown(prev => Math.max(0, prev - 1));
            try {
                const updatedOrder = await api.getOrder(orderId);
                if (updatedOrder.status === 'completed') {
                    clearInterval(pollRef.current);
                    setGiftCode(updatedOrder.giftCardCode);
                    setStep('success');
                } else if (updatedOrder.status === 'failed') {
                    clearInterval(pollRef.current);
                    setError('Payment failed. Please contact support.');
                    setStep('address');
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 5000);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(giftCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className="checkout-page">
            <div className="container">
                {step !== 'success' && (
                    <button className="detail__back" onClick={() => step === 'address' ? setStep('email') : navigate(-1)}>
                        <HiArrowLeft /> Back
                    </button>
                )}

                {error && (
                    <div className="checkout__error animate-fade-in">
                        <p>{error}</p>
                    </div>
                )}

                {/* ── STEP 1: Email Entry ── */}
                {step === 'email' && (
                    <div className="checkout__layout animate-fade-in-up">
                        <div className="checkout__main glass-card">
                            <h2 className="checkout__title">Complete Payment</h2>

                            <div className="checkout__order-summary">
                                <div className="checkout__brand-row">
                                    <div className="checkout__brand-logo" style={{ background: brand.bgGradient }}>
                                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
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
                                    onKeyDown={e => e.key === 'Enter' && email && handleGenerateAddress()}
                                    autoFocus
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                                    Your gift card code will be sent here after payment is confirmed.
                                </p>
                            </div>

                            <button
                                className="btn btn-primary btn-lg checkout__confirm-btn"
                                onClick={handleGenerateAddress}
                                disabled={!email || loading}
                                id="generate-address-btn"
                            >
                                {loading ? 'Generating Payment Address...' : `Pay with ${crypto.symbol} →`}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Show REAL Address + QR ── */}
                {step === 'address' && (
                    <div className="checkout__layout animate-fade-in-up">
                        <div className="checkout__main glass-card">
                            <h2 className="checkout__title">Send Payment</h2>

                            <div className="checkout__order-summary">
                                <div className="checkout__brand-row">
                                    <div className="checkout__brand-logo" style={{ background: brand.bgGradient }}>
                                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
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

                            {/* REAL Payment Address from NOWPayments */}
                            <div className="checkout__payment-box">
                                <div className="checkout__payment-header">
                                    <span className="checkout__crypto-icon" style={{ color: crypto.color }}>
                                        {crypto.icon}
                                    </span>
                                    <span>Send exactly</span>
                                </div>

                                <div className="checkout__crypto-amount">
                                    {cryptoPayAmount} {crypto.symbol}
                                </div>

                                <p className="checkout__payment-label">to this address:</p>

                                <div className="checkout__wallet-address">
                                    <code>{walletAddress}</code>
                                    <button
                                        className="checkout__copy-addr"
                                        onClick={() => navigator.clipboard.writeText(walletAddress)}
                                    >
                                        <HiOutlineClipboardCopy />
                                    </button>
                                </div>

                                {/* Real QR Code of the REAL address */}
                                <div className="checkout__qr">
                                    <div className="checkout__qr-placeholder">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${walletAddress}`}
                                            alt="Payment QR Code"
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                    <p className="checkout__qr-label">Scan to pay</p>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: 'var(--color-success, #4ade80)', textAlign: 'center', margin: '8px 0 16px' }}>
                                ✅ Order {orderId} — Delivering to {email}
                            </p>

                            <button
                                className="btn btn-primary btn-lg checkout__confirm-btn"
                                onClick={handleConfirmPayment}
                                id="confirm-payment-btn"
                            >
                                I've Sent the Payment
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Processing / Verifying ── */}
                {step === 'processing' && (
                    <div className="checkout__processing animate-fade-in-up">
                        <div className="glass-card checkout__processing-card">
                            <div className="checkout__spinner"></div>
                            <h2>Verifying Payment...</h2>
                            <p>Confirming your {crypto.symbol} transaction</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                Order: {orderId}
                            </p>
                            <div className="checkout__countdown">
                                <span className="checkout__countdown-num">{countdown}</span>
                                <span className="checkout__countdown-label">seconds remaining</span>
                            </div>
                            <div className="checkout__progress-bar">
                                <div
                                    className="checkout__progress-fill"
                                    style={{ width: `${(1 - countdown / 600) * 100}%` }}
                                />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                                This page checks automatically every 5 seconds. Do not close this tab.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── STEP 4: Success ── */}
                {step === 'success' && (
                    <div className="checkout__success animate-fade-in-up">
                        <div className="glass-card checkout__success-card">
                            <div className="checkout__success-check">✓</div>
                            <h2 className="checkout__success-title">Payment Confirmed!</h2>
                            <p className="checkout__success-subtitle">Your {brand.name} is ready</p>

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
                                            navigator.clipboard.writeText(`Card: ${num}\nCVV: ${cvv}\nExpiry: ${exp}`);
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
                                    <span>Order ID</span><span>{orderId}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Product</span><span>{brand.name}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Value</span>
                                    <span>{brand.currency === 'INR' ? '₹' : '$'}{amount}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Paid</span><span>{cryptoPayAmount} {crypto.symbol}</span>
                                </div>
                                <div className="checkout__success-detail">
                                    <span>Delivered to</span><span>{email}</span>
                                </div>
                            </div>

                            <div className="checkout__success-actions">
                                <Link to="/catalog" className="btn btn-primary">Buy Another Card</Link>
                                <Link to="/orders" className="btn btn-secondary">View My Orders</Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
