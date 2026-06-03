const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DEBTS = [
  {
    name: "Test borç",
    monthlyPayment: 10000,
    dueDate: "2026-06-05"
  },
  {
    name: "Test2",
    monthlyPayment: 2045,
    dueDate: "2026-06-06"
  },
  {
    name: "Test3",
    monthlyPayment: 5845,
    dueDate: "2026-06-06"
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
        console.log(data.ok ? '✅ Bildirim gönderildi' : '❌ Hata: ' + data.description);
        return data.ok;
    } catch (error) {
        console.log('❌ Bağlantı hatası:', error.message);
        return false;
    }
}

async function checkAllDebts() {
    console.log('🔍 Borçlar kontrol ediliyor...');
    console.log('📅 Tarih:', new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }));
    
    if (DEBTS.length === 0) {
        console.log('⚠️ Henüz borç eklenmemiş.');
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let notificationSent = false;
    
    for (const debt of DEBTS) {
        const dueDate = new Date(debt.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        console.log(`📋 ${debt.name}: ${daysUntilDue} gün (Vade: ${debt.dueDate})`);
        
        let message = '';
        let shouldNotify = false;
        
        if (daysUntilDue === 0) {
            message = `💰 <b>BUGÜN ÖDEME GÜNÜ!</b>\n\nBorç: ${debt.name}\nTutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\n\n🔴 Hemen ödeme yapmayı unutma!`;
            shouldNotify = true;
        } else if (daysUntilDue === 1) {
            message = `🔴 <b>YARIN SON GÜN!</b>\n\nBorç: ${debt.name}\nTutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\nSon Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n⚠️ Ödemeyi hazırla!`;
            shouldNotify = true;
        } else if (daysUntilDue === 3) {
            message = `🔶 <b>3 GÜN KALDI</b>\n\nBorç: ${debt.name}\nTutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\nSon Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n💡 Hazırlık yapmaya başla!`;
            shouldNotify = true;
        } else if (daysUntilDue === 7) {
            message = `⚠️ <b>1 HAFTA KALDI</b>\n\nBorç: ${debt.name}\nTutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\nSon Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n📅 Bütçeni ayarla.`;
            shouldNotify = true;
        } else if (daysUntilDue < 0) {
            message = `❌ <b>GECİKTİN!</b>\n\nBorç: ${debt.name}\nTutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\nGecikme: ${Math.abs(daysUntilDue)} gün\n\n🚨 Acil ödeme yap!`;
            shouldNotify = true;
        }
        
        if (shouldNotify) {
            console.log(`📤 Bildirim gönderiliyor: ${debt.name} (${daysUntilDue} gün)`);
            const success = await sendTelegramMessage(message);
            if (success) {
                notificationSent = true;
                console.log('✅ Gönderildi!');
            } else {
                console.log('❌ Gönderilemedi!');
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    if (!notificationSent) {
        console.log('✅ Yaklaşan ödeme yok, bildirim gönderilmedi.');
    }
    
    console.log('✅ Kontrol tamamlandı.');
}

checkAllDebts();