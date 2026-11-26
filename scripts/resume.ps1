$ErrorActionPreference = "Stop"
$root  = Split-Path -Parent $PSScriptRoot
$lock  = Join-Path $root ".run.lock"
$state = Join-Path $root "RUN_STATE.json"
$logs  = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logs | Out-Null
function Log($m) { Add-Content (Join-Path $logs "scheduler.log") "$(Get-Date -Format o)  $m" }

if (-not (Test-Path $state)) { Log "no state file; exit"; exit 0 }
try { $s = Get-Content $state -Raw | ConvertFrom-Json } catch { Log "state unreadable; session will repair"; $s = @{ status = "running" } }
if ($s.status -ne "running") { exit 0 }

if (Test-Path $lock) {
  $lockPid = (Get-Content $lock -Raw).Trim()
  $alive = $false
  if ($lockPid -match '^\d+$') { $alive = [bool](Get-Process -Id ([int]$lockPid) -ErrorAction SilentlyContinue) }
  if ($alive) { Log "session alive (pid $lockPid); skip"; exit 0 }
  Log "stale lock (pid $lockPid); removing"
  Remove-Item $lock -Force
}

Set-Content -Path $lock -Value $PID
$sessionLog = Join-Path $logs ("session-" + (Get-Date -Format "yyyyMMdd-HHmm") + ".log")
Log "starting session -> $sessionLog"
try {
  Push-Location $root
  $claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
  if (-not $claude) { $claude = Join-Path $env:APPDATA "npm\claude.cmd" }
  if (-not (Test-Path $claude)) { Log "claude CLI not found; set its full path in resume.ps1"; exit 1 }
  & $claude -p "Resume the investment hunt. Follow CLAUDE.md section 8.3 exactly: read CLAUDE.md, config.json and RUN_STATE.json, reconcile state against files on disk, then continue from the next pending task. Checkpoint after every task." --permission-mode acceptEdits *>> $sessionLog
  Log "session exited with code $LASTEXITCODE"
} catch {
  Log "session error: $($_.Exception.Message)"
} finally {
  Pop-Location
  Remove-Item $lock -Force -ErrorAction SilentlyContinue
}
