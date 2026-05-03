#!/bin/bash
# deploy.sh - Script to deploy ElectionBuddy backend to Google Cloud Run

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration Variables
PROJECT_ID="your-gcp-project-id"
REGION="asia-south1" # Pune/Mumbai region
SERVICE_NAME="ElectionBuddy-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "========================================"
echo " Deploying ElectionBuddy API to Cloud Run"
echo " Project: ${PROJECT_ID}"
echo " Region: ${REGION}"
echo "========================================"

# 1. Enable Required Google Cloud APIs
echo "Enabling necessary GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    aiplatform.googleapis.com \
    secretmanager.googleapis.com \
    --project ${PROJECT_ID}

# 2. Build the Docker Image and push to Google Container Registry (or Artifact Registry)
echo "Building and pushing Docker image using Cloud Build..."
gcloud builds submit --tag ${IMAGE_NAME} --project ${PROJECT_ID}

# 3. Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --project ${PROJECT_ID} \
    --allow-unauthenticated \
    --set-env-vars=GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION} \
    --memory 1024Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10

echo "========================================"
echo " Deployment Complete!"
echo " Check the URL provided above to access the API."
echo " To deploy the frontend, run: firebase deploy --only hosting"
echo "========================================"
