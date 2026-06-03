const TELEGRAM_TOKEN = '8498099085:AAEpI-uWC3RH6s_9IiY2_MyJVcImHhi_0FA';
const TELEGRAM_CHAT_ID = '6931158642';

const DEBTS = [];

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
    console.log('📅 Tarih:', new Date().toLocaleString('tr-TR'));
    
    if (DEBTS.length === 0) {
        console.log('⚠️ Henüz borç eklenmemiş.');
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const debt of DEBTS) {
        const dueDate = new Date(debt.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        let message = '';
        let shouldNotify = false;
        
        if (daysUntilDue === 0) {
            message = `💰 <b>BUGÜN ÖDEME GÜNÜ!</b>\n\nBorç: ${debt.name}\nTutar: ${debt.monthlyPayment} TL\n\n🔴 Hemen ödeme yapmayı unutma!`;
            shouldNotify = true;
        } else if (daysUntilDue === 1) {
            message = `🔴 <b>YARIN SON GÜN!</b>\n\nBorç: ${debt.name}\nTutar: ${debt.monthlyPayment} TL\n\n⚠️ Ödemeyi hazırla!`;
            shouldNotify = true;
        } else if (daysUntilDue === 3) {
            message = `🔶 <b>3 GÜN KALDI</b>\n\nBorç: ${debt.name}\nTutar: ${debt.monthlyPayment} TL\nSon Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n💡 Hazırlık yapmaya başla!`;
            shouldNotify = true;
        } else if (daysUntilDue === 7) {
            message = `⚠️ <b>1 HAFTA KALDI</b>\n\nBorç: ${debt.name}\nTutar: ${debt.monthlyPayment} TL\nSon Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n📅 Bütçeni ayarla.`;
            shouldNotify = true;
        } else if (daysUntilDue < 0) {
            message = `❌ <b>GECİKTİN!</b>\n\nBorç: ${debt.name}\nTutar: ${debt.monthlyPayment} TL\nGecikme: ${Math.abs(daysUntilDue)} gün\n\n🚨 Acil ödeme yap!`;
            shouldNotify = true;
        }
        
        if (shouldNotify) {
            console.log(`📤 Bildirim: ${debt.name} (${daysUntilDue} gün)`);
            await sendTelegramMessage(message);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('✅ Kontrol tamamlandı.');
}

checkAllDebts();
