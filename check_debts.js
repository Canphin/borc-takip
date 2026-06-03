const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DEBTS = [
  {
    name: "1",
    monthlyPayment: 15,
    dueDate: "2026-06-05"
  },
  {
    name: "2",
    monthlyPayment: 1000,
    dueDate: "2026-06-06"
  },
  {
    name: "3",
    monthlyPayment: 2000,
    dueDate: "2026-06-07"
  },
  {
    name: "4",
    monthlyPayment: 1500,
    dueDate: "2026-06-07"
  },
  {
    name: "5",
    monthlyPayment: 15000,
    dueDate: "2026-06-11"
  }
];

async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            console.log('✅ Bildirim gönderildi');
            return true;
        } else {
            console.log('❌ Telegram hatası: ' + data.description);
            return false;
        }
    } catch (error) {
        console.log('❌ Bağlantı hatası:', error.message);
        return false;
    }
}

function getStatusEmoji(days) {
    if (days < 0) return '❌';
    if (days === 0) return '💰';
    if (days === 1) return '🔴';
    if (days === 2) return '🟠';
    if (days === 3) return '🔶';
    if (days <= 5) return '🟡';
    if (days <= 7) return '⚠️';
    return '🟢';
}

function getStatusText(days) {
    if (days < 0) return `${Math.abs(days)} gün GECİKTİ!`;
    if (days === 0) return 'BUGÜN!';
    if (days === 1) return 'YARIN!';
    return `${days} gün kaldı`;
}

async function checkAllDebts() {
    console.log('🔍 Borçlar kontrol ediliyor...');
    console.log('📅 Tarih:', new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }));
    console.log('📊 Toplam borç sayısı:', DEBTS.length);
    
    if (DEBTS.length === 0) {
        console.log('⚠️ Henüz borç eklenmemiş.');
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const notifications = [];
    
    for (const debt of DEBTS) {
        const dueDate = new Date(debt.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        console.log(`📋 ${debt.name}: ${daysUntilDue} gün (Vade: ${debt.dueDate})`);
        
        if (daysUntilDue <= 7) {
            notifications.push({
                name: debt.name,
                amount: debt.monthlyPayment,
                days: daysUntilDue,
                date: debt.dueDate
            });
            console.log(`   ✅ Bildirim listesine eklendi`);
        } else {
            console.log(`   ⏭️ 7 günden fazla, atlandı`);
        }
    }
    
    if (notifications.length === 0) {
        console.log('✅ Yaklaşan ödeme yok.');
        return;
    }
    
    notifications.sort((a, b) => a.days - b.days);
    
    // TEK MESAJ
    let message = '';
    
    if (notifications.length === 1) {
        const n = notifications[0];
        message = `${getStatusEmoji(n.days)} <b>${getStatusText(n.days)}</b>\n\n` +
                 `📌 ${n.name}\n` +
                 `💵 ${n.amount.toLocaleString('tr-TR')} TL\n` +
                 `📅 ${new Date(n.date).toLocaleDateString('tr-TR')}`;
    } else {
        message = `📊 <b>BORÇ ÖZETİ</b>\n` +
                 `📅 ${today.toLocaleDateString('tr-TR')}\n` +
                 `━━━━━━━━━━━━━━━\n\n`;
        
        for (const n of notifications) {
            message += `${getStatusEmoji(n.days)} <b>${n.name}</b>\n` +
                      `   💵 ${n.amount.toLocaleString('tr-TR')} TL | ${getStatusText(n.days)}\n\n`;
        }
        
        const total = notifications.reduce((sum, n) => sum + n.amount, 0);
        message += `━━━━━━━━━━━━━━━\n` +
                  `💰 <b>Toplam: ${total.toLocaleString('tr-TR')} TL</b>\n` +
                  `📋 ${notifications.length} adet ödeme`;
    }
    
    console.log(`\n📤 TEK MESAJ gönderiliyor (${notifications.length} borç)...`);
    const success = await sendTelegramMessage(message);
    
    if (success) {
        console.log(`✅ Başarılı! ${notifications.length} borç tek mesajda iletildi.`);
    } else {
        console.log(`❌ Başarısız!`);
    }
    
    console.log('✅ Kontrol tamamlandı.');
}

checkAllDebts();
