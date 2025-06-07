#!/bin/bash

# Clinical Trial Table Metadata System Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Examples:
#   ./deploy.sh dev start
#   ./deploy.sh prod deploy
#   ./deploy.sh prod backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
ACTION=${2:-help}

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_info "Requirements check passed."
}

setup_environment() {
    log_info "Setting up environment for $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        if [ ! -f .env ]; then
            log_warn ".env file not found. Creating from .env.example..."
            cp .env.example .env
            log_warn "Please edit .env file with your production values before deploying."
            exit 1
        fi
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        COMPOSE_FILE="docker-compose.dev.yml"
    fi
    
    export COMPOSE_FILE
}

start_services() {
    log_info "Starting services in $ENVIRONMENT mode..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f $COMPOSE_FILE up -d
    else
        docker-compose -f $COMPOSE_FILE up -d
    fi
    
    log_info "Services started successfully."
    log_info "Frontend: http://localhost:3000 (dev) or http://localhost (prod)"
    log_info "Backend API: http://localhost:8000"
    
    if [ "$ENVIRONMENT" = "dev" ]; then
        log_info "Adminer (DB): http://localhost:8080"
    fi
}

stop_services() {
    log_info "Stopping services..."
    docker-compose -f $COMPOSE_FILE down
    log_info "Services stopped."
}

deploy() {
    log_info "Deploying to $ENVIRONMENT..."
    
    # Build images
    log_info "Building images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # Start services
    start_services
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    log_info "Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec backend alembic upgrade head
    
    # Create initial data (if needed)
    if [ "$ENVIRONMENT" = "dev" ]; then
        log_info "Creating initial data for development..."
        docker-compose -f $COMPOSE_FILE exec backend python -c "from app.db.init_db import init_db; init_db()"
    fi
    
    log_info "Deployment completed successfully!"
}

backup_database() {
    log_info "Creating database backup..."
    
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/ars_db_backup_$TIMESTAMP.sql"
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f $COMPOSE_FILE exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_FILE
    else
        docker-compose -f $COMPOSE_FILE exec postgres pg_dump -U ars_dev_user ars_dev_db > $BACKUP_FILE
    fi
    
    log_info "Database backup created: $BACKUP_FILE"
}

restore_database() {
    BACKUP_FILE=$3
    
    if [ -z "$BACKUP_FILE" ]; then
        log_error "Please specify backup file: ./deploy.sh $ENVIRONMENT restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    log_warn "This will restore the database from $BACKUP_FILE. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Database restore cancelled."
        exit 0
    fi
    
    log_info "Restoring database from $BACKUP_FILE..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f $COMPOSE_FILE exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB < $BACKUP_FILE
    else
        docker-compose -f $COMPOSE_FILE exec -T postgres psql -U ars_dev_user ars_dev_db < $BACKUP_FILE
    fi
    
    log_info "Database restored successfully."
}

show_logs() {
    SERVICE=${3:-""}
    
    if [ -n "$SERVICE" ]; then
        docker-compose -f $COMPOSE_FILE logs -f $SERVICE
    else
        docker-compose -f $COMPOSE_FILE logs -f
    fi
}

show_status() {
    log_info "Service status:"
    docker-compose -f $COMPOSE_FILE ps
    
    log_info "System resources:"
    docker stats --no-stream
}

cleanup() {
    log_warn "This will remove all containers, images, and volumes. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Cleanup cancelled."
        exit 0
    fi
    
    log_info "Cleaning up..."
    docker-compose -f $COMPOSE_FILE down -v --rmi all
    docker system prune -f
    log_info "Cleanup completed."
}

show_help() {
    echo "Clinical Trial Table Metadata System Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  dev     Development environment"
    echo "  prod    Production environment"
    echo ""
    echo "Actions:"
    echo "  start           Start services"
    echo "  stop            Stop services"
    echo "  deploy          Full deployment (build, start, migrate)"
    echo "  backup          Create database backup"
    echo "  restore <file>  Restore database from backup"
    echo "  logs [service]  Show logs (optionally for specific service)"
    echo "  status          Show service status"
    echo "  cleanup         Remove all containers and images"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev start              # Start development environment"
    echo "  $0 prod deploy            # Deploy to production"
    echo "  $0 prod backup            # Create production backup"
    echo "  $0 dev logs backend       # Show backend logs"
    echo "  $0 prod restore backup.sql # Restore from backup"
}

# Main execution
main() {
    check_requirements
    setup_environment
    
    case $ACTION in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        deploy)
            deploy
            ;;
        backup)
            backup_database
            ;;
        restore)
            restore_database "$@"
            ;;
        logs)
            show_logs "$@"
            ;;
        status)
            show_status
            ;;
        cleanup)
            cleanup
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"