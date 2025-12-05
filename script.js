// script.js
const state = {
    platform: null,
    shouldCloseBrowser: false,
    sessionId: null
};

// Platformani aniqlash
function detectPlatform() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/android/i.test(userAgent)) {
        return 'android';
    }
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return 'ios';
    }
    return 'web';
}

// Store app mavjudligini tekshirish (Android)
function isStoreAppAvailable() {
    // Bu funksiya Store app mavjudligini tekshiradi
    // Haqiqiy loyihada Store appning package name/scheme bo'yicha tekshirish kerak
    return false; // Hozircha har doim false qaytaradi
}

// Store/web sahifasiga yo'naltirish
function redirectToStoreWeb() {
    const platform = state.platform;

    if (platform === 'android') {
        // Play Store link
        window.location.href = 'https://play.google.com/store/apps/details?id=com.example.paramedics';
    } else if (platform === 'ios') {
        // App Store link
        window.location.href = 'https://apps.apple.com/app/id1234567890';
    } else {
        // Web versiya
        window.location.href = 'https://paramedics-web.com';
    }
}

// Deep link orqali app ochish
function openAppViaDeepLink() {
    const platform = state.platform;

    if (platform === 'android') {
        // Android deep link
        const deepLink = 'paramedics://open';
        window.location.href = deepLink;

        // Agar app ochilmasa, Store ga yo'naltiradi
        setTimeout(() => {
            if (document.hasFocus && !document.hasFocus()) {
                // App ochildi
                state.shouldCloseBrowser = true;
            } else {
                // App ochilmadi, Store ga o't
                redirectToStoreWeb();
            }
        }, 2500);

    } else if (platform === 'ios') {
        // iOS universal link
        window.location.href = 'https://paramedics.app.link/open';

        setTimeout(() => {
            redirectToStoreWeb();
        }, 2500);
    }
}

// Asosiy ishni boshlash
function init() {
    state.platform = detectPlatform();
    console.log('Platform detected:', state.platform);

    // Android uchun session boshqaruvi
    if (state.platform === 'android') {
        const lastSession = localStorage.getItem('last_android_session');

        if (lastSession) {
            state.shouldCloseBrowser = false; // Keyingi marta yopilmasin
        }

        state.sessionId = Date.now() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('last_android_session', state.sessionId);
    }

    // Asosiy logika
    if (state.platform === 'android' || state.platform === 'ios') {
        // Mobile qurilma - app ochishga urinish
        openAppViaDeepLink();
    } else {
        // Web brauzer - web sahifaga o'tish
        redirectToStoreWeb();
    }
}

// DOM yuklanganda ishga tushirish
document.addEventListener('DOMContentLoaded', init);

// Brauzer yopilishini nazorat qilish
window.addEventListener('beforeunload', function (e) {
    if (state.shouldCloseBrowser) {
        // App ochilganda brauzerni yopish
        setTimeout(() => {
            window.close();
        }, 100);
    }
});

// Visibility change (brauzerga qaytish)
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
        // User brauzerga qaytdi - Store/web ga yo'naltirish
        setTimeout(() => {
            redirectToStoreWeb();
        }, 500);
    }
});