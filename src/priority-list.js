/**
 * Priority list of file types, filenames, and folders to include icons for.
 * This list is based on WordPress/PHP/React development workflows.
 */

module.exports = {
  // File extensions (without the dot)
  extensions: [
    // PHP & WordPress
    'php',
    'inc',
    
    // JavaScript/TypeScript
    'js',
    'jsx',
    'ts',
    'tsx',
    'mjs',
    'vue',
    'svelte',
    
    // Styling
    'css',
    'scss',
    'sass',
    'less',
    'pcss',
    
    // Config & Data
    'json',
    'xml',
    'yml',
    'yaml',
    'toml',
    'ini',
    'env',
    'csv',
    'tsv',
    
    // Markup
    'html',
    'htm',
    'phtml',
    
    // Assets
    'svg',
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'woff',
    'woff2',
    'ttf',
    'eot',
    
    // Translation
    'pot',
    'po',
    'mo',
    
    // Shell
    'sh',
    'bash',
    'zsh',
    'fish',
    'command',
    
    // Documentation
    'md',
    'mdx',
    'txt',
    'text',
    'rst',
    'pdf',
    
    // Other languages
    'rb',
    'py',
    
    // Lock files
    'lock',
  ],
  
  // Specific filenames (with extension)
  filenames: [
    // WordPress/PHP
    'composer.json',
    'composer.lock',
    'phpunit.xml',
    'phpunit.xml.dist',
    'phpcs.xml',
    'phpcs.xml.dist',
    'phpstan.neon',
    '.phpcs.xml',
    
    // JavaScript/Build
    'package.json',
    'package-lock.json',
    'webpack.config.js',
    'webpack.config.babel.js',
    'rollup.config.js',
    'vite.config.js',
    'tsconfig.json',
    'jsconfig.json',
    '.babelrc',
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.json',
    '.prettierrc',
    '.prettierrc.js',
    '.stylelintrc',
    
    // Gutenberg
    'block.json',
    
    // Git
    '.gitignore',
    '.gitattributes',
    '.gitmodules',
    '.distignore',  // WordPress distribution ignore (uses git icon)
    
    // Editor/IDE
    '.editorconfig',
    
    // Node version
    '.nvmrc',
    '.node-version',
    
    // Docker
    'Dockerfile',
    'docker-compose.yml',
    '.dockerignore',
    
    // CI/CD
    '.travis.yml',
    'playwright.config.js',
    
    // Task runners
    'Gruntfile.js',
    'gulpfile.js',
    'Makefile',
    
    // Environment
    '.env',
    '.env.example',
    '.env.local',
    
    // Ruby
    'Gemfile',
    
    // Docs
    'README.md',
    'LICENSE',
    'LICENSE.txt',
    'CONTRIBUTING.md',
    'CHANGELOG.md',
    'CODE_OF_CONDUCT.md',
  ],
  
  // Folder names
  folders: [
    // WordPress structure
    'wp-content',
    'wp-includes',
    'wp-admin',
    'includes',
    'languages',
    'assets',
    'build',
    'dist',
    'src',
    'admin',
    'docs',
    'images',

    // Dependencies
    'node_modules',
    'vendor',
    'lib',

    // WordPress specific
    'plugins',
    'themes',
    'mu-plugins',

    // Common web dev folders
    'public',
    'private',
    'config',
    'components',
    'routes',
    'api',
    'helpers',
    'utils',
    'models',
    'views',
    'controllers',
    'services',
    'middleware',
    'templates',
    'layouts',

    // Styles & Assets
    'css',
    'sass',
    'scss',
    'fonts',
    'js',

    // Development
    'git',
    'github',
    '.claude',
    '.cursor',
    'tests',
    'test',
    'vscode',
    'bin',
    'examples',
    'tools',
    'webpack',

    // Build artifacts
    'coverage',
    'artifacts',
  ],
};
