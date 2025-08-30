# GitHub Repository Setup Script
# Run this script to push your automated code review action to GitHub

Write-Host "🚀 Setting up Automated Code Review Action on GitHub" -ForegroundColor Green
Write-Host ""

# Check if git is configured
$gitUserName = git config user.name
$gitUserEmail = git config user.email

if (-not $gitUserName -or -not $gitUserEmail) {
    Write-Host "⚠️  Git is not configured. Please set up your git config first:" -ForegroundColor Yellow
    Write-Host "git config --global user.name 'Your Name'"
    Write-Host "git config --global user.email 'your.email@example.com'"
    Write-Host ""
    exit 1
}

Write-Host "✅ Git configured as: $gitUserName <$gitUserEmail>" -ForegroundColor Green

# Get repository URL from user
Write-Host ""
Write-Host "📝 Please create a new repository on GitHub first, then provide the details:" -ForegroundColor Cyan
Write-Host ""

$repoOwner = Read-Host "Enter your GitHub username/organization"
$repoName = Read-Host "Enter repository name (e.g., automated-code-review)"

if (-not $repoOwner -or -not $repoName) {
    Write-Host "❌ Repository owner and name are required!" -ForegroundColor Red
    exit 1
}

$repoUrl = "https://github.com/$repoOwner/$repoName.git"

Write-Host ""
Write-Host "🔗 Repository URL: $repoUrl" -ForegroundColor Blue

# Confirm with user
$confirm = Read-Host "Continue with push to this repository? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Operation cancelled by user" -ForegroundColor Red
    exit 1
}

try {
    # Set up remote origin
    Write-Host ""
    Write-Host "🔧 Setting up remote origin..." -ForegroundColor Yellow
    git remote add origin $repoUrl
    
    # Set default branch to main
    Write-Host "🔧 Setting default branch to main..." -ForegroundColor Yellow
    git branch -M main
    
    # Push to GitHub
    Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    Write-Host ""
    Write-Host "🎉 SUCCESS! Your automated code review action is now hosted on GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Visit your repository: https://github.com/$repoOwner/$repoName"
    Write-Host "2. Enable GitHub Actions in repository settings"
    Write-Host "3. Create a test pull request to see the action in work"
    Write-Host "4. Check the README.md for customization options"
    Write-Host ""
    Write-Host "🔗 Repository: https://github.com/$repoOwner/$repoName" -ForegroundColor Blue
    Write-Host "📖 Quick Start: https://github.com/$repoOwner/$repoName/blob/main/QUICKSTART.md" -ForegroundColor Blue
    
} catch {
    Write-Host ""
    Write-Host "❌ Error occurred while pushing to GitHub:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Common solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure the repository exists on GitHub"
    Write-Host "2. Check your GitHub authentication (token/SSH key)"
    Write-Host "3. Verify you have push access to the repository"
    Write-Host "4. Try: git remote set-url origin git@github.com:$repoOwner/$repoName.git (for SSH)"
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
