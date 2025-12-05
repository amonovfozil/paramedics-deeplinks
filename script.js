// Asosiy sahifa yopilayotganda, iframe da app ochilmoqda
const iframe = document.createElement('iframe');
iframe.style.display = 'none';
iframe.src = 'paramedicsdr://deeplink?referral_code=123';