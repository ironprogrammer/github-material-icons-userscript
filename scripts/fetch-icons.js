/**
 * Fetch icons from material-extensions/vscode-material-icon-theme
 * Uses git clone/pull to sync the upstream repo, then copies needed icons.
 * 
 * This approach is much simpler and more reliable than HTTP API calls:
 * - Clone once, pull to update
 * - Direct file access (no network per-file)
 * - Works offline after initial clone
 * - Easy to see what version you have
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MATERIAL_ICONS_REPO = 'https://github.com/material-extensions/vscode-material-icon-theme.git';
const VENDOR_DIR = path.join(__dirname, '..', 'vendor');
const MATERIAL_ICONS_DIR = path.join(VENDOR_DIR, 'material-icon-theme');
const CACHE_DIR = path.join(__dirname, '..', 'cache');
const ICONS_DIR = path.join(CACHE_DIR, 'icons');

// Ensure directories exist
[VENDOR_DIR, CACHE_DIR, ICONS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Execute a shell command and return output
 */
function exec(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

/**
 * Clone or update the material-icon-theme repository
 */
function syncMaterialIconTheme() {
  console.log('Syncing material-icon-theme repository...\n');
  
  if (fs.existsSync(MATERIAL_ICONS_DIR)) {
    // Already cloned, just update it
    console.log('  Repository exists, updating...');
    try {
      exec('git pull', { cwd: MATERIAL_ICONS_DIR });
      console.log('  ✓ Updated to latest version\n');
    } catch (error) {
      console.log('  ⚠ Could not update (using existing version)\n');
    }
  } else {
    // Clone the repository
    console.log('  Cloning repository (this may take a minute)...');
    exec(`git clone --depth 1 ${MATERIAL_ICONS_REPO} "${MATERIAL_ICONS_DIR}"`);
    console.log('  ✓ Repository cloned\n');
  }
  
  // Show current commit info
  try {
    const commitHash = exec('git rev-parse --short HEAD', { cwd: MATERIAL_ICONS_DIR }).trim();
    const commitDate = exec('git log -1 --format=%cd --date=short', { cwd: MATERIAL_ICONS_DIR }).trim();
    console.log(`  Using version: ${commitHash} (${commitDate})\n`);
  } catch (error) {
    // Ignore if we can't get git info
  }
}

/**
 * Copy icon configuration files
 */
function copyIconConfigs() {
  console.log('Copying icon configuration files...');
  
  // Try both .ts and .json extensions (repo structure has changed over time)
  const fileIconsTs = path.join(MATERIAL_ICONS_DIR, 'src/core/icons/fileIcons.ts');
  const folderIconsTs = path.join(MATERIAL_ICONS_DIR, 'src/core/icons/folderIcons.ts');
  const fileIconsJson = path.join(MATERIAL_ICONS_DIR, 'src/icons/fileIcons.json');
  const folderIconsJson = path.join(MATERIAL_ICONS_DIR, 'src/icons/folderIcons.json');
  
  // Determine which files exist
  const fileIconsSource = fs.existsSync(fileIconsTs) ? fileIconsTs : fileIconsJson;
  const folderIconsSource = fs.existsSync(folderIconsTs) ? folderIconsTs : folderIconsJson;
  
  if (!fs.existsSync(fileIconsSource)) {
    throw new Error(
      'Icon config files not found. Checked:\n' +
      `  - ${fileIconsTs}\n` +
      `  - ${fileIconsJson}\n` +
      'The repository structure may have changed.'
    );
  }
  
  // If we have .ts files, we need to parse them differently
  const isTypeScript = fileIconsSource.endsWith('.ts');
  
  if (isTypeScript) {
    console.log('  Found TypeScript config files, parsing...');
    return parseTypeScriptConfigs(fileIconsSource, folderIconsSource);
  } else {
    // Old JSON format
    const fileIconsDest = path.join(CACHE_DIR, 'fileIcons.json');
    const folderIconsDest = path.join(CACHE_DIR, 'folderIcons.json');
    
    fs.copyFileSync(fileIconsSource, fileIconsDest);
    fs.copyFileSync(folderIconsSource, folderIconsDest);
    
    console.log('  ✓ fileIcons.json copied');
    console.log('  ✓ folderIcons.json copied\n');
    
    return {
      fileIcons: JSON.parse(fs.readFileSync(fileIconsDest, 'utf8')),
      folderIcons: JSON.parse(fs.readFileSync(folderIconsDest, 'utf8'))
    };
  }
}

/**
 * Map of VSCode language IDs to common file extensions
 * Used to convert languageIcons to fileExtensions
 */
const LANGUAGE_TO_EXTENSIONS = {
  'php': ['php'],
  'javascript': ['js'],
  'typescript': ['ts'],
  'python': ['py'],
  'ruby': ['rb'],
  'java': ['java'],
  'go': ['go'],
  'rust': ['rs'],
  'c': ['c'],
  'cpp': ['cpp', 'cc', 'cxx'],
  'csharp': ['cs'],
  'swift': ['swift'],
  'kotlin': ['kt'],
  'scala': ['scala'],
  'perl': ['pl'],
  'haxe': ['hx'],
  'elixir': ['ex'],
  'erlang': ['erl'],
  'julia': ['jl'],
  'elm': ['elm'],
  'hack': ['hack'],
  'nim': ['nim'],
  'nix': ['nix'],
  'r': ['r'],
  'dart': ['dart'],
  'clojure': ['clj'],
  'coffeescript': ['coffee'],
  'livescript': ['ls'],
  'lua': ['lua'],
  'matlab': ['m'],
  'zig': ['zig'],
  'solidity': ['sol'],
  'fsharp': ['fs'],
  'ocaml': ['ml'],
  'reason': ['re'],
  'haskell': ['hs'],
  'purescript': ['purs'],
  'vb': ['vb'],
  'groovy': ['groovy'],
  'powershell': ['ps1'],
  'objective-c': ['m'],
  'vue': ['vue'],
  'svelte': ['svelte'],
};

/**
 * Parse languageIcons.ts to extract language-based icon mappings
 */
function parseLanguageIcons(languageIconsPath) {
  console.log('  Parsing language icons...');

  try {
    const content = fs.readFileSync(languageIconsPath, 'utf8');
    const languageMappings = {};

    // Parse language icons - look for patterns like:
    // { name: 'php', ids: ['php'] }
    const iconPattern = /{[^}]*name:\s*['"]([^'"]+)['"][^}]*ids:\s*\[([^\]]+)\]/g;

    const matches = [...content.matchAll(iconPattern)];
    if (matches.length === 0) {
      console.log('  ⚠ Warning: No language icon patterns found - upstream format may have changed');
      return {};
    }

    matches.forEach(match => {
      const iconName = match[1];
      const idsStr = match[2];
      const ids = idsStr.match(/['"]([^'"]+)['"]/g);

      if (ids) {
        ids.forEach(id => {
          const cleanId = id.replace(/['"]/g, '');
          // Map language ID to icon name
          languageMappings[cleanId] = iconName;
        });
      }
    });

    const count = Object.keys(languageMappings).length;
    if (count < 50) {
      console.log(`  ⚠ Warning: Only parsed ${count} language mappings (expected 100+) - check upstream format`);
    } else {
      console.log(`  ✓ Parsed ${count} language mappings`);
    }

    return languageMappings;
  } catch (error) {
    console.log(`  ⚠ Error parsing language icons: ${error.message}`);
    console.log('  Continuing without language icon mappings...');
    return {};
  }
}

/**
 * Expand FileNamePattern patterns to actual file names
 */
const FILE_NAME_PATTERNS = {
  ecmascript: ['js', 'mjs', 'cjs', 'ts', 'mts', 'cts'],
  configuration: ['json', 'jsonc', 'json5', 'yaml', 'yml', 'toml'],
  nodeEcosystem: ['js', 'mjs', 'cjs', 'ts', 'mts', 'cts', 'json', 'jsonc', 'json5', 'yaml', 'yml', 'toml'],
  yaml: ['yaml', 'yml'],
};

/**
 * Parse TypeScript config files to extract icon mappings
 */
function parseTypeScriptConfigs(fileIconsPath, folderIconsPath) {
  console.log('  Parsing TypeScript configuration files...');

  try {
    const fileIconsContent = fs.readFileSync(fileIconsPath, 'utf8');
    const folderIconsContent = fs.readFileSync(folderIconsPath, 'utf8');

    // Extract icon mappings from TypeScript files
    // The format is: { name: 'iconName', fileExtensions: ['ext1', 'ext2'], fileNames: ['file1'] }
    const fileIcons = {
      fileExtensions: {},
      fileNames: {}
    };

    const folderIcons = {
      folderNames: {}
    };

    // Parse file icons - look for patterns like:
    // { name: 'javascript', fileExtensions: ['js', 'mjs'] }
    const iconPattern = /{[^}]*name:\s*['"]([^'"]+)['"]/g;

    // Parse file icons
    const fileIconMatches = [...fileIconsContent.matchAll(iconPattern)];
    if (fileIconMatches.length === 0) {
      throw new Error('No file icon definitions found in TypeScript config');
    }

    fileIconMatches.forEach((match, index) => {
      const iconName = match[1];
      const blockStart = match.index;

      // Find the matching closing brace for this icon block
      // We need to count braces to find the correct end
      let braceCount = 0;
      let blockEnd = blockStart;
      let inBlock = false;

      for (let i = blockStart; i < fileIconsContent.length; i++) {
        if (fileIconsContent[i] === '{') {
          braceCount++;
          inBlock = true;
        } else if (fileIconsContent[i] === '}') {
          braceCount--;
          if (inBlock && braceCount === 0) {
            blockEnd = i;
            break;
          }
        }
      }

      // Validate we found a matching brace
      if (blockEnd === blockStart || braceCount !== 0) {
        console.log(`  ⚠ Warning: Could not find matching brace for icon "${iconName}" - skipping`);
        return;
      }

      const block = fileIconsContent.substring(blockStart, blockEnd + 1);

    // Extract extensions
    const extMatch = block.match(/fileExtensions:\s*\[([^\]]+)\]/);
    if (extMatch) {
      const extensions = extMatch[1].match(/['"]([^'"]+)['"]/g);
      if (extensions) {
        extensions.forEach(ext => {
          const cleanExt = ext.replace(/['"]/g, '');
          fileIcons.fileExtensions[cleanExt] = iconName;
        });
      }
    }

    // Extract file names
    const nameMatch = block.match(/fileNames:\s*\[([^\]]+)\]/);
    if (nameMatch) {
      const names = nameMatch[1].match(/['"]([^'"]+)['"]/g);
      if (names) {
        names.forEach(name => {
          const cleanName = name.replace(/['"]/g, '');
          fileIcons.fileNames[cleanName] = iconName;
        });
      }
    }

    // Extract patterns (e.g., 'webpack.config': FileNamePattern.Ecmascript)
    const patternsMatch = block.match(/patterns:\s*{([\s\S]*?)}/);
    if (patternsMatch) {
      const patternsContent = patternsMatch[1];
      // Match patterns like: 'webpack.config': FileNamePattern.Ecmascript
      const patternEntries = patternsContent.match(/['"]([^'"]+)['"]:\s*FileNamePattern\.(\w+)/g);
      if (patternEntries) {
        patternEntries.forEach(entry => {
          const entryMatch = entry.match(/['"]([^'"]+)['"]:\s*FileNamePattern\.(\w+)/);
          if (entryMatch) {
            const baseName = entryMatch[1];
            const patternType = entryMatch[2].toLowerCase();
            const extensions = FILE_NAME_PATTERNS[patternType];

            if (extensions) {
              extensions.forEach(ext => {
                const fullName = `${baseName}.${ext}`;
                fileIcons.fileNames[fullName] = iconName;
              });
            }
          }
        });
      }
    }
  });

  // Parse folder icons
  const folderIconMatches = [...folderIconsContent.matchAll(iconPattern)];
  if (folderIconMatches.length === 0) {
    console.log('  ⚠ Warning: No folder icon definitions found - upstream format may have changed');
  }

  folderIconMatches.forEach(match => {
    const iconName = match[1];
    const blockStart = match.index;
    const blockEnd = folderIconsContent.indexOf('}', blockStart);

    // Validate we found a closing brace
    if (blockEnd === -1 || blockEnd <= blockStart) {
      console.log(`  ⚠ Warning: Could not find closing brace for folder icon "${iconName}" - skipping`);
      return;
    }

    const block = folderIconsContent.substring(blockStart, blockEnd);

    // Extract folder names
    const nameMatch = block.match(/folderNames:\s*\[([^\]]+)\]/);
    if (nameMatch) {
      const names = nameMatch[1].match(/['"]([^'"]+)['"]/g);
      if (names) {
        names.forEach(name => {
          const cleanName = name.replace(/['"]/g, '');
          folderIcons.folderNames[cleanName] = iconName;
        });
      }
    }
  });

  // Also parse languageIcons.ts to get language-based mappings
  const languageIconsPath = path.join(MATERIAL_ICONS_DIR, 'src/core/icons/languageIcons.ts');
  if (fs.existsSync(languageIconsPath)) {
    const languageMappings = parseLanguageIcons(languageIconsPath);

    // Convert language IDs to file extensions
    let languageExtensionsAdded = 0;
    for (const [langId, iconName] of Object.entries(languageMappings)) {
      const extensions = LANGUAGE_TO_EXTENSIONS[langId];
      if (extensions) {
        extensions.forEach(ext => {
          // Only add if not already defined by fileExtensions
          if (!fileIcons.fileExtensions[ext]) {
            fileIcons.fileExtensions[ext] = iconName;
            languageExtensionsAdded++;
          }
        });
      }
    }

    if (languageExtensionsAdded > 0) {
      console.log(`  ✓ Added ${languageExtensionsAdded} extensions from language icons`);
    }
  }

    // Validate parsing results
    const extCount = Object.keys(fileIcons.fileExtensions).length;
    const fileNameCount = Object.keys(fileIcons.fileNames).length;
    const folderCount = Object.keys(folderIcons.folderNames).length;

    // Check for suspiciously low counts (upstream usually has 1000+ extensions, 1000+ filenames, 500+ folders)
    if (extCount < 100) {
      console.log(`  ⚠ Warning: Only parsed ${extCount} file extensions (expected 1000+) - upstream format may have changed`);
    }
    if (fileNameCount < 100) {
      console.log(`  ⚠ Warning: Only parsed ${fileNameCount} file names (expected 1000+) - upstream format may have changed`);
    }
    if (folderCount < 50) {
      console.log(`  ⚠ Warning: Only parsed ${folderCount} folder names (expected 500+) - upstream format may have changed`);
    }

    // Save parsed configs to cache
    fs.writeFileSync(
      path.join(CACHE_DIR, 'fileIcons.json'),
      JSON.stringify(fileIcons, null, 2)
    );
    fs.writeFileSync(
      path.join(CACHE_DIR, 'folderIcons.json'),
      JSON.stringify(folderIcons, null, 2)
    );

    console.log(`  ✓ Parsed ${extCount} file extensions`);
    console.log(`  ✓ Parsed ${fileNameCount} file names`);
    console.log(`  ✓ Parsed ${folderCount} folder names\n`);

    return { fileIcons, folderIcons };

  } catch (error) {
    console.error('\n✗ Error parsing TypeScript configs:', error.message);
    console.error('\nPossible causes:');
    console.error('  - Upstream repository format has changed');
    console.error('  - TypeScript files are malformed');
    console.error('  - File paths have changed\n');
    console.error('Please check the upstream repository at:');
    console.error('  https://github.com/material-extensions/vscode-material-icon-theme\n');
    throw error;
  }
}

/**
 * Copy needed SVG icons based on priority list
 */
function copyNeededIcons(fileIcons, folderIcons) {
  console.log('Copying needed SVG icons...');
  
  const priorityList = require('../src/priority-list.js');
  const neededIcons = new Set();

  // Map extensions to icon names
  if (fileIcons.fileExtensions) {
    priorityList.extensions.forEach(ext => {
      if (fileIcons.fileExtensions[ext]) {
        neededIcons.add(fileIcons.fileExtensions[ext]);
      }
    });
  }
  
  // Map specific filenames to icon names
  if (fileIcons.fileNames) {
    priorityList.filenames.forEach(filename => {
      if (fileIcons.fileNames[filename]) {
        neededIcons.add(fileIcons.fileNames[filename]);
      }
    });
  }
  
  // Map folder names to icon names
  if (folderIcons.folderNames) {
    priorityList.folders.forEach(folder => {
      if (folderIcons.folderNames[folder]) {
        neededIcons.add(folderIcons.folderNames[folder]);
      }
    });
  }
  
  console.log(`  Found ${neededIcons.size} unique icons needed\n`);
  
  // Copy SVG files
  const iconsSourceDir = path.join(MATERIAL_ICONS_DIR, 'icons');
  let copied = 0;
  let skipped = 0;
  let missing = 0;
  
  for (const iconName of neededIcons) {
    const sourcePath = path.join(iconsSourceDir, `${iconName}.svg`);
    const destPath = path.join(ICONS_DIR, `${iconName}.svg`);
    
    if (!fs.existsSync(sourcePath)) {
      console.log(`  ⚠ Missing: ${iconName}.svg (not in upstream repo)`);
      missing++;
      continue;
    }
    
    // Check if file already exists and is identical
    if (fs.existsSync(destPath)) {
      const sourceContent = fs.readFileSync(sourcePath);
      const destContent = fs.readFileSync(destPath);
      if (sourceContent.equals(destContent)) {
        skipped++;
        continue;
      }
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, destPath);
    copied++;
  }
  
  console.log(`  ✓ Copied ${copied} new/updated icons`);
  if (skipped > 0) {
    console.log(`  ✓ Skipped ${skipped} unchanged icons`);
  }
  if (missing > 0) {
    console.log(`  ⚠ Missing ${missing} icons (check priority list)`);
  }
  console.log();
  
  return { copied, skipped, missing, total: neededIcons.size };
}

/**
 * Main fetch function
 */
async function fetchIcons() {
  console.log('=== Fetching Material Icons ===\n');
  
  try {
    // 1. Clone/update the material-icon-theme repo
    syncMaterialIconTheme();
    
    // 2. Copy icon configuration files
    const { fileIcons, folderIcons } = copyIconConfigs();
    
    // 3. Copy needed icon files
    const stats = copyNeededIcons(fileIcons, folderIcons);
    
    // 4. Summary
    console.log('✓ Complete!');
    console.log(`  Total icons: ${stats.total}`);
    console.log(`  Copied: ${stats.copied}`);
    console.log(`  Unchanged: ${stats.skipped}`);
    if (stats.missing > 0) {
      console.log(`  Missing: ${stats.missing} (these may need different names in priority-list.js)`);
    }
    console.log(`\nIcons saved to: ${ICONS_DIR}`);
    console.log(`Source repo: ${MATERIAL_ICONS_DIR}`);
    
  } catch (error) {
    console.error('\n✗ Error fetching icons:', error.message);
    console.error('\nMake sure you have git installed and can access GitHub.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fetchIcons();
}

module.exports = { fetchIcons };
