# Repository Rename Helper Script
# This script helps you rename your GitHub repository and update local references

Write-Host "🔄 GitHub Repository Rename Helper" -ForegroundColor Green
Write-Host ""

# Current repository information
$currentOwner = "3San360"
$currentRepo = "project-three"
$currentUrl = "https://github.com/$currentOwner/$currentRepo.git"

Write-Host "📋 Current Repository Information:" -ForegroundColor Cyan
Write-Host "  Owner: $currentOwner"
Write-Host "  Repository: $currentRepo"
Write-Host "  URL: $currentUrl"
Write-Host ""

# Suggested new names
Write-Host "💡 Suggested Repository Names:" -ForegroundColor Yellow
Write-Host "  1. automated-code-review-action (recommended - descriptive)"
Write-Host "  2. pr-code-reviewer (concise)"
Write-Host "  3. smart-code-review (catchy)"
Write-Host "  4. code-quality-guardian (professional)"
Write-Host "  5. github-pr-reviewer (clear purpose)"
Write-Host ""

# Get new repository name from user
$newRepoName = Read-Host "Enter the new repository name"

if (-not $newRepoName) {
    Write-Host "❌ Repository name is required!" -ForegroundColor Red
    exit 1
}

$newUrl = "https://github.com/$currentOwner/$newRepoName.git"

Write-Host ""
Write-Host "🔄 Planned Changes:" -ForegroundColor Blue
Write-Host "  From: $currentRepo"
Write-Host "  To:   $newRepoName"
Write-Host "  New URL: $newUrl"
Write-Host ""

# Confirm with user
$confirm = Read-Host "Continue with repository rename? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Operation cancelled by user" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Steps to rename your repository:" -ForegroundColor Green
Write-Host ""
Write-Host "1. 🌐 On GitHub.com:" -ForegroundColor Cyan
Write-Host "   a. Go to https://github.com/$currentOwner/$currentRepo"
Write-Host "   b. Click on 'Settings' tab"
Write-Host "   c. Scroll down to 'Repository name' section"
Write-Host "   d. Change name from '$currentRepo' to '$newRepoName'"
Write-Host "   e. Click 'Rename' button"
Write-Host ""

Write-Host "2. 💻 In your local repository:" -ForegroundColor Cyan
Write-Host "   After renaming on GitHub, run these commands:"
Write-Host ""
Write-Host "   git remote set-url origin $newUrl" -ForegroundColor White
Write-Host "   git push -u origin master" -ForegroundColor White
Write-Host ""

Write-Host "3. 📁 Optional - Rename local folder:" -ForegroundColor Cyan
Write-Host "   You can rename this folder from 'project-three' to '$newRepoName'"
Write-Host ""

Write-Host "4. ✅ Verify the changes:" -ForegroundColor Cyan
Write-Host "   git remote -v" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  Important Notes:" -ForegroundColor Yellow
Write-Host "  • Existing clones will need to update their remote URL"
Write-Host "  • Any existing pull requests and issues will be preserved"
Write-Host "  • GitHub will redirect the old URL to the new one temporarily"
Write-Host "  • Update any documentation or links that reference the old name"
Write-Host ""

# Ask if user wants to automatically update the remote URL (after GitHub rename)
$updateRemote = Read-Host "After you rename on GitHub, would you like me to update the remote URL automatically? (y/N)"

if ($updateRemote -eq 'y' -or $updateRemote -eq 'Y') {
    Write-Host ""
    Write-Host "⏳ Waiting for you to rename the repository on GitHub..." -ForegroundColor Yellow
    Write-Host "Press any key after you've completed the rename on GitHub.com"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    try {
        Write-Host ""
        Write-Host "🔧 Updating remote URL..." -ForegroundColor Yellow
        git remote set-url origin $newUrl
        
        Write-Host "📤 Testing connection..." -ForegroundColor Yellow
        git remote -v
        
        Write-Host ""
        Write-Host "🎉 Repository successfully renamed and updated!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Summary:" -ForegroundColor Cyan
        Write-Host "  ✅ Remote URL updated to: $newUrl"
        Write-Host "  ✅ Repository now accessible at: https://github.com/$currentOwner/$newRepoName"
        Write-Host ""
        Write-Host "🔗 Quick Links:" -ForegroundColor Blue
        Write-Host "  Repository: https://github.com/$currentOwner/$newRepoName"
        Write-Host "  Issues: https://github.com/$currentOwner/$newRepoName/issues"
        Write-Host "  Actions: https://github.com/$currentOwner/$newRepoName/actions"
        
    } catch {
        Write-Host ""
        Write-Host "❌ Error updating remote URL:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Manual fix:" -ForegroundColor Yellow
        Write-Host "Run: git remote set-url origin $newUrl"
    }
}

Write-Host ""
Write-Host "📚 Don't forget to update:" -ForegroundColor Cyan
Write-Host "  • README.md links and badges"
Write-Host "  • Documentation references"
Write-Host "  • CI/CD pipeline configurations"
Write-Host "  • Any external links or bookmarks"
Write-Host ""
Write-Host "Press any key to finish..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
