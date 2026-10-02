# Build the submission skill ZIP.
#
# Compress-Archive is not used: Windows PowerShell 5.1 writes backslashes into
# zip entry names, and a strict extractor rejects the archive. Entries are
# written here with forward slashes.
#
# The archive is standalone: the two skills, plus the MCP server they declare,
# its data and its tests, so a judge can run what the skills describe rather
# than only read it. The skill folders stay at the archive root, so extracting
# it straight into ~/.workbuddy-ai/skills/ is still a valid install; server/ has
# no SKILL.md and is ignored there.
#
# Run:  powershell -File build_skill_zips.ps1
# Out:  skill\Timbre Care-Skills Bundle-Karpathians.zip

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$repo = $PSScriptRoot
$root = Join-Path $repo "skill"

# Entry name in the archive -> source file on disk. Order is the order a reader
# meets them. Backups under data\ are deliberately excluded: only the live store
# and the replayed consultation ship.
$plan = [ordered]@{
    'README.md' = Join-Path $root 'README.md'

    'server/requirements.txt'           = Join-Path $repo 'requirements.txt'
    'server/run_smoke.py'               = Join-Path $repo 'run_smoke.py'
    'server/smoke_test_concurrency.py'  = Join-Path $repo 'smoke_test_concurrency.py'
    'server/smoke_test.py'              = Join-Path $repo 'smoke_test.py'
    'server/smoke_test_appointment.py'  = Join-Path $repo 'smoke_test_appointment.py'

    'server/mcp_server/__init__.py' = Join-Path $repo 'mcp_server\__init__.py'
    'server/mcp_server/server.py'   = Join-Path $repo 'mcp_server\server.py'
    'server/mcp_server/rules.py'    = Join-Path $repo 'mcp_server\rules.py'
    'server/mcp_server/store.py'    = Join-Path $repo 'mcp_server\store.py'
    'server/mcp_server/consult.py'  = Join-Path $repo 'mcp_server\consult.py'

    'server/data/consult-2026-08-05.json' = Join-Path $repo 'data\consult-2026-08-05.json'
    'server/data/signal_store.json'       = Join-Path $repo 'data\signal_store.json'
}

# The skill folders, walked whole so a file added to one is never missed.
$skillFolders = @('care-companion-check-in', 'care-companion-appointment')

$ZipName = 'Timbre Care-Skills Bundle-Karpathians.zip'
$dest = Join-Path $root $ZipName
if (Test-Path $dest) { Remove-Item $dest -Force }

$zip = [System.IO.Compression.ZipFile]::Open($dest, 'Create')
try {
    foreach ($folder in $skillFolders) {
        $src = Join-Path $root $folder
        foreach ($f in Get-ChildItem -Path $src -Recurse -File) {
            $rel = $f.FullName.Substring($root.Length + 1) -replace '\\', '/'
            $plan[$rel] = $f.FullName
        }
    }

    foreach ($rel in $plan.Keys) {
        $srcFile = $plan[$rel]
        if (-not (Test-Path $srcFile)) { throw "missing source for '$rel': $srcFile" }
        $entry = $zip.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
        $out = $entry.Open()
        $in = [System.IO.File]::OpenRead($srcFile)
        $in.CopyTo($out)
        $in.Dispose()
        $out.Dispose()
    }
} finally {
    $zip.Dispose()
}

$z = [System.IO.Compression.ZipFile]::OpenRead($dest)
Write-Output ("{0}  ({1} bytes)" -f $ZipName, (Get-Item $dest).Length)
$z.Entries | ForEach-Object { Write-Output ("    {0}  {1} bytes" -f $_.FullName, $_.Length) }
$z.Dispose()
