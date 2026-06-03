const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DEBTS = [
  { name: "1", monthlyPayment: 10000, dueDate: "2026-06-05" },
  { name: "2", monthlyPayment: 12000, dueDate: "2026-06-06" },
  { name: "3", monthlyPayment: 14000, dueDate: "2026-06-07" },
  { name: "4", monthlyPayment: 10000, dueDate: "2026-06-08" }
];

async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' })
        });
        const data = await response.json();
        if (data.ok) { console.log('✅ Gönderildi'); return true; }
        else { console.log('❌ Hata: ' + data.description); return false; }
    } catch (error) { console.log('❌ Bağlantı hatası'); return false; }
}

function emoji(d) { if(d<0)return'❌'; if(d===0)return'💰'; if(d===1)return'🔴'; if(d===2)return'🟠'; if(d===3)return'🔶'; if(d<=5)return'🟡'; return'⚠️'; }
function text(d) { if(d<0)return Math.abs(d)+' gün GECİKTİ!'; if(d===0)return'BUGÜN!'; if(d===1)return'YARIN!'; return d+' gün kaldı'; }

async function checkAllDebts() {
    console.log('🔍 Kontrol başladı');
    const today = new Date(); today.setHours(0,0,0,0);
    const list = [];
    
    for (const d of DEBTS) {
        const due = new Date(d.dueDate); due.setHours(0,0,0,0);
        const days = Math.ceil((due - today) / (1000*60*60*24));
        console.log(`📋 ${d.name}: ${days} gün`);
        if (days <= 7) { list.push({...d, days, date: d.dueDate}); console.log('   ✅ Eklendi'); }
        else { console.log('   ⏭️ Atladı'); }
    }
    
    if (list.length === 0) { console.log('✅ Ödeme yok'); return; }
    list.sort((a,b) => a.days - b.days);
    
    let msg = `📊 <b>BORÇ ÖZETİ</b>\n📅 ${today.toLocaleDateString('tr-TR')}\n━━━━━━━━━━━━━━━\n\n`;
    let total = 0;
    
    for (const d of list) {
        msg += `${emoji(d.days)} <b>${d.name}</b>\n   💵 ${d.amount.toLocaleString('tr-TR')} TL | ${text(d.days)}\n\n`;
        total += d.amount;
    }
    
    msg += `━━━━━━━━━━━━━━━\n💰 <b>Toplam: ${total.toLocaleString('tr-TR')} TL</b>\n📋 ${list.length} adet ödeme`;
    
    console.log(`📤 TEK MESAJ (${list.length} borç)...`);
    await sendTelegramMessage(msg);
    console.log('✅ Tamamlandı');
}

checkAllDebts();
