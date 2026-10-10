Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "Diagnostic: Checking Expo & Metro Server" -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta

$port = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
if ($port) {
    Write-Host "[OK] Metro server is running on port 8081" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Port 8081 is not open" -ForegroundColor Red
    exit
}

$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notmatch "^169\.254\."
} | Select-Object -ExpandProperty IPAddress

Write-Host "`nNetwork IPs for Expo Go:" -ForegroundColor Cyan
foreach ($ip in $ips) {
    Write-Host "   👉 exp://${ip}:8081" -ForegroundColor Yellow
}

Write-Host "`nTesting iOS bundle compilation..." -ForegroundColor Cyan
try {
    $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8081/node_modules/expo-router/entry.bundle?platform=ios&dev=true&minify=false" -UseBasicParsing -TimeoutSec 15
    if ($resp.StatusCode -eq 200) {
        $sizeMb = [math]::Round($resp.RawContentLength / 1MB, 2)
        Write-Host "[OK] iOS Bundle ready! ($sizeMb MB, 200 OK)" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] Bundle compilation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTesting Web bundle compilation..." -ForegroundColor Cyan
try {
    $respWeb = Invoke-WebRequest -Uri "http://127.0.0.1:8081/node_modules/expo-router/entry.bundle?platform=web&dev=true&minify=false" -UseBasicParsing -TimeoutSec 15
    if ($respWeb.StatusCode -eq 200) {
        $sizeMbWeb = [math]::Round($respWeb.RawContentLength / 1MB, 2)
        Write-Host "[OK] Web Bundle ready! ($sizeMbWeb MB, 200 OK)" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] Web bundle compilation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "==========================================" -ForegroundColor Magenta
