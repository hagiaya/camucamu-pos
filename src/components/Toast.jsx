import { useState } from 'react';

export default function Toast() {
    return null; // Toast is managed per-page
}

// Hook for toast
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const ToastContainer = () => (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast ${t.type}`}>
                    {t.type === 'success' ? '✅' : '❌'} {t.message}
                </div>
            ))}
        </div>
    );

    return { showToast, ToastContainer };
}
