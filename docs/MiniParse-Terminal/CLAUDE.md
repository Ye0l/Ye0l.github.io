# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MiniParse-Terminal is a web-based overlay for Final Fantasy XIV's Advanced Combat Tracker (ACT) that displays real-time combat data in a terminal-style interface. It's designed as a standalone HTML page with vanilla JavaScript modules that renders DPS/HPS meters with retro terminal aesthetics.

## Architecture

The project uses a modular JavaScript architecture with ES6 modules:

- **miniparse.html** - Main entry point, sets up the terminal UI and loads dependencies
- **js/main.js** - Core application logic, handles data updates and event listeners
- **js/data.js** - Data processing utilities including pet data merging and sample data
- **js/ui.js** - UI rendering and state management for combat meters
- **js/config.js** - Configuration mappings (job icons)
- **js/utils.js** - Utility functions for formatting and animations
- **css/main.css** - Terminal styling with scanline effects and job-specific colors
- **css/job-colors.css** - Job-specific color definitions
- **images/** - Contains job icon PNG files for all FFXIV jobs/classes

The app connects to ACT's OverlayPlugin API via the shared common.js library to receive real-time combat data.

## Development

### Running the Development Server

The project uses Vite for development. Since no package.json exists in the root, use the Vite CLI directly:

```bash
# Install Vite globally if needed
npm install -g vite

# Start development server
vite

# Or use npx
npx vite
```

The app will be available at http://localhost:5173/miniparse.html

### File Structure

- All JavaScript files use ES6 modules (`import`/`export`)
- The main entry point loads modules via `type="module"` script tag
- CSS uses CSS custom properties for theming
- Images are organized by job name in the images/ directory

### Key Features

- **Pet Data Merging** - Automatically merges pet damage/healing with owner data
- **Real-time Updates** - Animated number transitions and live data updates
- **Terminal Aesthetics** - Retro terminal styling with optional scanline effects
- **ACT Integration** - Connects to OverlayPlugin for real-time combat data
- **Responsive Grid Layout** - CSS Grid-based meter layouts

### Data Flow

1. ACT OverlayPlugin sends `CombatData` events
2. main.js receives events and processes them
3. data.js merges pet data with owner data
4. ui.js renders the processed data in meters
5. utils.js handles formatting and animations

### Testing

No formal test suite exists. Test by:
1. Loading the page in a browser
2. Clicking the [SAMPLE] button to view sample data
3. Using with ACT and OverlayPlugin for real data

### Adding New Jobs

1. Add job icon to images/ directory
2. Update JOB_ICON_MAP in js/config.js
3. Add job-specific colors to css/job-colors.css if needed

### Browser Compatibility

The app uses modern JavaScript features (ES6 modules, CSS Grid) and requires a contemporary browser. The OverlayPlugin common.js dependency handles cross-browser compatibility for the ACT integration layer.