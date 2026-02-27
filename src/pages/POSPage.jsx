import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { categories, formatRupiah, formatPhoneForFonnte, pantuns } from '../data/menuData';
import { useToast } from '../components/Toast';
import {
    Search,
    Minus,
    Plus,
    Trash2,
    CheckCircle,
    Printer,
    RotateCcw,
    X,
    ArrowLeft,
    Clock,
    QrCode,
    Banknote,
    MessageSquare,
} from 'lucide-react';

export default function POSPage({ user }) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [step, setStep] = useState('menu'); // 'menu', 'payment-select', 'cash', 'qris', 'receipt'
    const [lastOrder, setLastOrder] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const [paymentMethod, setPaymentMethod] = useState('');
    const [orderType, setOrderType] = useState('dine-in');
    const [cashReceived, setCashReceived] = useState('');
    const [qrisTimer, setQrisTimer] = useState(300); // 5 minutes
    const [qrisStatus, setQrisStatus] = useState('waiting'); // 'waiting', 'confirmed'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const timerRef = useRef(null);

    const { state, dispatch } = useApp();
    const { showToast, ToastContainer } = useToast();
    const [waNumber, setWaNumber] = useState('');
    const [isSendingWA, setIsSendingWA] = useState(false);
    const [showWAModal, setShowWAModal] = useState(false);

    // Effect to load editing order data
    useEffect(() => {
        if (state.editingOrder) {
            setCustomerName(state.editingOrder.customerName || '');
            setCustomerPhone(state.editingOrder.customerPhone || '');
            setOrderType(state.editingOrder.type || 'dine-in');
            setPaymentMethod(state.editingOrder.paymentMethod || 'cash');
        }
    }, [state.editingOrder]);

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
            return;
        }

        const finalItem = selectedVariant
            ? { ...item, id: `${item.id}-${selectedVariant.id}`, name: `${item.name} (${selectedVariant.name})`, price: item.price + selectedVariant.price }
            : item;

        dispatch({ type: 'ADD_TO_CART', payload: finalItem });
        if (selectedProduct) {
            setSelectedProduct(null);
            setSelectedVariant(null);
        }
    };

    const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalCost = state.cart.reduce((sum, item) => sum + item.cost * item.qty, 0);
    const profit = total - totalCost;
    const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const marginPct = total > 0 ? ((profit / total) * 100).toFixed(1) : 0;

    const cashReceivedNum = parseInt(cashReceived) || 0;
    const changeDue = cashReceivedNum - total;

    // QRIS Timer
    useEffect(() => {
        if (step === 'qris' && qrisStatus === 'waiting') {
            timerRef.current = setInterval(() => {
                setQrisTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        showToast('QRIS timeout! Silakan ulangi.', 'error');
                        setStep('payment-select');
                        return 300;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [step, qrisStatus]);

    const handlePayment = () => {
        if (state.cart.length === 0) {
            showToast('Keranjang kosong!', 'error');
            return;
        }
        setStep('payment-select');
    };

    const selectPaymentMethod = (method) => {
        setPaymentMethod(method);
        if (method === 'cash') {
            setCashReceived('');
            setStep('cash');
        } else if (method === 'qris') {
            setQrisTimer(300);
            setQrisStatus('waiting');
            setStep('qris');
        } else if (method === 'unpaid') {
            processPayment('unpaid');
        }
    };

    const processPayment = (method) => {
        const order = {
            ...(state.editingOrder || {}),
            id: state.editingOrder ? state.editingOrder.id : `ORD-${Date.now()}`,
            items: [...state.cart],
            total,
            totalCost,
            profit,
            customerName: customerName || 'Walk-in',
            customerPhone: customerPhone || '',
            paymentMethod: method || paymentMethod,
            type: orderType,
            cashReceived: method === 'cash' ? cashReceivedNum : null,
            change: method === 'cash' ? changeDue : null,
            cashierName: user?.username || (state.editingOrder?.cashierName || 'Admin'),
            status: state.editingOrder ? state.editingOrder.status : 'completed',
            createdAt: state.editingOrder ? state.editingOrder.createdAt : new Date().toISOString(),
        };

        if (state.editingOrder) {
            dispatch({ type: 'UPDATE_ORDER', payload: order });
            showToast('Pesanan berhasil diperbarui! 🎉');
        } else {
            dispatch({ type: 'ADD_ORDER', payload: order });
            showToast('Pembayaran berhasil! 🎉');
        }

        setLastOrder(order);

        clearInterval(timerRef.current);
        setStep('receipt');
        setCustomerName('');
        setCustomerPhone('');
        setCashReceived('');

        setQrisStatus('waiting');
        showToast('Pembayaran berhasil! 🎉');
    };

    const resetToMenu = () => {
        setStep('menu');
        setLastOrder(null);
        setPaymentMethod('');
        setCashReceived('');
        setQrisStatus('waiting');
        setQrisTimer(300);
        if (state.editingOrder) {
            dispatch({ type: 'SET_EDIT_ORDER', payload: null });
            dispatch({ type: 'CLEAR_CART' });
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Quick cash denominations
    const quickCash = [50000, 100000, 150000, 200000];

    return (
        <div className="page-wrapper">
            <ToastContainer />

            <div className="pos-layout">
                {/* Left: Menu Section */}
                <div className="pos-menu-section">
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ fontSize: 22, fontWeight: 700 }}>💳 Point of Sale</h2>
                            {state.editingOrder && (
                                <button
                                    onClick={() => {
                                        if (confirm('Batal edit pesanan ini?')) {
                                            dispatch({ type: 'SET_EDIT_ORDER', payload: null });
                                            dispatch({ type: 'CLEAR_CART' });
                                            setCustomerName('');
                                            setCustomerPhone('');
                                        }
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'rgba(255, 107, 107, 0.1)',
                                        color: 'var(--coral)',
                                        border: '1px solid var(--coral)',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Batal Edit
                                </button>
                            )}
                        </div>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
                            {state.editingOrder ? `Sedang mengedit pesanan: ${state.editingOrder.id}` : 'Pilih menu dan proses pembayaran'}
                        </p>
                    </div>

                    {/* Search */}
                    <div className="pos-search">
                        <div className="search-input-wrapper">
                            <Search size={16} className="icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Cari menu..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="pos-categories">
                        <button
                            className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('all')}
                            style={{ padding: '8px 16px', fontSize: 13 }}
                        >
                            Semua
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{ padding: '8px 16px', fontSize: 13 }}
                            >
                                {cat.icon} {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Menu Grid */}
                    <div className="pos-menu-grid">
                        {filtered.map((item) => (
                            <div
                                key={item.id}
                                className={`pos-item-card ${item.stock !== undefined && item.stock <= 0 ? 'out' : ''}`}
                                onClick={() => (item.stock === undefined || item.stock > 0) && addToCart(item)}
                                style={{
                                    position: 'relative',
                                    opacity: item.stock <= 0 ? 0.6 : 1,
                                    cursor: item.stock <= 0 ? 'not-allowed' : 'pointer',
                                    filter: item.stock <= 0 ? 'grayscale(0.8)' : 'none'
                                }}
                            >
                                {item.stock <= 5 && item.stock > 0 && (
                                    <span style={{
                                        position: 'absolute', top: 4, right: 4,
                                        fontSize: 8, background: 'var(--yellow)', color: '#000',
                                        padding: '2px 4px', borderRadius: 4, fontWeight: 700
                                    }}>SISA {item.stock}</span>
                                )}
                                {item.stock <= 0 && (
                                    <span style={{
                                        position: 'absolute', top: 4, right: 4,
                                        fontSize: 8, background: 'var(--coral)', color: 'white',
                                        padding: '2px 4px', borderRadius: 4, fontWeight: 700
                                    }}>HABIS</span>
                                )}

                                <div className="emoji">
                                    {(item.image.startsWith('/') || item.image.startsWith('http')) ? (
                                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                                    ) : (
                                        item.image
                                    )}
                                </div>

                                <div className="name">{item.name}</div>
                                <div className="price" style={{ color: item.stock <= 0 ? 'var(--text-tertiary)' : 'var(--teal-light)' }}>
                                    {formatRupiah(item.price)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Cart / Payment Section */}
                <div className="pos-cart-section">

                    {/* ======================== STEP: MENU (Cart) ======================== */}
                    {(step === 'menu' || step === 'payment-select') && (
                        <>
                            <div className="pos-cart-header">
                                <h3>
                                    Pesanan Baru
                                    {totalItems > 0 && (
                                        <span style={{
                                            fontSize: 12,
                                            background: 'var(--coral)',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: 'var(--radius-full)',
                                            marginLeft: 8,
                                        }}>
                                            {totalItems} item
                                        </span>
                                    )}
                                </h3>

                                <div className="tabs" style={{ marginBottom: 0, marginTop: 12 }}>
                                    {['dine-in', 'takeaway'].map((type) => (
                                        <button
                                            key={type}
                                            className={`tab ${orderType === type ? 'active' : ''}`}
                                            onClick={() => setOrderType(type)}
                                            style={{ fontSize: 12, padding: '6px 12px' }}
                                        >
                                            {type === 'dine-in' ? '🍽️ Dine-in' : '📦 Take Away'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pos-cart-items">
                                {state.cart.length === 0 ? (
                                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                                        <div className="emoji" style={{ fontSize: 48 }}>🛒</div>
                                        <h3 style={{ fontSize: 16 }}>Belum ada pesanan</h3>
                                        <p style={{ fontSize: 13 }}>Klik menu untuk menambahkan</p>
                                    </div>
                                ) : (
                                    state.cart.map((item) => {
                                        const itemProfit = (item.price - item.cost) * item.qty;
                                        const itemModalTotal = item.cost * item.qty;
                                        const itemMargin = ((item.price - item.cost) / item.price * 100).toFixed(0);
                                        const isImagePath = item.image && (item.image.startsWith('/') || item.image.startsWith('http'));

                                        return (
                                            <div key={item.id} className="pos-cart-item" style={{
                                                flexDirection: 'column',
                                                alignItems: 'stretch',
                                                padding: '12px 16px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginBottom: 8 }}>
                                                    <div style={{
                                                        width: 40, height: 40, borderRadius: 8,
                                                        background: 'var(--bg-surface)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0
                                                    }}>
                                                        {isImagePath ? (
                                                            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <span style={{ fontSize: 20 }}>{item.image}</span>
                                                        )}
                                                    </div>
                                                    <div className="item-info" style={{ flex: 1, minWidth: 0 }}>
                                                        <div className="name" style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                                        <div className="price" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatRupiah(item.price)} /pcs</div>
                                                    </div>
                                                    <div className="cart-item-qty" style={{ margin: '0 8px' }}>
                                                        <button
                                                            className="qty-btn"
                                                            onClick={() =>
                                                                dispatch({
                                                                    type: 'UPDATE_QTY',
                                                                    payload: { id: item.id, qty: item.qty - 1 },
                                                                })
                                                            }
                                                        >
                                                            {item.qty === 1 ? <Trash2 size={10} /> : <Minus size={10} />}
                                                        </button>
                                                        <span className="qty-num" style={{ fontSize: 13, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                                                        <button
                                                            className="qty-btn"
                                                            onClick={() =>
                                                                dispatch({
                                                                    type: 'UPDATE_QTY',
                                                                    payload: { id: item.id, qty: item.qty + 1 },
                                                                })
                                                            }
                                                        >
                                                            <Plus size={10} />
                                                        </button>
                                                    </div>
                                                    <div className="item-total" style={{ fontWeight: 700, fontSize: 14, color: 'var(--coral)', textAlign: 'right', minWidth: 80 }}>
                                                        {formatRupiah(item.price * item.qty)}
                                                    </div>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    gap: 6,
                                                    paddingLeft: 52,
                                                }}>
                                                    <span style={{
                                                        fontSize: 10, padding: '2px 6px',
                                                        borderRadius: 6,
                                                        background: 'rgba(253, 203, 110, 0.1)',
                                                        color: 'var(--yellow)', fontWeight: 600,
                                                    }}>HPP: {formatRupiah(itemModalTotal)}</span>
                                                    <span style={{
                                                        fontSize: 10, padding: '2px 6px',
                                                        borderRadius: 6,
                                                        background: 'rgba(0, 184, 148, 0.1)',
                                                        color: 'var(--green)', fontWeight: 600,
                                                    }}>Laba: {formatRupiah(itemProfit)}</span>
                                                    <span style={{
                                                        fontSize: 10, padding: '2px 6px',
                                                        borderRadius: 6,
                                                        background: 'rgba(78, 205, 196, 0.1)',
                                                        color: 'var(--teal-light)', fontWeight: 600,
                                                    }}>{itemMargin}%</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {state.cart.length > 0 && (
                                <div className="pos-cart-footer">
                                    <div className="pos-summary-row">
                                        <span>Subtotal ({totalItems} item)</span>
                                        <span>{formatRupiah(total)}</span>
                                    </div>
                                    <div className="pos-summary-row">
                                        <span>💰 Total Modal (HPP)</span>
                                        <span style={{ color: 'var(--yellow)' }}>{formatRupiah(totalCost)}</span>
                                    </div>
                                    <div className="pos-summary-row profit">
                                        <span>🎉 Total Keuntungan</span>
                                        <span>+{formatRupiah(profit)}</span>
                                    </div>
                                    <div className="pos-summary-row" style={{ fontSize: 12 }}>
                                        <span>📊 Margin Keuntungan</span>
                                        <span style={{ color: 'var(--teal-light)', fontWeight: 600 }}>{marginPct}%</span>
                                    </div>
                                    <div className="pos-summary-row total">
                                        <span>Total Bayar</span>
                                        <span>{formatRupiah(total)}</span>
                                    </div>

                                    {step === 'menu' && (
                                        <div className="pos-actions">
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => dispatch({ type: 'CLEAR_CART' })}
                                            >
                                                <RotateCcw size={14} />
                                                Reset
                                            </button>
                                            <button className="btn btn-primary" onClick={handlePayment}>
                                                <CheckCircle size={16} />
                                                Bayar {formatRupiah(total)}
                                            </button>
                                        </div>
                                    )}

                                    {/* ======================== PAYMENT SELECT ======================== */}
                                    {step === 'payment-select' && (
                                        <div style={{ marginTop: 16 }}>
                                            <div style={{ marginBottom: 12 }}>
                                                <div className="form-group" style={{ marginBottom: 12 }}>
                                                    <label style={{ fontSize: 11 }}>Nama Pelanggan</label>
                                                    <input
                                                        className="form-input"
                                                        type="text"
                                                        placeholder="Walk-in Customer"
                                                        value={customerName}
                                                        onChange={(e) => setCustomerName(e.target.value)}
                                                        style={{ padding: '10px 14px', fontSize: 14 }}
                                                    />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 12 }}>
                                                    <label style={{ fontSize: 11 }}>No. WhatsApp</label>
                                                    <input
                                                        className="form-input"
                                                        type="tel"
                                                        placeholder="08xxxxxxxx"
                                                        value={customerPhone}
                                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                                        style={{ padding: '10px 14px', fontSize: 14 }}
                                                    />
                                                </div>

                                            </div>

                                            <div style={{
                                                fontSize: 11,
                                                color: 'var(--text-tertiary)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5,
                                                marginBottom: 10,
                                                fontWeight: 600,
                                            }}>
                                                Pilih Metode Pembayaran
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                <button
                                                    onClick={() => selectPaymentMethod('cash')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 14,
                                                        padding: '16px 18px',
                                                        background: 'var(--bg-card)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: 'var(--radius-md)',
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        transition: 'var(--transition)',
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--green)';
                                                        e.currentTarget.style.background = 'rgba(0, 184, 148, 0.06)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.background = 'var(--bg-card)';
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 48, height: 48, borderRadius: 12,
                                                        background: 'rgba(0, 184, 148, 0.12)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 24,
                                                    }}>💵</div>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontWeight: 600, fontSize: 15 }}>Cash (Tunai)</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                                            Pembayaran langsung dengan uang tunai
                                                        </div>
                                                    </div>
                                                    <Banknote size={20} style={{ marginLeft: 'auto', color: 'var(--green)' }} />
                                                </button>

                                                <button
                                                    onClick={() => selectPaymentMethod('qris')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 14,
                                                        padding: '16px 18px',
                                                        background: 'var(--bg-card)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: 'var(--radius-md)',
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        transition: 'var(--transition)',
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--purple)';
                                                        e.currentTarget.style.background = 'rgba(108, 92, 231, 0.06)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.background = 'var(--bg-card)';
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 48, height: 48, borderRadius: 12,
                                                        background: 'rgba(108, 92, 231, 0.12)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 24,
                                                    }}>📱</div>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontWeight: 600, fontSize: 15 }}>QRIS</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                                            Scan QR code dengan e-wallet / m-banking
                                                        </div>
                                                    </div>
                                                    <QrCode size={20} style={{ marginLeft: 'auto', color: 'var(--purple)' }} />
                                                </button>

                                                <button
                                                    onClick={() => selectPaymentMethod('unpaid')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 14,
                                                        padding: '16px 18px',
                                                        background: 'var(--bg-card)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: 'var(--radius-md)',
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        transition: 'var(--transition)',
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--coral)';
                                                        e.currentTarget.style.background = 'rgba(255, 107, 107, 0.06)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.background = 'var(--bg-card)';
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 48, height: 48, borderRadius: 12,
                                                        background: 'rgba(255, 107, 107, 0.12)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 24,
                                                    }}>📝</div>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontWeight: 600, fontSize: 15 }}>Belum Bayar</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                                            Catat sebagai belum bayar untuk klien
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>

                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setStep('menu')}
                                                style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                                            >
                                                <ArrowLeft size={14} />
                                                Kembali
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* ======================== STEP: CASH PAYMENT ======================== */}
                    {step === 'cash' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="pos-cart-header" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setStep('payment-select')} style={{ padding: 6 }}>
                                        <ArrowLeft size={18} />
                                    </button>
                                    <h3>💵 Pembayaran Cash</h3>
                                </div>
                            </div>

                            <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
                                {/* Order Summary */}
                                <div style={{
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 16, marginBottom: 20,
                                }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Ringkasan Pesanan • {customerName || 'Walk-in'}
                                    </div>
                                    {state.cart.map((item) => (
                                        <div key={item.id} style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '6px 0', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                {(item.image.startsWith('/') || item.image.startsWith('http')) ? (
                                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: 14 }}>{item.image}</span>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>{item.name} x{item.qty}</div>
                                            <span style={{ fontWeight: 600 }}>{formatRupiah(item.price * item.qty)}</span>
                                        </div>
                                    ))}

                                </div>

                                {/* Total */}
                                <div style={{
                                    textAlign: 'center',
                                    padding: '16px 0',
                                    marginBottom: 20,
                                }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                                        TOTAL YANG HARUS DIBAYAR
                                    </div>
                                    <div style={{
                                        fontSize: 42, fontWeight: 800,
                                        fontFamily: "'Bree Serif', serif",
                                        color: 'var(--coral)',
                                    }}>
                                        {formatRupiah(total)}
                                    </div>
                                </div>

                                {/* Cash Input */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{
                                        fontSize: 12, color: 'var(--text-tertiary)',
                                        textTransform: 'uppercase', letterSpacing: 0.5,
                                        display: 'block', marginBottom: 8, fontWeight: 600,
                                    }}>
                                        Uang Diterima
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{
                                            position: 'absolute', left: 16, top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: 18, fontWeight: 600, color: 'var(--text-tertiary)',
                                        }}>Rp</span>
                                        <input
                                            type="number"
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value)}
                                            placeholder="0"
                                            autoFocus
                                            style={{
                                                width: '100%',
                                                padding: '18px 16px 18px 54px',
                                                background: 'var(--bg-card)',
                                                border: `2px solid ${cashReceivedNum >= total && cashReceivedNum > 0 ? 'var(--green)' : 'var(--border)'}`,
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--text-primary)',
                                                fontSize: 28, fontWeight: 700,
                                                fontFamily: "'Space Grotesk', sans-serif",
                                                transition: 'var(--transition)',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Quick Cash Buttons */}
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 8, marginBottom: 20,
                                }}>
                                    {quickCash.map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => setCashReceived(amount.toString())}
                                            style={{
                                                padding: '12px 16px',
                                                background: cashReceivedNum === amount ? 'rgba(0, 184, 148, 0.12)' : 'var(--bg-card)',
                                                border: `1px solid ${cashReceivedNum === amount ? 'var(--green)' : 'var(--border)'}`,
                                                borderRadius: 'var(--radius-md)',
                                                color: cashReceivedNum === amount ? 'var(--green)' : 'var(--text-primary)',
                                                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                                                transition: 'var(--transition)',
                                            }}
                                        >
                                            {formatRupiah(amount)}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCashReceived(total.toString())}
                                        style={{
                                            padding: '12px 16px', gridColumn: '1 / -1',
                                            background: cashReceivedNum === total ? 'rgba(78, 205, 196, 0.12)' : 'var(--bg-surface)',
                                            border: `1px solid ${cashReceivedNum === total ? 'var(--teal)' : 'var(--border)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            color: cashReceivedNum === total ? 'var(--teal)' : 'var(--text-secondary)',
                                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                            transition: 'var(--transition)',
                                        }}
                                    >
                                        Uang Pas: {formatRupiah(total)}
                                    </button>
                                </div>

                                {/* Change Display */}
                                {cashReceivedNum > 0 && (
                                    <div style={{
                                        background: changeDue >= 0
                                            ? 'rgba(0, 184, 148, 0.08)'
                                            : 'rgba(255, 107, 107, 0.08)',
                                        border: `1px solid ${changeDue >= 0 ? 'rgba(0, 184, 148, 0.2)' : 'rgba(255, 107, 107, 0.2)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        padding: 20, textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontSize: 12, color: 'var(--text-tertiary)',
                                            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
                                        }}>
                                            {changeDue >= 0 ? '💰 Kembalian' : '⚠️ Kurang'}
                                        </div>
                                        <div style={{
                                            fontSize: 36, fontWeight: 800,
                                            fontFamily: "'Space Grotesk', sans-serif",
                                            color: changeDue >= 0 ? 'var(--green)' : 'var(--coral)',
                                        }}>
                                            {changeDue >= 0
                                                ? formatRupiah(changeDue)
                                                : `- ${formatRupiah(Math.abs(changeDue))}`
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: 20, borderTop: '1px solid var(--border)' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => processPayment('cash')}
                                    disabled={cashReceivedNum < total || cashReceivedNum <= 0}
                                    style={{
                                        width: '100%', padding: '16px 24px', fontSize: 16,
                                        opacity: cashReceivedNum >= total && cashReceivedNum > 0 ? 1 : 0.4,
                                        cursor: cashReceivedNum >= total && cashReceivedNum > 0 ? 'pointer' : 'not-allowed',
                                    }}
                                >
                                    <CheckCircle size={20} />
                                    {cashReceivedNum >= total && cashReceivedNum > 0
                                        ? `Proses Pembayaran • Kembalian ${formatRupiah(changeDue)}`
                                        : 'Masukkan Jumlah Uang'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ======================== STEP: QRIS PAYMENT ======================== */}
                    {step === 'qris' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="pos-cart-header" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { clearInterval(timerRef.current); setStep('payment-select'); }} style={{ padding: 6 }}>
                                        <ArrowLeft size={18} />
                                    </button>
                                    <h3>📱 Pembayaran QRIS</h3>
                                </div>
                            </div>

                            <div style={{ flex: 1, padding: 20, overflowY: 'auto', textAlign: 'center' }}>
                                {/* Timer */}
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '6px 16px',
                                    background: qrisTimer <= 60 ? 'rgba(255, 107, 107, 0.12)' : 'rgba(78, 205, 196, 0.12)',
                                    border: `1px solid ${qrisTimer <= 60 ? 'rgba(255, 107, 107, 0.2)' : 'rgba(78, 205, 196, 0.2)'}`,
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: 14, fontWeight: 600,
                                    color: qrisTimer <= 60 ? 'var(--coral-light)' : 'var(--teal-light)',
                                    marginBottom: 20,
                                }}>
                                    <Clock size={14} />
                                    Berlaku {formatTime(qrisTimer)}
                                </div>

                                {/* Total */}
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                                        TOTAL PEMBAYARAN
                                    </div>
                                    <div style={{
                                        fontSize: 32, fontWeight: 800,
                                        fontFamily: "'Bree Serif', serif",
                                        color: 'var(--coral)',
                                    }}>
                                        {formatRupiah(total)}
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div style={{
                                    background: 'white', borderRadius: 'var(--radius-lg)', padding: 12,
                                    display: 'inline-block', marginBottom: 20,
                                    boxShadow: '0 8px 32px rgba(108, 92, 231, 0.2)',
                                    maxWidth: '220px', width: '100%'
                                }}>
                                    <img
                                        src="/assets/qris.png"
                                        alt="QRIS Pembayaran"
                                        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--radius-md)' }}
                                    />
                                </div>

                                <div style={{
                                    fontSize: 14, color: 'var(--text-secondary)',
                                    marginBottom: 8, lineHeight: 1.6,
                                }}>
                                    Scan QR code di atas menggunakan<br />
                                    <strong>GoPay, OVO, DANA, ShopeePay, LinkAja</strong><br />
                                    atau aplikasi m-Banking kamu
                                </div>

                                <div style={{
                                    fontSize: 12, color: 'var(--text-tertiary)',
                                    marginBottom: 20,
                                }}>
                                    Customer: {customerName || 'Walk-in'} • {orderType.toUpperCase()}
                                </div>

                                {/* Status */}
                                {qrisStatus === 'waiting' && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        justifyContent: 'center',
                                        padding: '10px 20px',
                                        background: 'rgba(253, 203, 110, 0.08)',
                                        border: '1px solid rgba(253, 203, 110, 0.2)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 13, color: 'var(--yellow)',
                                    }}>
                                        <div className="pulse">⏳</div>
                                        Menunggu pembayaran...
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: 20, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => processPayment('qris')}
                                    style={{ width: '100%', padding: '16px 24px', fontSize: 16 }}
                                >
                                    <CheckCircle size={20} />
                                    Konfirmasi Pembayaran Diterima
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => { clearInterval(timerRef.current); setStep('payment-select'); }}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    Batal & Ganti Metode
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ======================== STEP: RECEIPT ======================== */}
                    {step === 'receipt' && lastOrder && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="pos-cart-header" style={{ borderBottom: '1px solid var(--border)' }}>
                                <h3>🧾 Struk Pembayaran</h3>
                            </div>

                            <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
                                {/* Success animation */}
                                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                    <div className="success-icon" style={{ margin: '0 auto 12px' }}>
                                        ✅
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                                        Pembayaran Berhasil!
                                    </h3>
                                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                                        {lastOrder.paymentMethod === 'qris' ? '📱 QRIS' : '💵 Cash'} • {lastOrder.type.toUpperCase()}
                                    </p>
                                </div>

                                {/* Receipt */}
                                <div className="receipt">
                                    <div className="receipt-header">
                                        <h3 style={{ fontSize: 24, letterSpacing: 1 }}>✨ CAMU CAMU ✨</h3>
                                        <p style={{ fontStyle: 'italic', fontWeight: 500 }}>sekali gigit, seribu cerita</p>
                                        <p style={{ marginTop: 4 }}>
                                            {new Date(lastOrder.createdAt).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'long', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </p>
                                        <p style={{ fontWeight: 600, marginTop: 4 }}>#{lastOrder.id}</p>
                                    </div>

                                    <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                                        Customer: {lastOrder.customerName}
                                    </div>
                                    <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
                                        {lastOrder.type.toUpperCase()} | {lastOrder.paymentMethod === 'qris' ? 'QRIS' : 'CASH'}
                                    </div>

                                    {lastOrder.items.map((item) => (
                                        <div key={item.id} className="receipt-item">
                                            <span>{item.name} x{item.qty}</span>
                                            <span>{formatRupiah(item.price * item.qty)}</span>
                                        </div>
                                    ))}

                                    <div className="receipt-total">
                                        <div className="row grand">
                                            <span>TOTAL</span>
                                            <span>{formatRupiah(lastOrder.total)}</span>
                                        </div>
                                        {lastOrder.paymentMethod === 'cash' && (
                                            <>
                                                <div className="row">
                                                    <span>Tunai</span>
                                                    <span>{formatRupiah(lastOrder.cashReceived)}</span>
                                                </div>
                                                <div className="row" style={{ fontWeight: 600 }}>
                                                    <span>Kembalian</span>
                                                    <span>{formatRupiah(lastOrder.change)}</span>
                                                </div>
                                            </>
                                        )}
                                        {lastOrder.paymentMethod === 'qris' && (
                                            <div className="row">
                                                <span>Metode</span>
                                                <span>QRIS ✓</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="receipt-footer">
                                        <p>Makasih ya bestie udah jajan! ✨</p>
                                        <p>Tag kita di IG ya: @camucamu.id 🔥</p>
                                        <p style={{ marginTop: 4, opacity: 0.6, fontSize: 10 }}>#CamuCamuVibes #GakAdaObat</p>
                                    </div>
                                </div>

                                {/* Profit summary */}
                                <div style={{
                                    marginTop: 16,
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 16,
                                    border: '1px solid var(--border)',
                                }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        📊 Analisis Transaksi
                                    </div>
                                    {lastOrder.items.map((item) => (
                                        <div key={item.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12,
                                        }}>
                                            <span>{item.image} {item.name} x{item.qty}</span>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <span style={{
                                                    padding: '1px 6px', borderRadius: 'var(--radius-full)',
                                                    background: 'rgba(253, 203, 110, 0.12)', color: 'var(--yellow)',
                                                    fontSize: 10, fontWeight: 600,
                                                }}>Modal: {formatRupiah(item.cost * item.qty)}</span>
                                                <span style={{
                                                    padding: '1px 6px', borderRadius: 'var(--radius-full)',
                                                    background: 'rgba(0, 184, 148, 0.12)', color: 'var(--green)',
                                                    fontSize: 10, fontWeight: 600,
                                                }}>Untung: {formatRupiah((item.price - item.cost) * item.qty)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        marginTop: 10, paddingTop: 8, fontWeight: 700,
                                    }}>
                                        <div>
                                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Modal: </span>
                                            <span style={{ color: 'var(--yellow)', fontSize: 14 }}>{formatRupiah(lastOrder.totalCost)}</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Untung: </span>
                                            <span style={{ color: 'var(--green)', fontSize: 14 }}>{formatRupiah(lastOrder.profit)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: 20, borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => window.print()}>
                                    <Printer size={16} />
                                    Print
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1, color: '#25D366', borderColor: '#25D366', background: 'rgba(37, 211, 102, 0.05)' }}
                                    onClick={() => {
                                        setWaNumber(lastOrder?.customerPhone || '');
                                        setShowWAModal(true);
                                    }}

                                >
                                    <MessageSquare size={16} />
                                    WA Struk
                                </button>
                                <button className="btn btn-primary" style={{ flex: 2, minWidth: '100%' }} onClick={resetToMenu}>
                                    <CheckCircle size={16} />
                                    Pesanan Baru
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ========== WHATSAPP MODAL ========== */}
            <div className={`modal-overlay ${showWAModal ? 'open' : ''}`}
                onClick={() => setShowWAModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0 }}>📲 Kirim via WhatsApp</h2>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowWAModal(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <div className="form-group">
                            <label>Nomor WhatsApp Pelanggan</label>
                            <input
                                className="form-input"
                                type="tel"
                                placeholder="08dxxxxxxxx"
                                value={waNumber}
                                onChange={(e) => setWaNumber(e.target.value)}
                                style={{ padding: '12px 16px', fontSize: 16 }}
                            />
                            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                                Gunakan format angka saja (contoh: 08123456789)
                            </p>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', background: '#25D366', borderColor: '#25D366', padding: '14px' }}
                        onClick={async () => {
                            if (!waNumber) return showToast('Masukkan nomor WA!', 'error');
                            setIsSendingWA(true);

                            try {
                                const randomPantun = pantuns[Math.floor(Math.random() * pantuns.length)];
                                const message = `
*CAMU CAMU* ✨
_sekali gigit, seribu cerita_
----------------------------------
ID: ${lastOrder?.id}
Tanggal: ${new Date(lastOrder?.createdAt).toLocaleString('id-ID')}
Customer: ${lastOrder?.customerName}
----------------------------------
${lastOrder?.items.map(i => `✅ *${i.name}* x${i.qty} = ${formatRupiah(i.price * i.qty)}`).join('\n')}
----------------------------------
*TOTAL: ${formatRupiah(lastOrder?.total)}*
Bayar: ${lastOrder?.paymentMethod === 'cash' ? `Tunai (${formatRupiah(lastOrder?.cashReceived)})` : 'QRIS'}
${lastOrder?.paymentMethod === 'cash' ? `Kembalian: ${formatRupiah(lastOrder?.change)}` : ''}

*Bestie, ada pantun buat kamu:*
${randomPantun}

Terima kasih udah jajan di Camu Camu! Ditunggu kedatangannya lagi ya, slaaay! 💅🔥
_www.camucamu.id_
                                `;

                                const phone = formatPhoneForFonnte(waNumber);
                                if (!phone) {
                                    showToast('Nomor WA tidak valid', 'error');
                                    return;
                                }

                                const response = await fetch('https://api.fonnte.com/send', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': import.meta.env.VITE_FONNTE_TOKEN || 'zQe1WteVyRK7mVqNrpQT',
                                    },
                                    body: new URLSearchParams({
                                        'target': phone,
                                        'message': message,
                                    })
                                });



                                const result = await response.json();
                                if (result.status) {
                                    showToast('Struk terkirim otomatis via Fonnte!');
                                    setShowWAModal(false);
                                } else {
                                    showToast('Fonnte Error: ' + (result.reason || 'Cek kuota/koneksi'), 'error');
                                }
                            } catch (err) {
                                showToast('Gagal mengirim via Fonnte', 'error');
                            } finally {
                                setIsSendingWA(false);
                            }
                        }}
                        disabled={isSendingWA}
                    >
                        {isSendingWA ? '⌛ Mengirim...' : '🚀 Kirim Otomatis (Fonnte)'}
                    </button>

                    <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>CADANGAN (MANUAL)</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>

                    <button
                        className="btn btn-ghost"
                        style={{ width: '100%', color: 'var(--text-secondary)', padding: '12px', fontSize: 13 }}
                        onClick={() => {
                            if (!waNumber) return showToast('Masukkan nomor WA!', 'error');

                            const randomPantun = pantuns[Math.floor(Math.random() * pantuns.length)];
                            const message = `*CAMU CAMU* ✨%0A_sekali gigit, seribu cerita_%0A----------------------------------%0AID: ${lastOrder?.id}%0ATanggal: ${new Date(lastOrder?.createdAt).toLocaleString('id-ID')}%0ACustomer: ${lastOrder?.customerName}%0A----------------------------------%0A${lastOrder?.items.map(i => `✅ *${i.name}* x${i.qty} = ${formatRupiah(i.price * i.qty)}`).join('%0A')}%0A----------------------------------%0A*TOTAL: ${formatRupiah(lastOrder?.total)}*%0AMbayar: ${lastOrder?.paymentMethod === 'cash' ? `Tunai (${formatRupiah(lastOrder?.cashReceived)})` : 'QRIS'}%0A${lastOrder?.paymentMethod === 'cash' ? `Kembalian: ${formatRupiah(lastOrder?.change)}` : ''}%0A%0A*Bestie, ada pantun buat kamu:*%0A${randomPantun}%0A%0ATerima kasih udah jajan di Camu Camu! Ditunggu kedatangannya lagi ya, slaaay! 💅🔥%0A_www.camucamu.id_`;

                            let cleanNumber = waNumber.replace(/\D/g, '');
                            if (cleanNumber.startsWith('0')) {
                                cleanNumber = '62' + cleanNumber.slice(1);
                            }

                            window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
                            setShowWAModal(false);
                        }}
                    >
                        Kirim Manual via WA Link (Gratis)
                    </button>


                </div>
            </div>

            {/* ========== VARIANT MODAL ========== */}
            <div className={`modal-overlay ${selectedProduct ? 'open' : ''}`}
                onClick={() => setSelectedProduct(null)}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 12, overflow: 'hidden',
                            background: 'var(--bg-surface)', border: '1px solid var(--border)'
                        }}>
                            {selectedProduct?.image && (selectedProduct.image.startsWith('/') || selectedProduct.image.startsWith('http')) ? (
                                <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{selectedProduct?.image}</div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0 }}>{selectedProduct?.name}</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '4px 0 8px' }}>Pilih Varian Produk</p>
                            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--coral)' }}>
                                {selectedProduct && formatRupiah(selectedProduct.price + (selectedVariant?.price || 0))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                        {selectedProduct?.variants?.map(v => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVariant(v)}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '14px 18px', borderRadius: 12, border: '2px solid',
                                    borderColor: selectedVariant?.id === v.id ? 'var(--teal)' : 'var(--border)',
                                    background: selectedVariant?.id === v.id ? 'rgba(180, 83, 9, 0.05)' : 'var(--bg-card)',
                                    cursor: 'pointer', transition: 'var(--transition-fast)',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.name}</span>
                                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                                    {v.price > 0 ? `+${formatRupiah(v.price)}` : 'Gratis'}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary" onClick={() => setSelectedProduct(null)} style={{ flex: 1 }}>Batal</button>
                        <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => addToCart(selectedProduct)}>
                            Tambah Pesanan
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
