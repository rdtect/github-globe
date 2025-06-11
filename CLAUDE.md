# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zyeta Global Engagement Visualization Tool - An interactive 3D globe showcasing Zyeta's workspace design projects and international collaborations. This is a prototype tool for Zyeta.com, with Payal Sandhu (Global Engagement Head) as the primary stakeholder.

## Essential Commands

```bash
# Development with hot reload
npm start

# Production build (outputs to root directory for GitHub Pages)
npm run build

# Development build (outputs to ./dist directory)
npm run build-dev
```

## Architecture

The project is an interactive 3D visualization application with the following structure:

- **Entry Point**: `src/index.js` - Initializes the Three.js scene, creates the globe with Zyeta data, handles country click interactions
- **Build Output**: 
  - Development: `./dist/main.js`
  - Production: `./main.js` (root directory for GitHub Pages deployment)

### Key Components in src/index.js

1. **Scene Setup**: Three.js scene with dark blue theme matching Zyeta branding
2. **Globe Configuration**: 
   - Uses three-globe library
   - India (HQ) highlighted in gold
   - Countries with Zyeta projects highlighted in Zyeta blue
   - Interactive country polygons with click handlers
3. **Data Visualization**:
   - Office locations shown as labeled points
   - Project connections shown as animated arcs
   - Blue arcs for active projects, red for on-hold
4. **Interaction**: 
   - Click on countries to view engagement details
   - Engagement panel shows project list and details

### Data Files (src/files/)

- `globe-data-min.json` - Country polygon data (original)
- `zyeta-offices.json` - Zyeta office locations (Bangalore HQ, Hyderabad, Mumbai, Delhi) and collaboration cities
- `zyeta-projects.json` - Workspace design projects with client details and status
- `zyeta-engagements.json` - Detailed engagement data by country including talks, workshops, and projects
- `earth-dark.jpg` - Globe texture

### UI Components

- **Info Banner**: Displays Zyeta branding
- **Engagement Panel**: Shows country-specific project details when clicked
- **Interactive Globe**: Mouse-controlled rotation and zoom

## Development Notes

- The project uses webpack with separate development and production configurations
- Production build is configured for direct GitHub Pages deployment
- The globe includes Zyeta's brand colors (blue #00d4ff and gold #ffd700)
- Click interactions are handled by three-globe's onHexPolygonClick method
- Engagement data is stored in JSON format for easy updates

## Future Enhancements (Phase 2)

- Migration to Vite build system
- ES6+ modules and classes refactor
- Note-taking functionality for location-specific projects
- Multi-user support for all Zyeta team members
- Real-time data updates from backend