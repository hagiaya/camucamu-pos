import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { categories, formatRupiah } from '../data/menuData';
import { useToast } from '../components/Toast';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    Search,
    TrendingUp,
    Package,
    DollarSign,
    BarChart3,
    RotateCcw,
} from 'lucide-react';

const emojiOptions = ['🥭', '🍓', '🥑', '🐉', '🍊', '🥕', '🌅', '🥒', '🫐', '🥜', '🥥', '🍌', '🐟', '🟤', '🥣', '🍇', '🍵', '☕', '🧡', '🍈', '🧃', '🍋', '🥝', '🍎', '🍍', '🫘', '🍪', '🧁', '🍫', '🥤', '🍹', '🫖'];

export default function ProductsPage() {
    const { state, dispatch } = useApp();
    const { showToast, ToastContainer } = useToast();
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [form, setForm] = useState({
        name: '',
        category: 'makanan',
        price: '',
        cost: '',
        description: '',
        image: '🍟',
        popular: false,
    });

    const products = state.products || [];

    const filtered = products.filter((item) => {
        const matchCat = filterCat === 'all' || item.category === filterCat;
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    // Stats
    const totalProducts = products.length;
    const avgMargin = products.length > 0
        ? (products.reduce((sum, p) => sum + ((p.price - p.cost) / p.price * 100), 0) / products.length).toFixed(1)
        : 0;
    const avgProfit = products.length > 0
        ? Math.round(products.reduce((sum, p) => sum + (p.price - p.cost), 0) / products.length)
        : 0;
    const totalModalAll = products.reduce((sum, p) => sum + p.cost, 0);

    const resetForm = () => {
        setForm({ name: '', category: 'makanan', price: '', cost: '', description: '', image: '🍟', popular: false });
    };

    const openAdd = () => {
        resetForm();
        setEditingProduct(null);
        setShowAddModal(true);
    };

    const openEdit = (product) => {
        setForm({
            name: product.name,
            category: product.category,
            price: product.price.toString(),
            cost: product.cost.toString(),
            description: product.description,
            image: product.image,
            popular: product.popular || false,
        });
        setEditingProduct(product);
        setShowAddModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!form.name || !form.price || !form.cost) {
            showToast('Isi nama, harga jual, dan modal!', 'error');
            return;
        }

        const price = parseInt(form.price);
        const cost = parseInt(form.cost);

        if (cost >= price) {
            showToast('Modal harus lebih kecil dari harga jual!', 'error');
            return;
        }

        const productData = {
            name: form.name,
            category: form.category,
            price,
            cost,
            description: form.description,
            image: form.image,
            popular: form.popular,
        };

        if (editingProduct) {
            dispatch({
                type: 'UPDATE_PRODUCT',
                payload: { id: editingProduct.id, ...productData },
            });
            showToast(`${form.name} berhasil diupdate!`);
        } else {
            dispatch({ type: 'ADD_PRODUCT', payload: productData });
            showToast(`${form.name} berhasil ditambahkan!`);
        }

        setShowAddModal(false);
        resetForm();
        setEditingProduct(null);
    };

    const handleDelete = (id) => {
        dispatch({ type: 'DELETE_PRODUCT', payload: id });
        setDeleteConfirm(null);
        showToast('Produk berhasil dihapus!');
    };

    const formPrice = parseInt(form.price) || 0;
    const formCost = parseInt(form.cost) || 0;
    const formProfit = formPrice - formCost;
    const formMargin = formPrice > 0 ? ((formProfit / formPrice) * 100).toFixed(1) : 0;

    return (
        <div className="page-wrapper">
            <ToastContainer />

            <div className="page-header" style={{ paddingBottom: 0 }}>
                <div style={{ marginBottom: 8 }}>
                    <h1 className="page-title" style={{ fontSize: 24, margin: 0 }}>📦 Kelola Produk</h1>
                    <p className="page-desc" style={{ margin: 0 }}>
                        Atur harga, modal, dan menu produk
                    </p>
                </div>
            </div>

            <div className="section" style={{ paddingTop: 20 }}>
                {/* Stats Cards */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12, marginBottom: 24,
                }}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Package size={16} style={{ color: 'var(--teal-light)' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Total Produk</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                            {totalProducts}
                        </div>
                    </div>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <TrendingUp size={16} style={{ color: 'var(--green)' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Rata-rata Margin</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--green)' }}>
                            {avgMargin}%
                        </div>
                    </div>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <DollarSign size={16} style={{ color: 'var(--yellow)' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Rata-rata Untung/pcs</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--yellow)' }}>
                            {formatRupiah(avgProfit)}
                        </div>
                    </div>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <BarChart3 size={16} style={{ color: 'var(--coral-light)' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Total Modal Semua</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--coral-light)' }}>
                            {formatRupiah(totalModalAll)}
                        </div>
                    </div>
                </div>

                {/* Search + Add */}
                <div style={{
                    display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
                }}>
                    <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={16} className="icon" />
                        <input type="text" className="search-input" placeholder="Cari produk..."
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <Plus size={16} />
                        Tambah Produk
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                        if (confirm('Reset semua produk ke default?')) {
                            dispatch({ type: 'RESET_PRODUCTS' });
                            showToast('Produk direset ke default!');
                        }
                    }}>
                        <RotateCcw size={14} />
                        Reset
                    </button>
                </div>

                {/* Category Filter */}
                <div className="pos-categories" style={{ marginBottom: 20 }}>
                    <button
                        className={`category-pill ${filterCat === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterCat('all')}
                        style={{ padding: '6px 14px', fontSize: 12 }}
                    >Semua ({products.length})</button>
                    {categories.map((cat) => {
                        const count = products.filter(p => p.category === cat.id).length;
                        return (
                            <button key={cat.id}
                                className={`category-pill ${filterCat === cat.id ? 'active' : ''}`}
                                onClick={() => setFilterCat(cat.id)}
                                style={{ padding: '6px 14px', fontSize: 12 }}
                            >{cat.icon} {cat.name} ({count})</button>
                        );
                    })}
                </div>

                {/* Product Table */}
                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                }}>
                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '3fr 1.2fr 1.2fr 1.2fr 1.2fr 120px',
                        padding: '16px 24px',
                        fontSize: 11, fontWeight: 700,
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                    }}>
                        <span>PRODUK</span>
                        <span style={{ textAlign: 'right' }}>HARGA JUAL</span>
                        <span style={{ textAlign: 'right' }}>MODAL (HPP)</span>
                        <span style={{ textAlign: 'right' }}>UNTUNG/PCS</span>
                        <span style={{ textAlign: 'right' }}>MARGIN</span>
                        <span style={{ textAlign: 'center' }}>AKSI</span>
                    </div>

                    {/* Product Rows */}
                    {filtered.length === 0 ? (
                        <div style={{ padding: 60, textAlign: 'center' }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                            <div style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Produk tidak ditemukan</div>
                        </div>
                    ) : (
                        filtered.map((product) => {
                            const profit = product.price - product.cost;
                            const margin = ((profit / product.price) * 100).toFixed(1);
                            const marginColor = margin >= 60 ? 'var(--green)' : margin >= 40 ? 'var(--yellow)' : 'var(--coral)';
                            const isImagePath = product.image && (product.image.startsWith('/') || product.image.startsWith('http'));

                            return (
                                <div key={product.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '3fr 1.2fr 1.2fr 1.2fr 1.2fr 120px',
                                    padding: '20px 24px',
                                    borderBottom: '1px solid var(--border)',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease',
                                }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Product Name & Image */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 12,
                                            background: 'var(--bg-surface)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0
                                        }}>
                                            {isImagePath ? (
                                                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: 24 }}>{product.image}</span>
                                            )}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
                                                {product.popular && (
                                                    <span style={{
                                                        fontSize: 9, padding: '2px 6px',
                                                        borderRadius: 6,
                                                        background: 'rgba(253, 203, 110, 0.15)',
                                                        color: 'var(--yellow)',
                                                        fontWeight: 800, textTransform: 'uppercase', flexShrink: 0
                                                    }}>Populer</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {categories.find(c => c.id === product.category)?.icon}
                                                {categories.find(c => c.id === product.category)?.name || product.category}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                                        {formatRupiah(product.price)}
                                    </div>

                                    {/* Cost */}
                                    <div style={{ textAlign: 'right', fontSize: 14, color: 'var(--yellow)', fontWeight: 500 }}>
                                        {formatRupiah(product.cost)}
                                    </div>

                                    {/* Profit per unit */}
                                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, color: 'var(--green)' }}>
                                        +{formatRupiah(profit)}
                                    </div>

                                    {/* Margin */}
                                    <div style={{ textAlign: 'right', paddingLeft: 12 }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end',
                                            width: '100%'
                                        }}>
                                            <span style={{
                                                fontSize: 13, fontWeight: 800,
                                                color: marginColor,
                                                marginBottom: 4
                                            }}>
                                                {margin}%
                                            </span>
                                            {/* Mini bar */}
                                            <div style={{
                                                width: '100%', height: 4,
                                                background: 'var(--bg-surface)',
                                                borderRadius: 2, overflow: 'hidden',
                                                border: '1px solid var(--border)'
                                            }}>
                                                <div style={{
                                                    width: `${Math.min(100, margin)}%`, height: '100%',
                                                    background: marginColor,
                                                    borderRadius: 2,
                                                }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                        <button onClick={(e) => { e.stopPropagation(); openEdit(product); }}
                                            className="action-btn-edit"
                                            style={{
                                                padding: '8px', background: 'rgba(78, 205, 196, 0.12)',
                                                border: '1px solid rgba(78, 205, 196, 0.2)', borderRadius: 10, cursor: 'pointer',
                                                color: 'var(--teal-light)', transition: 'all 0.2s'
                                            }}>
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(product.id); }}
                                            style={{
                                                padding: '8px', background: 'rgba(255, 107, 107, 0.12)',
                                                border: '1px solid rgba(255, 107, 107, 0.2)', borderRadius: 10, cursor: 'pointer',
                                                color: 'var(--coral)', transition: 'all 0.2s'
                                            }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ========== ADD/EDIT MODAL ========== */}
            <div className={`modal-overlay ${showAddModal ? 'open' : ''}`}
                onClick={() => { setShowAddModal(false); setEditingProduct(null); }}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0 }}>
                            {editingProduct ? '✏️ Edit Produk' : '➕ Tambah Produk Baru'}
                        </h2>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddModal(false); setEditingProduct(null); }}>
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSave}>
                        {/* Emoji picker */}
                        <div className="form-group">
                            <label>Ikon Produk</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {emojiOptions.map((emoji) => (
                                    <button key={emoji} type="button"
                                        onClick={() => setForm({ ...form, image: emoji })}
                                        style={{
                                            width: 40, height: 40, fontSize: 20,
                                            border: form.image === emoji ? '2px solid var(--teal)' : '1px solid var(--border)',
                                            background: form.image === emoji ? 'rgba(78,205,196,0.1)' : 'var(--bg-card)',
                                            borderRadius: 8, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>{emoji}</button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nama Produk *</label>
                            <input className="form-input" type="text" placeholder="Contoh: Açaí Berry Bowl"
                                value={form.name} required
                                onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>

                        <div className="form-group">
                            <label>Kategori</label>
                            <select className="form-select" value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label>Harga Jual (Rp) *</label>
                                <input className="form-input" type="number" placeholder="45000"
                                    value={form.price} required min="1"
                                    onChange={(e) => setForm({ ...form, price: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Modal / HPP (Rp) *</label>
                                <input className="form-input" type="number" placeholder="18000"
                                    value={form.cost} required min="0"
                                    onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                            </div>
                        </div>

                        {/* Live calculation preview */}
                        {formPrice > 0 && formCost > 0 && (
                            <div style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                padding: 16, marginBottom: 16,
                            }}>
                                <div style={{
                                    fontSize: 11, color: 'var(--text-tertiary)',
                                    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
                                }}>📊 Perhitungan Otomatis Per Satuan</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Harga Jual</div>
                                        <div style={{ fontSize: 16, fontWeight: 700 }}>{formatRupiah(formPrice)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Modal</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--yellow)' }}>{formatRupiah(formCost)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Untung</div>
                                        <div style={{
                                            fontSize: 16, fontWeight: 700,
                                            color: formProfit > 0 ? 'var(--green)' : 'var(--coral)',
                                        }}>{formProfit > 0 ? '+' : ''}{formatRupiah(formProfit)}</div>
                                    </div>
                                </div>
                                <div style={{
                                    marginTop: 10, textAlign: 'center',
                                    padding: '8px 16px',
                                    background: formProfit > 0 ? 'rgba(0,184,148,0.08)' : 'rgba(255,107,107,0.08)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    <span style={{
                                        fontSize: 13, fontWeight: 700,
                                        color: formProfit > 0 ? 'var(--green)' : 'var(--coral)',
                                    }}>
                                        Margin: {formMargin}%
                                        {formMargin >= 60 ? ' 🔥 Sangat Bagus!' : formMargin >= 40 ? ' ✅ Bagus' : formMargin > 0 ? ' ⚠️ Rendah' : ' ❌ Rugi!'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Deskripsi</label>
                            <input className="form-input" type="text" placeholder="Bahan-bahan utama..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" id="popular" checked={form.popular}
                                onChange={(e) => setForm({ ...form, popular: e.target.checked })}
                                style={{ width: 18, height: 18, accentColor: 'var(--coral)' }} />
                            <label htmlFor="popular" style={{ margin: 0, cursor: 'pointer' }}>⭐ Tandai sebagai populer</label>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                            <button type="button" className="btn btn-secondary"
                                onClick={() => { setShowAddModal(false); setEditingProduct(null); }}
                                style={{ flex: 1 }}>
                                Batal
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                <Save size={16} />
                                {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ========== DELETE CONFIRM ========== */}
            <div className={`modal-overlay ${deleteConfirm ? 'open' : ''}`}
                onClick={() => setDeleteConfirm(null)}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
                    <h3>Hapus Produk?</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                        Produk <strong>{products.find(p => p.id === deleteConfirm)?.name}</strong> akan dihapus.
                        Tindakan ini tidak bisa dibatalkan.
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} style={{ flex: 1 }}>
                            Batal
                        </button>
                        <button className="btn btn-primary" onClick={() => handleDelete(deleteConfirm)}
                            style={{ flex: 1, background: 'var(--coral)' }}>
                            <Trash2 size={16} />
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
