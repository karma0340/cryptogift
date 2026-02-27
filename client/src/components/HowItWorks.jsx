import { HiOutlineShoppingCart, HiOutlineCurrencyDollar, HiOutlineGift } from 'react-icons/hi';
import { SiBitcoin } from 'react-icons/si';
import './HowItWorks.css';

const steps = [
    {
        icon: <HiOutlineShoppingCart />,
        number: '01',
        title: 'Choose a Brand',
        description: 'Browse 500+ gift cards from top brands like Amazon, Apple, Netflix, Steam and more.',
        color: 'var(--accent-green)',
    },
    {
        icon: <SiBitcoin />,
        number: '02',
        title: 'Pay with Crypto',
        description: 'Send Bitcoin, Ethereum, USDT, or Solana. We accept 5+ major cryptocurrencies.',
        color: 'var(--accent-cyan)',
    },
    {
        icon: <HiOutlineGift />,
        number: '03',
        title: 'Get Your Gift Card',
        description: 'Receive your gift card code instantly. Copy it and start shopping right away!',
        color: 'var(--accent-purple)',
    },
];

export default function HowItWorks() {
    return (
        <section className="how-it-works section" id="how-it-works">
            <div className="container">
                <h2 className="section-title">How It Works</h2>
                <p className="section-subtitle">
                    Three simple steps to convert your crypto into gift cards
                </p>

                <div className="hiw__steps stagger-children">
                    {steps.map((step, i) => (
                        <div className="hiw__step glass-card" key={i}>
                            <div className="hiw__step-number" style={{ color: step.color }}>
                                {step.number}
                            </div>
                            <div className="hiw__step-icon" style={{ background: step.color + '18', color: step.color }}>
                                {step.icon}
                            </div>
                            <h3 className="hiw__step-title">{step.title}</h3>
                            <p className="hiw__step-desc">{step.description}</p>

                            {i < steps.length - 1 && (
                                <div className="hiw__connector">
                                    <svg width="40" height="40" viewBox="0 0 40 40">
                                        <path d="M10 20 L30 20 M24 14 L30 20 L24 26" stroke="var(--text-muted)" strokeWidth="2" fill="none" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
