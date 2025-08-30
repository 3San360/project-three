# 🚀 Deployment Guide

## Option 1: Quick Setup (Recommended)

### Step 1: Create GitHub Repository
1. Go to [GitHub](https://github.com) and click "New repository"
2. Choose a name like `automated-code-review` or `code-review-action`
3. Make it **Public** (required for GitHub Actions in free accounts)
4. **Don't** initialize with README, .gitignore, or license (we already have them)
5. Click "Create repository"

### Step 2: Push Your Code
Run the setup script:
```powershell
# In PowerShell, navigate to your project directory
cd "c:\Users\Seconize\Imp_repos\project-three"

# Run the setup script
.\setup-github.ps1
```

The script will:
- ✅ Verify git configuration
- ✅ Ask for your GitHub repository details
- ✅ Set up remote origin
- ✅ Push all files to GitHub
- ✅ Provide next steps

## Option 2: Manual Setup

### Step 1: Check Git Configuration
```bash
git config user.name    # Should show your name
git config user.email   # Should show your email

# If not configured:
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 2: Add Remote Repository
```bash
# Replace USERNAME and REPO_NAME with your values
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 3: Enable GitHub Actions

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click **Actions** → **General**
4. Under "Actions permissions", select **"Allow all actions and reusable workflows"**
5. Click **Save**

## Step 4: Test the Action

### Create a Test Pull Request:

1. **Create a new branch:**
   ```bash
   git checkout -b test-code-review
   ```

2. **Add a test file with issues:**
   ```javascript
   // test-file.js
   var x = 1;  // Should use let/const
   console.log(x);  // Console statement
   
   function verylongfunctionnamethatdoesntfollowconventions() {
       let a = 1;  // Non-descriptive variable
       let b = 2;  // Non-descriptive variable
       return a + b;
   }
   ```

3. **Commit and push:**
   ```bash
   git add test-file.js
   git commit -m "Add test file to trigger code review"
   git push origin test-code-review
   ```

4. **Create Pull Request:**
   - Go to your repository on GitHub
   - Click "Compare & pull request"
   - Create the pull request
   - Watch the action run automatically! 🎉

## Step 5: Verify It Works

You should see:
- ✅ A check run called "Automated Code Review"
- ✅ Inline comments on problematic lines
- ✅ A summary comment with statistics
- ✅ Check status (pass/fail) based on issues found

## 🔧 Customization After Deployment

### Adjust Rules
- **ESLint**: Edit `.eslintrc.json` in your repository
- **Flake8**: Edit `.flake8` in your repository  
- **Custom**: Edit `scripts/best-practices-analyzer.js`

### Add More Languages
Edit `.github/workflows/code-review.yml` and add file extensions:
```yaml
paths:
  - '**/*.your-extension'
```

### Repository Settings
1. **Branch Protection**: Consider adding branch protection rules
2. **Required Checks**: Make the code review check required
3. **Permissions**: Ensure the action has necessary permissions

## 🚨 Troubleshooting

### Action Doesn't Run
- ✅ Check that workflow file is in the `main` branch
- ✅ Verify GitHub Actions are enabled
- ✅ Check file paths match the trigger conditions

### Permission Issues
- ✅ Ensure repository is public or you have GitHub Pro/Team
- ✅ Check `GITHUB_TOKEN` permissions in workflow file
- ✅ Verify Actions have write access to pull requests

### No Comments Appear
- ✅ Check the Actions logs for errors
- ✅ Verify files have supported extensions (`.js`, `.ts`, `.py`, etc.)
- ✅ Make sure there are actual issues to report

### Authentication Issues
```bash
# For HTTPS (will prompt for token):
git remote set-url origin https://github.com/USERNAME/REPO_NAME.git

# For SSH (requires SSH key setup):
git remote set-url origin git@github.com:USERNAME/REPO_NAME.git
```

## 📊 Expected Results

After successful deployment, every pull request will:

1. **Trigger automatically** when files are changed
2. **Run linters** (ESLint, Flake8, custom analyzer)  
3. **Post inline comments** on problematic lines
4. **Create summary** with statistics and suggestions
5. **Set check status** (✅ pass or ❌ fail)

## 🎯 Pro Tips

1. **Start Small**: Test with a few file types first
2. **Customize Gradually**: Adjust rules based on your team's needs
3. **Monitor Performance**: Check action execution times
4. **Team Adoption**: Share the QUICKSTART.md with your team
5. **Iterate**: Continuously improve rules based on feedback

---

**🎉 Once deployed, your team will have automated code review on every pull request!**

Need help? Check the [README.md](README.md) for detailed documentation or open an issue in the repository.
