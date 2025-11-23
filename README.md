# GitHub Material Icons Userscript

Material Design icons for GitHub's file browser, but in Safari ([Material Icons for GitHub](https://github.com/material-extensions/material-icons-browser-extension) only works for Chrome/Firefox). The default config is for WordPress/PHP/React, pertinent to my personal development workflows, but file/folder type replacements are customizable.

## Features

- 🎨 Material Design icons from the [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
- 📦 Self-contained userscript (no external dependencies at runtime)
- ⚡ Works with GitHub's SPA navigation
- 🔧 Thousands of icons to choose from via priority list

## Installation

### For Safari (using Userscripts)

1. Install [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) extension for Safari
2. Download the userscript: [github-material-icons.user.js](dist/github-material-icons.user.js)
3. Open the downloaded file - Userscripts will prompt to install
4. Browse to any GitHub repository and see the icons!

### For Chrome/Firefox (using Tampermonkey)

**Note:** This userscript is designed for Safari, but should work in Chrome/Firefox. If you already have a Material Icons browser extension installed, you may want to disable it to avoid conflicts.

1. Install Tampermonkey ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/))
2. Click on the Tampermonkey icon and select "Create a new script"
3. Copy the contents of [github-material-icons.user.js](dist/github-material-icons.user.js)
4. Save and browse to any GitHub repository

## Building from Source

### Prerequisites

- Node.js 14+ (no npm dependencies needed)
- Git (for cloning the material-icon-theme repository)

### Build Steps

```bash
# Clone the repository
git clone https://github.com/ironprogrammer/github-material-icons-userscript.git
cd github-material-icons-userscript

# Fetch icons from material-icon-theme
npm run fetch

# Build the userscript
npm run build

# Or do both in one command
npm run all
```

The built userscript will be in `dist/github-material-icons.user.js`.

### Customizing the Icon List

Edit `src/priority-list.js` to add/remove file types:

```javascript
module.exports = {
  extensions: [
    'php',
    'js',
    'css',
    // Add more extensions here
  ],
  filenames: [
    'package.json',
    'composer.json',
    // Add more specific filenames here
  ],
  folders: [
    'node_modules',
    'vendor',
    // Add more folder names here
  ],
};
```

Then rebuild:

```bash
npm run all
```

## Icon Coverage

The default priority list (`src/priority-list.js`) includes icons for:

- **50+ file extensions**: PHP, JS, TypeScript, CSS, JSON, YAML, and more
- **25+ specific filenames**: package.json, composer.json, webpack.config.js, etc.
- **47+ folder names**: node_modules, vendor, .github, tests, etc.

**Available Icons:** The [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) repository contains 1000+ file extensions, 1000+ filenames, and 500+ folder definitions. Your priority list determines which icons are included in the built userscript.

Optimized for:
- WordPress core and plugin development
- PHP projects with Composer
- Modern JavaScript with npm/webpack/vite
- React/TypeScript applications
- Shell scripting and dotfiles

## How It Works

1. **Fetch Script** (`scripts/fetch-icons.js`):
   - Clones the [material-icon-theme](https://github.com/material-extensions/vscode-material-icon-theme) repository to `vendor/`
   - Parses TypeScript icon definitions to build mappings
   - Copies only the needed SVG files (based on `src/priority-list.js`) to `cache/icons/`

2. **Build Script** (`scripts/build.js`):
   - Reads your priority list and icon mappings
   - Loads corresponding SVG files from cache
   - Converts SVGs to base64 data URIs
   - Generates a self-contained userscript with all icons embedded

3. **Userscript** (runs in browser):
   - Detects file/folder types on GitHub pages
   - Replaces GitHub's default icons with Material Design icons
   - Supports SPA navigation and tree view

## Project Structure

```
github-material-icons-userscript/
├── src/
│   └── priority-list.js       # YOUR icon selection (customizable)
├── scripts/
│   ├── fetch-icons.js         # Fetches icons from material-icon-theme
│   └── build.js               # Builds the final userscript
├── cache/                     # Cached icon files (git-ignored)
│   ├── fileIcons.json         # Parsed file icon mappings
│   ├── folderIcons.json       # Parsed folder icon mappings
│   └── icons/                 # SVG files
├── vendor/                    # Cloned material-icon-theme repo (git-ignored)
└── dist/
    └── github-material-icons.user.js  # Built userscript (~150 KB)
```

## File Size

The built userscript is approximately **150 KB**, which includes all selected icons embedded as base64 data URIs. The size depends on how many icons you include in your priority list.

## Credits

- Icons from [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
- Inspired by [Material Icons for GitHub](https://github.com/material-extensions/material-icons-browser-extension)

## License

[MIT License](https://opensource.org/licenses/MIT)

Icons are from the Material Icon Theme project and retain their original [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).
