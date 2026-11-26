$root   = Split-Path -Parent $PSScriptRoot
$script = Join-Path $root "scripts\resume.ps1"
$action  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 20)
$settings = New-ScheduledTaskSettingsSet -WakeToRun -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 6)
Register-ScheduledTask -TaskName "InvestmentHuntResume" -Action $action -Trigger $trigger -Settings $settings -Description "Resumes the investment hunt after usage-limit resets" -Force
