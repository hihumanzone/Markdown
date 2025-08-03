class KatexRenderer {
    constructor() { 
        this.init(); 
    }
    
    init() {
        if (typeof renderMathInElement === 'function') { 
            this.render(); 
        } else { 
            const interval = setInterval(() => { 
                if (typeof renderMathInElement === 'function') { 
                    clearInterval(interval); 
                    this.render(); 
                }
            }, 100); 
        }
    }
    
    render() {
        try {
            renderMathInElement(document.getElementById('content-container'), {
                delimiters: [
                    {left: "$$", right: "$$", display: true}, 
                    {left: "\\[", right: "\\]", display: true},
                    {left: "$", right: "$", display: false, throwOnError: false}, 
                    {left: "\\(", right: "\\)", display: false}
                ],
                throwOnError: false,
            });
        } catch (e) { 
            console.error("KaTeX rendering error:", e); 
        }
    }
}