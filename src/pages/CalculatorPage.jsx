import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { fixedCosts, formatRupiah } from '../data/menuData';
import Footer from '../components/Footer';
import {
    Calculator,
    TrendingUp,
    DollarSign,
    BarChart3,
    Target,
    Trash2,
    PieChart,
} from 'lucide-react';

export default function CalculatorPage() {
    const { state, dispatch } = useApp();
    const [activeTab, setActiveTab] = useState('bep');
    const [costs, setCosts] = useState({ ...fixedCosts });
    const [dailySales, setDailySales] = useState(50); // estimated daily items sold

    // === BEP CALCULATION ===
    const totalFixedCosts = useMemo(
        () => Object.values(costs).reduce((sum, val) => sum + Number(val), 0),
        [costs]
    );

    const products = state.products || [];

    // Average selling price & average cost across all items
    const avgPrice = useMemo(
        () => products.length > 0 ? products.reduce((sum, item) => sum + item.price, 0) / products.length : 0,
        [products]
    );

    const avgCost = useMemo(
        () => products.length > 0 ? products.reduce((sum, item) => sum + item.cost, 0) / products.length : 0,
        [products]
    );

    const avgContributionMargin = avgPrice - avgCost;
    const bepUnits = avgContributionMargin > 0 ? Math.ceil(totalFixedCosts / avgContributionMargin) : 0;
    const bepRevenue = bepUnits * avgPrice;
    const daysToBreakEven = dailySales > 0 ? Math.ceil(bepUnits / dailySales) : 0;

    // === MONTHLY PROJECTIONS ===
    const monthlyItems = dailySales * 30;
    const monthlyRevenue = monthlyItems * avgPrice;
    const monthlyVariableCost = monthlyItems * avgCost;
    const monthlyGrossProfit = monthlyRevenue - monthlyVariableCost;
    const monthlyNetProfit = monthlyGrossProfit - totalFixedCosts;

    // === PRODUCT ANALYSIS ===
    const productAnalysis = useMemo(() => {
        return products.map((item) => {
            const margin = item.price - item.cost;
            const marginPct = ((margin / item.price) * 100).toFixed(1);
            const itemBEP = totalFixedCosts > 0 && products.length > 0 ? Math.ceil(totalFixedCosts / products.length / margin) : 0;
            return {
                ...item,
                margin,
                marginPct: parseFloat(marginPct),
                itemBEP,
                monthlyProfit: products.length > 0 ? margin * Math.ceil(monthlyItems / products.length) : 0,
            };
        }).sort((a, b) => b.marginPct - a.marginPct);
    }, [products, totalFixedCosts, monthlyItems]);

    // === TRANSACTION STATS ===
    const transactionStats = useMemo(() => {
        const txns = state.transactions || [];
        const totalRevenue = txns.reduce((s, t) => s + t.total, 0);
        const totalCost = txns.reduce((s, t) => s + (t.totalCost || 0), 0);
        const totalProfit = txns.reduce((s, t) => s + (t.profit || 0), 0);

        // Daily breakdown
        const dailyMap = {};
        txns.forEach((t) => {
            const date = new Date(t.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
            });
            if (!dailyMap[date]) dailyMap[date] = { revenue: 0, profit: 0, count: 0 };
            dailyMap[date].revenue += t.total;
            dailyMap[date].profit += t.profit || 0;
            dailyMap[date].count += 1;
        });

        return {
            totalOrders: txns.length,
            totalRevenue,
            totalCost,
            totalProfit,
            avgOrderValue: txns.length > 0 ? totalRevenue / txns.length : 0,
            dailyBreakdown: Object.entries(dailyMap).slice(-7),
        };
    }, [state.transactions]);

    const maxDailyRevenue = Math.max(
        ...transactionStats.dailyBreakdown.map(([, d]) => d.revenue),
        1
    );

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <h1 className="page-title">📊 Kalkulator & Analisis Bisnis</h1>
                <p className="page-desc">
                    Hitung BEP, modal, keuntungan, dan analisis performa setiap produk
                </p>
            </div>

            {/* Tabs */}
            <div style={{ padding: '0 24px', maxWidth: 1400, margin: '0 auto' }}>
                <div className="tabs" style={{ maxWidth: 600 }}>
                    <button
                        className={`tab ${activeTab === 'bep' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bep')}
                    >
                        📐 BEP & Modal
                    </button>
                    <button
                        className={`tab ${activeTab === 'product' ? 'active' : ''}`}
                        onClick={() => setActiveTab('product')}
                    >
                        📦 Analisis Produk
                    </button>
                    <button
                        className={`tab ${activeTab === 'founder' ? 'active' : ''}`}
                        onClick={() => setActiveTab('founder')}
                    >
                        👥 Bagi Hasil Founder
                    </button>
                    <button
                        className={`tab ${activeTab === 'report' ? 'active' : ''}`}
                        onClick={() => setActiveTab('report')}
                    >
                        📈 Laporan
                    </button>
                </div>
            </div>

            {/* State for Founder Filter */}
            {activeTab === 'founder' && <FounderSection state={state} formatRupiah={formatRupiah} />}

            {/* ===== TAB: BEP & MODAL ===== */}
            {activeTab === 'bep' && (
                <div className="calc-layout">
                    {/* Fixed Costs Input */}
                    <div className="calc-card">
                        <h3>
                            <DollarSign size={20} />
                            Biaya Tetap Bulanan
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
                            Masukkan biaya tetap operasional per bulan
                        </p>
                        {Object.entries(costs).map(([key, value]) => (
                            <div key={key} className="calc-input-row">
                                <label style={{ textTransform: 'capitalize' }}>{key}</label>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) =>
                                        setCosts({ ...costs, [key]: Number(e.target.value) })
                                    }
                                />
                            </div>
                        ))}
                        <div className="calc-row highlight" style={{ marginTop: 12 }}>
                            <span className="label" style={{ fontWeight: 600 }}>Total Biaya Tetap</span>
                            <span className="value">{formatRupiah(totalFixedCosts)}</span>
                        </div>
                    </div>

                    {/* BEP Result */}
                    <div>
                        <div className="calc-card" style={{ marginBottom: 24 }}>
                            <h3>
                                <Target size={20} />
                                Break Even Point (BEP)
                            </h3>

                            <div className="calc-input-row">
                                <label>Estimasi Penjualan/Hari</label>
                                <input
                                    type="number"
                                    value={dailySales}
                                    onChange={(e) => setDailySales(Number(e.target.value))}
                                />
                            </div>

                            <div className="calc-row">
                                <span className="label">Harga Jual Rata-rata</span>
                                <span className="value">{formatRupiah(Math.round(avgPrice))}</span>
                            </div>
                            <div className="calc-row">
                                <span className="label">HPP Rata-rata</span>
                                <span className="value">{formatRupiah(Math.round(avgCost))}</span>
                            </div>
                            <div className="calc-row">
                                <span className="label">Contribution Margin</span>
                                <span className="value" style={{ color: 'var(--green)' }}>
                                    {formatRupiah(Math.round(avgContributionMargin))}
                                </span>
                            </div>

                            <div className="bep-result">
                                <h4>BEP (Break Even Point)</h4>
                                <div className="bep-value">{bepUnits.toLocaleString('id-ID')} porsi</div>
                                <div className="bep-desc">
                                    Setara dengan {formatRupiah(bepRevenue)} revenue
                                </div>
                                <div className="bep-desc" style={{ marginTop: 4, fontWeight: 600, color: 'var(--teal-light)' }}>
                                    ≈ {daysToBreakEven} hari untuk BEP ({dailySales} porsi/hari)
                                </div>
                            </div>
                        </div>

                        {/* Monthly Projection */}
                        <div className="calc-card">
                            <h3>
                                <TrendingUp size={20} />
                                Proyeksi Bulanan
                            </h3>
                            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
                                Berdasarkan {dailySales} porsi/hari × 30 hari
                            </p>

                            <div className="result-grid">
                                <div className="result-card coral">
                                    <div className="result-icon">💰</div>
                                    <div className="result-value">{formatRupiah(monthlyRevenue)}</div>
                                    <div className="result-label">Revenue</div>
                                </div>
                                <div className="result-card yellow">
                                    <div className="result-icon">📦</div>
                                    <div className="result-value">{formatRupiah(monthlyVariableCost)}</div>
                                    <div className="result-label">Biaya Bahan</div>
                                </div>
                                <div className="result-card teal">
                                    <div className="result-icon">📊</div>
                                    <div className="result-value">{formatRupiah(monthlyGrossProfit)}</div>
                                    <div className="result-label">Laba Kotor</div>
                                </div>
                                <div className={`result-card ${monthlyNetProfit >= 0 ? 'green' : 'coral'}`}>
                                    <div className="result-icon">{monthlyNetProfit >= 0 ? '🎉' : '⚠️'}</div>
                                    <div className="result-value">{formatRupiah(monthlyNetProfit)}</div>
                                    <div className="result-label">Laba Bersih</div>
                                </div>
                            </div>

                            <div className="calc-row" style={{ marginTop: 20 }}>
                                <span className="label">Margin Laba Bersih</span>
                                <span
                                    className="value"
                                    style={{
                                        color: monthlyNetProfit >= 0 ? 'var(--green)' : 'var(--coral)',
                                    }}
                                >
                                    {monthlyRevenue > 0
                                        ? ((monthlyNetProfit / monthlyRevenue) * 100).toFixed(1)
                                        : 0}
                                    %
                                </span>
                            </div>
                            <div className="calc-row">
                                <span className="label">ROI Bulanan</span>
                                <span className="value" style={{ color: 'var(--teal)' }}>
                                    {totalFixedCosts + monthlyVariableCost > 0
                                        ? ((monthlyNetProfit / (totalFixedCosts + monthlyVariableCost)) * 100).toFixed(1)
                                        : 0}
                                    %
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TAB: PRODUCT ANALYSIS ===== */}
            {activeTab === 'product' && (
                <div style={{ padding: '0 24px 60px', maxWidth: 1400, margin: '0 auto' }}>
                    <div className="calc-card">
                        <h3>
                            <PieChart size={20} />
                            Analisis Per Produk
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
                            Detail margin, HPP, dan BEP untuk setiap produk
                        </p>

                        <div className="analysis-table-wrapper">
                            <table className="analysis-table">
                                <thead>
                                    <tr>
                                        <th>Produk</th>
                                        <th>Kategori</th>
                                        <th>Harga Jual</th>
                                        <th>HPP</th>
                                        <th>Margin (Rp)</th>
                                        <th>Margin (%)</th>
                                        <th>BEP/Bulan</th>
                                        <th>Profit/Bulan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productAnalysis.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span>{item.image}</span>
                                                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-tertiary)' }}>
                                                {item.category}
                                            </td>
                                            <td>{formatRupiah(item.price)}</td>
                                            <td style={{ color: 'var(--text-tertiary)' }}>{formatRupiah(item.cost)}</td>
                                            <td style={{ color: 'var(--green)', fontWeight: 600 }}>
                                                {formatRupiah(item.margin)}
                                            </td>
                                            <td>
                                                <span
                                                    className={`margin-badge ${item.marginPct >= 65
                                                        ? 'margin-high'
                                                        : item.marginPct >= 50
                                                            ? 'margin-medium'
                                                            : 'margin-low'
                                                        }`}
                                                >
                                                    {item.marginPct}%
                                                </span>
                                            </td>
                                            <td>{item.itemBEP} porsi</td>
                                            <td style={{ fontWeight: 600, color: 'var(--teal)' }}>
                                                {formatRupiah(item.monthlyProfit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Visual Margin Comparison */}
                        <h4 style={{ marginTop: 40, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
                            📊 Perbandingan Margin (%)
                        </h4>
                        <div className="chart-bars" style={{ height: 220 }}>
                            {productAnalysis.slice(0, 10).map((item) => (
                                <div key={item.id} className="chart-bar">
                                    <div className="value">{item.marginPct}%</div>
                                    <div
                                        className="bar"
                                        style={{
                                            height: `${item.marginPct * 2.5}px`,
                                            background:
                                                item.marginPct >= 65
                                                    ? 'linear-gradient(180deg, var(--green), var(--teal))'
                                                    : item.marginPct >= 50
                                                        ? 'linear-gradient(180deg, var(--yellow), var(--orange))'
                                                        : 'linear-gradient(180deg, var(--coral), var(--coral-dark))',
                                        }}
                                    />
                                    <div className="label">{item.image}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TAB: REPORT ===== */}
            {activeTab === 'report' && (
                <div className="calc-layout">
                    {/* Summary Cards */}
                    <div className="calc-card">
                        <h3>
                            <BarChart3 size={20} />
                            Ringkasan Transaksi
                        </h3>

                        {state.transactions.length === 0 ? (
                            <div className="empty-state" style={{ padding: '40px 20px' }}>
                                <div className="emoji" style={{ fontSize: 48 }}>📊</div>
                                <h3 style={{ fontSize: 16 }}>Belum ada transaksi</h3>
                                <p style={{ fontSize: 13 }}>Mulai gunakan POS untuk melihat laporan</p>
                            </div>
                        ) : (
                            <>
                                <div className="result-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <div className="result-card coral">
                                        <div className="result-icon">🛒</div>
                                        <div className="result-value">{transactionStats.totalOrders}</div>
                                        <div className="result-label">Total Pesanan</div>
                                    </div>
                                    <div className="result-card teal">
                                        <div className="result-icon">💰</div>
                                        <div className="result-value" style={{ fontSize: 18 }}>
                                            {formatRupiah(transactionStats.totalRevenue)}
                                        </div>
                                        <div className="result-label">Total Revenue</div>
                                    </div>
                                    <div className="result-card yellow">
                                        <div className="result-icon">📦</div>
                                        <div className="result-value" style={{ fontSize: 18 }}>
                                            {formatRupiah(transactionStats.totalCost)}
                                        </div>
                                        <div className="result-label">Total HPP</div>
                                    </div>
                                    <div className="result-card green">
                                        <div className="result-icon">🎉</div>
                                        <div className="result-value" style={{ fontSize: 18 }}>
                                            {formatRupiah(transactionStats.totalProfit)}
                                        </div>
                                        <div className="result-label">Total Profit</div>
                                    </div>
                                </div>

                                <div className="divider" />

                                <div className="calc-row">
                                    <span className="label">Rata-rata Per Pesanan</span>
                                    <span className="value">
                                        {formatRupiah(Math.round(transactionStats.avgOrderValue))}
                                    </span>
                                </div>
                                <div className="calc-row">
                                    <span className="label">Margin Profit</span>
                                    <span className="value" style={{ color: 'var(--green)' }}>
                                        {transactionStats.totalRevenue > 0
                                            ? ((transactionStats.totalProfit / transactionStats.totalRevenue) * 100).toFixed(1)
                                            : 0}
                                        %
                                    </span>
                                </div>

                                {/* Daily Chart */}
                                {transactionStats.dailyBreakdown.length > 0 && (
                                    <>
                                        <h4 style={{ marginTop: 24, marginBottom: 12, fontSize: 15 }}>
                                            📈 Revenue Harian
                                        </h4>
                                        <div className="chart-bars" style={{ height: 150 }}>
                                            {transactionStats.dailyBreakdown.map(([date, data]) => (
                                                <div key={date} className="chart-bar">
                                                    <div className="value">{formatRupiah(data.revenue)}</div>
                                                    <div
                                                        className="bar"
                                                        style={{
                                                            height: `${(data.revenue / maxDailyRevenue) * 120}px`,
                                                        }}
                                                    />
                                                    <div className="label">{date}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ marginTop: 20 }}
                                    onClick={() => {
                                        if (confirm('Hapus semua data transaksi?')) {
                                            dispatch({ type: 'CLEAR_TRANSACTIONS' });
                                        }
                                    }}
                                >
                                    <Trash2 size={14} />
                                    Reset Transaksi
                                </button>
                            </>
                        )}
                    </div>

                    {/* Transaction History */}
                    <div className="calc-card">
                        <h3>📋 Riwayat Transaksi</h3>

                        {state.transactions.length === 0 ? (
                            <div className="empty-state" style={{ padding: '40px 20px' }}>
                                <div className="emoji" style={{ fontSize: 48 }}>📋</div>
                                <h3 style={{ fontSize: 16 }}>Belum ada riwayat</h3>
                            </div>
                        ) : (
                            <div className="transaction-list">
                                {state.transactions.map((txn) => (
                                    <div key={txn.id} className="transaction-item">
                                        <div className="info">
                                            <div className="order-id">{txn.id}</div>
                                            <div className="meta">
                                                {txn.customerName} • {txn.type} •{' '}
                                                {new Date(txn.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="amount">{formatRupiah(txn.total)}</div>
                                            <span
                                                className={`status-badge status-${txn.status}`}
                                                style={{ marginTop: 4 }}
                                            >
                                                {txn.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ paddingTop: 40 }}>
                <Footer />
            </div>
        </div>
    );
}

// === FOUNDER PROFIT SECTION ===
function FounderSection({ state, formatRupiah }) {
    const [period, setPeriod] = useState('day'); // 'day', 'week', 'month', 'all'

    const filteredTransactions = useMemo(() => {
        const txns = state.transactions || [];
        const now = new Date();

        return txns.filter(t => {
            const date = new Date(t.createdAt);
            if (period === 'day') {
                return date.toDateString() === now.toDateString();
            } else if (period === 'week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return date >= oneWeekAgo;
            } else if (period === 'month') {
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [state.transactions, period]);

    const filteredExpenses = useMemo(() => {
        const exps = state.expenses || [];
        const now = new Date();

        return exps.filter(e => {
            const date = new Date(e.date);
            if (period === 'day') {
                return date.toDateString() === now.toDateString();
            } else if (period === 'week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return date >= oneWeekAgo;
            } else if (period === 'month') {
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [state.expenses, period]);

    const totalExpenses = filteredExpenses.filter(e => e.fundSource !== 'Modal Awal').reduce((sum, e) => sum + (parseInt(e.amount) || 0), 0);
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const rawProfit = filteredTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalProfit = rawProfit - totalExpenses;

    const splits = [
        { name: 'Reza', share: 0.30, icon: '🧔' },
        { name: 'Andris', share: 0.35, icon: '👨‍💻' },
        { name: 'Lasulika', share: 0.35, icon: '👨‍💼' },
    ];

    return (
        <div className="calc-layout" style={{ paddingBottom: 60 }}>
            <div className="calc-card" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h3>👥 Pembagian Laba Founder</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                            Distribusi laba bersih berdasarkan porsi kepemilikan
                        </p>
                    </div>

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
                            { id: 'all', label: 'Semua' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: period === p.id ? 'var(--bg-card)' : 'transparent',
                                    color: period === p.id ? 'var(--coral)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: period === p.id ? 600 : 400,
                                    boxShadow: period === p.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="result-grid" style={{ marginBottom: 32 }}>
                    <div className="result-card teal">
                        <div className="result-icon">💰</div>
                        <div className="result-value">{formatRupiah(totalRevenue)}</div>
                        <div className="result-label">Total Revenue</div>
                    </div>
                    <div className="result-card coral">
                        <div className="result-icon">💸</div>
                        <div className="result-value">-{formatRupiah(totalExpenses)}</div>
                        <div className="result-label">Total Pengeluaran</div>
                    </div>
                    <div className={`result-card ${totalProfit >= 0 ? "green" : "coral"}`}>
                        <div className="result-icon">{totalProfit >= 0 ? "🎉" : "⏳"}</div>
                        <div className="result-value">
                            {totalProfit >= 0 ? formatRupiah(totalProfit) : `- ${formatRupiah(Math.abs(totalProfit))}`}
                        </div>
                        <div className="result-label">{totalProfit >= 0 ? "Net Profit (Sisa Dibagi)" : "Masih Proses Balik Modal"}</div>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 20
                }}>
                    {splits.map((f) => (
                        <div key={f.name} style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 16,
                            padding: 24,
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                padding: '8px 16px',
                                background: 'var(--coral)',
                                color: 'white',
                                fontSize: 12,
                                fontWeight: 700,
                                borderBottomLeftRadius: 12
                            }}>
                                {f.share * 100}%
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                    background: 'var(--bg-card)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 24,
                                    border: '1px solid var(--border)'
                                }}>
                                    {f.icon}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 18 }}>{f.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Founder / Partner</div>
                                </div>
                            </div>

                            <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                                    Jatah Keuntungan
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: totalProfit > 0 ? 'var(--green)' : 'var(--text-tertiary)' }}>
                                    {totalProfit > 0 ? formatRupiah(Math.floor(totalProfit * f.share)) : 'Rp 0'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    marginTop: 32,
                    padding: 16,
                    borderRadius: 12,
                    background: 'rgba(255, 193, 7, 0.05)',
                    border: '1px dashed rgba(255, 193, 7, 0.3)',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12
                }}>
                    <div style={{ fontSize: 20 }}>💡</div>
                    <p>
                        Perhitungan ini adalah estimasi laba bersih yang dibagikan kepada para founder berdasarkan porsi saham.
                        Pastikan semua HPP produk sudah diatur dengan benar untuk mendapatkan angka profit yang akurat.
                    </p>
                </div>
            </div>
        </div>
    );
}

