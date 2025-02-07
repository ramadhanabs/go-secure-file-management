package middleware

import (
	"fmt"
	"go-secure-file-management/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		if !strings.HasPrefix(auth, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		auth = auth[7:]
		claims, err := utils.ValidateJWT(auth)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			c.Abort()
			return
		}

		if c.Request.Method == http.MethodPost || c.Request.Method == http.MethodPut || c.Request.Method == http.MethodPatch {
			contentType := c.GetHeader("Content-Type")

			fmt.Printf("Fullpath %s", c.FullPath())

			switch c.FullPath() {
			case "/api/file/upload-chunk":
				if !strings.HasPrefix(contentType, "multipart/form-data") {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Content-Type must be multipart/form-data for file uploads"})
					c.Abort()
					return
				}
			default:
				if contentType != "application/json" {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Content-Type must be application/json"})
					c.Abort()
					return
				}
			}
		}

		c.Set("claims", claims)
		c.Set("userId", claims.UserID)
		c.Next()
	}
}
