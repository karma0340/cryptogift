import { Link } from 'react-router-dom';
import { SiBitcoin } from 'react-icons/si';
import { HiOutlineMail } from 'react-icons/hi';
import { FaXTwitter, FaTelegram, FaDiscord } from 'react-icons/fa6';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__top">
                    <div className="footer__brand">
                        <Link to="/" className="footer__logo">
                            <div className="footer__logo-icon">
                                <SiBitcoin />
                            </div>
                            <span className="footer__logo-text">CryptoGift</span>
                        </Link>
                        <p className="footer__desc">
                            Convert cryptocurrency into gift cards for 500+ brands worldwide. Fast, secure, and no KYC required.
                        </p>
                        <div className="footer__socials">
                            <a href="#" className="footer__social" aria-label="Twitter"><FaXTwitter /></a>
                            <a href="#" className="footer__social" aria-label="Telegram"><FaTelegram /></a>
                            <a href="#" className="footer__social" aria-label="Discord"><FaDiscord /></a>
                            <a href="#" className="footer__social" aria-label="Email"><HiOutlineMail /></a>
                        </div>
                    </div>

                    <div className="footer__links-group">
                        <h4 className="footer__links-title">Products</h4>
                        <Link to="/catalog" className="footer__link">Gift Cards</Link>
                        <a href="#how-it-works" className="footer__link">How It Works</a>
                        <Link to="/catalog" className="footer__link">All Brands</Link>
                    </div>

                    <div className="footer__links-group">
                        <h4 className="footer__links-title">Crypto</h4>
                        <span className="footer__link">Bitcoin (BTC)</span>
                        <span className="footer__link">Ethereum (ETH)</span>
                        <span className="footer__link">Tether (USDT)</span>
                        <span className="footer__link">Solana (SOL)</span>
                    </div>

                    <div className="footer__links-group">
                        <h4 className="footer__links-title">Company</h4>
                        <span className="footer__link">About Us</span>
                        <span className="footer__link">Privacy Policy</span>
                        <span className="footer__link">Terms of Service</span>
                        <span className="footer__link">Contact</span>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p className="footer__copy">
                        © {new Date().getFullYear()} CryptoGift. All rights reserved.
                    </p>
                    <p className="footer__disclaimer">
                        Gift cards are fulfilled by third-party providers. Crypto payments processed securely.
                    </p>
                </div>
            </div>
        </footer>
    );
}
