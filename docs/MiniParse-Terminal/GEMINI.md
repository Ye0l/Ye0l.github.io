# GEMINI.md

## Project Overview

This project is a web-based overlay component for the "Advanced Combat Tracker" (ACT) application, specifically for its OverlayPlugin. Its purpose is to render real-time in-game combat data, such as DPS (Damage Per Second) and HPS (Healing Per Second), into a customizable HTML table.

The frontend is built with vanilla HTML, CSS, and JavaScript. The presence of a `.vite` directory strongly suggests that the [Vite.js](https://vitejs.dev/) development server is used for local development and live-reloading.

The main logic resides within `miniparse.html`. This file listens for `CombatData` events dispatched by the OverlayPlugin, processes the data, and dynamically updates the display.

## Building and Running

### Running in Development

No explicit run scripts (like in a `package.json`) were found. However, based on the project structure, a Vite development server is likely used.

To run this for development, you would typically run a command to serve the `miniparse.html` file.

```bash
# TODO: Verify the exact command. It is likely one of the following.
# You may need to install vite first: npm install vite
npx vite
```

### Production Usage

In a production environment, the `miniparse.html` file is likely loaded directly as a resource by the ACT OverlayPlugin. No build step appears to be necessary.

## Development Conventions

*   **Configuration**: The layout and content of the display table (e.g., columns, widths, text alignment) are configured by modifying the JavaScript variables (`encounterDefine`, `headerDefine`, `bodyDefine`) at the top of the `<script>` section within `miniparse.html`.
*   **Technology**: The project uses vanilla JavaScript for all its logic. It does not use a major frontend framework like React or Vue.
*   **Code Style**: The code is self-contained within the HTML file. The JavaScript is procedural and event-driven.
*   **Comments**: The source code is commented in Japanese.
