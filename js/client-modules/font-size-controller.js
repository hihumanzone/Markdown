class FontSizeController {
    constructor(body) {
        this.body = body; 
        this.increaseBtn = document.getElementById('increaseFontBtn');
        this.decreaseBtn = document.getElementById('decreaseFontBtn'); 
        this.resetBtn = document.getElementById('resetFontBtn');
        this.display = document.getElementById('currentFontSizeDisplay'); 
        this.lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.FONT_SIZE;
        this.config = window.__APP_DATA__.config.FONT_SIZE;
        this.currentPercent = parseInt(localStorage.getItem(this.lsKey) || this.config.DEFAULT, 10);
        this.init();
    }
    
    init() {
        if (!this.increaseBtn || !this.decreaseBtn || !this.resetBtn || !this.display) return;
        this.increaseBtn.addEventListener('click', () => this.adjust(this.config.STEP));
        this.decreaseBtn.addEventListener('click', () => this.adjust(-this.config.STEP));
        this.resetBtn.addEventListener('click', () => this.reset());
        this.applyFontSize(this.currentPercent);
    }
    
    adjust(step) { 
        this.applyFontSize(this.currentPercent + step); 
    }
    
    reset() { 
        this.applyFontSize(this.config.DEFAULT); 
    }
    
    applyFontSize(percent) {
        this.currentPercent = Math.max(this.config.MIN, Math.min(this.config.MAX, percent));
        this.body.style.fontSize = `${(this.config.BASE * this.currentPercent) / 100}px`;
        this.display.textContent = `${this.currentPercent}%`;
        localStorage.setItem(this.lsKey, this.currentPercent);
    }
}