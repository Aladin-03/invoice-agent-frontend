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
echo "========================================="

# Validate required variables
if [ -z "$FIREBASE_PROJECT_ID" ] || [ -z "$REGION" ] || [ -z "$SERVICE_ACCOUNT" ] || [ -z "$APP_NAME" ]; then
    echo -e "${RED}Error: Missing required environment variables in .env${NC}"
    echo "Required: FIREBASE_PROJECT_ID, REGION, SERVICE_ACCOUNT, APP_NAME"
    exit 1
fi

# Set project
echo -e "${YELLOW}Setting GCP project...${NC}"
gcloud config set project $FIREBASE_PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# Build and deploy
echo -e "${YELLOW}Building and deploying to Cloud Run...${NC}"
gcloud run deploy $APP_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --service-account $SERVICE_ACCOUNT \
  --max-instances 5 \
  --min-instances 0 \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --set-env-vars VITE_API_BASE_URL=$VITE_API_BASE_URL

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
