import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HiArrowLeft, HiOutlineShieldCheck } from 'react-icons/hi';
import brands, { cryptoCurrencies } from '../data/GiftCardData';
import './CardDetailPage.css';

export default function CardDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const brand = brands.find(b => b.id === id);

    const [selectedAmount, setSelectedAmount] = useState(null);
    const [customAmount, setCustomAmount] = useState('');
    const [selectedCrypto, setSelectedCrypto] = useState(cryptoCurrencies[0]);

    const finalAmount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0);
    const discountedAmount = finalAmount * (1 - (brand?.discount || 0) / 100);

    const cryptoAmount = useMemo(() => {
        if (!finalAmount || !selectedCrypto) return 0;
        // Convert: if INR, first convert to USD (1 USD ≈ 83 INR)
        const usdAmount = brand?.currency === 'INR' ? discountedAmount / 83 : discountedAmount;
        return (usdAmount * selectedCrypto.rate).toFixed(8);
    }, [finalAmount, selectedCrypto, brand, discountedAmount]);

    if (!brand) {
        return (
            <main className="detail-page">
                <div className="container">
                    <div className="detail__not-found">
                        <h2>Gift card not found</h2>
                        <Link to="/catalog" className="btn btn-primary">Back to Catalog</Link>
                    </div>
                </div>
            </main>
        );
    }

    const handleProceed = () => {
        if (finalAmount > 0) {
            navigate('/checkout', {
                state: {
                    brand,
                    amount: finalAmount,
                    discountedAmount,
                    crypto: selectedCrypto,
                    cryptoAmount,
                },
            });
        }
    };

    return (
        <main className="detail-page">
            <div className="container">
                <button className="detail__back" onClick={() => navigate(-1)}>
                    <HiArrowLeft /> Back
                </button>

                <div className="detail__layout animate-fade-in-up">
                    {/* Left: Brand Info */}
                    <div className="detail__info">
                        <div
                            className="detail__logo"
                            style={{ background: brand.bgGradient }}
                        >
                            <span
                                className="detail__initial"
                                style={{
                                    color: brand.color === '#1b2838' || brand.color === '#000000' ? '#fff' : brand.color,
                                }}
                            >
                                {brand.name.charAt(0)}
                            </span>
                        </div>

                        <div>
                            <p className="detail__category-tag">{brand.category}</p>
                            <h1 className="detail__title">{brand.name} Gift Card</h1>
                            <p className="detail__desc">{brand.description}</p>

                            {brand.discount > 0 && (
                                <div className="badge badge-green" style={{ marginTop: '12px' }}>
                                    🎉 {brand.discount}% discount applied automatically
                                </div>
                            )}
                        </div>

                        <div className="detail__features">
                            <div className="detail__feature">
                                <HiOutlineShieldCheck className="detail__feature-icon" />
                                <div>
                                    <strong>Instant Delivery</strong>
                                    <p>Receive your code within seconds</p>
                                </div>
                            </div>
                            <div className="detail__feature">
                                <HiOutlineShieldCheck className="detail__feature-icon" />
                                <div>
                                    <strong>100% Secure</strong>
                                    <p>Encrypted payment processing</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Purchase Panel */}
                    <div className="detail__purchase glass-card">
                        <h3 className="detail__purchase-title">Select Amount</h3>

                        <div className="detail__amounts">
                            {brand.denominations.map(d => (
                                <button
                                    key={d}
                                    className={`detail__amount-btn ${selectedAmount === d ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedAmount(d);
                                        setCustomAmount('');
                                    }}
                                >
                                    {brand.currency === 'INR' ? '₹' : '$'}{d}
                                </button>
                            ))}
                        </div>

                        <div className="detail__custom-amount">
                            <label className="detail__label">Or enter custom amount ({brand.currency})</label>
                            <input
                                type="number"
                                placeholder={`e.g. ${brand.denominations[2] || 50}`}
                                value={customAmount}
                                onChange={e => {
                                    setCustomAmount(e.target.value);
                                    setSelectedAmount(null);
                                }}
                                className="detail__input"
                                min="1"
                            />
                        </div>

                        <div className="detail__crypto-select">
                            <label className="detail__label">Pay with</label>
                            <div className="detail__cryptos">
                                {cryptoCurrencies.map(crypto => (
                                    <button
                                        key={crypto.id}
                                        className={`detail__crypto-btn ${selectedCrypto.id === crypto.id ? 'active' : ''}`}
                                        onClick={() => setSelectedCrypto(crypto)}
                                        style={{
                                            borderColor: selectedCrypto.id === crypto.id ? crypto.color : undefined,
                                            background: selectedCrypto.id === crypto.id ? crypto.color + '15' : undefined,
                                        }}
                                    >
                                        <span className="detail__crypto-icon" style={{ color: crypto.color }}>
                                            {crypto.icon}
                                        </span>
                                        <span className="detail__crypto-symbol">{crypto.symbol}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Summary */}
                        {finalAmount > 0 && (
                            <div className="detail__summary animate-fade-in">
                                <div className="detail__summary-row">
                                    <span>Gift card value</span>
                                    <span>{brand.currency === 'INR' ? '₹' : '$'}{finalAmount.toFixed(2)}</span>
                                </div>
                                {brand.discount > 0 && (
                                    <div className="detail__summary-row detail__summary-discount">
                                        <span>Discount ({brand.discount}%)</span>
                                        <span>-{brand.currency === 'INR' ? '₹' : '$'}{(finalAmount - discountedAmount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="detail__summary-row detail__summary-total">
                                    <span>You pay</span>
                                    <span className="detail__crypto-price">
                                        {cryptoAmount} {selectedCrypto.symbol}
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            className="btn btn-primary btn-lg detail__buy-btn"
                            disabled={finalAmount <= 0}
                            onClick={handleProceed}
                            id="proceed-checkout-btn"
                        >
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
