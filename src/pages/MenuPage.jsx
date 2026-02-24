import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { categories, formatRupiah, formatPhoneForFonnte } from '../data/menuData';
import { useToast } from '../components/Toast';
import Footer from '../components/Footer';
import CartSidebar from '../components/CartSidebar';
import ChatBot from '../components/ChatBot';
import { ShoppingCart, Search, CheckCircle, ArrowLeft, Clock, QrCode, Banknote, Star } from 'lucide-react';

export default function MenuPage() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [cartOpen, setCartOpen] = useState(false);
    const [orderStep, setOrderStep] = useState('closed'); // 'closed','form','payment-select','cash','qris','success'
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        notes: '',
    });
    const [cashReceived, setCashReceived] = useState('');
    const [qrisTimer, setQrisTimer] = useState(300);
    const [lastOrder, setLastOrder] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const timerRef = useRef(null);

    const { state, dispatch } = useApp();
    const { showToast, ToastContainer } = useToast();

    const cartCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalCost = state.cart.reduce((sum, item) => sum + item.cost * item.qty, 0);
    const cashReceivedNum = parseInt(cashReceived) || 0;
    const changeDue = cashReceivedNum - total;

    const allProducts = state.products || [];
    const filtered = allProducts.filter((item) => {
        const matchCategory = activeCategory === 'all' || item.category === activeCategory;
        const matchSearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
        return matchCategory && matchSearch;
    });

    const addToCart = (item) => {
        if (item.variants && item.variants.length > 0 && !selectedVariant) {
            setSelectedProduct(item);
            setSelectedVariant(item.variants[0]);
            setOrderStep('variant-select');
            return;
        }

        const finalItem = selectedVariant
            ? { ...item, id: `${item.id}-${selectedVariant.id}`, name: `${item.name} (${selectedVariant.name})`, price: item.price + selectedVariant.price }
            : item;

        dispatch({ type: 'ADD_TO_CART', payload: finalItem });
        showToast(`${finalItem.name} ditambahkan!`);

        if (orderStep === 'variant-select') {
            setOrderStep('closed');
            setSelectedProduct(null);
            setSelectedVariant(null);
        }
    };

    const handleCheckout = () => {
        setCartOpen(false);
        setOrderStep('form');
    };

    // Communication with App level Navbar & Cart
    useEffect(() => {
        const handleOpenCart = () => setCartOpen(true);
        window.addEventListener('open-menu-cart', handleOpenCart);

        // Auto-open checkout if redirected from other pages
        const params = new URLSearchParams(window.location.search);
        if (params.get('checkout') === 'true' && state.cart.length > 0) {
            setOrderStep('form');
            // Clean URL after reading
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        return () => window.removeEventListener('open-menu-cart', handleOpenCart);
    }, [state.cart.length]);

    // QRIS Timer

    useEffect(() => {
        if (orderStep === 'qris') {
            timerRef.current = setInterval(() => {
                setQrisTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        showToast('QRIS timeout! Silakan ulangi.', 'error');
                        setOrderStep('payment-select');
                        return 300;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [orderStep]);

    const goToPayment = (e) => {
        e.preventDefault();
        if (!formData.customerName || !formData.customerPhone) {
            showToast('Isi nama dan nomor telepon!', 'error');
            return;
        }
        setOrderStep('payment-select');
    };

    const selectPayment = (method) => {
        if (method === 'cash') {
            setCashReceived('');
            setOrderStep('cash');
        } else {
            setQrisTimer(300);
            setOrderStep('qris');
        }
    };

    const processOrder = (method) => {
        const orderPayload = {
            items: [...state.cart],
            total,
            totalCost,
            profit: total - totalCost,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            notes: formData.notes,
            paymentMethod: method,
            cashReceived: method === 'cash' ? cashReceivedNum : null,
            change: method === 'cash' ? changeDue : null,
        };

        dispatch({
            type: 'ADD_ONLINE_ORDER',
            payload: orderPayload,
        });

        // SEND FONNTE NOTIFICATION
        sendFonnteNotification(orderPayload);

        setLastOrder(orderPayload);
        clearInterval(timerRef.current);
        setOrderStep('success');
        setFormData({ customerName: '', customerPhone: '', notes: '' });
        setCashReceived('');
    };

    const sendFonnteNotification = async (order) => {
        const phone = formatPhoneForFonnte(order.customerPhone);
        if (!phone) return;

        try {
            const message = `
*PESANAN BARU - CAMU CAMU*
------------------------------
ID: ${order.id || 'Web-Order'}
Customer: ${order.customerName}
WA: ${order.customerPhone}
------------------------------
${order.items.map(i => `${i.name} x${i.qty} = ${formatRupiah(i.price * i.qty)}`).join('\n')}
------------------------------
*TOTAL: ${formatRupiah(order.total)}*
Bayar: ${order.paymentMethod === 'cash' ? 'Cash/Tunai (Belum Lunas - Bayar di Kasir)' : 'QRIS (Sudah Lunas ✓)'}
Catatan: ${order.notes || '-'}

Terima kasih atas pesanannya! 🙏
Silakan tunjukkan pesan ini ke kasir jika Anda memilih bayar Cash.
`;

            const res = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: {
                    'Authorization': import.meta.env.VITE_FONNTE_TOKEN || 'zQe1WteVyRK7mVqNrpQT',
                },
                body: new URLSearchParams({
                    'target': phone,
                    'message': message,
                })
            });
            const data = await res.json();
            console.log('Fonnte Response (New Order):', data);
            if (data.status) {
                showToast('Notifikasi pesanan terkirim ke WA! ✅');
            } else {
                console.warn('Fonnte failed:', data.reason);
                showToast('Gagal kirim notif WA: ' + (data.reason || 'Cek koneksi'), 'error');
            }
        } catch (err) {
            console.error('Failed to send Fonnte notification:', err);
            showToast('Gagal terhubung ke layanan WA.', 'error');
        }
    };


    const closeModal = () => {
        clearInterval(timerRef.current);
        setOrderStep('closed');
        setQrisTimer(300);
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const quickCash = [50000, 100000, 150000, 200000];

    return (
        <div className="page-wrapper">
            <ToastContainer />

            <div className="page-header">
                <h1 className="page-title">🍈 Menu Camu Camu</h1>
                <p className="page-desc">Pilih menu favoritmu dan langsung pesan!</p>
            </div>

            <div className="section" style={{ paddingTop: 20 }}>
                <div style={{ maxWidth: 500, marginBottom: 24 }}>
                    <div className="search-input-wrapper">
                        <Search size={18} className="icon" />
                        <input type="text" className="search-input" placeholder="Cari menu favorit..."
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="menu-categories" style={{ justifyContent: 'flex-start' }}>
                    <button className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('all')}>🍽️ Semua</button>
                    {categories.map((cat) => (
                        <button key={cat.id}
                            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}>{cat.icon} {cat.name}</button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="emoji">🔍</div>
                        <h3>Menu tidak ditemukan</h3>
                        <p>Coba kata kunci lain</p>
                    </div>
                ) : (
                    <div className="menu-grid">
                        {filtered.map((item) => (
                            <div key={item.id} className={`menu-item-card ${item.stock <= 0 ? 'out-of-stock' : ''}`}>
                                {item.popular && <span className="menu-item-popular">⭐ Popular</span>}
                                {item.stock <= 5 && item.stock > 0 && <span className="menu-item-stock-warning">Sisa {item.stock}!</span>}
                                {item.stock <= 0 && <span className="menu-item-out">Habis</span>}
                                <div className="menu-item-image-container">
                                    {(item.image.startsWith('/') || item.image.startsWith('http')) ? (
                                        <img src={item.image} alt={item.name} className="menu-item-img" />
                                    ) : (
                                        <span className="menu-item-emoji">{item.image}</span>
                                    )}
                                </div>
                                <h3 className="menu-item-name">{item.name}</h3>
                                <p className="menu-item-desc">{item.description}</p>
                                <div className="menu-item-footer">
                                    <span className="menu-item-price">{formatRupiah(item.price)}</span>
                                    <button
                                        className="menu-item-add"
                                        onClick={() => (item.stock === undefined || item.stock > 0) && addToCart(item)}
                                        disabled={item.stock !== undefined && item.stock <= 0}
                                        style={{ opacity: item.stock <= 0 ? 0.3 : 1, cursor: item.stock <= 0 ? 'not-allowed' : 'pointer' }}
                                    >
                                        {item.stock <= 0 ? 'X' : '+'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {cartCount > 0 && (
                <button className="floating-cart-btn" onClick={() => setCartOpen(true)}>
                    <ShoppingCart size={24} />
                    <span className="badge">{cartCount}</span>
                </button>
            )}

            <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} onCheckout={handleCheckout} />

            {/* ==================== ORDER MODAL ==================== */}
            <div className={`modal-overlay ${orderStep !== 'closed' ? 'open' : ''}`} onClick={closeModal}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: orderStep === 'variant-select' ? 400 : 480 }}>

                    {/* ===== VARIANT SELECT ===== */}
                    {orderStep === 'variant-select' && selectedProduct && (
                        <div>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                                <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-surface)' }}>
                                    {(selectedProduct.image.startsWith('/') || selectedProduct.image.startsWith('http')) ? (
                                        <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{selectedProduct.image}</div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0 }}>{selectedProduct.name}</h3>
                                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '4px 0 8px' }}>Pilih varian favoritmu</p>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--coral-light)' }}>
                                        {formatRupiah(selectedProduct.price + (selectedVariant?.price || 0))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                                {selectedProduct.variants.map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVariant(v)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px 16px', borderRadius: 10, border: '2px solid',
                                            borderColor: selectedVariant?.id === v.id ? 'var(--teal)' : 'var(--border)',
                                            background: selectedVariant?.id === v.id ? 'rgba(180, 83, 9, 0.05)' : 'var(--bg-card)',
                                            cursor: 'pointer', transition: 'var(--transition-fast)'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>{v.name}</span>
                                        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                                            {v.price > 0 ? `+${formatRupiah(v.price)}` : 'Gratis'}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn btn-secondary" onClick={closeModal} style={{ flex: 1 }}>Batal</button>
                                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => addToCart(selectedProduct)}>
                                    Tambah ke Keranjang
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== SUCCESS ===== */}
                    {orderStep === 'success' && (
                        <div className="success-screen">
                            <div className="success-icon">{lastOrder?.paymentMethod === 'qris' ? '🔥' : '⏳'}</div>
                            <h2>{lastOrder?.paymentMethod === 'qris' ? 'Pesanan Sedang Dibuat!' : 'Pemesanan Berhasil!'}</h2>
                            <p style={{ lineHeight: 1.6 }}>
                                {lastOrder?.paymentMethod === 'qris'
                                    ? 'Terima kasih! Pembayaran QRIS kamu telah kami terima. Pesanan kamu sedang diproses, silakan tunggu panggilan.'
                                    : 'Terima kasih! Silakan tunjukkan layar ini atau sebutkan nama kamu ke kasir untuk proses pembayaran. Pesanan akan segera dibuat setelah pembayaran selesai.'
                                }
                            </p>
                            <button className="btn btn-primary" onClick={closeModal}>
                                Kembali ke Menu
                            </button>
                        </div>
                    )}

                    {/* ===== FORM ===== */}
                    {orderStep === 'form' && (
                        <>
                            <h2>📝 Data Pemesanan</h2>

                            <div style={{
                                background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                                padding: 16, marginBottom: 20,
                            }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Ringkasan Pesanan
                                </div>
                                {state.cart.map((item) => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                            {(item.image.startsWith('/') || item.image.startsWith('http')) ? (
                                                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: 16 }}>{item.image}</span>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.qty} x {formatRupiah(item.price)}</div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatRupiah(item.price * item.qty)}</div>
                                    </div>
                                ))}
                                <div style={{
                                    borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8,
                                    display: 'flex', justifyContent: 'space-between',
                                    fontWeight: 700, fontSize: 18, color: 'var(--coral-light)',
                                }}>
                                    <span>Total</span>
                                    <span>{formatRupiah(total)}</span>
                                </div>
                            </div>

                            <form onSubmit={goToPayment}>
                                <div className="form-group">
                                    <label>Nama Lengkap *</label>
                                    <input className="form-input" type="text" placeholder="Masukkan nama kamu"
                                        value={formData.customerName} required
                                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>No. Telepon / WhatsApp *</label>
                                    <input className="form-input" type="tel" placeholder="08xxxxxxxxxx"
                                        value={formData.customerPhone} required
                                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Catatan</label>
                                    <input className="form-input" type="text" placeholder="Catatan tambahan (opsional)"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button type="button" className="btn btn-secondary" onClick={closeModal} style={{ flex: 1 }}>
                                        Batal
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                        Lanjut ke Pembayaran →
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* ===== PAYMENT SELECT ===== */}
                    {orderStep === 'payment-select' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setOrderStep('form')} style={{ padding: 6 }}>
                                    <ArrowLeft size={18} />
                                </button>
                                <h2 style={{ margin: 0 }}>💳 Pilih Pembayaran</h2>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>TOTAL</div>
                                <div style={{
                                    fontSize: 32, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif",
                                    background: 'linear-gradient(135deg, var(--coral), var(--orange))',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>{formatRupiah(total)}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                                    {formData.customerName} • {formData.customerPhone}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <button onClick={() => selectPayment('cash')} style={{
                                    display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer',
                                    transition: 'var(--transition)',
                                }}
                                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.background = 'rgba(0, 184, 148, 0.06)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0, 184, 148, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>💵</div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600, fontSize: 16 }}>Cash (Tunai)</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Bayar langsung saat pengambilan</div>
                                    </div>
                                    <Banknote size={20} style={{ marginLeft: 'auto', color: 'var(--green)' }} />
                                </button>

                                <button onClick={() => selectPayment('qris')} style={{
                                    display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer',
                                    transition: 'var(--transition)',
                                }}
                                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = 'rgba(108, 92, 231, 0.06)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(108, 92, 231, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📱</div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600, fontSize: 16 }}>QRIS</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Scan QR dengan e-wallet / m-banking</div>
                                    </div>
                                    <QrCode size={20} style={{ marginLeft: 'auto', color: 'var(--purple)' }} />
                                </button>
                            </div>
                        </>
                    )}

                    {/* ===== CASH PAYMENT ===== */}
                    {orderStep === 'cash' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setOrderStep('payment-select')} style={{ padding: 6 }}>
                                    <ArrowLeft size={18} />
                                </button>
                                <h2 style={{ margin: 0 }}>💵 Pembayaran Cash</h2>
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>TOTAL BAYAR</div>
                                <div style={{
                                    fontSize: 36, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif",
                                    background: 'linear-gradient(135deg, var(--coral), var(--orange))',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>{formatRupiah(total)}</div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                                    Uang Diterima
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 600, color: 'var(--text-tertiary)' }}>Rp</span>
                                    <input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)}
                                        placeholder="0" autoFocus style={{
                                            width: '100%', padding: '16px 16px 16px 54px',
                                            background: 'var(--bg-card)',
                                            border: `2px solid ${cashReceivedNum >= total && cashReceivedNum > 0 ? 'var(--green)' : 'var(--border)'}`,
                                            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                                            fontSize: 28, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
                                        }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                                {quickCash.map((amt) => (
                                    <button key={amt} onClick={() => setCashReceived(amt.toString())} style={{
                                        padding: '10px 14px', background: cashReceivedNum === amt ? 'rgba(0,184,148,0.12)' : 'var(--bg-card)',
                                        border: `1px solid ${cashReceivedNum === amt ? 'var(--green)' : 'var(--border)'}`,
                                        borderRadius: 'var(--radius-md)', color: cashReceivedNum === amt ? 'var(--green)' : 'var(--text-primary)',
                                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                    }}>{formatRupiah(amt)}</button>
                                ))}
                                <button onClick={() => setCashReceived(total.toString())} style={{
                                    padding: '10px 14px', gridColumn: '1 / -1',
                                    background: cashReceivedNum === total ? 'rgba(78,205,196,0.12)' : 'var(--bg-surface)',
                                    border: `1px solid ${cashReceivedNum === total ? 'var(--teal)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-md)', color: cashReceivedNum === total ? 'var(--teal)' : 'var(--text-secondary)',
                                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                }}>Uang Pas: {formatRupiah(total)}</button>
                            </div>

                            {cashReceivedNum > 0 && (
                                <div style={{
                                    background: changeDue >= 0 ? 'rgba(0,184,148,0.08)' : 'rgba(255,107,107,0.08)',
                                    border: `1px solid ${changeDue >= 0 ? 'rgba(0,184,148,0.2)' : 'rgba(255,107,107,0.2)'}`,
                                    borderRadius: 'var(--radius-lg)', padding: 16, textAlign: 'center', marginBottom: 16,
                                }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
                                        {changeDue >= 0 ? '💰 Kembalian' : '⚠️ Kurang'}
                                    </div>
                                    <div style={{
                                        fontSize: 30, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif",
                                        color: changeDue >= 0 ? 'var(--green)' : 'var(--coral)',
                                    }}>{changeDue >= 0 ? formatRupiah(changeDue) : `- ${formatRupiah(Math.abs(changeDue))}`}</div>
                                </div>
                            )}

                            <button className="btn btn-primary" onClick={() => processOrder('cash')}
                                disabled={cashReceivedNum < total || cashReceivedNum <= 0}
                                style={{
                                    width: '100%', padding: '14px 24px', fontSize: 16,
                                    opacity: cashReceivedNum >= total && cashReceivedNum > 0 ? 1 : 0.4,
                                    cursor: cashReceivedNum >= total && cashReceivedNum > 0 ? 'pointer' : 'not-allowed',
                                }}>
                                <CheckCircle size={18} />
                                {cashReceivedNum >= total && cashReceivedNum > 0
                                    ? `Konfirmasi • Kembalian ${formatRupiah(changeDue)}`
                                    : 'Masukkan Jumlah Uang'}
                            </button>
                        </>
                    )}

                    {/* ===== QRIS PAYMENT ===== */}
                    {orderStep === 'qris' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => { clearInterval(timerRef.current); setOrderStep('payment-select'); }} style={{ padding: 6 }}>
                                    <ArrowLeft size={18} />
                                </button>
                                <h2 style={{ margin: 0 }}>📱 Pembayaran QRIS</h2>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px',
                                    background: qrisTimer <= 60 ? 'rgba(255,107,107,0.12)' : 'rgba(78,205,196,0.12)',
                                    border: `1px solid ${qrisTimer <= 60 ? 'rgba(255,107,107,0.2)' : 'rgba(78,205,196,0.2)'}`,
                                    borderRadius: 'var(--radius-full)', fontSize: 14, fontWeight: 600,
                                    color: qrisTimer <= 60 ? 'var(--coral-light)' : 'var(--teal-light)', marginBottom: 16,
                                }}>
                                    <Clock size={14} />
                                    Berlaku {formatTime(qrisTimer)}
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>TOTAL PEMBAYARAN</div>
                                    <div style={{
                                        fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif",
                                        background: 'linear-gradient(135deg, var(--purple), var(--coral))',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    }}>{formatRupiah(total)}</div>
                                </div>

                                {/* QR Code */}
                                <div style={{
                                    background: 'white', borderRadius: 'var(--radius-lg)', padding: 12,
                                    display: 'inline-block', marginBottom: 16,
                                    boxShadow: '0 8px 32px rgba(108, 92, 231, 0.2)',
                                    maxWidth: '260px', width: '100%'
                                }}>
                                    <img
                                        src="/assets/qris.png"
                                        alt="QRIS Pembayaran"
                                        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--radius-md)' }}
                                    />
                                </div>

                                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.6 }}>
                                    Scan QR code menggunakan<br />
                                    <strong>GoPay, OVO, DANA, ShopeePay, LinkAja</strong>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
                                    {formData.customerName} • {formData.customerPhone}
                                </div>

                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                                    padding: '8px 16px', background: 'rgba(253,203,110,0.08)',
                                    border: '1px solid rgba(253,203,110,0.2)', borderRadius: 'var(--radius-md)',
                                    fontSize: 13, color: 'var(--yellow)', marginBottom: 16,
                                }}>
                                    <div className="pulse">⏳</div>
                                    Menunggu pembayaran...
                                </div>
                            </div>

                            <button className="btn btn-primary" onClick={() => processOrder('qris')}
                                style={{ width: '100%', padding: '14px 24px', fontSize: 16, marginBottom: 8 }}>
                                <CheckCircle size={18} />
                                Konfirmasi Pembayaran Diterima
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { clearInterval(timerRef.current); setOrderStep('payment-select'); }}
                                style={{ width: '100%', justifyContent: 'center' }}>
                                Batal & Ganti Metode
                            </button>
                        </>
                    )}
                </div>
            </div>

            <Footer />
            <ChatBot onNavigate={() => {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.scrollIntoView({ behavior: 'smooth' });
                    searchInput.focus();
                }
            }} />
        </div>
    );
}
