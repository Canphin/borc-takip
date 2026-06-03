const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DEBTS = [
  {
    name: "🚗 Araba Kredisi",
    monthlyPayment: 4625,
    dueDate: "2026-06-10"
  },
  {
    name: "💳 Kredi Kartı",
    monthlyPayment: 2500,
    dueDate: "2026-06-06"
  },
  {
    name: "🏠 Kira",
    monthlyPayment: 3000,
    dueDate: "2026-06-04"
  }
];

// Yardımcı fonksiyon: Belirli süre bekleme
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
            
            // Rate limit hatasıysa 3 saniye bekle ve tekrar dene
            if (data.error_code === 429) {
                const retryAfter = (data.parameters && data.parameters.retry_after) || 3;
                console.log(`⏳ Rate limit! ${retryAfter} saniye bekleniyor...`);
                await sleep(retryAfter * 1000);
                
                // Tekrar dene
                console.log('🔄 Tekrar deneniyor...');
                const retryResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: message,
                        parse_mode: 'HTML'
                    })
                });
                
                const retryData = await retryResponse.json();
                if (retryData.ok) {
                    console.log('✅ İkinci denemede gönderildi');
                    return true;
                } else {
                    console.log('❌ İkinci deneme de başarısız: ' + retryData.description);
                    return false;
                }
            }
            
            return false;
        }
    } catch (error) {
        console.log('❌ Bağlantı hatası:', error.message);
        return false;
    }
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
    
    let notificationSent = 0;
    let notificationFailed = 0;
    let notificationSkipped = 0;
    
    for (const debt of DEBTS) {
        const dueDate = new Date(debt.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        console.log(`\n📋 ${debt.name}: ${daysUntilDue} gün (Vade: ${debt.dueDate})`);
        
        let message = '';
        let shouldNotify = false;
        
        // TÜM GÜNLER İÇİN BİLDİRİM (0-7 gün arası + gecikmeler)
        if (daysUntilDue < 0) {
            message = `❌ <b>GECİKTİN!</b>\n\n` +
                     `Borç: ${debt.name}\n` +
                     `Tutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\n` +
                     `Gecikme: ${Math.abs(daysUntilDue)} gün\n` +
                     `Vade: ${dueDate.toLocaleDateString('tr-TR')}\n\n` +
                     `🚨 Acil ödeme yap!`;
            shouldNotify = true;
        } else if (daysUntilDue === 0) {
            message = `💰 <b>BUGÜN ÖDEME GÜNÜ!</b>\n\n` +
                     `Borç: ${debt.name}\n` +
                     `Tutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\n\n` +
                     `🔴 Hemen ödeme yapmayı unutma!`;
            shouldNotify = true;
        } else if (daysUntilDue === 1) {
            message = `🔴 <b>YARIN SON GÜN!</b>\n\n` +
                     `Borç: ${debt.name}\n` +
                     `Tutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\n` +
                     `Son Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n` +
                     `⚠️ Ödemeyi hazırla!`;
            shouldNotify = true;
        } else if (daysUntilDue === 2) {
            message = `🟠 <b>2 GÜN KALDI</b>\n\n` +
                     `Borç: ${debt.name}\n` +
                     `Tutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\n` +
                     `Son Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n` +
                     `⏰ Çok az kaldı!`;
            shouldNotify = true;
        } else if (daysUntilDue === 3) {
            message = `🔶 <b>3 GÜN KALDI</b>\n\n` +
                     `Borç: ${debt.name}\n` +
                     `Tutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\n` +
                     `Son Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n` +
                     `💡 Hazırlık yapmaya başla!`;
            shouldNotify = true;
        } else if (daysUntilDue === 4) {
            message = `🟡 <b>4 GÜN KALDI</b>\n\n` +
                     `Borç: ${debt.name}\n` +
                     `Tutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\n` +
                     `Son Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n` +
                     `📅 Yaklaşıyor...`;
            shouldNotify = true;
        } else if (daysUntilDue === 5) {
            message = `🟡 <b>5 GÜN KALDI</b>\n\n` +
                     `Borç: ${debt.name}\n` +
                     `Tutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\n` +
                     `Son Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n` +
                     `💭 Bütçeni planlamaya başla.`;
            shouldNotify = true;
        } else if (daysUntilDue === 6) {
            message = `🟢 <b>6 GÜN KALDI</b>\n\n` +
                     `Borç: ${debt.name}\n` +
                     `Tutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\n` +
                     `Son Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n` +
                     `📋 Hatırlatma amaçlı.`;
            shouldNotify = true;
        } else if (daysUntilDue === 7) {
            message = `⚠️ <b>1 HAFTA KALDI</b>\n\n` +
                     `Borç: ${debt.name}\n` +
                     `Tutar: ${debt.monthlyPayment.toLocaleString('tr-TR')} TL\n` +
                     `Son Ödeme: ${dueDate.toLocaleDateString('tr-TR')}\n\n` +
                     `📅 Bütçeni ayarla.`;
            shouldNotify = true;
        }
        
        if (shouldNotify) {
            console.log(`📤 Bildirim gönderiliyor: ${debt.name} (${daysUntilDue} gün)`);
            const success = await sendTelegramMessage(message);
            
            if (success) {
                notificationSent++;
                console.log(`✅ Başarılı (${notificationSent}. bildirim)`);
            } else {
                notificationFailed++;
                console.log(`❌ Başarısız (${notificationFailed}. başarısız)`);
            }
            
            // HER BORÇTAN SONRA 3 SANİYE BEKLE (rate limit için)
            console.log('⏳ 3 saniye bekleniyor...');
            await sleep(3000);
        } else {
            notificationSkipped++;
            console.log(`⏭️ Atladı (${daysUntilDue} gün - bildirim aralığı dışında)`);
        }
    }
    
    console.log('\n📊 ÖZET:');
    console.log(`✅ Başarılı: ${notificationSent}`);
    console.log(`❌ Başarısız: ${notificationFailed}`);
    console.log(`⏭️ Atlanan: ${notificationSkipped}`);
    console.log(`📋 Toplam borç: ${DEBTS.length}`);
    console.log('✅ Kontrol tamamlandı.');
}

// Ana fonksiyonu çalıştır
checkAllDebts();
