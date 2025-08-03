class MainPageThemeController {
    constructor() {
        this.body = document.body;
        this.toggleBtn = document.getElementById('themeToggleBtn');
        this.darkClass = 'dark-theme';
        this.highContrastClass = 'high-contrast-theme';
        this.lsKey = 'renderedOutputTheme';
        this.init();
    }
    
    init() {
        if (!this.toggleBtn) return;
        this.toggleBtn.addEventListener('click', () => this.toggle());
        
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.toggle();
            }
        });
        
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        this.applyTheme(localStorage.getItem(this.lsKey) || prefersDark);
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem(this.lsKey)) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    applyTheme(theme) {
        this.body.classList.remove(this.darkClass, this.highContrastClass);
        if (theme === 'dark') {
            this.body.classList.add(this.darkClass);
            this.toggleBtn.textContent = 'High Contrast';
        } else if (theme === 'high-contrast') {
            this.body.classList.add(this.highContrastClass);
            this.toggleBtn.textContent = 'Light Theme';
        } else {
            this.toggleBtn.textContent = 'Dark Theme';
        }
        localStorage.setItem(this.lsKey, theme);
    }
    
    toggle() {
        const classList = this.body.classList;
        const current = classList.contains(this.highContrastClass) ? 'high-contrast' : 
                       (classList.contains(this.darkClass) ? 'dark' : 'light');
        const next = current === 'light' ? 'dark' : 
                    (current === 'dark' ? 'high-contrast' : 'light');
        this.applyTheme(next);
    }
}