/**
 * Build the final userscript with embedded SVG icons as data URIs
 */

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const ICONS_DIR = path.join(CACHE_DIR, 'icons');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'github-material-icons.user.js');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

/**
 * Convert SVG to base64 data URI
 */
function svgToDataUri(svgContent) {
  const base64 = Buffer.from(svgContent).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Build icon mappings from cached data
 */
function buildIconMappings() {
  console.log('Building icon mappings...\n');
  
  const priorityList = require('../src/priority-list.js');
  const fileIconsPath = path.join(CACHE_DIR, 'fileIcons.json');
  const folderIconsPath = path.join(CACHE_DIR, 'folderIcons.json');

  if (!fs.existsSync(fileIconsPath) || !fs.existsSync(folderIconsPath)) {
    console.error('Error: Icon definitions not found. Run "npm run fetch" first.');
    process.exit(1);
  }

  const fileIcons = JSON.parse(fs.readFileSync(fileIconsPath, 'utf8'));
  const folderIcons = JSON.parse(fs.readFileSync(folderIconsPath, 'utf8'));

  // Manual mappings for files not in Material Icons fileExtensions
  const manualFilenameMappings = {
    '.distignore': 'git',  // WordPress distribution ignore file (same as .gitignore)
  };

  // Manual extension mappings (for extensions not in Material Icons fileExtensions)
  const manualExtensionMappings = {
    'yml': 'yaml',
    'yaml': 'yaml',
    'html': 'html',  // Material Icons only maps 'htm', not 'html'
  };

  // Add manual mappings to fileIcons
  Object.assign(fileIcons.fileNames, manualFilenameMappings);
  Object.assign(fileIcons.fileExtensions, manualExtensionMappings);
  
  const mappings = {
    extensions: {},
    filenames: {},
    folders: {},
  };
  
  // Map extensions
  priorityList.extensions.forEach(ext => {
    if (fileIcons.fileExtensions && fileIcons.fileExtensions[ext]) {
      const iconName = fileIcons.fileExtensions[ext];
      const iconPath = path.join(ICONS_DIR, `${iconName}.svg`);
      
      if (fs.existsSync(iconPath)) {
        const svgContent = fs.readFileSync(iconPath, 'utf8');
        mappings.extensions[ext] = svgToDataUri(svgContent);
        console.log(`  ✓ .${ext} → ${iconName}`);
      }
    }
  });
  
  // Map specific filenames
  priorityList.filenames.forEach(filename => {
    if (fileIcons.fileNames && fileIcons.fileNames[filename]) {
      const iconName = fileIcons.fileNames[filename];
      const iconPath = path.join(ICONS_DIR, `${iconName}.svg`);
      
      if (fs.existsSync(iconPath)) {
        const svgContent = fs.readFileSync(iconPath, 'utf8');
        mappings.filenames[filename] = svgToDataUri(svgContent);
        console.log(`  ✓ ${filename} → ${iconName}`);
      }
    }
  });
  
  // Map folders
  priorityList.folders.forEach(folder => {
    if (folderIcons.folderNames && folderIcons.folderNames[folder]) {
      const iconName = folderIcons.folderNames[folder];
      const iconPath = path.join(ICONS_DIR, `${iconName}.svg`);
      
      if (fs.existsSync(iconPath)) {
        const svgContent = fs.readFileSync(iconPath, 'utf8');
        mappings.folders[folder] = svgToDataUri(svgContent);
        console.log(`  ✓ ${folder}/ → ${iconName}`);
      }
    }
  });
  
  // Add default file/folder icons if they exist
  const defaultFileIcon = path.join(ICONS_DIR, 'file.svg');
  const defaultFolderIcon = path.join(ICONS_DIR, 'folder.svg');

  if (fs.existsSync(defaultFileIcon)) {
    mappings.defaultFile = svgToDataUri(fs.readFileSync(defaultFileIcon, 'utf8'));
  } else {
    // Use a simple fallback icon (generic document)
    console.log('  ⚠ No default file icon found, will use first matched icon as fallback');
  }

  if (fs.existsSync(defaultFolderIcon)) {
    mappings.defaultFolder = svgToDataUri(fs.readFileSync(defaultFolderIcon, 'utf8'));
  } else {
    // Use a simple fallback icon (generic folder)
    console.log('  ⚠ No default folder icon found, will use first matched icon as fallback');
  }

  // Add symlink icon
  // This icon is from the material-icons-browser-extension's custom icons, not the VS Code theme.
  // It's embedded directly here because it's not part of the upstream vscode-material-icon-theme
  // that our fetch script syncs from. The browser extension created this custom icon specifically
  // for filesystem symlinks (folder-symlink.svg).
  // Source: https://github.com/material-extensions/material-icons-browser-extension/blob/main/src/custom/folder-symlink.svg
  const symlinkSvg = '<svg version="1.1" viewBox="0 0 32 32" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M13.84376,7.53645l-1.28749-1.0729A2,2,0,0,0,11.27591,6H4A2,2,0,0,0,2,8V24a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V10a2,2,0,0,0-2-2H15.12412A2,2,0,0,1,13.84376,7.53645Z" fill="#90a4ae"/><g transform="translate(3.233,3.34)" fill="#eceff1"><path d="m20.767 9.66v4h-8v6h8v4l8-7z" fill="#eceff1" /></g></svg>';
  mappings.symlink = svgToDataUri(symlinkSvg);
  console.log('  ✓ Added symlink icon (folder-symlink)');
  
  console.log(`\n✓ Built mappings for ${Object.keys(mappings.extensions).length} extensions, ${Object.keys(mappings.filenames).length} filenames, ${Object.keys(mappings.folders).length} folders`);
  
  return mappings;
}

/**
 * Generate the final userscript
 */
function generateUserscript(mappings) {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  
  const userscript = `// ==UserScript==
// @name         GitHub Material Icons
// @namespace    http://brianalexander.com/
// @version      ${pkg.version}
// @description  ${pkg.description}
// @author       ${pkg.author}
// @match        https://github.com/*
// @grant        none
// @run-at       document-end
// @inject-into  content
// @updateURL    https://raw.githubusercontent.com/ironprogrammer/github-material-icons-userscript/main/dist/github-material-icons.user.js
// @downloadURL  https://raw.githubusercontent.com/ironprogrammer/github-material-icons-userscript/main/dist/github-material-icons.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    // Icon mappings
    const ICON_MAPPINGS = ${JSON.stringify(mappings, null, 2)};
    
    /**
     * Get icon for a file based on filename and extension
     */
    function getFileIcon(filename) {
        // Check for exact filename match first
        if (ICON_MAPPINGS.filenames[filename]) {
            return ICON_MAPPINGS.filenames[filename];
        }

        // Handle compound extensions (e.g., "phpcs.xml.dist" -> try "phpcs.xml" then ".xml")
        const parts = filename.split('.');
        if (parts.length > 2) {
            // Try removing the last extension (e.g., "phpcs.xml.dist" -> "phpcs.xml")
            const withoutLastExt = parts.slice(0, -1).join('.');
            if (ICON_MAPPINGS.filenames[withoutLastExt]) {
                return ICON_MAPPINGS.filenames[withoutLastExt];
            }

            // Try the second-to-last extension (e.g., ".xml" from "phpcs.xml.dist")
            const secondExt = parts[parts.length - 2].toLowerCase();
            if (ICON_MAPPINGS.extensions[secondExt]) {
                return ICON_MAPPINGS.extensions[secondExt];
            }
        }

        // Check for simple extension match
        if (parts.length > 1) {
            const ext = parts[parts.length - 1].toLowerCase();
            if (ICON_MAPPINGS.extensions[ext]) {
                return ICON_MAPPINGS.extensions[ext];
            }
        }

        // Return default file icon (or null to keep GitHub's default)
        return ICON_MAPPINGS.defaultFile || null;
    }
    
    /**
     * Get icon for a folder
     */
    function getFolderIcon(foldername) {
        // Try exact match first
        if (ICON_MAPPINGS.folders[foldername]) {
            return ICON_MAPPINGS.folders[foldername];
        }

        // Try without leading dot (e.g., .github -> github)
        if (foldername.startsWith('.')) {
            const withoutDot = foldername.substring(1);
            if (ICON_MAPPINGS.folders[withoutDot]) {
                return ICON_MAPPINGS.folders[withoutDot];
            }
        }

        return ICON_MAPPINGS.defaultFolder || null;
    }

    /**
     * Create a Material icon img element
     */
    function createIconImg(iconDataUri, marginRight = '') {
        const img = document.createElement('img');
        img.src = iconDataUri;
        img.style.width = '16px';
        img.style.height = '16px';
        img.style.display = 'inline-block';
        img.style.verticalAlign = 'text-bottom';
        if (marginRight) {
            img.style.marginRight = marginRight;
        }
        img.setAttribute('aria-hidden', 'true');
        img.classList.add('material-icon-replacement');
        return img;
    }

    /**
     * Replace icon for a single file/folder item
     */
    function replaceIconForItem(item, stats) {
        // Check for parent directory (..) link first (different structure)
        let parentDirLink = item.querySelector('a[data-testid="up-tree"]');
        if (parentDirLink) {
            // This is the "back up one level" row
            const svg = parentDirLink.querySelector('svg.octicon');
            if (svg && !svg.nextElementSibling?.classList.contains('material-icon-replacement')) {
                const iconDataUri = ICON_MAPPINGS.defaultFolder;
                if (iconDataUri) {
                    svg.style.visibility = 'hidden';
                    svg.style.position = 'absolute';

                    const img = createIconImg(iconDataUri, '4px');
                    svg.parentNode.insertBefore(img, svg.nextSibling);
                    if (stats) stats.replaced++;
                }
            }
            return;
        }

        // GitHub has separate cells for small/large screens
        // We need to target the large-screen cell which is visible
        const largeScreenCell = item.querySelector('td.react-directory-row-name-cell-large-screen');
        const targetCell = largeScreenCell || item.querySelector('td');

            if (!targetCell) return;

            // Find the link with the file/folder name
            // Look in the visible (non-edit) link
            // Note: symlinks don't have the Link--primary class, so we don't require it
            let link = targetCell.querySelector('a[href*="/blob/"], a[href*="/tree/"]');

            if (!link) return;

            let name = link.textContent.trim();
            if (!name) return;

            // Handle collapsed paths (e.g., ".cursor/rules" -> ".cursor")
            // GitHub shows nested empty folders as "folder/subfolder"
            // We only want to match the first folder name
            if (name.includes('/')) {
                name = name.split('/')[0];
            }

            // Find the SVG in the SAME container as the link (not in edit buttons)
            // The file icon SVG should be a sibling or near the link
            const container = targetCell.querySelector('.react-directory-filename-column');
            if (!container) return;

            // Look for the SVG
            // GitHub uses octicon-file, octicon-file-directory, and their -fill variants
            let svg = container.querySelector('svg[class*="octicon-file"]');
            if (!svg) return;

            // Check if it's a symlink first
            const isSymlink = svg.classList.contains('octicon-file-symlink-file') ||
                            svg.classList.contains('octicon-file-symlink-directory');

            // Check if it's a folder
            const isFolder = link.getAttribute('href')?.includes('/tree/') ||
                           svg.getAttribute('aria-label')?.toLowerCase().includes('directory') ||
                           svg.getAttribute('aria-label')?.toLowerCase().includes('folder');

            // Get the appropriate icon
            let iconDataUri;
            if (isSymlink) {
                iconDataUri = ICON_MAPPINGS.symlink;
            } else if (isFolder) {
                iconDataUri = getFolderIcon(name);
            } else {
                iconDataUri = getFileIcon(name);
            }
            if (!iconDataUri) return;

            // Check if Refined GitHub has wrapped this in an edit link
            const editLink = svg.closest('a.rgh-quick-file-edit');

            if (editLink) {
                // Refined GitHub is active - replace the icon but keep the edit link

                // Check if we already added our icon to the edit link
                const existingIcon = editLink.querySelector('img.material-icon-replacement');
                if (existingIcon) {
                    // Remove any duplicate icons that are siblings of the edit link
                    let sibling = editLink.nextElementSibling;
                    while (sibling && sibling.classList?.contains('material-icon-replacement')) {
                        const toRemove = sibling;
                        sibling = sibling.nextElementSibling;
                        toRemove.remove();
                    }
                    return; // Already replaced
                }

                // Check if we previously added an icon as a sibling of the edit link (before RGH wrapped it)
                let siblingIcon = editLink.nextElementSibling;
                if (siblingIcon?.classList?.contains('material-icon-replacement')) {
                    siblingIcon.remove();
                }

                // Find the file icon SVG (not the pencil)
                const fileIconSvg = editLink.querySelector('svg[class*="octicon-file"]:not(.octicon-pencil)');
                if (fileIconSvg) {
                    // Hide the file icon SVG (use visibility so RGH can still find it)
                    fileIconSvg.style.visibility = 'hidden';
                    fileIconSvg.style.position = 'absolute';

                    // Insert our icon at the beginning of the edit link (before everything)
                    const img = createIconImg(iconDataUri);
                    editLink.insertBefore(img, editLink.firstChild);
                    if (stats) stats.replaced++;
                }
            } else {
                // No Refined GitHub - normal replacement

                // Check if we already added our icon
                if (svg.nextElementSibling?.classList.contains('material-icon-replacement')) {
                    return; // Already replaced
                }

                // Hide the original SVG (use visibility so RGH can still find it)
                svg.style.visibility = 'hidden';
                svg.style.position = 'absolute';

                // Insert our icon after the hidden SVG
                const img = createIconImg(iconDataUri, svg.style.marginRight || '');

                // Copy color if needed
                if (svg.style.color) {
                    img.style.filter = 'opacity(0.5)'; // Match GitHub's muted color
                }

                svg.parentNode.insertBefore(img, svg.nextSibling);
                if (stats) stats.replaced++;
            }
    }

    /**
     * Replace icon for a tree view item (left sidebar file tree)
     */
    function replaceIconForTreeItem(item, stats) {
        // Find the filename span
        const filenameSpan = item.querySelector('.PRIVATE_TreeView-item-content-text span');
        if (!filenameSpan) return;

        let name = filenameSpan.textContent.trim();
        if (!name) return;

        // Find the SVG container
        const visualContainer = item.querySelector('.PRIVATE_TreeView-item-visual');
        if (!visualContainer) return;

        // Look for the SVG (may be directly in visualContainer or wrapped in directory-icon div)
        let svg = visualContainer.querySelector('svg.octicon');
        if (!svg) return;

        // For open folders, the SVG is wrapped in .PRIVATE_TreeView-directory-icon
        const svgParent = svg.parentNode;

        // Check if we already have a replacement icon in the parent
        const existingIcon = svgParent.querySelector('img.material-icon-replacement');

        if (existingIcon) {
            // Icon already exists, just make sure the SVG is hidden
            // (This handles folder toggle where GitHub adds a new SVG)
            svg.style.visibility = 'hidden';
            svg.style.position = 'absolute';
            return; // Don't add another icon
        }

        // Check if it's a symlink first
        const isSymlink = svg.classList.contains('octicon-file-symlink-file') ||
                        svg.classList.contains('octicon-file-symlink-directory');

        // Check if it's a folder by looking at the SVG class
        // Treat both closed and open folder icons the same
        const isFolder = svg.classList.contains('octicon-file-directory') ||
                       svg.classList.contains('octicon-file-directory-fill') ||
                       svg.classList.contains('octicon-file-directory-open-fill');

        // Get the appropriate icon
        let iconDataUri;
        if (isSymlink) {
            iconDataUri = ICON_MAPPINGS.symlink;
        } else if (isFolder) {
            iconDataUri = getFolderIcon(name);
        } else {
            iconDataUri = getFileIcon(name);
        }
        if (!iconDataUri) return;

        // Hide the original SVG
        svg.style.visibility = 'hidden';
        svg.style.position = 'absolute';

        // Insert our icon after the hidden SVG
        const img = createIconImg(iconDataUri);
        svgParent.insertBefore(img, svg.nextSibling);
        if (stats) stats.replaced++;
    }

    /**
     * Replace icons in the file browser
     */
    function replaceIcons() {
        const stats = { replaced: 0 };

        // Main file browser (right panel)
        // GitHub uses div[role="row"] for file list items
        let items = document.querySelectorAll('div[role="row"]');

        // Alternative: table-based layout
        if (items.length === 0) {
            items = document.querySelectorAll('tbody tr.react-directory-row, tbody tr[id^="folder-row-"]');
        }

        items.forEach(item => {
            replaceIconForItem(item, stats);
        });

        // Tree view (left sidebar file tree)
        const treeItems = document.querySelectorAll('.PRIVATE_TreeView-item-content');
        treeItems.forEach(item => {
            replaceIconForTreeItem(item, stats);
        });

        if (stats.replaced > 0) {
            console.log('[Material Icons] Replaced', stats.replaced, 'icons');
        }
    }


    /**
     * Initialize the script
     */
    function init() {
        console.log('[Material Icons] Loaded:',
                    Object.keys(ICON_MAPPINGS.extensions).length, 'extensions,',
                    Object.keys(ICON_MAPPINGS.filenames).length, 'filenames,',
                    Object.keys(ICON_MAPPINGS.folders).length, 'folders');

        // Check for conflicting browser extension
        if (document.querySelector('[data-material-icons-extension]')) {
            console.warn('[Material Icons] Detected Material Icons browser extension - userscript disabled to avoid conflicts.');
            console.info('[Material Icons] To use this userscript, disable the Material Icons browser extension.');
            return;
        }

        // Replace icons on initial load
        replaceIcons();

        // Watch for DOM changes (GitHub is an SPA and Refined GitHub adds edit links)
        // Watch for URL changes (GitHub SPA navigation)
        let lastUrl = location.href;
        const urlObserver = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                // Observer will catch when GitHub adds the new rows
            }
        });
        urlObserver.observe(document.querySelector('title'), {
            childList: true,
            subtree: true
        });

        // Also listen for browser back/forward
        window.addEventListener('popstate', () => {
            // Observer will catch when GitHub adds the new rows
        });

        setTimeout(() => {
            const observer = new MutationObserver((mutations) => {
                let rowsToProcess = new Set();

                for (const mutation of mutations) {
                    // Check if our icon was removed
                    for (const node of mutation.removedNodes) {
                        if (node.nodeType === 1 && node.classList?.contains('material-icon-replacement')) {
                            // Our icon was removed - find the row and re-process it
                            const row = mutation.target.closest('div[role="row"], tr.react-directory-row');
                            if (row) {
                                rowsToProcess.add(row);
                            }
                        }
                    }

                    // Check if SVG visibility was changed (GitHub might be un-hiding it)
                    if (mutation.type === 'attributes' && mutation.target.tagName === 'svg') {
                        const svg = mutation.target;
                        if (svg.getAttribute('class')?.includes('octicon-file')) {
                            // Check if the SVG was made visible again
                            if (svg.style.visibility !== 'hidden') {
                                const row = svg.closest('div[role="row"], tr.react-directory-row');
                                if (row) {
                                    rowsToProcess.add(row);
                                }
                            }
                        }
                    }

                    // Ignore mutations from our own icon additions
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) {
                            // Skip our own icon replacements
                            if (node.classList?.contains('material-icon-replacement')) {
                                continue;
                            }

                            // Check if this is a new SVG in tree view (folder open/close toggle)
                            if (node.matches && node.matches('svg.octicon')) {
                                const treeItem = node.closest('.PRIVATE_TreeView-item-content');
                                if (treeItem) {
                                    rowsToProcess.add(treeItem);
                                }
                            }

                            // Check if this is a file row or parent directory row
                            if (node.matches && (node.matches('div[role="row"]') || node.matches('tr.react-directory-row') || node.matches('tr[id^="folder-row-"]'))) {
                                rowsToProcess.add(node);
                            }
                            // Check if file rows were added as children
                            else if (node.querySelector) {
                                const rows = node.querySelectorAll('div[role="row"], tr.react-directory-row, tr[id^="folder-row-"]');
                                if (rows.length > 0) {
                                    // Add all found rows to be processed individually
                                    // This catches when GitHub replaces the entire row container
                                    rows.forEach(row => rowsToProcess.add(row));
                                }
                            }

                            // Check if Refined GitHub added an edit link
                            if (node.matches && node.matches('a.rgh-quick-file-edit')) {
                                const row = node.closest('div[role="row"], tr.react-directory-row');
                                if (row) {
                                    rowsToProcess.add(row);
                                }
                            }
                            // Check if edit links were added as children
                            else if (node.querySelector) {
                                const editLinks = node.querySelectorAll('a.rgh-quick-file-edit');
                                if (editLinks.length > 0) {
                                    // Add rows with edit links to be processed individually
                                    editLinks.forEach(link => {
                                        const row = link.closest('div[role="row"], tr.react-directory-row');
                                        if (row) rowsToProcess.add(row);
                                    });
                                }
                            }

                            // Check if this is a tree view item (left sidebar)
                            if (node.matches && node.matches('.PRIVATE_TreeView-item-content')) {
                                rowsToProcess.add(node);
                            }
                            // Check if tree view items were added as children
                            else if (node.querySelector) {
                                const treeItems = node.querySelectorAll('.PRIVATE_TreeView-item-content');
                                if (treeItems.length > 0) {
                                    treeItems.forEach(item => rowsToProcess.add(item));
                                }
                            }
                        }
                    }
                }

                // Process individual items that were added
                if (rowsToProcess.size > 0) {
                    rowsToProcess.forEach(item => {
                        // Determine if this is a tree view item or a file browser row
                        if (item.classList.contains('PRIVATE_TreeView-item-content')) {
                            replaceIconForTreeItem(item);
                        } else {
                            replaceIconForItem(item);
                        }
                    });
                }
            });

            // Start observing
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }, 100);
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 100);
        });
    } else {
        setTimeout(init, 100);
    }
})();
`;
  
  return userscript;
}

/**
 * Main build function
 */
function build() {
  console.log('Building GitHub Material Icons userscript...\n');
  
  try {
    // Build icon mappings
    const mappings = buildIconMappings();
    
    // Generate userscript
    console.log('\nGenerating userscript...');
    const userscript = generateUserscript(mappings);
    
    // Write to dist
    fs.writeFileSync(OUTPUT_FILE, userscript);
    
    const sizeKB = (Buffer.byteLength(userscript) / 1024).toFixed(2);
    console.log(`\n✓ Userscript built successfully!`);
    console.log(`  File: ${OUTPUT_FILE}`);
    console.log(`  Size: ${sizeKB} KB`);

  } catch (error) {
    console.error('Error building userscript:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  build();
}

module.exports = { build };