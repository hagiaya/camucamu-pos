import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const newOrder = {
        id: `ORD-${Date.now()}`,
        items: [{ id: 1, name: "Test", price: 10000, qty: 1 }],
        total: 10000,
        totalCost: 5000,
        profit: 5000,
        customerName: 'Walk-in',
        customerPhone: '',
        paymentMethod: 'cash',
        cashReceived: 10000,
        change: 0,
        type: 'dine-in',
        status: 'proses',
        createdAt: new Date().toISOString()
    };

    console.log("Inserting:", newOrder);
    const { data, error } = await supabase.from('transactions').upsert(newOrder);

    if (error) {
        console.error("Supabase Error:", error);
    } else {
        console.log("Success:", data);
    }
}

testInsert();
