<#
.SYNOPSIS
  Registers the NIB Legal SLA / expiry scan as a Windows Scheduled Task.

.DESCRIPTION
  The scan raises the in-app expiry, renewal and SLA-breach notifications
  (EXPIRY_ALERT / SLA_ALERT). Nothing scheduled it before, so those alerts only
  appeared if a manager triggered the job by hand. This registers it to run on a
  fixed interval so the alerting is genuinely automated.

  The job is idempotent — an alert fires only on the transition into a
  breached/expiring state — so running it hourly does not spam recipients.

.PARAMETER IntervalMinutes
  How often to run. Default 60.

.PARAMETER TaskName
  Scheduled Task name. Default "NibLegal-SlaScan".

.EXAMPLE
  # Run from an elevated PowerShell, in the project root:
  .\scripts\register-sla-task.ps1

.EXAMPLE
  .\scripts\register-sla-task.ps1 -IntervalMinutes 30

.NOTES
  Requires: CRON_SECRET in .env.local, and the app reachable at APP_URL.
  Remove with:  Unregister-ScheduledTask -TaskName "NibLegal-SlaScan" -Confirm:$false
  Log file:     storage\logs\sla-scan.log
#>
[CmdletBinding()]
param(
  [int]$IntervalMinutes = 60,
  [string]$TaskName = 'NibLegal-SlaScan'
)

$ErrorActionPreference = 'Stop'

# Resolve the project root as the parent of this script's directory.
$projectRoot = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $projectRoot 'scripts\run-sla-scan.mjs'

if (-not (Test-Path $runner)) {
  throw "Runner not found at $runner"
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  throw 'node was not found on PATH. Install Node.js or run this from a shell where node resolves.'
}

if (-not (Test-Path (Join-Path $projectRoot '.env.local'))) {
  Write-Warning '.env.local not found — the runner needs CRON_SECRET to authenticate.'
}

Write-Host "Project root : $projectRoot"
Write-Host "Node         : $node"
Write-Host "Runner       : $runner"
Write-Host "Interval     : every $IntervalMinutes minute(s)"

$action = New-ScheduledTaskAction -Execute $node -Argument "`"$runner`"" -WorkingDirectory $projectRoot

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Write-Host "Existing task '$TaskName' found — replacing it."
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description 'NIB Legal — contract expiry / renewal / SLA scan producing in-app alerts.' `
  -RunLevel Limited | Out-Null

Write-Host ""
Write-Host "Registered scheduled task '$TaskName'." -ForegroundColor Green
Write-Host "Run it now with:  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "Check results in: $(Join-Path $projectRoot 'storage\logs\sla-scan.log')"
Write-Host "Remove it with:   Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
