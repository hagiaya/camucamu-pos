import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../data/menuData';
import { useToast } from '../components/Toast';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Save,
    Search,
    Receipt,
    Calendar,
    DollarSign,
    BarChart3,
    ArrowDownCircle,
    Wallet
} from 'lucide-react';

export default function ExpensesPage() {
    const { state, dispatch } = useApp();
    const { showToast, ToastContainer } = useToast();
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [form, setForm] = useState({
        title: '',
        amount: '',
        category: 'Operasional',
        notes: '',
        date: new Date().toISOString().split('T')[0],
    });

    const categories = [
        'Operasional',
        'Bahan Baku',
        'Gaji Karyawan',
        'Sewa Tempat',
        'Listrik & Air',
        'Pemasaran',
        'Lainnya',
    ];

    const expenses = state.expenses || [];

    const filtered = expenses.filter((item) => {
        const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.category.toLowerCase().includes(search.toLowerCase());
        return matchSearch;
    });

    // Stats
    const totalExpenses = expenses.filter(e => e.type !== 'capital').reduce((sum, e) => sum + (parseInt(e.amount) || 0), 0);
    const todayExpenses = expenses.filter(e => e.date === new Date().toISOString().split('T')[0] && e.type !== 'capital')
        .reduce((sum, e) => sum + (parseInt(e.amount) || 0), 0);
    const countExpenses = expenses.filter(e => e.type !== 'capital').length;

    const resetForm = () => {
        setForm({
            title: '',
            amount: '',
            category: 'Operasional',
            notes: '',
            date: new Date().toISOString().split('T')[0],
        });
    };

    const openAdd = () => {
        resetForm();
        setEditingExpense(null);
        setShowAddModal(true);
    };

    const openEdit = (expense) => {
        setForm({
            title: expense.title,
            amount: expense.amount.toString(),
            category: expense.category,
            notes: expense.notes || '',
            date: expense.date,
        });
        setEditingExpense(expense);
        setShowAddModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!form.title || !form.amount || !form.date) {
            showToast('Isi judul, jumlah, dan tanggal!', 'error');
            return;
        }

        const expenseData = {
            id: editingExpense ? editingExpense.id : `EXP-${Date.now()}`,
            createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
            type: 'expense', // Always expense now
            title: form.title,
            amount: parseInt(form.amount),
            category: form.category,
            fundSource: 'Pendapatan', // Always Pendapatan now
            notes: form.notes,
            date: form.date,
        };

        if (editingExpense) {
            dispatch({
                type: 'UPDATE_EXPENSE',
                payload: { id: editingExpense.id, ...expenseData },
            });
            showToast(`Pengeluaran "${form.title}" berhasil diupdate!`);
        } else {
            dispatch({ type: 'ADD_EXPENSE', payload: expenseData });
            showToast(`Pengeluaran "${form.title}" berhasil dicatat!`);
        }

        setShowAddModal(false);
        resetForm();
        setEditingExpense(null);
    };

    const handleDelete = (id) => {
        dispatch({ type: 'DELETE_EXPENSE', payload: id });
        setDeleteConfirm(null);
        showToast('Catatan berhasil dihapus!');
    };

    return (
        <div className="page-wrapper">
            <ToastContainer />

            <div className="page-header" style={{ paddingBottom: 0 }}>
                <div style={{ marginBottom: 8 }}>
                    <h1 className="page-title" style={{ fontSize: 24, margin: 0 }}>💸 Pengeluaran Harian</h1>
                    <p className="page-desc" style={{ margin: 0 }}>
                        Catat dan pantau pengeluaran operasional Camu Camu
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
                            <BarChart3 size={16} style={{ color: 'var(--yellow)' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Total Pengeluaran</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                            {formatRupiah(totalExpenses)}
                        </div>
                    </div>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <ArrowDownCircle size={16} style={{ color: 'var(--coral)' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Pengeluaran Hari Ini</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--coral)' }}>
                            {formatRupiah(todayExpenses)}
                        </div>
                    </div>

                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Receipt size={16} style={{ color: 'var(--teal-light)' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Jumlah Catatan</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                            {countExpenses}
                        </div>
                    </div>
                </div>

                {/* Search + Add */}
                <div style={{
                    display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
                }}>
                    <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={16} className="icon" />
                        <input type="text" className="search-input" placeholder="Cari pengeluaran..."
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <Plus size={16} />
                        Catat Pengeluaran
                    </button>
                </div>

                {/* Expense Table */}
                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                }}>
                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 2fr 1.2fr 1.5fr 120px',
                        padding: '16px 24px',
                        fontSize: 11, fontWeight: 700,
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                    }}>
                        <span>TANGGAL</span>
                        <span>JUDUL PENGELUARAN</span>
                        <span>KATEGORI</span>
                        <span style={{ textAlign: 'right' }}>NOMINAL</span>
                        <span style={{ textAlign: 'center' }}>AKSI</span>
                    </div>

                    {/* Expense Rows */}
                    {filtered.length === 0 ? (
                        <div style={{ padding: 60, textAlign: 'center' }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
                            <div style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Belum ada pengeluaran dicatat</div>
                        </div>
                    ) : (
                        filtered.filter(e => e.type !== 'capital').map((expense) => {
                            return (
                                <div key={expense.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.2fr 2fr 1.2fr 1.5fr 120px',
                                    padding: '20px 24px',
                                    borderBottom: '1px solid var(--border)',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease',
                                }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                        <Calendar size={14} />
                                        {new Date(expense.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>

                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                                            {expense.title}
                                        </div>
                                        {expense.notes && (
                                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                {expense.notes}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <span style={{
                                            fontSize: 11, padding: '4px 10px',
                                            borderRadius: 20,
                                            background: 'var(--bg-surface)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text-secondary)',
                                            fontWeight: 600,
                                        }}>{expense.category}</span>
                                    </div>

                                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: 'var(--coral)' }}>
                                        {formatRupiah(expense.amount)}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                        <button onClick={() => openEdit(expense)}
                                            style={{
                                                padding: '8px', background: 'rgba(78, 205, 196, 0.12)',
                                                border: '1px solid rgba(78, 205, 196, 0.2)', borderRadius: 10, cursor: 'pointer',
                                                color: 'var(--teal-light)', transition: 'all 0.2s'
                                            }}>
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => setDeleteConfirm(expense.id)}
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
                onClick={() => { setShowAddModal(false); setEditingExpense(null); }}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ margin: 0 }}>
                            {editingExpense ? '✏️ Edit Pengeluaran' : '💸 Catat Pengeluaran'}
                        </h2>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddModal(false); setEditingExpense(null); }}>
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label>Judul Pengeluaran *</label>
                            <input className="form-input" type="text" placeholder="Contoh: Belanja Buah Naga"
                                value={form.title} required
                                onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </div>

                        <div className="form-group">
                            <label>Kategori</label>
                            <select className="form-select" value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label>Nominal (Rp) *</label>
                                <input className="form-input" type="number" placeholder="50000"
                                    value={form.amount} required min="1"
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Tanggal *</label>
                                <input className="form-input" type="date"
                                    value={form.date} required
                                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Catatan Tambahan</label>
                            <textarea className="form-input" placeholder="Beli di pasar induk, 5kg"
                                style={{ minHeight: 80, paddingTop: 12 }}
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                            <button type="button" className="btn btn-secondary"
                                onClick={() => { setShowAddModal(false); setEditingExpense(null); }}
                                style={{ flex: 1 }}>
                                Batal
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                <Save size={16} />
                                {editingExpense ? 'Simpan Perubahan' : 'Catat Sekarang'}
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
                    <h3>Hapus Catatan?</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                        Catatan <strong>{expenses.find(e => e.id === deleteConfirm)?.title}</strong> akan dihapus.
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
