#!/bin/bash

# Infrastructure Setup Script for Clinical Trial Table Metadata System
# This script sets up the basic infrastructure components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running on supported OS
check_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        log_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    log_info "Detected OS: $OS"
}

# Install Docker
install_docker() {
    log_step "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        log_info "Docker is already installed"
        docker --version
        return
    fi
    
    if [[ "$OS" == "linux" ]]; then
        # Install Docker on Linux
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        
        # Install Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
    elif [[ "$OS" == "macos" ]]; then
        # Install Docker Desktop on macOS
        if command -v brew &> /dev/null; then
            brew install --cask docker
        else
            log_warn "Homebrew not found. Please install Docker Desktop manually from https://docker.com"
            return 1
        fi
    fi
    
    log_info "Docker installed successfully"
}

# Install kubectl
install_kubectl() {
    log_step "Installing kubectl..."
    
    if command -v kubectl &> /dev/null; then
        log_info "kubectl is already installed"
        kubectl version --client
        return
    fi
    
    if [[ "$OS" == "linux" ]]; then
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
        rm kubectl
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install kubectl
        else
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
            chmod +x ./kubectl
            sudo mv ./kubectl /usr/local/bin/kubectl
        fi
    fi
    
    log_info "kubectl installed successfully"
}

# Install Helm
install_helm() {
    log_step "Installing Helm..."
    
    if command -v helm &> /dev/null; then
        log_info "Helm is already installed"
        helm version
        return
    fi
    
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    
    log_info "Helm installed successfully"
}

# Install additional tools
install_additional_tools() {
    log_step "Installing additional tools..."
    
    # Install jq for JSON processing
    if ! command -v jq &> /dev/null; then
        if [[ "$OS" == "linux" ]]; then
            sudo apt-get update && sudo apt-get install -y jq
        elif [[ "$OS" == "macos" ]]; then
            if command -v brew &> /dev/null; then
                brew install jq
            fi
        fi
        log_info "jq installed"
    fi
    
    # Install yq for YAML processing
    if ! command -v yq &> /dev/null; then
        if [[ "$OS" == "linux" ]]; then
            sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
            sudo chmod +x /usr/local/bin/yq
        elif [[ "$OS" == "macos" ]]; then
            if command -v brew &> /dev/null; then
                brew install yq
            fi
        fi
        log_info "yq installed"
    fi
    
    # Install curl if not present
    if ! command -v curl &> /dev/null; then
        if [[ "$OS" == "linux" ]]; then
            sudo apt-get update && sudo apt-get install -y curl
        fi
        log_info "curl installed"
    fi
}

# Setup local development environment
setup_local_dev() {
    log_step "Setting up local development environment..."
    
    # Create .env file if it doesn't exist
    if [[ ! -f .env ]]; then
        log_info "Creating .env file from template..."
        cp .env.example .env
        log_warn "Please edit .env file with your configuration before running the application"
    fi
    
    # Create necessary directories
    mkdir -p logs backups ssl
    
    # Set permissions
    chmod +x deploy.sh
    
    log_info "Local development environment setup complete"
}

# Setup Kubernetes cluster (local)
setup_local_k8s() {
    log_step "Setting up local Kubernetes cluster..."
    
    # Check if kind is installed
    if ! command -v kind &> /dev/null; then
        log_info "Installing kind (Kubernetes in Docker)..."
        if [[ "$OS" == "linux" ]]; then
            curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
            chmod +x ./kind
            sudo mv ./kind /usr/local/bin/kind
        elif [[ "$OS" == "macos" ]]; then
            if command -v brew &> /dev/null; then
                brew install kind
            fi
        fi
    fi
    
    # Create kind cluster if it doesn't exist
    if ! kind get clusters | grep -q "ars-local"; then
        log_info "Creating local Kubernetes cluster..."
        cat <<EOF | kind create cluster --name ars-local --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
- role: worker
- role: worker
EOF
    fi
    
    # Install NGINX Ingress Controller
    log_info "Installing NGINX Ingress Controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
    
    # Wait for ingress controller to be ready
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=90s
    
    log_info "Local Kubernetes cluster setup complete"
}

# Install monitoring tools
setup_monitoring() {
    log_step "Setting up monitoring tools..."
    
    # Add Helm repositories
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo update
    
    # Create monitoring namespace
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    
    # Install Prometheus and Grafana
    log_info "Installing Prometheus stack..."
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --set grafana.adminPassword=admin123 \
        --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
        --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false
    
    log_info "Monitoring tools installed successfully"
    log_info "Grafana will be available at: http://localhost:3000 (admin/admin123)"
}

# Main menu
show_menu() {
    echo "=================================================="
    echo "  Clinical Trial Metadata System - Infrastructure Setup"
    echo "=================================================="
    echo "1. Install Docker"
    echo "2. Install kubectl"
    echo "3. Install Helm"
    echo "4. Install additional tools (jq, yq, curl)"
    echo "5. Setup local development environment"
    echo "6. Setup local Kubernetes cluster"
    echo "7. Setup monitoring tools"
    echo "8. Install all (full setup)"
    echo "9. Exit"
    echo "=================================================="
}

# Full installation
install_all() {
    log_step "Starting full infrastructure setup..."
    check_os
    install_docker
    install_kubectl
    install_helm
    install_additional_tools
    setup_local_dev
    setup_local_k8s
    setup_monitoring
    
    log_info "Full infrastructure setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Run './deploy.sh dev start' for local development"
    echo "3. Run 'kubectl apply -f k8s/' for Kubernetes deployment"
    echo "4. Access Grafana at http://localhost:3000 (admin/admin123)"
}

# Main execution
main() {
    if [[ $# -eq 0 ]]; then
        while true; do
            show_menu
            read -p "Please select an option (1-9): " choice
            case $choice in
                1) check_os && install_docker ;;
                2) install_kubectl ;;
                3) install_helm ;;
                4) install_additional_tools ;;
                5) setup_local_dev ;;
                6) check_os && setup_local_k8s ;;
                7) setup_monitoring ;;
                8) install_all ;;
                9) exit 0 ;;
                *) log_error "Invalid option. Please try again." ;;
            esac
            echo ""
            read -p "Press Enter to continue..."
            clear
        done
    else
        case $1 in
            all) install_all ;;
            docker) check_os && install_docker ;;
            kubectl) install_kubectl ;;
            helm) install_helm ;;
            tools) install_additional_tools ;;
            dev) setup_local_dev ;;
            k8s) check_os && setup_local_k8s ;;
            monitoring) setup_monitoring ;;
            *) 
                echo "Usage: $0 [all|docker|kubectl|helm|tools|dev|k8s|monitoring]"
                exit 1
                ;;
        esac
    fi
}

main "$@"