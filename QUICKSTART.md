# Quick Setup Guide

## 🚀 Quick Start (5 minutes)

1. **Copy the files** to your repository:
   ```bash
   # Copy these directories to your repo root:
   .github/workflows/code-review.yml
   .github/actions/code-review/
   scripts/best-practices-analyzer.js
   ```

2. **Commit and push** to your default branch (main/master)

3. **Test it**:
   - Create a new branch
   - Add some code with issues (see examples/ folder)
   - Open a pull request
   - Watch the magic happen! ✨

## 🎯 What Happens Next

The action will:
- ✅ Run ESLint on JS/TS files
- ✅ Run Flake8 on Python files
- ✅ Run custom best practices analysis
- ✅ Post inline comments on your PR
- ✅ Create a summary comment with statistics

## 🔧 Customization

### Add More Languages
Edit `.github/workflows/code-review.yml` and add your file extensions:
```yaml
paths:
  - '**/*.your-extension'
```

### Adjust Rules
- **ESLint**: Edit `.eslintrc.json`
- **Flake8**: Edit `.flake8`
- **Custom**: Edit `scripts/best-practices-analyzer.js`

### Change Limits
In `scripts/best-practices-analyzer.js`:
```javascript
const MAX_FUNCTION_LENGTH = 50;    // Max lines per function
const MAX_LINE_LENGTH = 120;       // Max characters per line
const MAX_COMMENTS_PER_PR = 50;    // Max inline comments
```

## 🐛 Troubleshooting

**Action doesn't run?**
- Check workflow file is in default branch
- Verify GitHub Actions are enabled
- Check file paths match the `paths` filter

**No comments appear?**
- Check Action logs for errors
- Verify token has proper permissions
- Make sure files have supported extensions

**Need help?**
- Check the full README.md for detailed docs
- Review example files in `examples/` folder
- Open an issue with your logs

---
**Happy coding! 🎉**
