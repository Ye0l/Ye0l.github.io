# AGENTS.md

## Build/Lint/Test Commands
This is a static HTML/CSS/JavaScript project with no build system. To test:
- Open `index.html` directly in a web browser
- Use browser developer tools for debugging
- No package.json, npm scripts, or test framework present

## Code Style Guidelines

### JavaScript (ES6 Modules)
- Use ES6 module imports/exports consistently
- Import order: local modules (./) first, then external libraries
- Function naming: camelCase for functions, PascalCase for classes
- Variable naming: camelCase, constants in UPPER_SNAKE_CASE
- Use `const` by default, `let` only when reassignment needed
- Error handling: try/catch blocks with console.error for debugging
- Use template literals for string interpolation
- Prefer arrow functions for callbacks and short functions

### CSS
- Use CSS custom properties (variables) for theming
- BEM-style class naming for components
- Mobile-first responsive design
- Use flexbox/grid for layouts
- Organize styles: variables, base styles, components, utilities

### File Structure
- Keep modules focused on single responsibility
- Separate data processing, UI logic, and utilities
- Use descriptive file names matching their purpose
- Maintain consistent directory structure

### General
- No comments unless explaining complex logic
- Follow existing patterns and conventions
- Use semantic HTML5 elements
- Ensure accessibility with proper ARIA labels where needed