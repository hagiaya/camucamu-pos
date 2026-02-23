// Menu data for Camu Camu Street Food
// Each item includes sell price, cost (HPP), and category

export const categories = [
    { id: 'makanan', name: 'Makanan', icon: '🍟', color: '#D32F2F' },
    { id: 'minuman', name: 'Minuman', icon: '🥤', color: '#2E7D32' },
];

export const menuItems = [
    {
        id: 1,
        name: 'Banana Roll',
        category: 'makanan',
        price: 15000,
        cost: 5000,
        description: 'Pisang raja gulung renyah dengan topping coklat lumer dan keju parut',
        image: '/assets/menu/banana_roll.png',
        popular: true,
    },
    {
        id: 2,
        name: 'French Fries',
        category: 'makanan',
        price: 12000,
        cost: 4000,
        description: 'Kentang goreng gurih nan renyah dengan bumbu spesial',
        image: '/assets/menu/french_fries.png',
        popular: true,
    },
    {
        id: 3,
        name: 'Ice Milo',
        category: 'minuman',
        price: 10000,
        cost: 3500,
        description: 'Minuman milo dingin dengan taburan bubuk milo melimpah di atasnya',
        image: '/assets/menu/ice_milo.png',
        popular: true,
    },
    {
        id: 4,
        name: 'Fansus (Fanta Susu)',
        category: 'minuman',
        price: 8000,
        cost: 2500,
        description: 'Kesegaran fanta merah berpadu dengan manisnya susu kental manis',
        image: '/assets/menu/fansus.png',
        popular: false,
    },
    {
        id: 5,
        name: 'Mojito Drink',
        category: 'minuman',
        price: 12000,
        cost: 4000,
        description: 'Minuman segar dengan perpaduan jeruk nipis, daun mint, dan soda',
        image: '/assets/menu/mojito.png',
        popular: false,
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

