# PaceySpace Workspace Certificate Installer
# Run this in PowerShell as Administrator

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  PaceySpace Workspace Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "⚠️  Please run this script as Administrator." -ForegroundColor Yellow
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Download certificate
$certUrl = "https://onboarding.pspace/assets/paceyspace-ca.crt"
$tempPath = "$env:TEMP\paceyspace-ca.crt"

try {
    Write-Host "📥 Downloading certificate..." -ForegroundColor Blue
    Invoke-WebRequest -Uri $certUrl -OutFile $tempPath -UseBasicParsing
    Write-Host "✅ Certificate downloaded" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to download certificate: $_" -ForegroundColor Red
    exit 1
}

# Install certificate
Write-Host ""
Write-Host "🔐 Installing certificate to Trusted Root CA store..." -ForegroundColor Blue

try {
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($tempPath)
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()
    
    Write-Host "✅ Certificate installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Subject: $($cert.Subject)" -ForegroundColor Gray
    Write-Host "   Issuer: $($cert.Issuer)" -ForegroundColor Gray
    Write-Host "   Valid From: $($cert.NotBefore)" -ForegroundColor Gray
    Write-Host "   Valid Until: $($cert.NotAfter)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  🎉 You're all set!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   You can now access PaceySpace services:" -ForegroundColor White
    Write-Host "   • https://nebula.pspace" -ForegroundColor Cyan
    Write-Host "   • https://webmail.pspace" -ForegroundColor Cyan
    Write-Host "   • https://engine.pspace" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Close and reopen your browser if you still see warnings." -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "❌ Failed to install certificate: $_" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
    if (Test-Path $tempPath) {
        Remove-Item $tempPath -Force
    }
}
