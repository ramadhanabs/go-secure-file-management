package middleware

import "github.com/gin-gonic/gin"

func SecureHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")                                         // Prevent MIME-type sniffing
		c.Writer.Header().Set("X-Frame-Options", "DENY")                                                   // disallow embedding in iframes
		c.Writer.Header().Set("X-XSS-Protection", "1; mode=block")                                         // prevent XSS
		c.Writer.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload") // Enforce HTTPS (HSTS - HTTP Strict Transport Security)

		c.Next()
	}
}
