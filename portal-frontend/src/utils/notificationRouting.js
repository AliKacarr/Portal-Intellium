// Bildirim tiplerini Dashboard'daki sayfa anahtarlarına (route key) eşleyen yapı
// Sol taraf: Backend'den gelen 'type' (küçük harfe çevrilmiş hali)
// Sağ taraf: AppRouter.js içindeki 'path' (route)
const notificationRouteMap = {
    project: 'projectList',
    ticket: 'tickets',
    
    // 🔥 GÜNCELLENDİ: Varsayılan olarak 'İzin Taleplerim' sayfasına gitsin
    permission: 'my-requests', 
    
    time: 'holidays',         // İzin Takvimi
    alert: 'notification',
    birthday: 'my-profile',   // Doğum günü -> Profilim
    health: 'healthInfo',     // Sağlık -> Sağlık Bilgileri
    insurance: 'healthInfo',  // Sigorta -> Sağlık Bilgileri
    military: 'personalInfo', // Askerlik -> Kişisel Bilgiler
    
    // ✅ YENİ EKLENEN: Scrum Board Rotası
    scrumtask: 'scrum-board', // Backend 'scrumTask' yollar, burası 'scrumtask' olarak yakalar
    
    // AI Task Preview İçin
    aitaskpreview: 'scrum-board',

    // ✅ Masraf / Onay hatırlatma (Type normalize edilince küçük harf; örn. ExpenseReminder → expensereminder değil, backend "expensereminder" göndermeli)
    expense: 'my-expenses',
    expensereminder: 'my-expenses',
    expensereminder_admin: 'my-expenses',
    expenserequest: 'my-expenses',
    // ✅ Yeni masraf workflow bildirimleri
    expense_revision_requested: 'my-expenses',
    expense_rejected: 'my-expenses',
    expense_approved: 'my-expenses',

    news: 'news',
    news_comment: 'news',
    announcement: 'announcements',
    poll: 'polls',

    // Varsayılan Zimmet Rotası: Kullanıcının kendi talepleri
    debit: 'my-assets-requests',   

    // Özel Rota: Onay Sayfası (Router'da tanımlı olmalı)
    approvalProcess: 'approvalProcess', 

    defaultType: 'notification',
};

// Yardımcı Fonksiyon: Bildirim tipini normalize et (Küçük harf ve güvenli kontrol)
const normalizeNotificationCategory = (type) => {
    if (!type) return 'defaultType';
    const lowerType = type.toLowerCase().trim();
    
    // Eğer map içinde bu tip varsa onu döndür, yoksa default döndür
    return Object.keys(notificationRouteMap).includes(lowerType) 
        ? lowerType 
        : 'defaultType';
};

// Yardımcı Fonksiyon: Bildirim objesinden ReferenceId'yi güvenli bir şekilde çıkar
const extractReferenceId = (notification) => {
    const value =
      notification.referenceId ||
      notification.ReferenceId ||
      notification.referenceID ||
      notification.ReferenceID;
    
    if (value === undefined || value === null) return null;
    
    const asString = String(value).trim();
    return asString.length ? asString : null;
};

// --- ANA FONKSİYON ---
// Bildirim objesini alır -> { path, deepLinkId } döner.
export const buildNotificationDeepLink = (notification) => {
    // 1. Tipi normalize et (Örn: 'permission', 'debit', 'scrumtask' vb.)
    const category = normalizeNotificationCategory(notification.type || notification.Type);
    const title = (notification.title || notification.Title || '').toLowerCase();

    // 2. Map'ten varsayılan sayfayı bul
    let path = notificationRouteMap[category] || notificationRouteMap.defaultType;

    // --- 🔥 ÖZEL KURAL: İZİN YÖNETİMİ 🔥 ---
    if (category === 'permission') {
        // Eğer başlıkta "başvuru" geçiyorsa -> Yönetici Onay Sayfasına
        if (title.includes('başvuru')) {
            path = 'approvalProcess';
        }
        // "Onaylandı", "Reddedildi" gibi durumlarda map'teki varsayılan ('my-requests') kalır.
    }

    // --- 🔥 ÖZEL KURAL: ZİMMET YÖNETİMİ 🔥 ---
    if (category === 'debit') {
        // Eğer başlıkta "yeni zimmet talebi" geçiyorsa -> Admin/Worker gelen talepler sayfasına
        if (title.includes('yeni zimmet talebi')) {
            path = 'incoming-requests'; 
        }
        // Diğer durumlar (Onaylandı/Reddedildi) yukarıdaki varsayılan 'my-assets-requests'e gider.
    }

    // 3. Varsa Reference ID'yi çek
    let deepLinkId = extractReferenceId(notification);

    // --- AI TASK PREVIEW İÇİN ÖZEL DEEPLINK ---
    if (category === 'aitaskpreview') {
        deepLinkId = deepLinkId ? `autolist-${deepLinkId}` : 'autolist';
    }

    return {
        path,       // Gidilecek sayfa (route)
        deepLinkId, // Açılacak kayıt ID'si (Task ID vb.)
    };
};