export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                    <div className="footer-brand">
                        <div className="logo">
                            <img
                                src="/logo2.png"
                                alt="Camu Camu"
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    objectFit: 'cover',
                                }}
                            />
                            CAMU CAMU
                        </div>
                        <p>
                            Sekali Gigit, Ribuan Cerita. Street food terbaik dengan cita rasa
                            autentik kaki lima Indonesia. Jajanan favorit yang bikin nagih!
                        </p>
                    </div>

                    <div className="footer-col">
                        <h4>Menu</h4>
                        <ul>
                            <li><a href="#menu">Gorengan</a></li>
                            <li><a href="#menu">Nasi & Mie</a></li>
                            <li><a href="#menu">Sate & Bakar</a></li>
                            <li><a href="#menu">Bakso & Soto</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Kontak</h4>
                        <ul>
                            <li><a href="#">📍 Jakarta, Indonesia</a></li>
                            <li><a href="#">📱 +62 812 3456 7890</a></li>
                            <li><a href="#">✉️ hello@camucamu.id</a></li>
                            <li><a href="#">📸 @camucamu.id</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} CAMU CAMU. Sekali Gigit, Ribuan Cerita. Made with 🔥 & ❤️</p>
                </div>
            </div>
        </footer>
    );
}
