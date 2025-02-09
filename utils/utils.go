package utils

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/h2non/filetype"
)

type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

var JWTSecret = []byte(os.Getenv("JWT_SECRET")) // need to update

func GenerateJWT(userId uint, email string) (string, error) {
	claims := Claims{
		UserID: userId,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Token expiration
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JWTSecret)
}

func ValidateJWT(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return JWTSecret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func GetMimeType(file multipart.File) (string, error) {
	// Read first 261 bytes (max signature length)
	header := make([]byte, 261)
	_, err := file.Read(header)
	if err != nil && err != io.EOF {
		return "", err
	}

	// Detect the file type
	kind, _ := filetype.Match(header)
	if kind == filetype.Unknown {
		return "", fmt.Errorf("unknown type")
	}

	return kind.MIME.Value, nil
}

func ScanFileWithClamav(filePath string) (bool, error) {
	absolutePath, err := filepath.Abs(filePath)
	if err != nil {
		fmt.Println("Error getting absolute path:", err)
		return false, err
	}

	cmd := exec.Command("clamdscan", "--no-summary", filePath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false, err
	}

	if string(output) == "" || string(output) == fmt.Sprintf("%s: OK\n", absolutePath) {
		return true, nil // clean
	} else {
		return false, nil // infected
	}
}
