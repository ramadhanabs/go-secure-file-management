# Project Overview
This project is a web application built with React (Vite) for the frontend and Golang (Gin) for the backend. It supports secure file upload with chunking, authentication using JWT, and includes security measures such as CSP, XSS protection, and rate limiting.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Golang](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtoken&logoColor=white)

## Features
- **User Authentication**: Login and register using JWT tokens.
- **Secure File Upload**: Chunked file uploads with server-side re-validation.
- **Rate Limiting**: Prevent abuse with IP-based rate limits.
- **Security Measures**:
  - Content Security Policy (CSP)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection
  - MIME-type validation
  - Server-side file type re-validation using `github.com/h2non/filetype`
  - Virus scanning integration (TBD)

## Tech Stack
- **Frontend**: React (Vite), TypeScript, TailwindCSS, Shadcn UI, React Router
- **Backend**: Golang (Gin), SQLite3
- **Security**: CSP, JWT authentication

## Installation

### Prerequisites
- Node.js & npm
- Golang (v1.19+)
- SQLite
- Clamav (only required if virus scanner enabled)
- Musl

### Backend Setup
```sh
git clone <repo-url>
go mod tidy
go run main.go
```

### Frontend Setup
```sh
cd frontend
npm install
npm run dev
```

## API Endpoints
### **Authentication**
#### Register
```http
POST /api/register
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```
**Response:**
```json
{
  "email": "user@example.com",
  "token": "<JWT_TOKEN>"
}
```

#### Login
```http
POST /api/login
```
**Body:** _(Same as register)_

### **File Upload (Chunked Upload)**
#### Upload Chunk
```http
POST /api/upload-chunk
```
**Form Data:**
- `file`: Chunked file part
- `metadata`: JSON string containing `{ fileId, offset, limit, fileSize, fileName, checkSum }`

#### Download File
```http
GET /api/file/download/:id
```

## Deployment
### **Backend on Ubuntu VPS**
```sh
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
```
Run:
```sh
go run main.go
```

### **Frontend on Ubuntu VPS**
```sh
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
```
# Documentation

## Security Audit
### **Client-Side Protections Implemented**
1. **Content Security Policy (CSP)**
   - Restricts sources for scripts, styles, and other resources.
   - Prevents inline scripts and `eval()`.
   - To test CSP, check the **Network Tab** in DevTools for `Content-Security-Policy` header.

2. **XSS Protection**
   - Avoids rendering untrusted input directly in the DOM.
   - Avoiding `dangerouslySetInnerHTML` usage on React application.

3. **Secure HTTP Headers**
   - `X-Content-Type-Options: nosniff` (Prevents MIME-type sniffing).
   - `X-Frame-Options: DENY` (Prevents clickjacking).
   - `X-XSS-Protection: 1; mode=block` (Blocks reflected XSS attacks).

4. **Strict MIME Type Handling**
   - Ensures only expected file types are processed -> ["image/png", "image/jpeg", "application/pdf"]
   - Uses **`github.com/h2non/filetype`** for accurate file type detection on the backend.

5. **Authentication & Token Security**
   - Uses **JWT** -> needs some improvement by implementing short age and invalidating previous JWT token.

### **Server-Side Security Recommendations**
1. **Rate Limiting**
   - Limits requests to **200 requests per minute** for `/upload-chunk`.
   - Prevents **DoS (Denial of Service)** attacks by tracking IP-based limits.

2. **File Upload Security**
   - **Server-side file type re-validation** using `h2non/filetype` to prevent spoofing.
   - **Virus scanning** integration (e.g., ClamAV or third-party services) -> currently disabled due to directory ownership problem.
   - **Sanitizing file names** to prevent directory traversal attacks -> TBD

3. **Input Validation & Sanitization**
   - **Zod schema validation** for all API requests to reject malformed data.
   - **Escaping untrusted user input** before storage or rendering.

4. **Secure API Communication**
   - Enforces HTTPS with **HSTS (Strict-Transport-Security)**.
   - Uses proper **CORS settings** to allow only trusted origins.

5. **Logging & Monitoring**
   - Tracks failed login attempts.
   - Uses structured logging for debugging and threat detection.
  
## Performance Plan
### **Large File Handling Strategy**
  - Chunked File Uploads: Implemented to reduce memory usage and prevent timeouts. ✅
  - Temporary Storage Cleanup: Ensure temporary chunk files are deleted after the final file is assembled. ✅
  - Concurrent Upload Processing: Consider handling multiple chunks in parallel for improved performance. 🕐
  - Unused Temporary File Cleanup: Ensure unused temporary chunk files are deleted if the upload process is failing by utilizing cronjob 🕐

### **Memory Management Approach**
  - Rate-Limited Processing: Apply rate limits to prevent excessive concurrent requests that could exhaust server resources. ✅
  - File Descriptor Management: Prevent file descriptor leaks by properly closing all file handles. ✅
  - Garbage Collection Optimization: Ensure that unused memory is released promptly in Golang. 🕐
  - Efficient Buffering: Use efficient buffering when writing chunked data to avoid excessive memory consumption. 🕐

### **Future Improvement**
  - Utilizing cloud storage services i.e. AWS S3 or Cloudinary to prevent storage optimization overhead issues.
  - Resumable upload feature.
  - Implementing Docker for horizontal scaling capability.
  - Implementing scheduled temporary file cleanup by utilizing cronjob.
  - CI/CD implementation for efficient and seamless development.

# Appendix
## Lighthouse Report
![Lighthouse Report](https://res.cloudinary.com/dzu79mrdy/image/upload/v1739150353/Screenshot_2025-02-09_at_22.35.12_jbp4ky.png)

## HTTP Observatory Report
![HTTP Observatory Report](https://res.cloudinary.com/dzu79mrdy/image/upload/v1739150547/Screenshot_2025-02-09_at_23.27.04_awr8fp.png)

## License
MIT License

