#!/bin/bash

# Load environment variables from .env file
set -o allexport
source .env
set +o allexport

echo "Building React app..."
cd frontend
npm run build

scp -i ../$SSH_KEY_PATH -r dist/* $SERVER:/var/www/html
echo "Deployment React app completed"