# PowerShell script to fix .env.local file
# Removes quotes and fixes formatting for Paddle variables

Write-Host "🔧 Fixing .env.local file...`n" -ForegroundColor Cyan

$envPath = ".\.env.local"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "   Expected location: $((Get-Location).Path)\$envPath" -ForegroundColor Yellow
    exit 1
}

# Read the file
$content = Get-Content $envPath -Raw
$lines = Get-Content $envPath
$fixedLines = @()
$changes = 0

foreach ($line in $lines) {
    $originalLine = $line
    
    # Check if it's a PADDLE variable
    if ($line -match '^PADDLE_') {
        # Remove quotes from value (handles both single and double quotes)
        $line = $line -replace '^([A-Z_]+)\s*=\s*["''](.+)["'']\s*$', '$1=$2'
        
        # Remove any spaces around =
        $line = $line -replace '\s*=\s*', '='
        
        # Remove trailing spaces
        $line = $line.Trim()
        
        if ($originalLine -ne $line) {
            $changes++
            Write-Host "  ✅ Fixed: $($line.Substring(0, [Math]::Min(50, $line.Length)))..." -ForegroundColor Green
        }
    }
    
    $fixedLines += $line
}

# Write back
if ($changes -gt 0) {
    $fixedLines | Set-Content $envPath -NoNewline
    Write-Host "`n✅ Fixed $changes line(s) in .env.local" -ForegroundColor Green
    Write-Host "   Please restart 'npx vercel dev' for changes to take effect.`n" -ForegroundColor Yellow
} else {
    Write-Host "✅ No changes needed - file looks good!`n" -ForegroundColor Green
}

# Verify Paddle variables
Write-Host "🔍 Verifying Paddle variables...`n" -ForegroundColor Cyan

$paddleVars = @(
    'PADDLE_VENDOR_ID',
    'PADDLE_API_KEY',
    'PADDLE_ENV',
    'PADDLE_PRICE_SUPPORTER_MONTHLY',
    'PADDLE_PRICE_SUPPORTER_YEARLY',
    'PADDLE_PRICE_UNLIMITED_MONTHLY',
    'PADDLE_PRICE_UNLIMITED_YEARLY',
    'PADDLE_PRICE_FAMILY_MONTHLY',
    'PADDLE_PRICE_FAMILY_YEARLY'
)

$foundVars = @()
$missingVars = @()

foreach ($varName in $paddleVars) {
    $pattern = "^$varName=(.+)$"
    $match = $fixedLines | Select-String -Pattern $pattern
    
    if ($match) {
        $value = $match.Matches[0].Groups[1].Value.Trim()
        $hasQuotes = $value.StartsWith('"') -or $value.StartsWith("'")
        $foundVars += $varName
        
        if ($hasQuotes) {
            Write-Host "  ⚠️  $varName still has quotes!" -ForegroundColor Yellow
        }
    } else {
        $missingVars += $varName
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "`n❌ Missing variables:" -ForegroundColor Red
    foreach ($v in $missingVars) {
        Write-Host "   - $v" -ForegroundColor Yellow
    }
    Write-Host "`n   Please add these to .env.local`n" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ All $($paddleVars.Count) Paddle variables found!`n" -ForegroundColor Green
}

Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   Found: $($foundVars.Count)/$($paddleVars.Count)"
Write-Host "   Missing: $($missingVars.Count)"
Write-Host "   Fixed: $changes line(s)`n"

