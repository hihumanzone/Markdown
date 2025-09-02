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
        if (!window.__APP_DATA__.config.ENABLE_LIST_LONG_PRESS_COPY) {
            return;
        }
        
        // Check if long press copy is currently enabled via the toggle
        const lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.LONG_PRESS_COPY;
        const savedSetting = localStorage.getItem(lsKey);
        const isEnabled = savedSetting !== null ? savedSetting === 'true' : true;
        
        const listItems = this.contentContainer.querySelectorAll('li');
        listItems.forEach((li, index) => {
            if (li.dataset.listCopyInitialized === 'true') return;
            li.dataset.listIndex = index;
            
            if (isEnabled) {
                li.dataset.listCopyInitialized = 'true';
                li.addEventListener('mousedown', (e) => { if (e.button === 0) this.handleStart(li, e); });
                li.addEventListener('touchstart', (e) => this.handleStart(li, e), { passive: true });
                // Apply clickable styles
                li.style.cursor = 'pointer';
                li.style.userSelect = 'none';
                li.style.webkitUserSelect = 'none';
                li.style.mozUserSelect = 'none';
                li.style.msUserSelect = 'none';
            } else {
                li.dataset.listCopyInitialized = 'false';
                // Allow normal text selection
                li.style.cursor = 'auto';
                li.style.userSelect = 'auto';
                li.style.webkitUserSelect = 'auto';
                li.style.mozUserSelect = 'auto';
                li.style.msUserSelect = 'auto';
            }
        });
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
            const listIndex = parseInt(element.dataset.listIndex, 10);
            const listData = window.__APP_DATA__.listItems;
            const isValidIndex = !isNaN(listIndex) && listData && listIndex < listData.length && listData[listIndex];
            
            if (!isValidIndex) {
                await this.copyElementText(element);
                return;
            }
            
            const textToCopy = listData[listIndex].content;
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

    updateLongPressCopyState(enabled) {
        const listItems = this.contentContainer.querySelectorAll('li');
        listItems.forEach(li => {
            if (enabled) {
                // Enable long press copy functionality
                if (li.dataset.listCopyInitialized !== 'true') {
                    li.dataset.listCopyInitialized = 'true';
                    li.addEventListener('mousedown', (e) => { if (e.button === 0) this.handleStart(li, e); });
                    li.addEventListener('touchstart', (e) => this.handleStart(li, e), { passive: true });
                }
                // Add styles that make items look clickable and prevent text selection
                li.style.cursor = 'pointer';
                li.style.userSelect = 'none';
                li.style.webkitUserSelect = 'none';
                li.style.mozUserSelect = 'none';
                li.style.msUserSelect = 'none';
            } else {
                // Disable long press copy functionality
                this.removeListItemListeners(li);
                li.dataset.listCopyInitialized = 'false';
                
                // Force remove styles to allow normal text selection
                li.style.cursor = 'auto';
                li.style.userSelect = 'auto';
                li.style.webkitUserSelect = 'auto';
                li.style.mozUserSelect = 'auto';
                li.style.msUserSelect = 'auto';
                
                // Clear any highlight class
                li.classList.remove('list-item-highlight');
            }
        });
    }

    removeListItemListeners(li) {
        // Remove event listeners by storing references
        // Since we can't easily remove specific listeners without references,
        // we'll mark the element as having no listeners and clear any timers
        if (this.longPressElement === li) {
            this.handleEnd();
        }
    }
}