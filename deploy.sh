#!/bin/bash

# Load .env
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found!"
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "Deploying Invoice Agent Frontend"
echo "========================================="
echo "App Name: $APP_NAME"
echo "Project: $FIREBASE_PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_ACCOUNT"
echo "Backend URL: $VITE_API_BASE_URL"
echo "OpenAI API Key length: ${#VITE_OPENAI_API_KEY}"
echo "OpenAI API Key preview: ${VITE_OPENAI_API_KEY:0:20}..."
echo "========================================="

# Validate required variables
if [ -z "$FIREBASE_PROJECT_ID" ] || [ -z "$REGION" ] || [ -z "$SERVICE_ACCOUNT" ] || [ -z "$APP_NAME" ] || [ -z "$VITE_OPENAI_API_KEY" ]; then
    echo -e "${RED}Error: Missing required environment variables in .env${NC}"
    echo "Required: FIREBASE_PROJECT_ID, REGION, SERVICE_ACCOUNT, APP_NAME, VITE_OPENAI_API_KEY"
    exit 1
fi

# Set project
echo -e "${YELLOW}Setting GCP project...${NC}"
gcloud config set project $FIREBASE_PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Create Artifact Registry repository if it doesn't exist
echo -e "${YELLOW}Checking Artifact Registry...${NC}"
gcloud artifacts repositories describe $APP_NAME \
    --location=$REGION 2>/dev/null || \
gcloud artifacts repositories create $APP_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for $APP_NAME"

# Build image with Cloud Build
IMAGE_NAME="${REGION}-docker.pkg.dev/${FIREBASE_PROJECT_ID}/${APP_NAME}/${APP_NAME}:latest"

echo -e "${YELLOW}Building Docker image with Cloud Build...${NC}"
gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions="_VITE_API_BASE_URL=${VITE_API_BASE_URL},_VITE_OPENAI_API_KEY=${VITE_OPENAI_API_KEY},_IMAGE_NAME=${IMAGE_NAME}" \
    --timeout=20m

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

# Deploy to Cloud Run
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy $APP_NAME \
  --image $IMAGE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --service-account $SERVICE_ACCOUNT \
  --max-instances 5 \
  --port 8080 \
  --memory 4Gi \
  --cpu 2000m \
  --timeout 900

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Deployment failed${NC}"
    exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe $APP_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "========================================="
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo "========================================="
echo -e "${GREEN}Service URL: ${SERVICE_URL}${NC}"
echo "========================================="
