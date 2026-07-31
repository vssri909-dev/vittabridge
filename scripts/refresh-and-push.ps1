# Daily auction refresh, run locally via Windows Task Scheduler.
# (BaankNet 403-blocks GitHub-hosted runner IPs, so this replaced the Actions cron in July 2026.)
# Registered as scheduled task "VittaBridge auction refresh" — daily 00:15 IST,
# catches up on next boot if the PC was off.
# Logs to %LOCALAPPDATA%\vittabridge-refresh.log

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$log = Join-Path $env:LOCALAPPDATA 'vittabridge-refresh.log'

function Log($msg) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg" | Add-Content -Path $log
}

# Keep the log from growing unbounded
if ((Test-Path $log) -and ((Get-Item $log).Length -gt 512KB)) {
    Get-Content $log -Tail 200 | Set-Content $log
}

try {
    Set-Location $repo
    Log 'Starting refresh'

    git pull --ff-only 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'git pull --ff-only failed (diverged or offline?)' }

    $output = node scripts/refresh-auctions.js
    if ($LASTEXITCODE -ne 0) { throw "refresh-auctions.js exited $LASTEXITCODE : $output" }
    $output | ForEach-Object { Log "  $_" }

    git diff --quiet -- auctions.html
    if ($LASTEXITCODE -eq 0) {
        Log 'No changes to auctions.html - nothing to push'
    } else {
        git add auctions.html
        git commit -q -m 'Update auction listings - automated daily refresh'
        if ($LASTEXITCODE -ne 0) { throw 'git commit failed' }
        git push -q
        if ($LASTEXITCODE -ne 0) { throw 'git push failed' }
        Log 'Pushed updated listings'
    }
    Log 'Done'
} catch {
    Log "FAILED: $_"
    exit 1
}
