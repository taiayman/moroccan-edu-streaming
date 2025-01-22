# Paths configuration
$outputPath = ".\src_code.json"
$watchPath = "C:\Users\LENOVO\Desktop\Nextjs_projects\moroccan-edu-platform\src"

function Update-SourceFile {
    $filesData = Get-ChildItem -Path $watchPath -Recurse -File | ForEach-Object {
        if ($_.Name -notmatch "node_modules|build") {
            $content = Get-Content $_.FullName -Raw
            $content = $content -replace "`r",""
            $content = $content -replace "`n"," "
            $content = $content -replace "\s{2,}"," "
            
            [PSCustomObject]@{
                File = $_.FullName.Replace($watchPath, 'src')
                Extension = $_.Extension.TrimStart('.')
                Content = $content
            }
        }
    }

    $json = $filesData | ConvertTo-Json -Depth 5
    
    # Remove JSON escapes
    $escapes = @{
        '\\\\u0027' = "'"
        '\\\\u003e' = '>'
        '\\\\u003c' = '<'
        '\\\\u003d' = '='
        '\\\\u0026' = '&'
        '\\\\u003a' = ':'
        '\\\\u002f' = '/'
        '\\u0027' = "'"
        '\\u003e' = '>'
        '\\u003c' = '<'
        '\\u003d' = '='
        '\\u0026' = '&'
        '\\u003a' = ':'
        '\\u002f' = '/'
    }
    
    foreach ($key in $escapes.Keys) {
        $json = $json -replace $key, $escapes[$key]
    }
    
    $json | Out-File -FilePath $outputPath -Encoding utf8
    Write-Host "$(Get-Date -Format 'HH:mm:ss'): JSON source file updated"
}

# Initial export
Update-SourceFile

# Set up watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $watchPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Register events
$events = @('Changed', 'Created', 'Deleted', 'Renamed') | ForEach-Object {
    Register-ObjectEvent $watcher $_ -Action { Update-SourceFile }
}

Write-Host "Watching for changes in $watchPath..."
Write-Host "Press Ctrl+C to stop"

try {
    while ($true) { Start-Sleep -Seconds 1 }
}
finally {
    $events | ForEach-Object {
        Unregister-Event -SourceIdentifier $_.Name
    }
}