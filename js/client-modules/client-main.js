(function() {
    'use strict';
    
    function initializeUI() {
        window.markdownRendererUI = new UIController();
        
        // Setup links: internal hash links smooth-scroll, external links open in new tab
        document.querySelectorAll('#content-container a').forEach(link => {
            const href = link.getAttribute('href') || '';
            if (href.startsWith('#')) {
                link.addEventListener('click', (e) => {
                    const rawTargetId = href.slice(1);
                    if (!rawTargetId) return;
                    const targetId = decodeURIComponent(rawTargetId);
                    const targetEl = document.getElementById(targetId) || document.getElementById(rawTargetId);
                    if (targetEl) {
                        e.preventDefault();
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        try {
                            history.pushState(null, '', '#' + encodeURIComponent(targetId));
                        } catch (_) {}
                    }
                });
            } else if (link.href && !link.hasAttribute('target')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUI);
    } else {
        initializeUI();
    }
})();