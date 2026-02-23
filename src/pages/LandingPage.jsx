import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { categories, formatRupiah } from '../data/menuData';
import { useToast } from '../components/Toast';
import Footer from '../components/Footer';
import {
    ArrowRight,
    Flame,
    Star,
    ShoppingBag,
    Heart,
    Zap,
    Award,
    Utensils,
    ShieldCheck,
} from 'lucide-react';

export default function LandingPage() {
    const [activeCategory, setActiveCategory] = useState('all');
    const { state, dispatch } = useApp();
    const { showToast, ToastContainer } = useToast();

    const allProducts = state.products || [];
    const popularItems = allProducts.filter((item) => item.popular);
    const filteredItems =
        activeCategory === 'all'
            ? popularItems
            : allProducts.filter((item) => item.category === activeCategory);

    const addToCart = (item) => {
        dispatch({ type: 'ADD_TO_CART', payload: item });
        showToast(`${item.name} ditambahkan ke keranjang`);
    };

    return (
        <>
            <ToastContainer />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <Flame size={14} />
                            🔥 Sekali Gigit, Ribuan Cerita
                        </div>
                        <h1 className="hero-title" style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '1.5rem' }}>
                            Hadirkan Momen Manis <br />
                            <span style={{ color: 'var(--coral)' }}>Lewat Jajanan Istimewa</span>
                        </h1>
                        <p className="hero-subtitle" style={{ fontSize: '1.25rem', marginBottom: '2.5rem', color: 'var(--text-secondary)' }}>
                            Setiap menu kami diracik dengan hati untuk menemani waktu santaimu.
                            Nikmati kualitas bahan premium dalam harga yang tetap bersahabat.
                        </p>
                        <div className="hero-buttons" style={{ display: 'flex', gap: 16 }}>
                            <Link to="/menu" className="btn btn-primary btn-lg">
                                Pesan Sekarang
                                <ArrowRight size={20} />
                            </Link>
                            <a href="#menu" className="btn btn-secondary btn-lg">
                                Lihat Menu
                            </a>
                        </div>
                    </div>
                    <div className="hero-image-side">
                        <img
                            src="/assets/hero_collage.png"
                            alt="Street Food Collage"
                            className="hero-main-img"
                        />
                    </div>
                </div>
            </section>

            {/* Stats */}
            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-number">20+</div>
                    <div className="stat-label">Menu Jajanan</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">100%</div>
                    <div className="stat-label">Bahan Segar</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">1000+</div>
                    <div className="stat-label">Pelanggan Puas</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">4.8</div>
                    <div className="stat-label">Rating ⭐</div>
                </div>
            </div>

            {/* Features */}
            <section className="section" id="features">
                <div className="section-header">
                    <div className="section-badge">
                        <Star size={14} />
                        Kenapa Camu Camu?
                    </div>
                    <h2 className="section-title">Bukan Jajanan Biasa</h2>
                    <p className="section-desc">
                        Street food dengan sentuhan modern. Rasa otentik, kualitas premium, harga bersahabat.
                    </p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(211, 47, 47, 0.12)' }}>
                            <Zap />
                        </div>
                        <h3>Dibuat Dadakan</h3>
                        <p>
                            Dinikmati selagi hangat! Tiap pesanan baru dimasak saat kamu pesan supaya
                            kriuknya pas dan aromanya menggoda.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(249, 168, 37, 0.12)' }}>
                            <ShoppingBag />
                        </div>
                        <h3>Topping Melimpah</h3>
                        <p>
                            Kami nggak pelit topping. Mulai dari cokelat lumer sampai keju parut,
                            semuanya dikasih porsi ekstra buat bikin kamu happy!
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(230, 81, 0, 0.12)' }}>
                            <Utensils />
                        </div>
                        <h3>Bumbu Nagih</h3>
                        <p>
                            Bukan sekadar asin-gurih. Racikan bumbu rahasia Camu Camu bikin
                            setiap gigitan punya rasa unik yang sulit dilupain.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(255, 193, 7, 0.12)' }}>
                            <Award />
                        </div>
                        <h3>Harga Merakyat</h3>
                        <p>
                            Rasa bintang lima, harga tetap kaki lima! Jajan puas tanpa drama dompet tipis,
                            karena semua mulai Rp 5.000-an aja.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(46, 125, 50, 0.12)' }}>
                            <Heart />
                        </div>
                        <h3>Teman Nyemil</h3>
                        <p>
                            Lagi ngerjain tugas atau sekadar nongkrong bareng bestie? Camu Camu
                            adalah pelengkap momen pas buat segala suasana.
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon" style={{ background: 'rgba(33, 150, 243, 0.12)' }}>
                            <ShieldCheck />
                        </div>
                        <h3>Pasti Higienis</h3>
                        <p>
                            Walaupun konsepnya jajanan jalanan, kebersihan tetap nomor satu.
                            Diolah bersih supaya aman dikonsumsi siapa saja, kapan saja.
                        </p>
                    </div>
                </div>
            </section>

            {/* Menu Preview */}
            <section className="section" id="menu">
                <div className="section-header">
                    <div className="section-badge">
                        <span>🔥</span>
                        Menu Kami
                    </div>
                    <h2 className="section-title">Jajanan Favorit</h2>
                    <p className="section-desc">
                        Pilihan street food terbaik yang bikin nagih dan selalu jadi favorit pelanggan.
                    </p>
                </div>

                <div className="menu-categories">
                    <button
                        className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('all')}
                    >
                        ✨ Populer
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>

                <div className="menu-grid">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="menu-item-card">
                            {item.popular && <span className="menu-item-popular">🔥 Laris</span>}
                            <div className="menu-item-image-container">
                                {item.image.startsWith('/') ? (
                                    <img src={item.image} alt={item.name} className="menu-item-img" />
                                ) : (
                                    <span className="menu-item-emoji">{item.image}</span>
                                )}
                            </div>
                            <h3 className="menu-item-name">{item.name}</h3>
                            <p className="menu-item-desc">{item.description}</p>
                            <div className="menu-item-footer">
                                <span className="menu-item-price">{formatRupiah(item.price)}</span>
                                <button className="menu-item-add" onClick={() => addToCart(item)}>
                                    +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: 40 }}>
                    <Link to="/menu" className="btn btn-secondary">
                        Lihat Semua Menu
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="cta-inner">
                    <h2>
                        Laper? <span className="text-gradient">Pesen Aja!</span>
                    </h2>
                    <p>
                        Pesan sekarang dan nikmati jajanan kaki lima terbaik langsung ke tempatmu.
                        Sekali gigit, pasti nagih! 🔥
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/menu" className="btn btn-primary btn-lg">
                            <ShoppingBag size={18} />
                            Pesan Sekarang
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}
