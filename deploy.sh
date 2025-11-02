#!/bin/bash

# Ehub PMS Deployment Script
# This script helps automate the deployment process

set -e  # Exit on error

echo "🚀 Ehub PMS Deployment Script"
echo "=============================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    if [ -f env.production.template ]; then
        cp env.production.template .env
        echo -e "${GREEN}✅ Created .env file from template${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env file with your settings before continuing${NC}"
        read -p "Press enter to continue after editing .env file..."
    else
        echo -e "${RED}❌ env.production.template not found${NC}"
        exit 1
    fi
fi

# Function to check if services are running
check_services() {
    echo -e "\n${YELLOW}Checking service status...${NC}"
    docker-compose ps
}

# Function to view logs
view_logs() {
    echo -e "\n${YELLOW}Viewing logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

# Function to stop services
stop_services() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Function to start services
start_services() {
    echo -e "\n${YELLOW}Starting services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ Services started${NC}"
    
    echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 10
    
    # Check if backend is responding
    if curl -f http://localhost:3002/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend may still be starting. Check logs with: docker-compose logs backend${NC}"
    fi
}

# Function to rebuild services
rebuild_services() {
    echo -e "\n${YELLOW}Rebuilding services...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}✅ Services rebuilt${NC}"
}

# Function to scale backend
scale_backend() {
    read -p "Enter number of backend instances: " instances
    echo -e "\n${YELLOW}Scaling backend to $instances instances...${NC}"
    docker-compose up -d --scale backend=$instances
    echo -e "${GREEN}✅ Backend scaled to $instances instances${NC}"
}

# Function to backup database
backup_database() {
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="backups/backup_${DATE}.sql"
    
    echo -e "\n${YELLOW}Creating database backup...${NC}"
    mkdir -p backups
    docker-compose exec -T mysql mysqldump -u root -p${DB_PASSWORD:-change_me_secure_password} ehub_pms | gzip > ${BACKUP_FILE}.gz
    
    if [ -f "${BACKUP_FILE}.gz" ]; then
        echo -e "${GREEN}✅ Backup created: ${BACKUP_FILE}.gz${NC}"
    else
        echo -e "${RED}❌ Backup failed${NC}"
    fi
}

# Main menu
show_menu() {
    echo -e "\n${GREEN}Select an option:${NC}"
    echo "1) Start services"
    echo "2) Stop services"
    echo "3) Restart services"
    echo "4) View logs"
    echo "5) Check service status"
    echo "6) Rebuild services"
    echo "7) Scale backend"
    echo "8) Backup database"
    echo "9) Update and redeploy"
    echo "0) Exit"
    echo -ne "\nEnter choice: "
}

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Parse command line arguments
if [ "$1" == "start" ]; then
    start_services
elif [ "$1" == "stop" ]; then
    stop_services
elif [ "$1" == "restart" ]; then
    stop_services
    start_services
elif [ "$1" == "logs" ]; then
    view_logs
elif [ "$1" == "status" ]; then
    check_services
elif [ "$1" == "backup" ]; then
    backup_database
elif [ "$1" == "rebuild" ]; then
    rebuild_services
    start_services
elif [ "$1" == "update" ]; then
    echo -e "${YELLOW}Pulling latest changes...${NC}"
    git pull
    rebuild_services
    start_services
else
    # Interactive mode
    while true; do
        show_menu
        read choice
        
        case $choice in
            1) start_services ;;
            2) stop_services ;;
            3) stop_services; start_services ;;
            4) view_logs ;;
            5) check_services ;;
            6) rebuild_services ;;
            7) scale_backend ;;
            8) backup_database ;;
            9) 
                echo -e "${YELLOW}Pulling latest changes...${NC}"
                git pull
                rebuild_services
                start_services
                ;;
            0) 
                echo -e "${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac
        
        echo -e "\nPress enter to continue..."
        read
    done
fi
