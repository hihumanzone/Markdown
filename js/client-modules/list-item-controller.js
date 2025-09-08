class ListItemController {
    constructor() {
        this.contentContainer = document.getElementById('content-container');
        this.notificationElement = document.getElementById('copy-notification');
        this.longPressTimer = null;
        this.longPressElement = null;
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.boundHandleMove = this.handleMove.bind(this);
        this.boundHandleEnd = this.handleEnd.bind(this);

        this.init();
    }

    init() {
        if (!this.contentContainer || !this.notificationElement) return;
        const setup = () => {
            if (this.setupTimeout) clearTimeout(this.setupTimeout);
            this.setupTimeout = setTimeout(() => this.attachInitialListeners(), 300);
        };
        setTimeout(setup, 500);
        const observer = new MutationObserver(setup);
        observer.observe(this.contentContainer, { childList: true, subtree: true });
    }

    attachInitialListeners() {
        if (!window.__APP_DATA__.config.ENABLE_LIST_LONG_PRESS_COPY) return;
        
        const isEnabled = this.isLongPressCopyEnabled();
        const allLis = Array.from(this.contentContainer.querySelectorAll('li'));
        allLis.forEach((li, index) => {
            if (li.dataset.listCopyInitialized === 'true' || li.dataset.listCopyInitialized === 'false') return;
            this.initializeListItem(li, index, isEnabled);
        });
    }

    isLongPressCopyEnabled() {
        if (!window.__APP_DATA__.config.ENABLE_LIST_LONG_PRESS_COPY) return false;
        
        const savedSetting = localStorage.getItem(window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.LONG_PRESS_COPY);
        return savedSetting !== null ? savedSetting === 'true' : true;
    }

    initializeListItem(li, index, enabled) {
        li.dataset.listIndex = index;
        li.dataset.listCopyInitialized = enabled.toString();
        
        try {
            const listData = window.__APP_DATA__?.flatListItems || window.__APP_DATA__?.listItems || [];
            if (Array.isArray(listData) && listData[index]) {
                li.dataset.rawListContent = listData[index].content || '';
            }
        } catch (_) { /* no-op */ }
        
        this.cleanupListItemEventListeners(li);
        
        if (enabled) {
            const mousedownHandler = (e) => { if (e.button === 0) this.handleStart(li, e); };
            const touchstartHandler = (e) => this.handleStart(li, e);
            
            li.addEventListener('mousedown', mousedownHandler);
            li.addEventListener('touchstart', touchstartHandler, { passive: true });
            
            li._longPressHandlers = {
                mousedown: mousedownHandler,
                touchstart: touchstartHandler
            };
            
            this.applyClickableStyles(li);
        } else {
            this.applyTextSelectableStyles(li);
        }
    }

    applyClickableStyles(element) {
        Object.assign(element.style, {
            cursor: 'pointer',
            userSelect: 'none',
            webkitUserSelect: 'none',
            mozUserSelect: 'none',
            msUserSelect: 'none'
        });
    }

    applyTextSelectableStyles(element) {
        Object.assign(element.style, {
            cursor: 'auto',
            userSelect: 'auto',
            webkitUserSelect: 'auto',
            mozUserSelect: 'auto',
            msUserSelect: 'auto'
        });
    }

    updateLongPressCopyState(enabled) {
        const allLis = Array.from(this.contentContainer.querySelectorAll('li'));
        
        allLis.forEach((li, index) => {
            if (this.longPressElement === li) {
                this.handleEnd();
            }
            
            this.cleanupListItemEventListeners(li);
            
            this.initializeListItem(li, index, enabled);
            
            li.classList.remove('list-item-highlight');
        });
    }

    cleanupListItemEventListeners(li) {
        if (li._longPressHandlers) {
            if (li._longPressHandlers.mousedown) {
                li.removeEventListener('mousedown', li._longPressHandlers.mousedown);
            }
            if (li._longPressHandlers.touchstart) {
                li.removeEventListener('touchstart', li._longPressHandlers.touchstart);
            }
            delete li._longPressHandlers;
        }
    }

    handleStart(element, event) {
        this.handleEnd();

        this.longPressElement = element;

        if (event.type === 'touchstart' && event.touches.length > 0) {
            this.touchStartX = event.touches[0].clientX;
            this.touchStartY = event.touches[0].clientY;

            element.addEventListener('touchmove', this.boundHandleMove, { passive: true });
            element.addEventListener('touchend', this.boundHandleEnd);
            element.addEventListener('touchcancel', this.boundHandleEnd);
        } else if (event.type === 'mousedown') {
            element.addEventListener('mouseup', this.boundHandleEnd);
            element.addEventListener('mouseleave', this.boundHandleEnd);
        }

        element.classList.add('list-item-highlight');
        
        this.longPressTimer = setTimeout(async () => {
            if (this.longPressElement === element) {
                await this.copyListContent(element);
            }
        }, window.__APP_DATA__.config.LONG_PRESS_DURATION);
    }

    handleMove(event) {
        if (!this.longPressTimer) return;

        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const deltaX = Math.abs(touch.clientX - this.touchStartX);
            const deltaY = Math.abs(touch.clientY - this.touchStartY);
        
            if (deltaX > 10 || deltaY > 10) {
                this.handleEnd();
            }
        }
    }

    handleEnd() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        if (this.longPressElement) {
            this.longPressElement.classList.remove('list-item-highlight');
            
            this.longPressElement.removeEventListener('touchmove', this.boundHandleMove);
            this.longPressElement.removeEventListener('touchend', this.boundHandleEnd);
            this.longPressElement.removeEventListener('touchcancel', this.boundHandleEnd);
            this.longPressElement.removeEventListener('mouseup', this.boundHandleEnd);
            this.longPressElement.removeEventListener('mouseleave', this.boundHandleEnd);
            
            this.longPressElement = null;
        }
    }

    async copyListContent(element) {
        try {
            let textToCopy = element.dataset.rawListContent;
            if (!textToCopy) {
                const allLis = Array.from(this.contentContainer.querySelectorAll('li'));
                const recomputedIndex = allLis.indexOf(element);
                const listData = window.__APP_DATA__?.flatListItems || window.__APP_DATA__?.listItems || [];
                if (recomputedIndex > -1 && listData[recomputedIndex]) {
                    textToCopy = listData[recomputedIndex].content;
                }
            }

            if (!textToCopy) {
                await this.copyElementText(element);
                return;
            }
            
            await this._copyToClipboard(textToCopy);
            this.showNotification('List content copied!');
        } catch (err) {
            console.error('Failed to copy list item:', err);
            this.showNotification('Failed to copy. See console.', true);
        }
    }

    async copyElementText(element) {
        const textContent = (element.innerText || element.textContent || "").trim();
        if (textContent) {
            await this._copyToClipboard(textContent);
            this.showNotification('List item text copied!');
        } else {
            throw new Error('List item content is empty.');
        }
    }

    async _copyToClipboard(text) {
        if (navigator.clipboard?.writeText) { 
            return navigator.clipboard.writeText(text); 
        }
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; 
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select(); 
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    showNotification(message, isError = false) {
        if (!this.notificationElement) return;
        this.notificationElement.textContent = message;
        this.notificationElement.style.backgroundColor = isError ? 'rgba(200, 0, 0, 0.9)' : 'rgba(30, 30, 30, 0.9)';
        this.notificationElement.style.color = 'white';
        if (document.body.classList.contains('dark-theme') || document.body.classList.contains('high-contrast-theme')) {
            this.notificationElement.style.backgroundColor = isError ? 'rgba(255, 80, 80, 0.9)' : 'rgba(200, 200, 200, 0.9)';
            this.notificationElement.style.color = '#0d1117';
        }
        this.notificationElement.style.display = 'block';
        setTimeout(() => { 
            this.notificationElement.style.display = 'none'; 
        }, isError ? 3500 : 2000);
    }
}