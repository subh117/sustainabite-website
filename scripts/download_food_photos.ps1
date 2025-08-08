param(
    [int]$Total = 200,
    [string[]]$Keywords = @("pizza","burger","salad","pasta","sushi","dessert","vegan","breakfast","drinks"),
    [string]$OutDir = "assets/images/food",
    [int]$MinWidth = 1280,
    [int]$PerPage = 80,
    [int]$MaxPagesPerKeyword = 10,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-EnvOrThrow([string]$Name) {
    $val = [Environment]::GetEnvironmentVariable($Name)
    if (-not $val) { throw "Environment variable $Name is not set." }
    return $val
}

function Ensure-Directory([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Get-HashSHA256([byte[]]$Bytes) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $hashBytes = $sha.ComputeHash($Bytes)
    } finally {
        $sha.Dispose()
    }
    -join ($hashBytes | ForEach-Object { $_.ToString('x2') })
}

function Load-Manifest([string]$Path) {
    if (Test-Path -LiteralPath $Path) {
        try {
            return (Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json)
        } catch {
            Write-Warning "Manifest at $Path is corrupt or unreadable. Starting fresh."
        }
    }
    return [pscustomobject]@{
        version = 1
        createdAt = (Get-Date).ToString("o")
        updatedAt = (Get-Date).ToString("o")
        images = @()
        hashes = @{}
        photoIds = @{}
    }
}

function Save-Manifest($Manifest, [string]$Path) {
    $Manifest.updatedAt = (Get-Date).ToString("o")
    $json = $Manifest | ConvertTo-Json -Depth 6
    $json | Set-Content -LiteralPath $Path -Encoding UTF8
}

function ShortHash([string]$FullHash, [int]$Len = 10) { $FullHash.Substring(0, [Math]::Min($Len, $FullHash.Length)) }

function Get-PexelsPage([string]$ApiKey, [string]$Keyword, [int]$Page, [int]$PerPage, [int]$MinWidth) {
    $uri = "https://api.pexels.com/v1/search?query=$([uri]::EscapeDataString($Keyword))&per_page=$PerPage&page=$Page&orientation=landscape&size=large"
    $headers = @{ Authorization = $ApiKey }
    try {
        $resp = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers -TimeoutSec 60
    } catch {
        Write-Warning "Failed to query Pexels for '$Keyword' page $Page: $($_.Exception.Message)"
        return @()
    }
    if (-not $resp.photos) { return @() }
    # Filter by min width using API metadata
    $filtered = @()
    foreach ($p in $resp.photos) {
        if ($p.width -ge $MinWidth) { $filtered += $p }
    }
    return $filtered
}

function Download-Bytes([string]$Url) {
    try {
        $r = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 120
        return ,$r.Content
    } catch {
        Write-Warning "Download failed $Url: $($_.Exception.Message)"
        return $null
    }
}

function Save-Image([byte[]]$Bytes, [string]$Path) {
    Ensure-Directory ([System.IO.Path]::GetDirectoryName($Path))
    [System.IO.File]::WriteAllBytes($Path, $Bytes)
}

# Main
$apiKey = Get-EnvOrThrow -Name 'PEXELS_API_KEY'
Ensure-Directory $OutDir
$manifestPath = Join-Path $OutDir '.manifest.json'
$manifest = Load-Manifest -Path $manifestPath

if (-not $manifest.images) { $manifest.images = @() }
if (-not $manifest.hashes) { $manifest.hashes = @{} }
if (-not $manifest.photoIds) { $manifest.photoIds = @{} }

$targetPerKeyword = [Math]::Ceiling($Total / [double]$Keywords.Count)
$downloadedTotal = 0

Write-Host "Starting download: Total=$Total, Keywords=$($Keywords -join ', '), OutDir=$OutDir" -ForegroundColor Cyan

foreach ($kw in $Keywords) {
    if ($downloadedTotal -ge $Total) { break }
    $downloadedForKw = 0
    $page = 1

    while ($downloadedForKw -lt $targetPerKeyword -and $page -le $MaxPagesPerKeyword -and $downloadedTotal -lt $Total) {
        $photos = Get-PexelsPage -ApiKey $apiKey -Keyword $kw -Page $page -PerPage $PerPage -MinWidth $MinWidth
        if (-not $photos -or $photos.Count -eq 0) { break }

        foreach ($p in $photos) {
            if ($downloadedForKw -ge $targetPerKeyword -or $downloadedTotal -ge $Total) { break }

            $photoId = "$($p.id)"
            if ($manifest.photoIds.ContainsKey($photoId)) { continue }

            $url = if ($p.src.large2x) { $p.src.large2x } elseif ($p.src.large) { $p.src.large } elseif ($p.src.original) { $p.src.original } else { $null }
            if (-not $url) { continue }

            $bytes = Download-Bytes -Url $url
            if (-not $bytes) { continue }

            $hash = Get-HashSHA256 -Bytes $bytes
            if ($manifest.hashes.ContainsKey($hash)) { continue }

            $short = ShortHash -FullHash $hash -Len 10
            $safeKw = ($kw -replace "[^a-zA-Z0-9_-]", "_").ToLower()
            $fileName = "${safeKw}_${short}.jpg"
            $filePath = Join-Path $OutDir $fileName

            if ($DryRun) {
                Write-Host "[DryRun] Would save $fileName (id=$photoId)" -ForegroundColor Yellow
            } else {
                Save-Image -Bytes $bytes -Path $filePath
                $record = [pscustomobject]@{
                    id = $photoId
                    keyword = $kw
                    file = $fileName
                    url = $url
                    width = $p.width
                    height = $p.height
                    photographer = $p.photographer
                    photographer_url = $p.photographer_url
                    src = $p.src
                    sha256 = $hash
                    downloadedAt = (Get-Date).ToString("o")
                }
                $manifest.images += $record
                $manifest.hashes[$hash] = $true
                $manifest.photoIds[$photoId] = $true
                Save-Manifest -Manifest $manifest -Path $manifestPath
                $downloadedForKw++
                $downloadedTotal++
                Write-Host "Saved $fileName (kw=$kw, id=$photoId) [$downloadedTotal/$Total]" -ForegroundColor Green
            }
        }

        $page++
    }
    Write-Host "Keyword '$kw' complete: $downloadedForKw/$targetPerKeyword" -ForegroundColor DarkCyan
}

Write-Host "Done. Downloaded $downloadedTotal images. Manifest: $manifestPath" -ForegroundColor Cyan

