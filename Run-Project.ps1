$ErrorActionPreference = "Stop"

try {
    $Root = $PSScriptRoot

    Write-Host "`n=== AI Job Hunter - Windows Launcher ===" -ForegroundColor Cyan
    Write-Host "Project: $Root"

    # 1. Verify project structure
    foreach ($Required in @("README.md", "backend", "frontend", "scripts")) {
        if (-not (Test-Path (Join-Path $Root $Required))) {
            throw "Required project item not found: $Required"
        }
    }

    Set-Location $Root

    # 2. Check development tools
    Write-Host "`n--- Checking installed tools ---" -ForegroundColor Cyan

    foreach ($Tool in @("python", "node", "npm")) {
        $Command = Get-Command $Tool -ErrorAction SilentlyContinue

        if ($Command) {
            Write-Host "$Tool : $(& $Command.Source --version 2>&1 | Select-Object -First 1)" -ForegroundColor Green
        }
        else {
            Write-Host "$Tool : NOT FOUND" -ForegroundColor Yellow
        }
    }

    # 3. Find available PowerShell scripts
    $ScriptsFolder = Join-Path $Root "scripts"
    $Scripts = @(Get-ChildItem $ScriptsFolder -Filter "*.ps1" -File -Recurse |
        Sort-Object FullName)

    if ($Scripts.Count -eq 0) {
        throw "No PowerShell scripts found inside the scripts folder."
    }

    Write-Host "`n--- Available project scripts ---" -ForegroundColor Cyan

    for ($i = 0; $i -lt $Scripts.Count; $i++) {
        $RelativePath = $Scripts[$i].FullName.Substring($Root.Length).TrimStart('\')
        Write-Host "[$($i + 1)] $RelativePath"
    }

    Write-Host "`nInspect a script before running it."
    $Choice = Read-Host "Enter a script number to inspect, or Q to quit"

    if ($Choice -match '^[Qq]$') {
        exit 0
    }

    $Index = 0
    if (-not [int]::TryParse($Choice, [ref]$Index) -or
        $Index -lt 1 -or $Index -gt $Scripts.Count) {
        throw "Invalid selection."
    }

    $Selected = $Scripts[$Index - 1]

    Write-Host "`n--- Script preview: $($Selected.Name) ---" -ForegroundColor Cyan
    Get-Content $Selected.FullName

    Write-Host "`nDo not run scripts you do not understand or trust." -ForegroundColor Yellow
    $Confirm = Read-Host "Type RUN to execute this script"

    if ($Confirm -cne "RUN") {
        Write-Host "Cancelled. No script was executed." -ForegroundColor Yellow
        exit 0
    }

    Write-Host "`n--- Running selected script ---" -ForegroundColor Cyan
    & $Selected.FullName

    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        throw "The selected script reported exit code $LASTEXITCODE."
    }

    Write-Host "`nScript finished. Check its output for errors." -ForegroundColor Green
}
catch {
    Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
