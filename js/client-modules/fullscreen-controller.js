class FullscreenController {
    constructor() {
        this.toggleBtn = document.getElementById('toggleFullscreenBtn');
        this.lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.FULLSCREEN || 'renderedOutputFullscreen';
        this.init();
    }
    
    init() {
        if (!this.toggleBtn) return;
        this.toggleBtn.addEventListener('click', () => this.toggle());
        
        document.addEventListener('fullscreenchange', () => this.updateButtonText());
        document.addEventListener('webkitfullscreenchange', () => this.updateButtonText());
        document.addEventListener('mozfullscreenchange', () => this.updateButtonText());
        document.addEventListener('msfullscreenchange', () => this.updateButtonText());
        
        this.updateButtonText();
    }
    
    toggle() {
        if (this.isFullscreen()) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }
    
    isFullscreen() {
        return !!(document.fullscreenElement || 
                 document.webkitFullscreenElement || 
                 document.mozFullScreenElement || 
                 document.msFullscreenElement);
    }
    
    enterFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }
    
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    
    updateButtonText() {
        if (this.isFullscreen()) {
            this.toggleBtn.textContent = 'Exit Fullscreen';
            this.toggleBtn.title = 'Exit fullscreen mode (F11)';
        } else {
            this.toggleBtn.textContent = 'Fullscreen';
            this.toggleBtn.title = 'Enter fullscreen mode (F11)';
        }
    }
}