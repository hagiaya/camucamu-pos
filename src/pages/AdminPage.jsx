import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Calculator,
    BarChart3,
    ChevronRight,
    LogOut,
    Wallet,
    CheckCircle,
    List,
    Search,
    RefreshCw,
    Trash2,
    X,
} from 'lucide-react';

import POSPage from './POSPage';
import ProductsPage from './ProductsPage';
import CalculatorPage from './CalculatorPage';
import ExpensesPage from './ExpensesPage';

import { useApp } from '../context/AppContext';
import { formatRupiah, formatPhoneForFonnte } from '../data/menuData';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabaseClient';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

function LoginPage({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: 20
        }}>
            <div style={{
                width: '100%',
                maxWidth: 400,
                background: 'var(--bg-card)',
                padding: 32,
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                border: '1px solid var(--border)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <img src="/logo2.png" alt="Logo" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 12, objectFit: 'cover' }} />
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Admin Login</h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Silakan masuk untuk mengelola outlet</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Username</label>
                        <div className="search-input-wrapper" style={{ background: 'var(--bg-primary)', margin: 0 }}>
                            <User size={18} className="icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Masukkan username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Password</label>
                        <div className="search-input-wrapper" style={{ background: 'var(--bg-primary)', margin: 0 }}>
                            <Lock size={18} className="icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="search-input"
                                placeholder="Masukkan password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '0 10px' }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px 24px', fontSize: 15, fontWeight: 600 }}>
                        Masuk Sekarang
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [dashboardPeriod, setDashboardPeriod] = useState('day');
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('camucamu_admin');
        return saved ? JSON.parse(saved) : null;
    });
    const { state, dispatch } = useApp();
    const { showToast, ToastContainer } = useToast();

    const handleLogin = async (username, password) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username.toLowerCase())
                .eq('password', password)
                .single();

            if (data) {
                setUser(data);
                localStorage.setItem('camucamu_admin', JSON.stringify(data));
                showToast(`Selamat datang, ${data.username}! 👋`);
            } else {
                showToast('Username atau password salah', 'error');
            }
        } catch (err) {
            showToast('Gagal terhubung ke database', 'error');
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('camucamu_admin');
        showToast('Berhasil keluar');
    };

    if (!user) {
        return <LoginPage onLogin={handleLogin} />;
    }



    const getBusinessDate = (dateOb) => {
        const d = new Date(dateOb);
        if (isNaN(d.getTime())) return new Date();
        d.setHours(d.getHours() - 5);
        return d;
    };

    const getBusinessDateString = (dateOb) => {
        return getBusinessDate(dateOb).toDateString();
    };

    const dashboardStats = useMemo(() => {
        const nowBusiness = getBusinessDate(new Date());

        const isMatchPeriod = (dateOb) => {
            const d = getBusinessDate(dateOb);
            if (dashboardPeriod === 'day') {
                return d.toDateString() === nowBusiness.toDateString();
            } else if (dashboardPeriod === 'week') {
                const oneWeekAgo = new Date(nowBusiness);
                oneWeekAgo.setDate(nowBusiness.getDate() - 7);
                return d >= oneWeekAgo;
            } else if (dashboardPeriod === 'month') {
                return d.getMonth() === nowBusiness.getMonth() && d.getFullYear() === nowBusiness.getFullYear();
            } else if (dashboardPeriod === 'year') {
                return d.getFullYear() === nowBusiness.getFullYear();
            }
            return true;
        };

        const filteredOrders = (state.transactions || []).filter(t => isMatchPeriod(t.createdAt));
        const filteredExpensesList = (state.expenses || []).filter(e => isMatchPeriod(e.createdAt || e.date) && e.type !== 'capital');

        const expenses = filteredExpensesList.reduce((s, e) => s + (parseInt(e.amount) || 0), 0);
        const revenue = filteredOrders.reduce((s, t) => s + (t.total || 0), 0);
        const cost = filteredOrders.reduce((s, t) => s + (t.totalCost || 0), 0) - expenses;
        const profit = filteredOrders.reduce((s, t) => s + (t.profit || 0), 0);

        const chartMap = {};

        if (dashboardPeriod === 'day') {
            filteredOrders.forEach((t) => {
                const h = new Date(t.createdAt).getHours().toString().padStart(2, '0') + ':00';
                if (!chartMap[h]) chartMap[h] = { revenue: 0, profit: 0 };
                chartMap[h].revenue += t.total;
                chartMap[h].profit += t.profit || 0;
            });
        } else if (dashboardPeriod === 'week' || dashboardPeriod === 'month') {
            filteredOrders.forEach((t) => {
                const d = getBusinessDate(t.createdAt);
                const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                if (!chartMap[key]) chartMap[key] = { revenue: 0, profit: 0 };
                chartMap[key].revenue += t.total;
                chartMap[key].profit += t.profit || 0;
            });
        } else if (dashboardPeriod === 'year') {
            filteredOrders.forEach((t) => {
                const d = getBusinessDate(t.createdAt);
                const key = d.toLocaleDateString('id-ID', { month: 'short' });
                if (!chartMap[key]) chartMap[key] = { revenue: 0, profit: 0 };
                chartMap[key].revenue += t.total;
                chartMap[key].profit += t.profit || 0;
            });
        }

        const chartDataArray = Object.entries(chartMap).map(([label, data]) => ({ label, ...data }));
        const maxRev = Math.max(...chartDataArray.map((d) => d.revenue), 1);

        return { revenue, expenses, cost, profit, chartData: chartDataArray, maxRev };
    }, [state.transactions, state.expenses, dashboardPeriod]);

    const nowBusinessStr = getBusinessDateString(new Date());

    const totalExpensesCost = (state.expenses || []).filter(e => e.type !== 'capital').reduce((s, e) => s + (parseInt(e.amount) || 0), 0);
    const totalOrders = (state.transactions || []).length;
    const totalRevenue = (state.transactions || []).reduce((s, t) => s + t.total, 0);
    const totalProfit = (state.transactions || []).reduce((s, t) => s + (t.profit || 0), 0);
    const totalProducts = (state.products || []).length;

    const todayOrders = (state.transactions || []).filter(t => getBusinessDateString(t.createdAt) === nowBusinessStr);
    const todayExpensesList = (state.expenses || []).filter(e => {
        const dateInput = e.createdAt || e.date;
        return getBusinessDateString(dateInput) === nowBusinessStr && e.type !== 'capital';
    });

    const todayExpenses = todayExpensesList.reduce((s, e) => s + (parseInt(e.amount) || 0), 0);
    const todayRevenue = todayOrders.reduce((s, t) => s + (t.total || 0), 0);
    const todayProfit = todayOrders.reduce((s, t) => s + (t.profit || 0), 0);

    const founderSplits = [
        { name: 'Reza', share: 0.30, icon: '🧔' },
        { name: 'Andris', share: 0.35, icon: '👨‍💻' },
        { name: 'Lasulika', share: 0.35, icon: '👨‍💼' },
    ];

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pos', label: 'POS (Kasir)', icon: ShoppingCart },
        { id: 'transactions', label: 'Riwayat Transaksi', icon: List },
        { id: 'expenses', label: 'Pengeluaran', icon: Wallet },
        { id: 'products', label: 'Kelola Produk', icon: Package },
        { id: 'calculator', label: 'Kalkulator & Analisis', icon: Calculator },
    ];


    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <ToastContainer />
            {/* ========== SIDEBAR ========== */}
            <div style={{
                width: sidebarCollapsed ? 72 : 260,
                background: 'var(--bg-card)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease',
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 100,
                overflow: 'hidden',
            }}>
                {/* Sidebar Header */}
                <div
                    style={{
                        padding: sidebarCollapsed ? '20px 12px' : '20px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                    <img
                        src="/logo2.png"
                        alt="Camu Camu"
                        style={{
                            width: 36, height: 36, borderRadius: 10,
                            objectFit: 'cover', flexShrink: 0,
                        }}
                    />
                    {!sidebarCollapsed && (
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>CAMU CAMU</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Admin Panel</div>
                        </div>
                    )}
                </div>

                {/* Nav Items */}
                <div style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: sidebarCollapsed ? '12px' : '12px 16px',
                                    background: isActive
                                        ? 'rgba(204, 43, 43, 0.08)'
                                        : 'transparent',
                                    border: isActive ? '1px solid rgba(204, 43, 43, 0.2)' : '1px solid transparent',
                                    borderRadius: 'var(--radius-md)',
                                    color: isActive ? 'var(--coral)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: isActive ? 600 : 400,
                                    fontSize: 14,
                                    transition: 'var(--transition)',
                                    width: '100%',
                                    textAlign: 'left',
                                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                }}
                            >
                                <Icon size={18} style={{ flexShrink: 0 }} />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                                {!sidebarCollapsed && isActive && (
                                    <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Sidebar Footer */}
                <div style={{
                    padding: sidebarCollapsed ? '16px 8px' : '16px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: sidebarCollapsed ? '10px' : '10px 14px',
                            background: 'rgba(255, 107, 107, 0.1)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--coral)',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                        }}
                    >
                        <LogOut size={16} />
                        {!sidebarCollapsed && <span>Keluar</span>}
                    </button>
                    <Link
                        to="/"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: sidebarCollapsed ? '10px' : '10px 14px',
                            color: 'var(--text-tertiary)',
                            textDecoration: 'none',
                            fontSize: 12,
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                        }}
                    >
                        <ShoppingCart size={14} />
                        {!sidebarCollapsed && <span>Ke Menu</span>}
                    </Link>
                </div>
            </div>

            {/* ========== MAIN CONTENT ========== */}
            <div style={{
                flex: 1,
                marginLeft: sidebarCollapsed ? 72 : 260,
                transition: 'margin-left 0.3s ease',
                minHeight: '100vh',
            }}>
                {/* ===== DASHBOARD TAB ===== */}
                {activeTab === 'dashboard' && (
                    <div style={{ padding: 32 }}>
                        <div style={{ marginBottom: 32 }}>
                            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
                                👋 Selamat Datang, Admin!
                            </h1>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
                                Ringkasan bisnis Camu Camu hari ini
                            </p>
                        </div>

                        {/* Today Stats */}
                        <div style={{ marginBottom: 32 }}>
                            <h3 style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                📅 Hari Ini
                            </h3>
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: 16,
                            }}>
                                <DashCard
                                    icon="🛒" label="Pesanan Hari Ini"
                                    value={todayOrders.length}
                                    color="var(--coral-light)"
                                />
                                <DashCard
                                    icon="💰" label="Revenue Hari Ini"
                                    value={formatRupiah(todayRevenue)}
                                    color="var(--teal-light)"
                                />
                                <DashCard
                                    icon={todayProfit >= 0 ? "🎉" : "⏳"}
                                    label={todayProfit >= 0 ? "Profit Hari Ini" : "Minus / Balik Modal"}
                                    value={formatRupiah(Math.abs(todayProfit))}
                                    color={todayProfit >= 0 ? "var(--green)" : "var(--coral)"}
                                />
                            </div>
                        </div>

                        {/* All Time Stats */}
                        <div style={{ marginBottom: 32 }}>
                            <h3 style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                📊 Keseluruhan
                            </h3>
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: 16,
                            }}>
                                <DashCard
                                    icon="📦" label="Total Produk"
                                    value={totalProducts}
                                    color="var(--purple)"
                                />
                                <DashCard
                                    icon="🛒" label="Total Pesanan"
                                    value={totalOrders}
                                    color="var(--coral-light)"
                                />
                            </div>
                        </div>



                        {/* Founder Splits Dashboard */}
                        <div style={{ marginBottom: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
                                <h3 style={{ fontSize: 14, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    👥 Bagi Hasil & Laporan
                                </h3>
                                <div style={{
                                    display: 'flex',
                                    background: 'var(--bg-surface)',
                                    padding: 4,
                                    borderRadius: 12,
                                    border: '1px solid var(--border)'
                                }}>
                                    {[
                                        { id: 'day', label: 'Hari Ini' },
                                        { id: 'week', label: '7 Hari' },
                                        { id: 'month', label: 'Bulan Ini' },
                                        { id: 'year', label: 'Tahun Ini' },
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setDashboardPeriod(p.id)}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: 10,
                                                border: 'none',
                                                background: dashboardPeriod === p.id ? 'var(--bg-card)' : 'transparent',
                                                color: dashboardPeriod === p.id ? 'var(--coral)' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: 13,
                                                fontWeight: dashboardPeriod === p.id ? 600 : 400,
                                                boxShadow: dashboardPeriod === p.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                <span style={{ fontSize: 13, background: dashboardStats.profit >= 0 ? 'rgba(78, 205, 196, 0.1)' : 'rgba(255, 107, 107, 0.1)', color: dashboardStats.profit >= 0 ? 'var(--teal)' : 'var(--coral)', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                                    {dashboardStats.profit >= 0 ? 'Profit Bersih:' : 'Sisa Balik Modal:'} {formatRupiah(Math.abs(dashboardStats.profit))}
                                </span>
                            </div>

                            {/* Grafik */}
                            {dashboardStats.chartData.length > 0 && (
                                <div style={{
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '24px',
                                    marginBottom: 24,
                                    border: '1px solid var(--border)'
                                }}>
                                    <h4 style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>📈 Grafik Revenue</h4>
                                    <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                        {dashboardStats.chartData.map((data) => (
                                            <div key={data.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                                                    {formatRupiah(data.revenue)}
                                                </div>
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        maxWidth: 40,
                                                        background: 'linear-gradient(180deg, var(--teal), rgba(78, 205, 196, 0.2))',
                                                        borderRadius: '4px 4px 0 0',
                                                        height: `${(data.revenue / dashboardStats.maxRev) * 130}px`,
                                                        minHeight: 4
                                                    }}
                                                />
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                                    {data.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: 16, marginBottom: 24,
                            }}>
                                <DashCard
                                    icon="💰" label="Total Pendapatan"
                                    value={formatRupiah(dashboardStats.revenue)}
                                    color="var(--teal)"
                                />
                                <DashCard
                                    icon="💸" label="Total Pengeluaran"
                                    value={formatRupiah(dashboardStats.expenses)}
                                    color="var(--coral)"
                                />
                                <DashCard
                                    icon="📦" label="Total Uang Modal (HPP)"
                                    value={formatRupiah(dashboardStats.cost)}
                                    color="var(--orange)"
                                />
                                <DashCard
                                    icon={dashboardStats.profit >= 0 ? "🎉" : "⏳"} label="Total Uang Profit"
                                    value={(dashboardStats.profit < 0 ? "-" : "") + formatRupiah(Math.abs(dashboardStats.profit))}
                                    color={dashboardStats.profit >= 0 ? "var(--green)" : "var(--coral)"}
                                />
                            </div>

                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: 16,
                            }}>
                                {founderSplits.map(f => (
                                    <div key={f.name} style={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                                {f.icon}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{f.share * 100}%</div>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: dashboardStats.profit > 0 ? 'var(--green)' : 'var(--text-tertiary)', fontSize: 16 }}>
                                            {dashboardStats.profit > 0 ? formatRupiah(Math.floor(dashboardStats.profit * f.share)) : 'Rp 0'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <h3 style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                ⚡ Aksi Cepat
                            </h3>
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: 12,
                            }}>
                                <QuickAction
                                    icon="🛒" label="Buka POS / Kasir"
                                    desc="Proses pesanan & pembayaran"
                                    onClick={() => setActiveTab('pos')}
                                    color="var(--coral)"
                                />
                                <QuickAction
                                    icon="📦" label="Kelola Produk"
                                    desc="Tambah, edit, hapus menu & harga"
                                    onClick={() => setActiveTab('products')}
                                    color="var(--teal)"
                                />
                                <QuickAction
                                    icon="💸" label="Catat Pengeluaran"
                                    desc="Input pengeluaran operasional"
                                    onClick={() => setActiveTab('expenses')}
                                    color="var(--coral)"
                                />
                                <QuickAction
                                    icon="📊" label="Kalkulator Bisnis"
                                    desc="BEP, proyeksi, & laporan"
                                    onClick={() => setActiveTab('calculator')}
                                    color="var(--purple)"
                                />

                            </div>
                        </div>

                        {/* Recent Orders */}
                        {(state.transactions || []).length > 0 && (
                            <div style={{ marginTop: 32 }}>
                                <h3 style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    📋 Pesanan Terakhir
                                </h3>
                                <div style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)',
                                    overflow: 'hidden',
                                }}>
                                    {(state.transactions || []).slice(0, 5).map((txn) => (
                                        <div key={txn.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '14px 20px',
                                            borderBottom: '1px solid var(--border)',
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{txn.id}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                                    {txn.customerName} {txn.customerPhone ? `(${txn.customerPhone})` : ''} • {txn.paymentMethod?.toUpperCase()} • {new Date(txn.createdAt).toLocaleString('id-ID', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </div>

                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, fontSize: 15 }}>{formatRupiah(txn.total)}</div>
                                                <div style={{ fontSize: 11, color: txn.status === 'dibayar' ? 'var(--green)' : txn.status === 'diambil' ? 'var(--yellow)' : 'var(--coral)', fontWeight: 600 }}>
                                                    {txn.status === 'dibayar' ? 'DIBAYAR' : txn.status === 'diambil' ? 'DIAMBIL' : 'PROSES'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}



                    </div>
                )}

                {/* ===== POS TAB ===== */}
                {activeTab === 'pos' && <POSPage user={user} />}

                {/* ===== PRODUCTS TAB ===== */}
                {activeTab === 'products' && <ProductsPage />}

                {/* ===== TRANSACTIONS TAB ===== */}
                {activeTab === 'transactions' && <TransactionsManagement role={user.role} setActiveTab={setActiveTab} />}

                {/* ===== CALCULATOR TAB ===== */}
                {activeTab === 'calculator' && <CalculatorPage />}

                {/* ===== EXPENSES TAB ===== */}
                {activeTab === 'expenses' && <ExpensesPage />}
            </div>

        </div>
    );
}

// Dashboard Stat Card
function DashCard({ icon, label, value, color }) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            transition: 'var(--transition)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{label}</span>
            </div>
            <div style={{
                fontSize: 24, fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                color: color || 'var(--text-primary)',
            }}>
                {value}
            </div>
        </div>
    );
}

// Quick Action Button
function QuickAction({ icon, label, desc, onClick, color }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '18px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                textAlign: 'left',
                width: '100%',
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
            }}>{icon}</div>
            <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{desc}</div>
            </div>
            <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
        </button>
    );
}

// Transactions Management Component
function TransactionsManagement({ role, setActiveTab }) {
    const { state, dispatch } = useApp();
    const { showToast, ToastContainer: TMToastContainer } = useToast();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const transactions = state.transactions || [];

    const getStatusNormalized = (st) => {
        if (!st || st === 'new') return 'proses';
        if (st === 'ready') return 'diambil';
        if (st === 'done' || st === 'completed') return 'dibayar';
        return st;
    };

    const filtered = transactions.filter(t => {
        const matchSearch = t.id.toLowerCase().includes(search.toLowerCase()) ||
            t.customerName.toLowerCase().includes(search.toLowerCase()) ||
            (t.customerPhone && t.customerPhone.includes(search));
        const s = getStatusNormalized(t.status);
        const matchStatus = statusFilter === 'all' || s === statusFilter;
        return matchSearch && matchStatus;
    });

    const handleUpdateStatus = (txn, newStatus) => {
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id: txn.id, status: newStatus } });
    };

    return (
        <div style={{ padding: 32 }}>
            <TMToastContainer />
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>📦 Manajemen Transaksi</h1>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Kelola status pesanan dan riwayat penjualan</p>
                    </div>
                    {role === 'super' && (
                        <button
                            onClick={() => {
                                if (window.confirm('⚠️ PERINGATAN: Semua riwayat transaksi akan dihapus PERMANEN. Anda yakin?')) {
                                    dispatch({ type: 'CLEAR_TRANSACTIONS' });
                                }
                            }}
                            style={{
                                padding: '10px 16px',
                                background: 'rgba(255, 107, 107, 0.1)',
                                border: '1px solid rgba(255, 107, 107, 0.2)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--coral)',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                transition: 'var(--transition)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'}
                        >
                            <Trash2 size={16} /> Reset Riwayat
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="search-input-wrapper" style={{ flex: 1, maxWidth: 400, background: 'var(--bg-card)' }}>
                        <Search size={18} className="icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Cari ID, Nama, atau No.WA..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '0 16px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: 14,
                            cursor: 'pointer',
                            height: 46
                        }}
                    >
                        <option value="all">Semua Status</option>
                        <option value="proses">Pesanan Proses</option>
                        <option value="diambil">Pesanan Diambil</option>
                        <option value="dibayar">Pesanan Dibayar</option>
                    </select>
                </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Waktu & ID</th>
                            <th style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Pelanggan</th>
                            <th style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Kasir</th>
                            <th style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Pesanan</th>
                            <th style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total</th>
                            <th style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    Tidak ada transaksi ditemukan
                                </td>
                            </tr>
                        ) : filtered.map((txn) => (
                            <tr key={txn.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{txn.id}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                        {new Date(txn.createdAt).toLocaleString('id-ID', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontWeight: 600 }}>{txn.customerName}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{txn.customerPhone || '-'}</div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: txn.cashierName === 'System' ? 'rgba(108, 92, 231, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                                            color: txn.cashierName === 'System' ? 'var(--purple)' : 'var(--green)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, fontWeight: 700, textTransform: 'uppercase'
                                        }}>
                                            {(txn.cashierName || 'A')[0]}
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 500 }}>{txn.cashierName || 'Admin'}</div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontSize: 13 }}>
                                        {txn.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                                    </div>
                                    {txn.notes && <div style={{ fontSize: 11, color: 'var(--coral)', marginTop: 4 }}>Note: {txn.notes}</div>}
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontWeight: 700 }}>{formatRupiah(txn.total)}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{txn.paymentMethod?.toUpperCase()}</div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: 20,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        background:
                                            getStatusNormalized(txn.status) === 'dibayar' ? 'rgba(46, 204, 113, 0.1)' :
                                                getStatusNormalized(txn.status) === 'diambil' ? 'rgba(253, 203, 110, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                                        color:
                                            getStatusNormalized(txn.status) === 'dibayar' ? 'var(--green)' :
                                                getStatusNormalized(txn.status) === 'diambil' ? 'var(--yellow)' : 'var(--coral)',
                                        border: `1px solid ${getStatusNormalized(txn.status) === 'dibayar' ? 'rgba(46, 204, 113, 0.2)' :
                                            getStatusNormalized(txn.status) === 'diambil' ? 'rgba(253, 203, 110, 0.2)' : 'rgba(255, 107, 107, 0.2)'
                                            }`
                                    }}>
                                        {getStatusNormalized(txn.status) === 'dibayar' ? 'PESANAN DIBAYAR' :
                                            getStatusNormalized(txn.status) === 'diambil' ? 'PESANAN DIAMBIL' : 'PESANAN PROSES'}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {getStatusNormalized(txn.status) === 'proses' && (
                                            <button
                                                onClick={() => handleUpdateStatus(txn, 'diambil')}
                                                style={{
                                                    padding: '8px 12px',
                                                    background: 'var(--yellow)',
                                                    color: '#000',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}
                                            >
                                                <CheckCircle size={14} /> Diambil
                                            </button>
                                        )}
                                        {getStatusNormalized(txn.status) === 'diambil' && (
                                            <button
                                                onClick={() => handleUpdateStatus(txn, 'dibayar')}
                                                style={{
                                                    padding: '8px 12px',
                                                    background: 'var(--green)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}
                                            >
                                                <CheckCircle size={14} /> Dibayar
                                            </button>
                                        )}
                                        {getStatusNormalized(txn.status) !== 'dibayar' && (
                                            <button
                                                onClick={() => {
                                                    dispatch({ type: 'SET_CART', payload: txn.items });
                                                    dispatch({ type: 'SET_EDIT_ORDER', payload: txn });
                                                    setActiveTab('pos');
                                                }}
                                                style={{
                                                    padding: '8px 12px',
                                                    background: 'var(--purple)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}
                                            >
                                                ✏️ Edit
                                            </button>
                                        )}
                                        {getStatusNormalized(txn.status) === 'dibayar' && (
                                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Transaksi Selesai</span>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Yakin ingin menghapus pesanan ini? Stok produk akan dikembalikan otomatis.')) {
                                                    dispatch({ type: 'DELETE_ORDER', payload: txn.id });
                                                    showToast('Pesanan berhasil dihapus! 🎉');
                                                }
                                            }}
                                            title="Hapus Pesanan"
                                            style={{
                                                padding: '8px',
                                                background: 'rgba(255, 107, 107, 0.1)',
                                                color: 'var(--coral)',
                                                border: '1px solid rgba(255, 107, 107, 0.2)',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginLeft: 'auto'
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table >
            </div >
        </div >
    );
}
