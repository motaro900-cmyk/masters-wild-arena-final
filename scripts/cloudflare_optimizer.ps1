param(
    [string]$Token,
    [string]$Email,
    [string]$Key,
    [string]$Domain = "mastersofthewild.ru"
)

if (-not $Token -and (-not $Email -or -not $Key)) {
    Write-Host "Cloudflare Optimizer for Russian Federation (TSPU / RKN Bypass)" -ForegroundColor Cyan
    Write-Host "Usage:"
    Write-Host "  .\scripts\cloudflare_optimizer.ps1 -Token '<YOUR_CF_API_TOKEN>'"
    Write-Host "  or"
    Write-Host "  .\scripts\cloudflare_optimizer.ps1 -Email '<YOUR_EMAIL>' -Key '<GLOBAL_API_KEY>'"
    exit 1
}

if ($Token) {
    python "B:\Masters of the Wild\scripts\cloudflare_optimizer.py" --domain $Domain --token $Token
} else {
    python "B:\Masters of the Wild\scripts\cloudflare_optimizer.py" --domain $Domain --email $Email --key $Key
}
