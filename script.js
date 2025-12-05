// Store WEB ga redirect bo'lganda:
state.shouldCloseBrowser = false; // Browser YOPILMASIN

// Android da birinchi martani aniqlash:
if (state.platform === 'android') {
    const lastSession = localStorage.getItem('last_android_session');
    if (lastSession) {
        state.shouldCloseBrowser = false; // Keyingi marta yopilmasin
    }
}

state.sessionId = Date.now() + Math.random().toString(36).substr(2, 9);
localStorage.setItem('last_android_session', state.sessionId);

// Agar store app ochilmasa, darhol web ga o'tish
if (!isStoreAppAvailable()) {
    redirectToStoreWeb();
    return;
}

// User browser ga qaytib kelsa, store web ga yo'naltirish
if (document.visibilityState === 'visible') {
    state.shouldCloseBrowser = false;
    redirectToStoreWeb();
}