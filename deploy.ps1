# Ehub PMS Deployment Script for Windows PowerShell
# This script helps automate the deployment process

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "logs", "status", "backup", "rebuild", "update")]
    [string]$Action = ""
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Ehub PMS Deployment Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path "env.production.template") {
        Copy-Item "env.production.template" ".env"
        Write-Host "✅ Created .env file from template" -ForegroundColor Green
        Write-Host "⚠️  Please edit .env file with your settings before continuing" -ForegroundColor Yellow
        Read-Host "Press Enter to continue after editing .env file"
    } else {
        Write-Host "❌ env.production.template not found" -ForegroundColor Red
        exit 1
    }
}

function Start-Services {
    Write-Host "`n🔄 Starting services..." -ForegroundColor Yellow
    docker-compose up -d
    Write-Host "✅ Services started" -ForegroundColor Green
    
    Write-Host "`n⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/api/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is healthy" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Backend may still be starting. Check logs with: docker-compose logs backend" -ForegroundColor Yellow
    }
}

function Stop-Services {
    Write-Host "`n🛑 Stopping services..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "✅ Services stopped" -ForegroundColor Green
}

function Show-Status {
    Write-Host "`n📊 Service Status:" -ForegroundColor Yellow
    docker-compose ps
}

function Show-Logs {
    Write-Host "`n📋 Viewing logs (Ctrl+C to exit)..." -ForegroundColor Yellow
    docker-compose logs -f
}

function Backup-Database {
    $date = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "backups"
    $backupFile = "$backupDir\backup_$date.sql.gz"
    
    Write-Host "`n💾 Creating database backup..." -ForegroundColor Yellow
    
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    # Load .env to get DB password
    $envVars = Get-Content ".env" | Where-Object { $_ -match "^DB_PASSWORD=" }
    $dbPassword = if ($envVars) { $envVars.Split("=")[1] } else { "change_me_secure_password" }
    
    docker-compose exec -T mysql mysqldump -u root -p$dbPassword ehub_pms | gzip | Out-File -FilePath $backupFile
    
    if (Test-Path $backupFile) {
        Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
    } else {
        Write-Host "❌ Backup failed" -ForegroundColor Red
    }
}

function Rebuild-Services {
    Write-Host "`n🔨 Rebuilding services..." -ForegroundColor Yellow
    docker-compose build --no-cache
    Write-Host "✅ Services rebuilt" -ForegroundColor Green
}

function Update-And-Deploy {
    Write-Host "`n📥 Pulling latest changes..." -ForegroundColor Yellow
    git pull
    
    Rebuild-Services
    Start-Services
    
    Write-Host "✅ Update and deployment complete" -ForegroundColor Green
}

# Execute action based on parameter
switch ($Action) {
    "start" { Start-Services }
    "stop" { Stop-Services }
    "restart" { Stop-Services; Start-Services }
    "status" { Show-Status }
    "logs" { Show-Logs }
    "backup" { Backup-Database }
    "rebuild" { Rebuild-Services; Start-Services }
    "update" { Update-And-Deploy }
    "" {
        # Interactive mode
        while ($true) {
            Write-Host "`nSelect an option:" -ForegroundColor Cyan
            Write-Host "1) Start services"
            Write-Host "2) Stop services"
            Write-Host "3) Restart services"
            Write-Host "4) View logs"
            Write-Host "5) Check service status"
            Write-Host "6) Rebuild services"
            Write-Host "7) Backup database"
            Write-Host "8) Update and redeploy"
            Write-Host "0) Exit"
            Write-Host ""
            $choice = Read-Host "Enter choice"
            
            switch ($choice) {
                "1" { Start-Services }
                "2" { Stop-Services }
                "3" { Stop-Services; Start-Services }
                "4" { Show-Logs }
                "5" { Show-Status }
                "6" { Rebuild-Services; Start-Services }
                "7" { Backup-Database }
                "8" { Update-And-Deploy }
                "0" { 
                    Write-Host "👋 Goodbye!" -ForegroundColor Green
                    exit 0
                }
                default { Write-Host "❌ Invalid option" -ForegroundColor Red }
            }
            
            Write-Host "`nPress Enter to continue..."
            Read-Host | Out-Null
        }
    }
}

