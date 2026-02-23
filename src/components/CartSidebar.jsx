import { useApp } from '../context/AppContext';
import { formatRupiah } from '../data/menuData';
import { X, Minus, Plus, Trash2 } from 'lucide-react';

export default function CartSidebar({ isOpen, onClose, onCheckout }) {
    const { state, dispatch } = useApp();
    const { cart } = state;

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    return (
        <>
            <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h3>
                        🛒 Keranjang
                        {cart.length > 0 && (
                            <span className="cart-count-badge">
                                {cart.reduce((s, i) => s + i.qty, 0)}
                            </span>
                        )}
                    </h3>
                    <button className="btn btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="cart-items">
                    {cart.length === 0 ? (
                        <div className="cart-empty">
                            <div className="emoji">🛒</div>
                            <p>Keranjang masih kosong</p>
                            <p style={{ fontSize: 13, marginTop: 8 }}>Pilih menu favorit kamu!</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="cart-item">
                                <div className="cart-item-thumbnail">
                                    {(item.image.startsWith('/') || item.image.startsWith('http')) ? (
                                        <img src={item.image} alt={item.name} className="cart-item-img" />
                                    ) : (
                                        <span className="cart-item-emoji">{item.image}</span>
                                    )}
                                </div>


                                <div className="cart-item-info">
                                    <h4>{item.name}</h4>
                                    <span className="price">{formatRupiah(item.price)}</span>
                                </div>
                                <div className="cart-item-qty">
                                    <button
                                        className="qty-btn"
                                        onClick={() =>
                                            dispatch({
                                                type: 'UPDATE_QTY',
                                                payload: { id: item.id, qty: item.qty - 1 },
                                            })
                                        }
                                    >
                                        {item.qty === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                                    </button>
                                    <span className="qty-num">{item.qty}</span>
                                    <button
                                        className="qty-btn"
                                        onClick={() =>
                                            dispatch({
                                                type: 'UPDATE_QTY',
                                                payload: { id: item.id, qty: item.qty + 1 },
                                            })
                                        }
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-total">
                            <span className="label">Total</span>
                            <span className="amount">{formatRupiah(total)}</span>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onCheckout}>
                            Proses Pesanan
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
