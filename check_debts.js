const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DEBTS = [
  { name: "Deneme1", monthlyPayment: 4000, dueDate: "2026-06-05" },
  { name: "Deneme2", monthlyPayment: 5000, dueDate: "2026-06-06" },
  { name: "Deneme3", monthlyPayment: 6000, dueDate: "2026-06-05" },
  { name: "Deneme4", monthlyPayment: 9000, dueDate: "2026-06-08" },
  { name: "Deneme5", monthlyPayment: 5000, dueDate: "2026-06-09" },
  { name: "Deneme6", monthlyPayment: 5000, dueDate: "2026-06-09" }
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
    console.log('🔍 Borçlar kontrol ediliyor...');
    console.log('📅 Tarih:', new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }));
    console.log('📊 Toplam borç sayısı:', DEBTS.length);
    
    if (DEBTS.length === 0) { console.log('⚠️ Borç yok.'); return; }
    
    const today = new Date(); today.setHours(0,0,0,0);
    const notifications = [];
    
    for (const debt of DEBTS) {
        const dueDate = new Date(debt.dueDate); dueDate.setHours(0,0,0,0);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000*60*60*24));
        console.log(`📋 ${debt.name}: ${daysUntilDue} gün (Vade: ${debt.dueDate})`);
        
        if (daysUntilDue <= 7) {
            notifications.push({...debt, days: daysUntilDue, date: debt.dueDate});
            console.log('   ✅ Bildirim listesine eklendi');
        } else {
            console.log('   ⏭️ 7 günden fazla, atlandı');
        }
    }
    
    if (notifications.length === 0) { console.log('✅ Yaklaşan ödeme yok.'); return; }
    
    notifications.sort((a,b) => a.days - b.days);
    
    let message = `📊 <b>BORÇ ÖZETİ</b>\n📅 ${today.toLocaleDateString('tr-TR')}\n━━━━━━━━━━━━━━━\n\n`;
    let total = 0;
    
    for (const n of notifications) {
        message += `${emoji(n.days)} <b>${n.name}</b>\n   💵 ${n.monthlyPayment.toLocaleString('tr-TR')} TL | ${text(n.days)}\n\n`;
        total += n.monthlyPayment;
    }
    
    message += `━━━━━━━━━━━━━━━\n💰 <b>Toplam: ${total.toLocaleString('tr-TR')} TL</b>\n📋 ${notifications.length} adet ödeme`;
    
    console.log(`\n📤 TEK MESAJ gönderiliyor (${notifications.length} borç)...`);
    const success = await sendTelegramMessage(message);
    if (success) { console.log(`✅ Başarılı! ${notifications.length} borç tek mesajda iletildi.`); }
    else { console.log('❌ Başarısız!'); }
    
    console.log('✅ Kontrol tamamlandı.');
}

checkAllDebts();