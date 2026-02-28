// Menu data for Camu Camu Street Food
// Each item includes sell price, cost (HPP), and category

export const categories = [
    { id: 'makanan', name: 'Makanan', icon: '🍟', color: '#D32F2F' },
    { id: 'minuman', name: 'Minuman', icon: '🥤', color: '#2E7D32' },
];

export const menuItems = [
    {
        id: 1,
        name: 'Banana Roll Coklat',
        category: 'makanan',
        price: 10000,
        cost: 6000,
        description: 'Pisang raja gulung renyah dengan topping coklat lumer yang melimpah',
        image: '/assets/menu/banana_roll.png',
        popular: true,
        stock: 50,
    },
    {
        id: 2,
        name: 'French Fries',
        category: 'makanan',
        price: 10000,
        cost: 5000,
        description: 'Kentang goreng gurih nan renyah dengan bumbu spesial Camu Camu',
        image: '/assets/menu/french_fries.png',
        popular: true,
        stock: 40,
    },
    {
        id: 3,
        name: 'Banana Roll Coklat Keju',
        category: 'makanan',
        price: 15000,
        cost: 7500,
        description: 'Perpaduan sempurna pisang gulung, coklat lumer, dan parutan keju premium',
        image: '/assets/menu/banana_roll.png',
        popular: true,
        stock: 30,
    },
    {
        id: 4,
        name: 'Banana Roll Coklat + Tiramisu + Strowbery',
        category: 'makanan',
        price: 12000,
        cost: 7500,
        description: 'Sensasi tiga rasa dalam satu porsi pisang gulung yang unik',
        image: '/assets/menu/banana_roll.png',
        popular: false,
        stock: 25,
    },
    {
        id: 5,
        name: 'Ice Choco Milo',
        category: 'minuman',
        price: 12000,
        cost: 7000,
        description: 'Minuman coklat milo dingin yang nyegerin banget',
        image: '/assets/menu/ice_milo.png',
        popular: true,
        stock: 60,
    },
    {
        id: 6,
        name: 'Ice Chocho Milo Latte',
        category: 'minuman',
        price: 15000,
        cost: 8000,
        description: 'Kombinasi milo dan susu latte yang creamy dan berkelas',
        image: '/assets/menu/ice_milo.png',
        popular: false,
        stock: 40,
    },
    {
        id: 7,
        name: 'Ice Fanta Susu',
        category: 'minuman',
        price: 9000,
        cost: 5000,
        description: 'Kesegaran fanta merah berpadu dengan manisnya susu kental manis',
        image: '/assets/menu/fansus.png',
        popular: false,
        stock: 50,
    },
];

// Fixed costs per month for BEP calculation
export const fixedCosts = {
    sewa: 2000000,
    listrik: 500000,
    air: 200000,
    gaji: 3000000,
    gas: 300000,
    perlengkapan: 300000,
    marketing: 500000,
    lainnya: 200000,
};

export const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

export const formatPhoneForFonnte = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
};

export const pantuns = [
    "Ke pasar beli pepaya, pulangnya mampir ke Senayan. Camu Camu emang slaaaay, bikin mood kamu langsung nyaman! ✨",
    "Makan seblak di pinggir jalan, pedasnya bikin telinga pengang. Sekali nyicip lupakan mantan, Camu Camu bikin hidup makin terang! 🌈",
    "Nonton drakor sambil makan kuaci, ceritanya bikin baper sekali. Camu Camu bestie sejati, temen setia buat asupan hari ini! 💖",
    "Main game kalah terus, bikin kesel sampe ke tulang. Makan Camu Camu biar lurus, biar semangat makin gampang datang! 🔥",
    "Jalan-jalan ke Kota Tua, jangan lupa beli kacamata. Camu Camu favorit kita semua, sekali gigit seribu cerita! 📖",
    "Beli baju warnanya ungu, jangan lupa beli buat mama. Hidup emang sering bikin bingung, tapi Camu Camu selalu seirama! 🎵",
    "Minum boba pake topping jelly, belinya bareng gebetan baru. Camu Camu bukan cuma sekali, tapi bikin nagih terus-terusan nih boss, senggol dong! 🤙",
    "Ke mall pake baju rapi, biar kelihatan makin kece. Camu Camu asupan bergizi, bikin hari kamu gak lagi sepi alias mleyot! 🫠",
    "Upload foto di media sosial, jangan lupa pake filter aesthetic. Camu Camu emang paling spesial, rasanya beneran gak ada obat, no debat! 💯",
    "Nungguin chat doi belum dibalas, mending scroll TikTok cari hiburan. Jangan sampe hidup kamu makin malas, yuk Camu Camu dulu biar makin sat set! ⚡",
    "Beli pulsa di konter depan, jangan lupa beli camilan. Camu Camu idola masa depan, bikin kamu makin bersinar di keramaian! 🌟",
    "Belajar coding emang pusing, apalagi pas error melulu. Camu Camu temen yang paling pas, buat nemenin kamu cari ilmu! 💻",
    "Pergi healing ke pantai Bali, pulangnya mampir ke Jogja. Camu Camu emang asik sekali, bikin semangat makin membara! 🏖️",
    "Pakai outfit minimalis, biar kelihatan makin modis. Camu Camu rasanya manis, bikin hari-hari kamu makin manis juga, bestie! 🍭",
    "Langit biru warnanya cerah, secerah senyummu di pagi hari. Jangan pernah bilang menyerah, Camu Camu siap hibur diri! 😊",
    "Beli seblak kerupuknya banyak, dimakan pas lagi hujan. Camu Camu emang paling enak, asupan sehat gak pake beban! 🥗",
    "Main skateboard jatuh melulu, tapi tetep gaya nomor satu. Camu Camu emang paling seru, temen setia tiap waktu! 🛹",
    "Ke konser pake lightstick, jangan lupa bawa harapan. Camu Camu emang paling otentik, rasanya juara di tiap suapan! 👑",
    "Nonton konser Tulus di Jakarta, nangis-nangis bareng kawan. Sekali gigit seribu cerita, Camu Camu emang idaman! 🤩",
    "Mancing ikan dapetnya hiu, kagetnya bukan main. Camu Camu emang paling ILY, bikin kamu gak mau pindah ke lain! 🫶"
];
