class UIController {
    constructor() {
        this.body = document.querySelector('body.markdown-body');
        this.initializeControls();
        this.addGlobalKeydownListener();
    }
    
    initializeControls() {
        this.katexRenderer = new KatexRenderer();
        this.themeController = new ThemeController(this.body);
        this.fontSizeController = new FontSizeController(this.body);
        this.collapsibleController = new CollapsibleController();
        this.viewToggleController = new ViewToggleController();
        this.fullscreenController = new FullscreenController();
        this.listItemController = new ListItemController();
        this.savePdfController = new SavePdfController();
        this.exportMarkdownController = new ExportMarkdownController();
        this.exportImageController = new ExportImageController();
    }
    
    addGlobalKeydownListener() {
        const config = window.__APP_DATA__.config;
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '-': 
                        e.preventDefault(); 
                        this.fontSizeController.adjust(-config.FONT_SIZE.STEP); 
                        break;
                    case '=':
                    case '+': 
                        e.preventDefault(); 
                        this.fontSizeController.adjust(config.FONT_SIZE.STEP); 
                        break;
                    case '0': 
                        e.preventDefault(); 
                        this.fontSizeController.reset(); 
                        break;
                    case 't': 
                    case 'T': 
                        e.preventDefault(); 
                        this.themeController.toggle(); 
                        break;
                    case 'r': 
                    case 'R': 
                        e.preventDefault(); 
                        this.viewToggleController.toggle(); 
                        break;
                    case 'p': 
                    case 'P': 
                        e.preventDefault(); 
                        this.savePdfController.saveAsPdf(); 
                        break;
                }
            } else if (e.key === 'F11') {
                e.preventDefault(); 
                this.fullscreenController.toggle();
            }
        });
    }
}