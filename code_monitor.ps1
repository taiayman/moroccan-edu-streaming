# Create a function to format file content
function Format-FileContent {
    param (
        [string]$filePath,
        [string]$content
    )
    
    $fileName = Split-Path $filePath -Leaf
    $separator = "=" * 80
    
    return @"
$separator
FILE: $filePath
$separator

$content

"@
}

# List of files to monitor
$filesToMonitor = @(
    "src/api/config.js",
    "public/streaming/js/config.js",
    "public/streaming/js/teacher.js",
    "public/streaming/teacher.html",
    "public/streaming/student.html",
    "public/streaming/js/student.js",
    "src/pages/student/LiveClasses.jsx",
    "src/pages/teacher/Dashboard.jsx"
)

# Output file
$outputFile = "code_streaming.txt"

# Ensure all paths use forward slashes for consistency
$filesToMonitor = $filesToMonitor | ForEach-Object { $_ -replace "\\", "/" }

# Function to update the output file
function Update-OutputFile {
    try {
        $content = ""

        foreach ($file in $filesToMonitor) {
            if (Test-Path $file) {
                try {
                    $fileContent = Get-Content $file -Raw -ErrorAction Stop
                    if ($null -ne $fileContent) {
                        $content += Format-FileContent -filePath $file -content $fileContent
                    } else {
                        Write-Warning "Empty content in file: $file" 
                    }
                }
                catch {
                    Write-Warning ("Error reading file {0}: {1}" -f $file, $_.Exception.Message)
                }
            }
            else {
                Write-Warning "File not found: $file"
            }
        }

        if ($content) {
            # Ensure output directory exists
            $outputDir = Split-Path -Parent $outputFile
            if ($outputDir -and !(Test-Path -Path $outputDir)) {     
                New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
            }

            # Write content with UTF-8 encoding without BOM
            $utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($outputFile, $content, $utf8NoBomEncoding)

            Write-Host "Updated $outputFile at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        }
    }
    catch {
        Write-Error "Error updating output file: $($_.Exception.Message)"
    }
}

# Create a FileSystemWatcher
try {
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $PWD
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    # Add throttling to prevent multiple rapid updates
    $script:lastUpdate = [DateTime]::MinValue
    $throttleSeconds = 2

    # Register event handlers
    $action = {
        $path = $Event.SourceEventArgs.FullPath
        $relativePath = $path.Substring($PWD.Path.Length + 1) -replace "\\", "/"

        if ($filesToMonitor -contains $relativePath) {
            $now = Get-Date
            if (($now - $script:lastUpdate).TotalSeconds -ge $throttleSeconds) {
                $script:lastUpdate = $now
                Update-OutputFile
            }
        }
    }

    # Register events
    $handlers = @(
        'Changed',
        'Created',
        'Deleted'
    )

    $events = $handlers | ForEach-Object {
        Register-ObjectEvent $watcher $_ -Action $action
    }

    # Initial export
    Update-OutputFile

    Write-Host "Monitoring files for changes. Press Ctrl+C to stop." 
    Write-Host "Watching the following files:"
    $filesToMonitor | ForEach-Object { Write-Host "  - $_" }

    # Keep the script running
    while ($true) { Start-Sleep -Seconds 1 }
}
catch {
    Write-Error "Error in watcher setup: $($_.Exception.Message)"    
}
finally {
    # Cleanup
    if ($null -ne $watcher) {
        $watcher.Dispose()
    }
    Get-EventSubscriber | Where-Object { $null -ne $_ } | Unregister-Event
} 