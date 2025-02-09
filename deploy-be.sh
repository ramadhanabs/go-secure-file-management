#!/bin/bash

# Load environment variables from .env file
set -o allexport
source .env
set +o allexport

# Remove existing compiled file
rm -rf $APP_NAME.gz

# Build the Go binary
echo "Building Golang app..."
CGO_ENABLED=1 CC=x86_64-linux-musl-gcc GOOS=linux GOARCH=amd64 go build -o $APP_NAME

# Compress the binary
gzip $APP_NAME

FILE_TO_TRANSFER="${APP_NAME}.gz"

echo "Deploying to $SERVER..."
# Clean up existing files on the server before deploying

ssh $SERVER -i $SSH_KEY_PATH << EOF
    echo "Cleaning up old build files..."
    cd $REMOTE_DIR
    rm -f $APP_NAME
    rm -f $FILE_TO_TRANSFER
EOF

echo "Transferring Golang binary..."
scp -i $SSH_KEY_PATH $FILE_TO_TRANSFER $SERVER:$REMOTE_DIR

ssh $SERVER -i $SSH_KEY_PATH << EOF
        echo "Setting up the new build..."
        cd $REMOTE_DIR
        gunzip $FILE_TO_TRANSFER
        chmod +x $APP_NAME
        sudo systemctl daemon-reload 
        sudo systemctl restart app
        echo "Deployment completed on $SERVER!"
EOF

echo "Deployment completed for $SERVER."


