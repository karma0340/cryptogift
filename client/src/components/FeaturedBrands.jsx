import { Link } from 'react-router-dom';
import brands from '../data/GiftCardData';
import './FeaturedBrands.css';

export default function FeaturedBrands() {
    const featured = brands.filter(b => b.popular);

    return (
        <section className="featured section">
            <div className="container">
                <h2 className="section-title">Popular Gift Cards</h2>
                <p className="section-subtitle">
                    Our most-requested brands, available instantly with crypto payment
                </p>

                <div className="featured__grid stagger-children">
                    {featured.map(brand => (
                        <Link
                            to={`/card/${brand.id}`}
                            className="featured__card glass-card"
                            key={brand.id}
                            id={`featured-${brand.id}`}
                        >
                            <div
                                className="featured__card-logo"
                                style={{ background: brand.bgGradient }}
                            >
                                <span className="featured__card-initial" style={{ color: brand.color === '#1b2838' || brand.color === '#000000' ? '#fff' : brand.color }}>
                                    {brand.name.charAt(0)}
                                </span>
                            </div>
                            <div className="featured__card-info">
                                <h3 className="featured__card-name">{brand.name}</h3>
                                <p className="featured__card-category">{brand.category}</p>
                            </div>
                            {brand.discount > 0 && (
                                <span className="badge badge-green featured__card-discount">
                                    -{brand.discount}%
                                </span>
                            )}
                        </Link>
                    ))}
                </div>

                <div className="featured__cta">
                    <Link to="/catalog" className="btn btn-secondary btn-lg">
                        View All 500+ Brands →
                    </Link>
                </div>
            </div>
        </section>
    );
}
