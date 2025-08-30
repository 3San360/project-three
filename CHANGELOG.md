# Changelog

All notable changes to the Automated Code Review GitHub Action will be documented in this file.

## [1.1.0] - 2025-08-30

### 🚀 Added
- **Enhanced TypeScript Support**: Better analysis for TypeScript files with type-specific checks
- **Configuration System**: Added `.code-review.yml` for easy customization
- **Configuration Helper**: `config-helper.js` script for validation and setup
- **Performance Optimizations**: Parallel analysis and better caching
- **Extended Language Checks**:
  - JavaScript: Strict equality checks, TODO comment detection, any-type warnings
  - Python: Bare except detection, print statement warnings, global variable detection
- **Better Error Handling**: Graceful failure handling across all components
- **Enhanced Comment Formatting**: Improved markdown formatting with severity indicators

### 🛠️ Improved
- **ESLint Integration**: Local installation for better consistency
- **Flake8 Processing**: More robust error handling and better JSON formatting
- **Custom Analyzer**: Enhanced patterns and better regex safety
- **GitHub Action**: Better file validation and security improvements
- **Documentation**: Updated with new features and configuration options

### 🔧 Fixed
- **JSON Processing**: Better handling of malformed linter output
- **File Path Validation**: Enhanced security against directory traversal
- **Memory Management**: Better handling of large files
- **Rate Limiting**: Improved API call management

### 📊 Performance
- **Parallel Analysis**: Run multiple analyzers concurrently
- **Smart Caching**: Better npm and pip dependency caching
- **File Filtering**: Skip analysis for very small or empty files
- **Timeout Handling**: Prevent hanging on problematic files

### 🔒 Security
- **Input Validation**: Enhanced validation for all user inputs
- **Output Sanitization**: Better XSS protection in comments
- **Path Security**: Improved directory traversal protection
- **Token Handling**: More secure GitHub token management

## [1.0.0] - 2025-08-30

### 🎉 Initial Release
- **Multi-language Support**: JavaScript, TypeScript, Python, Java, Go, Rust, PHP, Ruby
- **Integrated Linters**: ESLint and Flake8 integration
- **Custom Analysis**: Best practices analyzer for naming, function length, duplication
- **Inline Comments**: Automated PR comments with suggestions
- **Security-First**: Built with security best practices
- **Comprehensive Documentation**: Complete setup and usage guides
- **Example Files**: Sample code for testing and validation

### 📋 Features
- Automatic PR triggering on file changes
- Configurable rules and thresholds
- Summary comments with statistics
- Check run integration
- Rate limiting and spam prevention
- Cross-platform compatibility

---

## Release Notes

### How to Update

1. **Pull latest changes** from the repository
2. **Update dependencies** with `npm install` in `.github/actions/code-review/`
3. **Review configuration** options in the new `.code-review.yml` file
4. **Test the action** on a test pull request

### Breaking Changes

- None in v1.1.0 (backward compatible)

### Migration Guide

- Configuration is now optional - existing setups will continue to work
- New features are opt-in through the configuration file
- No changes required to existing workflows

### Support

For questions or issues:
1. Check the [README.md](README.md) for detailed documentation
2. Review the [QUICKSTART.md](QUICKSTART.md) for setup help
3. Use the configuration helper: `node scripts/config-helper.js help`
4. Open an issue with logs and repository details
