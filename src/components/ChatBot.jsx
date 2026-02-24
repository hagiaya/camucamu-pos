import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot } from 'lucide-react';

export default function ChatBot({ onNavigate }) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: 'Halo Bestie! ✨ Kenalin, aku CamuBot. Siap bantuin kamu jajan enak hari ini! Mau pesen apa nih?' }
    ]);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e) => {
        if (e) e.preventDefault();
        if (!inputValue.trim()) return;

        const userText = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userText }]);

        setTimeout(() => {
            let botResponse = '';
            let options = [];
            const lowInput = userText.toLowerCase();

            if (lowInput.includes('pesen') || lowInput.includes('order') || lowInput.includes('cara')) {
                botResponse = 'Caranya gampang banget! Pilih menu favorit, klik (+), terus checkout di keranjang. Mau langsung ke menu?';
                options = [
                    { id: 'go_to_menu', text: 'Boleh, anterin!' },
                    { id: 'just_looking', text: 'Nanti aja' }
                ];
            } else if (lowInput.includes('bayar') || lowInput.includes('pembayaran') || lowInput.includes('qris')) {
                botResponse = 'Bisa bayar pake Cash (tunai) atau QRIS pas mau checkout nanti. Aman kok!';
                options = [{ id: 'how_to_order', text: 'Cara pesennya?' }];
            } else if (lowInput.includes('rekomen') || lowInput.includes('enak')) {
                botResponse = 'Fix Banana Roll Coklat Lumer juaranya! 🏆 Sekali gigit seribu cerita. Mau liat menunya?';
                options = [{ id: 'go_to_menu', text: 'Mau dong!' }];
            } else {
                botResponse = 'Wah, aku belum terlalu ngerti nih. Tapi kalo soal jajan di Camu Camu, aku jagonya! Mau tanya apa?';
                options = [
                    { id: 'how_to_order', text: 'Cara pesen' },
                    { id: 'rekomendasi', text: 'Menu rekomen' }
                ];
            }

            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: botResponse, options }]);
        }, 800);
    };

    const handleOption = (option, text) => {
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text }]);

        if (option === 'go_to_menu') {
            setTimeout(() => {
                setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: 'Otw menu... ✨ Yuk pilih favoritmu!' }]);
                onNavigate('menu');
            }, 600);
            return;
        }

        setTimeout(() => {
            let botResponse = '';
            let options = [];

            if (option === 'how_to_order') {
                botResponse = 'Gampang banget! Kamu tinggal pilih menu favorit, klik tombol (+), trus klik keranjang di pojok kanan bawah buat checkout. Mau aku anter ke menu sekarang?';
                options = [
                    { id: 'go_to_menu', text: 'Boleh, anterin!' },
                    { id: 'just_looking', text: 'Aku liat-liat dulu' }
                ];
            } else if (option === 'payment_info') {
                botResponse = 'Tenang, bayarnya bisa pake Cash pas ambil atau Scan QRIS biar sat set! Pas checkout nanti tinggal pilih ya bestie.';
                options = [
                    { id: 'how_to_order', text: 'Cara pesennya gimana?' }
                ];
            } else if (option === 'rekomendasi') {
                botResponse = 'Fix sih, kamu harus coba Banana Roll Coklat Lumer! Sekali gigit seribu cerita pokonya. Mau liat menunya?';
                options = [
                    { id: 'go_to_menu', text: 'Mau dong!' }
                ];
            }

            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: botResponse, options }]);
        }, 800);
    };

    return (
        <>
            <div className="chatbot-bubble" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X size={28} color="white" /> : '🤖'}
            </div>

            <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
                <div className="chatbot-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Bot size={20} />
                        <span style={{ fontWeight: 700 }}>CamuBot ✨</span>
                    </div>
                    <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
                </div>

                <div className="chatbot-messages" ref={scrollRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className={`chat-msg ${msg.type}`}>
                                {msg.text}
                            </div>
                            {msg.options && (
                                <div className="chat-options">
                                    {msg.options.map(opt => (
                                        <button key={opt.id} className="chat-option-btn" onClick={() => handleOption(opt.id, opt.text)}>
                                            {opt.text}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {messages.length === 1 && (
                        <div className="chat-options">
                            <button className="chat-option-btn" onClick={() => handleOption('how_to_order', 'Gimana cara pesen?')}>Gimana cara pesen?</button>
                            <button className="chat-option-btn" onClick={() => handleOption('payment_info', 'Bayarnya lewat apa?')}>Bayarnya lewat apa?</button>
                            <button className="chat-option-btn" onClick={() => handleOption('rekomendasi', 'Menu rekomen dong!')}>Menu rekomen dong!</button>
                        </div>
                    )}
                </div>

                <form className="chatbot-input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        placeholder="Tanya CamuBot..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        style={{
                            flex: 1, border: 'none', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)'
                        }}
                    />
                    <button
                        type="submit"
                        style={{ background: 'var(--teal)', color: 'white', border: 'none', borderRadius: 8, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </>
    );
}
