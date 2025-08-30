#!/usr/bin/env node

/**
 * Configuration Validator and Helper
 * 
 * This script validates the code review configuration and provides
 * helpful suggestions for optimization.
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('yaml');

const DEFAULT_CONFIG_PATH = '.code-review.yml';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  analysis: {
    max_function_length: 50,
    max_line_length: 120,
    min_variable_name_length: 2,
    max_file_size_mb: 5,
    duplication: {
      min_lines: 5,
      min_chars: 50
    }
  },
  comments: {
    max_comments_per_pr: 50,
    max_comment_length: 2000,
    create_summary: true,
    create_checks: true
  },
  languages: {
    javascript: {
      typescript_checks: true,
      rules: {
        no_console: "warning",
        no_var: "warning",
        prefer_strict_equality: "warning",
        no_any_type: "warning",
        todo_comment: "info"
      }
    },
    python: {
      rules: {
        no_bare_except: "warning",
        no_print: "info",
        no_global: "warning"
      }
    }
  },
  performance: {
    parallel_analysis: true,
    file_timeout: 30,
    skip_large_files: true
  },
  security: {
    validate_paths: true,
    sanitize_output: true,
    rate_limit: true
  }
};

/**
 * Loads and validates configuration file
 * @param {string} configPath - Path to config file
 * @returns {Promise<Object>} Validated configuration
 */
async function loadConfig(configPath = DEFAULT_CONFIG_PATH) {
  try {
    const configExists = await fs.access(configPath).then(() => true).catch(() => false);
    
    if (!configExists) {
      console.log('ℹ️  No configuration file found, using defaults');
      return DEFAULT_CONFIG;
    }
    
    const configContent = await fs.readFile(configPath, 'utf8');
    const userConfig = yaml.parse(configContent);
    
    // Merge with defaults
    const config = deepMerge(DEFAULT_CONFIG, userConfig);
    
    // Validate configuration
    validateConfig(config);
    
    console.log('✅ Configuration loaded and validated successfully');
    return config;
    
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
    console.log('📝 Using default configuration instead');
    return DEFAULT_CONFIG;
  }
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Validates configuration values
 * @param {Object} config - Configuration to validate
 */
function validateConfig(config) {
  const errors = [];
  const warnings = [];
  
  // Validate analysis settings
  if (config.analysis?.max_function_length < 10) {
    warnings.push('max_function_length is very low, might generate too many warnings');
  }
  
  if (config.analysis?.max_line_length < 80) {
    warnings.push('max_line_length is quite short, consider increasing to at least 80');
  }
  
  if (config.analysis?.max_file_size_mb > 50) {
    warnings.push('max_file_size_mb is very high, might cause performance issues');
  }
  
  // Validate comment settings
  if (config.comments?.max_comments_per_pr > 100) {
    warnings.push('max_comments_per_pr is high, might spam pull requests');
  }
  
  if (config.comments?.max_comments_per_pr < 10) {
    warnings.push('max_comments_per_pr is low, some issues might not be reported');
  }
  
  // Validate performance settings
  if (!config.performance?.parallel_analysis) {
    warnings.push('parallel_analysis is disabled, analysis will be slower');
  }
  
  if (config.performance?.file_timeout < 10) {
    warnings.push('file_timeout is very low, might cause timeouts on larger files');
  }
  
  // Report results
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`  • ${error}`));
    throw new Error('Configuration validation failed');
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    warnings.forEach(warning => console.warn(`  • ${warning}`));
  }
}

/**
 * Creates a sample configuration file
 */
async function createSampleConfig() {
  const samplePath = '.code-review.sample.yml';
  const sampleContent = yaml.stringify(DEFAULT_CONFIG);
  
  await fs.writeFile(samplePath, sampleContent);
  console.log(`✅ Sample configuration created: ${samplePath}`);
  console.log('📝 Copy and rename to .code-review.yml to use');
}

/**
 * Main CLI function
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'validate':
      console.log('🔍 Validating configuration...');
      await loadConfig();
      break;
      
    case 'sample':
      console.log('📄 Creating sample configuration...');
      await createSampleConfig();
      break;
      
    case 'help':
    default:
      console.log('🛠️  Code Review Configuration Helper\n');
      console.log('Usage:');
      console.log('  node config-helper.js validate  - Validate current configuration');
      console.log('  node config-helper.js sample    - Create sample configuration file');
      console.log('  node config-helper.js help      - Show this help message');
      break;
  }
}

// Export for use as module
module.exports = {
  loadConfig,
  validateConfig,
  DEFAULT_CONFIG
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}
