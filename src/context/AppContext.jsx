import { createContext, useContext, useReducer, useEffect } from 'react';
import { menuItems as defaultMenuItems } from '../data/menuData';
import { supabase } from '../lib/supabaseClient';


const AppContext = createContext(null);

const initialState = {
    cart: [],
    orders: [],
    transactions: [],
    products: [], // custom/editable product list
    expenses: [], // daily expenses
};


// Load from localStorage
const loadState = () => {
    try {
        const saved = localStorage.getItem('camucamu_state');
        if (saved) {
            const parsed = JSON.parse(saved);

            // Force reset if products are from old version
            const isOutdated = parsed.products &&
                (parsed.products.some(p => p.name.includes('Smoothie') || p.name.includes('Dragon')) ||
                    !parsed.products.some(p => p.name.includes('Banana Roll')));

            const productsRaw = (isOutdated || !parsed.products || parsed.products.length === 0)
                ? defaultMenuItems
                : parsed.products;

            // NEW: Always sync images from defaultMenuItems if names match 
            // to ensure no "broken" images from old versions are stuck in localStorage
            const syncedProducts = productsRaw.map(p => {
                const defaultItem = defaultMenuItems.find(d => d.name === p.name);
                let finalImage = p.image;

                // If current image is missing or just an emoji (not a path), and default has a path
                if ((!p.image || !p.image.startsWith('/')) && defaultItem && defaultItem.image.startsWith('/')) {
                    finalImage = defaultItem.image;
                }

                return {
                    ...p,
                    image: finalImage,
                    stock: p.stock !== undefined ? p.stock : 100
                };
            });

            return {
                ...initialState,
                ...parsed,
                products: syncedProducts,
            };
        }
    } catch (e) {
        console.error('Error loading state:', e);
    }
    return {
        ...initialState,
        products: defaultMenuItems.map(p => ({
            ...p,
            stock: p.stock !== undefined ? p.stock : 100
        }))
    };
};

function appReducer(state, action) {
    switch (action.type) {
        case 'ADD_TO_CART': {
            const existing = state.cart.find(item => item.id === action.payload.id);
            if (existing) {
                return {
                    ...state,
                    cart: state.cart.map(item =>
                        item.id === action.payload.id
                            ? { ...item, qty: item.qty + 1 }
                            : item
                    ),
                };
            }
            return {
                ...state,
                cart: [...state.cart, { ...action.payload, qty: 1 }],
            };
        }

        case 'REMOVE_FROM_CART':
            return {
                ...state,
                cart: state.cart.filter(item => item.id !== action.payload),
            };

        case 'UPDATE_QTY': {
            const { id, qty } = action.payload;
            if (qty <= 0) {
                return {
                    ...state,
                    cart: state.cart.filter(item => item.id !== id),
                };
            }
            return {
                ...state,
                cart: state.cart.map(item =>
                    item.id === id ? { ...item, qty } : item
                ),
            };
        }

        case 'CLEAR_CART':
            return { ...state, cart: [] };

        // ============ PRODUCT MANAGEMENT ============
        case 'ADD_PRODUCT': {
            const newProduct = {
                id: String(Date.now()), // default ID
                ...action.payload,
            };
            return {
                ...state,
                products: [...state.products, newProduct],
            };
        }

        case 'UPDATE_PRODUCT': {
            return {
                ...state,
                products: state.products.map(p =>
                    p.id === action.payload.id ? { ...p, ...action.payload } : p
                ),
            };
        }

        case 'DELETE_PRODUCT': {
            return {
                ...state,
                products: state.products.filter(p => p.id !== action.payload),
            };
        }

        case 'RESET_PRODUCTS': {
            return {
                ...state,
                products: defaultMenuItems,
            };
        }

        // ============ ORDERS ============
        case 'ADD_ORDER': {
            const order = {
                id: `ORD-${Date.now()}`,
                items: [...state.cart],
                total: state.cart.reduce((sum, item) => sum + item.price * item.qty, 0),
                totalCost: state.cart.reduce((sum, item) => sum + item.cost * item.qty, 0),
                profit: state.cart.reduce((sum, item) => sum + (item.price - item.cost) * item.qty, 0),
                customerName: action.payload.customerName || 'Walk-in',
                customerPhone: action.payload.customerPhone || '',
                paymentMethod: action.payload.paymentMethod || 'cash',
                cashReceived: action.payload.cashReceived || null,
                change: action.payload.change || null,
                type: action.payload.type || 'dine-in',
                status: 'completed',
                cashierName: action.payload.cashierName || null,
                createdAt: new Date().toISOString(),
            };
            const updatedProducts = state.products.map(p => {
                const cartItem = state.cart.find(item => {
                    const baseId = String(item.id).split('-')[0];
                    return baseId === p.id.toString() || baseId === p.id;
                });
                if (cartItem) {
                    return { ...p, stock: Math.max(0, (p.stock || 0) - cartItem.qty) };
                }
                return p;
            });

            return {
                ...state,
                orders: [order, ...state.orders],
                transactions: [order, ...state.transactions],
                products: updatedProducts,
                cart: [],
            };
        }

        case 'ADD_ONLINE_ORDER': {
            const onlineOrder = {
                id: `ONL-${Date.now()}`,
                items: action.payload.items,
                total: action.payload.total,
                totalCost: action.payload.totalCost,
                profit: action.payload.profit,
                customerName: action.payload.customerName,
                customerPhone: action.payload.customerPhone,
                notes: action.payload.notes,
                paymentMethod: action.payload.paymentMethod || 'cash',
                cashReceived: action.payload.cashReceived || null,
                change: action.payload.change || null,
                type: 'online',
                status: 'completed',
                cashierName: action.payload.cashierName || 'System',
                createdAt: new Date().toISOString(),
            };
            const updatedProductsOnline = state.products.map(p => {
                const cartItem = action.payload.items.find(item => {
                    const baseId = String(item.id).split('-')[0];
                    return baseId === p.id.toString() || baseId === p.id;
                });
                if (cartItem) {
                    return { ...p, stock: Math.max(0, (p.stock || 0) - cartItem.qty) };
                }
                return p;
            });

            return {
                ...state,
                orders: [onlineOrder, ...state.orders],
                transactions: [onlineOrder, ...state.transactions],
                products: updatedProductsOnline,
                cart: [],
            };
        }

        case 'UPDATE_ORDER_STATUS':
            return {
                ...state,
                orders: state.orders.map(order =>
                    order.id === action.payload.id
                        ? { ...order, status: action.payload.status }
                        : order
                ),
                transactions: state.transactions.map(t =>
                    t.id === action.payload.id
                        ? { ...t, status: action.payload.status }
                        : t
                ),
            };

        case 'CLEAR_TRANSACTIONS':
            return { ...state, orders: [], transactions: [] };

        // ============ EXPENSES ============
        case 'ADD_EXPENSE': {
            const newExpense = {
                ...action.payload,
                id: `EXP-${Date.now()}`,
                createdAt: new Date().toISOString(),
            };
            return {
                ...state,
                expenses: [newExpense, ...(state.expenses || [])],
            };
        }

        case 'UPDATE_EXPENSE': {
            return {
                ...state,
                expenses: (state.expenses || []).map(e =>
                    e.id === action.payload.id ? { ...e, ...action.payload } : e
                ),
            };
        }

        case 'DELETE_EXPENSE': {
            return {
                ...state,
                expenses: (state.expenses || []).filter(e => e.id !== action.payload),
            };
        }


        case 'SET_INITIAL_STATE': {
            const mergedProducts = action.payload.products ? action.payload.products.map(p => {
                const defaultItem = defaultMenuItems.find(d => d.name === p.name);
                // If the product doesn't have a valid image path but the default one does, sync it
                if ((!p.image || !p.image.startsWith('/')) && defaultItem && defaultItem.image.startsWith('/')) {
                    return { ...p, image: defaultItem.image };
                }
                return p;
            }) : state.products;

            return {
                ...state,
                ...action.payload,
                products: mergedProducts,
            };
        }

        default:
            return state;
    }
}


export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, null, loadState);

    // Initial load from Supabase
    useEffect(() => {
        const fetchSupabaseData = async () => {
            try {
                // Fetch Products
                const { data: products } = await supabase.from('products').select('*').order('name');
                // Fetch Transactions
                const { data: transactions } = await supabase.from('transactions').select('*').order('createdAt', { ascending: false });
                // Fetch Expenses
                const { data: expenses } = await supabase.from('expenses').select('*').order('date', { ascending: false });

                const newState = {};
                if (products && products.length > 0) newState.products = products;
                if (transactions && transactions.length > 0) {
                    newState.transactions = transactions;
                    newState.orders = transactions; // Assuming orders and transactions are the same for now
                }
                if (expenses && expenses.length > 0) newState.expenses = expenses;

                if (Object.keys(newState).length > 0) {
                    dispatch({ type: 'SET_INITIAL_STATE', payload: newState });
                }
            } catch (err) {
                console.error('Supabase fetch error:', err);
            }
        };

        if (import.meta.env.VITE_SUPABASE_URL) {
            fetchSupabaseData();
        }
    }, []);

    // Sync to LocalStorage (Existing)
    useEffect(() => {
        const toSave = {
            orders: state.orders,
            transactions: state.transactions,
            products: state.products,
            expenses: state.expenses || [],
        };
        localStorage.setItem('camucamu_state', JSON.stringify(toSave));
    }, [state.orders, state.transactions, state.products, state.expenses]);

    // Sync to Supabase (Add/Update logic)
    // For simplicity, we'll implement specific sync calls in the actions if needed, 
    // but here we can handle the most critical ones via effects if they are small enough.
    // However, for performance and reliability, it's better to trigger the sync 
    // alongside the dispatch in the UI or a wrapper.

    const syncProduct = async (product) => {
        if (!import.meta.env.VITE_SUPABASE_URL) return;

        // Ensure id is a string, and include all properties (including stock)
        const productToSync = { ...product, id: String(product.id) };

        await supabase.from('products').upsert(productToSync);
    };

    const deleteProduct = async (id) => {
        if (!import.meta.env.VITE_SUPABASE_URL) return;
        await supabase.from('products').delete().eq('id', id);
    };

    const syncTransaction = async (txn) => {
        if (!import.meta.env.VITE_SUPABASE_URL) return;
        await supabase.from('transactions').upsert(txn);
    };

    const syncExpense = async (expense) => {
        if (!import.meta.env.VITE_SUPABASE_URL) return;
        await supabase.from('expenses').upsert(expense);
    };

    const deleteExpense = async (id) => {
        if (!import.meta.env.VITE_SUPABASE_URL) return;
        await supabase.from('expenses').delete().eq('id', id);
    };

    // We wrap dispatch to include Supabase syncing
    const dispatchWithSync = async (action) => {
        // Run local reducer first
        dispatch(action);

        // Then sync to Supabase
        try {
            switch (action.type) {
                case 'ADD_PRODUCT':
                case 'UPDATE_PRODUCT':
                    await syncProduct({ ...action.payload, id: action.payload.id || Date.now() });
                    break;
                case 'DELETE_PRODUCT':
                    await deleteProduct(action.payload);
                    break;
                case 'ADD_ORDER':
                    // Need to construct the exact order object that the reducer created
                    const newOrder = {
                        id: `ORD-${Date.now()}`,
                        items: state.cart,
                        total: state.cart.reduce((sum, item) => sum + item.price * item.qty, 0),
                        totalCost: state.cart.reduce((sum, item) => sum + item.cost * item.qty, 0),
                        profit: state.cart.reduce((sum, item) => sum + (item.price - item.cost) * item.qty, 0),
                        customerName: action.payload.customerName || 'Walk-in',
                        customerPhone: action.payload.customerPhone || '',
                        paymentMethod: action.payload.paymentMethod || 'cash',
                        cashReceived: action.payload.cashReceived || null,
                        change: action.payload.change || null,
                        type: action.payload.type || 'dine-in',
                        status: 'completed',
                        createdAt: new Date().toISOString(),
                    };
                    await syncTransaction(newOrder);
                    break;
                case 'ADD_ONLINE_ORDER':
                    const onlineOrder = {
                        id: `ONL-${Date.now()}`,
                        ...action.payload,
                        type: 'online',
                        status: 'completed',
                        createdAt: new Date().toISOString(),
                    };
                    await syncTransaction(onlineOrder);
                    break;
                case 'ADD_EXPENSE':
                    const newExp = {
                        ...action.payload,
                        id: `EXP-${Date.now()}`,
                        createdAt: new Date().toISOString(),
                    };
                    await syncExpense(newExp);
                    break;
                case 'UPDATE_EXPENSE':
                    await syncExpense(action.payload);
                    break;
                case 'UPDATE_ORDER_STATUS':
                    await syncTransaction({ id: action.payload.id, status: action.payload.status });
                    break;
                case 'DELETE_EXPENSE':
                    await deleteExpense(action.payload);
                    break;
                case 'CLEAR_TRANSACTIONS':
                    if (import.meta.env.VITE_SUPABASE_URL) {
                        await supabase.from('transactions').delete().neq('id', '0');
                    }
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error('Supabase sync error:', err);
        }
    };

    return (
        <AppContext.Provider value={{ state, dispatch: dispatchWithSync }}>
            {children}
        </AppContext.Provider>
    );
}


export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
