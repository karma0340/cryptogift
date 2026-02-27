import { Link } from 'react-router-dom';
import { SiBitcoin, SiEthereum } from 'react-icons/si';
import { HiArrowRight, HiShieldCheck, HiLightningBolt, HiGlobe } from 'react-icons/hi';
import './Hero.css';

export default function Hero() {
    return (
        <section className="hero">
            {/* Animated background */}
            <div className="hero__bg">
                <div className="hero__orb hero__orb--1"></div>
                <div className="hero__orb hero__orb--2"></div>
                <div className="hero__orb hero__orb--3"></div>
                <div className="hero__grid"></div>
            </div>

            <div className="container hero__content">
                <div className="hero__badge animate-fade-in-up">
                    <span className="badge badge-green">
                        <HiLightningBolt /> Instant Delivery
                    </span>
                </div>

                <h1 className="hero__title animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    Pay with <span className="hero__title-accent">Crypto</span>.
                    <br />
                    Shop <span className="hero__title-accent2">Anywhere</span>.
                </h1>

                <p className="hero__subtitle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Convert your cryptocurrency into gift cards for Amazon, Apple, Netflix,
                    Steam and 500+ brands worldwide. No KYC required.
                </p>

                <div className="hero__actions animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <Link to="/catalog" className="btn btn-primary btn-lg" id="hero-browse-btn">
                        Browse Gift Cards <HiArrowRight />
                    </Link>
                    <a href="#how-it-works" className="btn btn-secondary btn-lg" id="hero-learn-btn">
                        How It Works
                    </a>
                </div>

                <div className="hero__stats animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <div className="hero__stat">
                        <span className="hero__stat-value">500+</span>
                        <span className="hero__stat-label">Gift Card Brands</span>
                    </div>
                    <div className="hero__stat-divider"></div>
                    <div className="hero__stat">
                        <span className="hero__stat-value">150+</span>
                        <span className="hero__stat-label">Countries</span>
                    </div>
                    <div className="hero__stat-divider"></div>
                    <div className="hero__stat">
                        <span className="hero__stat-value">5+</span>
                        <span className="hero__stat-label">Cryptos Accepted</span>
                    </div>
                </div>

                {/* Floating crypto icons */}
                <div className="hero__floating">
                    <div className="hero__float-icon hero__float-icon--btc">
                        <SiBitcoin />
                    </div>
                    <div className="hero__float-icon hero__float-icon--eth">
                        <SiEthereum />
                    </div>
                    <div className="hero__float-icon hero__float-icon--usdt">₮</div>
                    <div className="hero__float-icon hero__float-icon--sol">◎</div>
                </div>

                {/* Trust badges */}
                <div className="hero__trust animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                    <div className="hero__trust-item">
                        <HiShieldCheck className="hero__trust-icon" />
                        <span>Secure Payments</span>
                    </div>
                    <div className="hero__trust-item">
                        <HiLightningBolt className="hero__trust-icon" />
                        <span>Instant Delivery</span>
                    </div>
                    <div className="hero__trust-item">
                        <HiGlobe className="hero__trust-icon" />
                        <span>Global Coverage</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
