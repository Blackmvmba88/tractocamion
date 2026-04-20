// Theme Switcher for Tractocamión 4.0
// Handles switching between BlackOps, Nena/Reyna, and Infantil themes

class ThemeSwitcher {
    constructor() {
        this.currentTheme = localStorage.getItem('tractocamion-theme') || 'default';
        this.themes = {
            default: 'Clásico',
            blackops: 'BlackOps',
            nena: 'Nena',
            infantil: 'Infantil'
        };
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeSwitcher();
    }

    createThemeSwitcher() {
        const header = document.querySelector('header');
        if (!header) return;

        const switcherContainer = document.createElement('div');
        switcherContainer.className = 'theme-switcher';
        switcherContainer.setAttribute('role', 'radiogroup');
        switcherContainer.setAttribute('aria-label', 'Selector de tema visual');
        switcherContainer.innerHTML = `
            <span class="theme-label">🎨 Tema:</span>
            ${Object.entries(this.themes).map(([key, label]) => `
                <button class="theme-btn ${key} ${this.currentTheme === key ? 'active' : ''}" 
                        data-theme="${key}"
                        role="radio"
                        aria-checked="${this.currentTheme === key}"
                        aria-label="Tema ${label}">
                    ${label}
                </button>
            `).join('')}
        `;

        // Insert after subtitle or platform-info
        const subtitle = header.querySelector('.subtitle');
        const platformInfo = header.querySelector('#platform-info');
        const insertAfter = platformInfo || subtitle;
        
        if (insertAfter && insertAfter.parentNode) {
            insertAfter.parentNode.insertBefore(switcherContainer, insertAfter.nextSibling);
        } else {
            header.appendChild(switcherContainer);
        }

        // Add event listeners
        switcherContainer.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.switchTheme(theme);
            });
        });
    }

    switchTheme(theme) {
        if (theme === this.currentTheme) return;

        this.currentTheme = theme;
        this.applyTheme(theme);
        localStorage.setItem('tractocamion-theme', theme);

        // Update button states and ARIA attributes
        document.querySelectorAll('.theme-btn').forEach(btn => {
            const isActive = btn.dataset.theme === theme;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive);
        });

        // Trigger animation
        this.animateThemeChange();
    }

    applyTheme(theme) {
        // Remove all theme classes
        document.body.classList.remove('theme-blackops', 'theme-nena', 'theme-infantil');
        
        // Apply new theme class
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
    }

    animateThemeChange() {
        const container = document.querySelector('.container');
        if (!container) return;

        // Add animation class instead of direct style manipulation
        container.classList.add('theme-transitioning');
        
        setTimeout(() => {
            container.classList.remove('theme-transitioning');
        }, 500);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize theme switcher when DOM is ready
let themeSwitcher;

function initThemeSwitcher() {
    themeSwitcher = new ThemeSwitcher();
    themeSwitcher.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSwitcher);
} else {
    initThemeSwitcher();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeSwitcher;
}
