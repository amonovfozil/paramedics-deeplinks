// Configuration
const CONFIG = {
    // App Information
    APP_NAME: 'Paramedics Dr',
    APP_SCHEME: 'paramedicsdr://deeplink',

    // Store Links
    PLAY_STORE: 'https://play.google.com/store/apps/details?id=com.paramedics.paramedicsuz_doctor',
    APP_STORE: 'https://apps.apple.com/uz/app/paramedics-dr/id6469779193',

    // Timing (milliseconds)
    INITIAL_DELAY: 800,
    APP_OPEN_TIMEOUT: 500,
    STORE_REDIRECT_TIMEOUT: 1500,
    TOTAL_TIMEOUT: 2500,

    // Storage
    STORAGE_KEY: 'paramedics_referral',
    STORAGE_EXPIRY_DAYS: 7,

    // Debug
    DEBUG: false
};

// DOM Elements
const elements = {
    // Referral elements
    referralCard: document.getElementById('referralCard'),
    referrerRow: document.getElementById('referrerRow'),
    codeRow: document.getElementById('codeRow'),
    campaignRow: document.getElementById('campaignRow'),
    referrerName: document.getElementById('referrerName'),
    referralCode: document.getElementById('referralCode'),
    campaignName: document.getElementById('campaignName'),

    // Loading elements
    loadingSection: document.getElementById('loadingSection'),
    progressBar: document.getElementById('progressBar'),
    statusText: document.getElementById('statusText'),

    // Store elements
    storeSection: document.getElementById('storeSection')
};

// State
let state = {
    platform: null,
    referralData: null,
    appOpened: false,
    redirectStarted: false
};

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Detect user platform
 */
function detectPlatform() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;

    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        return 'ios';
    } else if (/android/i.test(ua)) {
        return 'android';
    } else {
        return 'desktop';
    }
}

/**
 * Get URL parameters
 */
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};

    // Extract all parameters
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }

    // Always expect referral_code
    if (!params.referral_code) {
        params.referral_code = 'N/A';
    }

    return params;
}

/**
 * Save data to storage
 */
function saveToStorage(data) {
    try {
        const storageData = {
            data: data,
            timestamp: Date.now(),
            expires: Date.now() + (CONFIG.STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
            platform: state.platform,
            url: window.location.href
        };

        // LocalStorage
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(storageData));

        // SessionStorage (for immediate access)
        sessionStorage.setItem('current_referral', JSON.stringify(data));

        // Cookies (for backup)
        const expires = new Date(storageData.expires).toUTCString();
        document.cookie = `${CONFIG.STORAGE_KEY}=${encodeURIComponent(JSON.stringify(storageData))}; expires=${expires}; path=/; samesite=lax`;

        log('Data saved to storage');
        return true;

    } catch (error) {
        logError('Storage save error:', error);
        return false;
    }
}

/**
 * Update UI status
 */
function updateStatus(message, isError = false) {
    if (elements.statusText) {
        elements.statusText.textContent = message;
        elements.statusText.style.color = isError ? '#ea4335' : '';
    }
    log(message);
}

/**
 * Show referral information
 */
function showReferralInfo(data) {
    if (!data) return;

    // Show referrer name
    if (data.user_name) {
        elements.referrerName.textContent = data.user_name;
        elements.referrerRow.style.display = 'flex';
    } else if (data.user_id) {
        elements.referrerName.textContent = `User ${data.user_id}`;
        elements.referrerRow.style.display = 'flex';
    } else {
        elements.referrerRow.style.display = 'none';
    }

    // Show referral code
    if (data.referral_code && data.referral_code !== 'N/A') {
        elements.referralCode.textContent = data.referral_code;
        elements.codeRow.style.display = 'flex';
    } else {
        elements.codeRow.style.display = 'none';
    }

    // Show campaign
    if (data.campaign) {
        elements.campaignName.textContent = data.campaign;
        elements.campaignRow.style.display = 'flex';
    } else {
        elements.campaignRow.style.display = 'none';
    }

    // Show card if any data exists
    if (data.user_name || data.user_id || (data.referral_code && data.referral_code !== 'N/A') || data.campaign) {
        elements.referralCard.style.display = 'block';
    }
}

/**
 * Show loading section
 */
function showLoading() {
    elements.loadingSection.style.display = 'block';
    elements.storeSection.style.display = 'none';
}

/**
 * Show store section
 */
function showStoreSection() {
    elements.loadingSection.style.display = 'none';
    elements.storeSection.style.display = 'block';
}

// ====================
// APP OPENING LOGIC
// ====================

/**
 * Try to open iOS app
 */
function openIOSApp(params) {
    updateStatus('Opening iOS app...');

    // Method 1: Universal Link
    let universalLink = 'https://paramedics-deeplinks.vercel.app/app-link';
    if (params && Object.keys(params).length > 0) {
        const query = new URLSearchParams(params).toString();
        universalLink += '?' + query;
    }

    window.location.href = universalLink;

    // Method 2: URL Scheme (fallback)
    setTimeout(() => {
        if (!state.appOpened) {
            updateStatus('Trying URL scheme...');
            let schemeLink = CONFIG.APP_SCHEME;
            if (params && Object.keys(params).length > 0) {
                const query = new URLSearchParams(params).toString();
                schemeLink += '?' + query;
            }
            window.location.href = schemeLink;
        }
    }, CONFIG.APP_OPEN_TIMEOUT);

    // Method 3: App Store (final fallback)
    setTimeout(() => {
        if (!state.appOpened) {
            updateStatus('Redirecting to App Store...');
            window.location.href = CONFIG.APP_STORE;
        }
    }, CONFIG.STORE_REDIRECT_TIMEOUT);
}

/**
 * Try to open Android app
 */
function openAndroidApp(params) {
    updateStatus('Opening Android app...');

    // Method 1: Intent
    let intentLink = 'intent://deeplink';
    if (params && Object.keys(params).length > 0) {
        const query = new URLSearchParams(params).toString();
        intentLink += '?' + query;
    }
    intentLink += '#Intent;scheme=paramedicsdr;package=com.paramedics.paramedicsuz_doctor;end';

    window.location.href = intentLink;

    // Method 2: URL Scheme (fallback)
    setTimeout(() => {
        if (!state.appOpened) {
            updateStatus('Trying URL scheme...');
            let schemeLink = CONFIG.APP_SCHEME;
            if (params && Object.keys(params).length > 0) {
                const query = new URLSearchParams(params).toString();
                schemeLink += '?' + query;
            }
            window.location.href = schemeLink;
        }
    }, CONFIG.APP_OPEN_TIMEOUT);

    // Method 3: Play Store (final fallback)
    setTimeout(() => {
        if (!state.appOpened) {
            updateStatus('Redirecting to Google Play...');
            window.location.href = CONFIG.PLAY_STORE;
        }
    }, CONFIG.STORE_REDIRECT_TIMEOUT);
}

/**
 * Handle desktop platform
 */
function handleDesktop(params) {
    updateStatus('Please open this link on your mobile device');
    showStoreSection();

    // Auto-show store buttons after delay
    setTimeout(() => {
        showStoreSection();
    }, 3000);
}

// ====================
// EVENT HANDLERS
// ====================

/**
 * Handle app blur (when app opens)
 */
function onAppBlur() {
    state.appOpened = true;
    log('App opened (window blurred)');

    // Update status if still visible
    if (!document.hidden) {
        updateStatus('App opened successfully!');
    }
}

/**
 * Handle visibility change
 */
function onVisibilityChange() {
    if (document.visibilityState === 'visible' && !state.appOpened) {
        // User returned to browser - app didn't open
        log('User returned - app not opened');

        setTimeout(() => {
            if (!state.redirectStarted) {
                updateStatus('App not detected. Showing download options...');
                showStoreSection();
            }
        }, 1000);
    }
}

/**
 * Handle page before unload
 */
function onBeforeUnload() {
    state.appOpened = true;
    log('Page unloading - assuming app opened');
}

// ====================
// MAIN INITIALIZATION
// ====================

/**
 * Initialize the deep link handler
 */
function init() {
    try {
        // Detect platform
        state.platform = detectPlatform();

        // Get URL parameters
        state.referralData = getUrlParams();

        // Show referral information
        showReferralInfo(state.referralData);

        // Save to storage
        saveToStorage(state.referralData);

        log(`Platform: ${state.platform}`);
        log(`Referral data:`, state.referralData);

        // Show loading state
        showLoading();

        // Set up event listeners
        window.addEventListener('blur', onAppBlur);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('beforeunload', onBeforeUnload);

        // Start redirect process after delay
        setTimeout(startRedirect, CONFIG.INITIAL_DELAY);

        // Total timeout handler
        setTimeout(() => {
            if (!state.appOpened && !state.redirectStarted) {
                updateStatus('Timeout - showing download options');
                showStoreSection();
            }
        }, CONFIG.TOTAL_TIMEOUT);

    } catch (error) {
        logError('Initialization error:', error);
        updateStatus('Error initializing. Please try again.', true);
        showStoreSection();
    }
}

/**
 * Start the redirect process
 */
function startRedirect() {
    if (state.redirectStarted) return;
    state.redirectStarted = true;

    updateStatus(`Detected: ${state.platform.toUpperCase()}`);

    // Platform-specific handling
    switch (state.platform) {
        case 'ios':
            openIOSApp(state.referralData);
            break;

        case 'android':
            openAndroidApp(state.referralData);
            break;

        case 'desktop':
            handleDesktop(state.referralData);
            break;

        default:
            updateStatus('Redirecting to store...');
            window.location.href = CONFIG.PLAY_STORE;
    }
}

/**
 * Log messages (debug mode only)
 */
function log(...args) {
    if (CONFIG.DEBUG) {
        console.log('[DeepLink]', ...args);
    }
}

/**
 * Log errors
 */
function logError(...args) {
    console.error('[DeepLink Error]', ...args);
}

// ====================
// EXPORT FUNCTIONS
// ====================

/**
 * Manually show store buttons (for manual trigger)
 */
window.showStoreButtons = function () {
    showStoreSection();
    return false;
};

/**
 * Copy referral code to clipboard
 */
window.copyReferralCode = function () {
    if (state.referralData && state.referralData.referral_code) {
        navigator.clipboard.writeText(state.referralData.referral_code)
            .then(() => {
                updateStatus('Copied to clipboard!');
            })
            .catch(err => {
                logError('Copy failed:', err);
            });
    }
    return false;
};

// ====================
// START APPLICATION
// ====================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Handle page load errors
window.addEventListener('error', function (event) {
    logError('Page error:', event.error);
});

// Handle unhandled rejections
window.addEventListener('unhandledrejection', function (event) {
    logError('Unhandled rejection:', event.reason);
});