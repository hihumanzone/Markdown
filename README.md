# Markdown & LaTeX Renderer

A powerful, client-side web application for rendering Markdown documents with full LaTeX math support. This tool provides a clean, intuitive interface for writing, editing, and rendering Markdown content with mathematical expressions.

## Features

### Core Functionality
- **Markdown Rendering**: Full GitHub Flavored Markdown (GFM) support using Marked.js
- **Syntax Highlighting & Line Numbers**: Rich code block highlighting and numbered lines powered by Prism.js with Autoloader
- **LaTeX Math Support**: Render mathematical expressions using KaTeX
  - Inline math: `$equation$` or `\(equation\)`
  - Display math: `$$equation$$` or `\[equation\]`
- **Same-Tab Preview & Pop-out**: Previews content instantly in the same tab with options to open in a new tab or close and return to the editor
- **Fallback Renderer**: Built-in backup renderer when external libraries fail to load

### File Management
- **Import Files**: Support for `.md`, `.markdown`, and `.txt` files (up to 10MB)
- **Export Content**: Save rendered sections as Markdown files
- **Drag & Drop**: Easy file importing via drag and drop interface

### Organization & Productivity
- **Library System**: Save frequently used markdown sections for quick access
- **Recent History**: Track and revisit recently rendered content
- **Quick Actions**: Paste and render, clear content, and one-click operations

### User Experience
- **Multi-Theme Support**: Light, dark, and high-contrast themes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Keyboard Shortcuts**: Quick theme switching with `Ctrl/Cmd + T`
- **Accessibility**: Full ARIA support and semantic HTML

## Getting Started

### Quick Start
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start writing Markdown in the text area
4. Click "Render Markdown" to see the formatted output

### Local Development
```bash
# Clone the repository
git clone https://github.com/hihumanzone/Markdown.git
cd Markdown

# Serve locally (optional, for development)
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### Deployment
This is a static web application with no server-side dependencies. Simply:
1. Upload all files to your web server
2. Ensure `index.html` is accessible
3. The application will work immediately

## Usage Examples

### Basic Markdown
```markdown
# Heading 1
## Heading 2

This is **bold** and *italic* text.

- Bullet point 1
- Bullet point 2

`inline code` and code blocks:
```javascript
function hello() {
    console.log("Hello, World!");
}
```

### Math Expressions
```markdown
Inline math: The quadratic formula is $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$

Display math:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

Matrix example:
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$
```

## File Structure

```
Markdown/
├── index.html              # Main application entry point
├── css/                    # Stylesheets
│   ├── main.css           # Core application styles
│   ├── themes.css         # Theme definitions
│   └── modals.css         # Modal dialog styles
└── js/                     # JavaScript modules
    ├── app.js             # Main application logic
    ├── config.js          # Configuration settings
    ├── main.js            # Application initialization
    ├── file-manager.js    # File import/export handling
    ├── theme-controller.js # Theme management
    ├── fallback-renderer.js # Backup markdown renderer
    ├── saved-sections-manager.js # Library system
    ├── current-content-manager.js # Active content management
    ├── rendered-page-builder.js # Output page generation
    ├── utils.js           # Utility functions
    └── client-modules/    # Additional client-side modules
```

## Technical Details

### Dependencies
- **Marked.js**: Markdown parsing and rendering
- **Prism.js**: Code block syntax highlighting & line numbers with Autoloader
- **KaTeX**: LaTeX math rendering
- **DOMPurify**: HTML sanitization for security
- **GitHub Markdown CSS**: Styling for rendered output

### Browser Support
- Modern browsers with ES6+ support
- Graceful degradation for older browsers
- Mobile-responsive design

### Security Features
- Content sanitization via DOMPurify
- XSS prevention
- Safe file handling with type validation
- Input length validation

### Performance
- Client-side rendering (no server required)
- Lazy loading of external libraries
- Efficient DOM manipulation
- Local storage for user preferences

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + T` | Toggle theme (Light → Dark → High Contrast) |
| `Tab` in textarea | Insert tab character |
| Standard text editing shortcuts work in the input area |

## Contributing

This project welcomes contributions! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly in multiple browsers
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Test in multiple browsers
- Ensure accessibility compliance
- Update documentation as needed
- Keep the application lightweight and fast

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Core rendering | ✅ | ✅ | ✅ | ✅ |
| File import | ✅ | ✅ | ✅ | ✅ |
| Math rendering | ✅ | ✅ | ✅ | ✅ |
| Themes | ✅ | ✅ | ✅ | ✅ |

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Contribute improvements via pull requests

---

**Happy Markdown rendering!** 🚀
