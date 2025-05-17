# Personal Trainer UI Component Templates

This project contains a master set of UI component templates designed for building personalized personal trainer applications. The components are built with HTML, CSS (using CSS Custom Properties for easy theming), and vanilla JavaScript for modularity.

## Project Structure

-   `/index.html`: Main showcase page demonstrating components with different themes.
-   `/assets/css/`: Contains all CSS files.
    -   `/base/`: Core styles including reset, master variables, and base component styles.
    -   `/themes/`: Individual theme files (e.g., sharp-modern, soft-friendly).
    -   `main.css`: Imports base styles.
-   `/assets/js/`: Contains JavaScript files.
    -   `main.js`: Global JavaScript.
    -   `/components/`: For individual component-specific JavaScript files (future).
-   `/assets/images/`: For static image assets.
-   `/component-snippets/`: Raw HTML snippets for each reusable component.

## How to Use

1.  Clone the repository.
2.  Open `index.html` in your browser to see the component showcase.
3.  To use components in your project:
    *   Include `assets/css/main.css`.
    *   Include the desired theme CSS from `assets/css/themes/` or link all and use wrapper classes.
    *   Copy HTML snippets from `component-snippets/` or `index.html`.
    *   Modify CSS variables in a theme file or create a new one to customize the look and feel.

## Theming

Theming is achieved by overriding the CSS Custom Properties defined in `assets/css/base/_variables.css`. Each file in `assets/css/themes/` provides a different visual style. To apply a theme, wrap your content in a div with the corresponding theme class (e.g., `<div class="theme-sharp-modern">...</div>`).