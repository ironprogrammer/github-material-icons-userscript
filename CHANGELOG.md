# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-11-22

### Added
- Material Design icons for GitHub file browser
- Git-based icon fetching from material-icon-theme repository
- Support for 50+ file extensions (PHP, JS, TypeScript, CSS, etc.)
- Support for 25+ specific filenames (package.json, composer.json, etc.)
- Support for 47+ folder names (node_modules, vendor, src, etc.)
- Customizable icon priority list via `src/priority-list.js`
- Self-contained userscript (~150 KB) with embedded SVG icons
- Compatibility with Refined GitHub extension
- Support for GitHub's SPA navigation
- Tree view support (left sidebar file explorer)

### Technical
- Zero runtime dependencies
- Icons cached locally in `cache/` directory
- Vendor repository cloned to `vendor/` directory
- Build system converts SVGs to base64 data URIs
- Robust TypeScript config parsing with error handling
