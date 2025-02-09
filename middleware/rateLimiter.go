package middleware

import (
	"errors"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

var (
	rateLimitMap = make(map[string]int) // Store request count per IP
	mu           sync.Mutex             // Prevent race conditions
)

const (
	limit     = 200             // Max requests per minute
	resetTime = 1 * time.Minute // Reset period
)

func ResetRateLimit() {
	for {
		time.Sleep(resetTime)
		mu.Lock()
		rateLimitMap = make(map[string]int) // Reset all counts
		mu.Unlock()
	}
}

func RateLimiter() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()

		mu.Lock()
		defer mu.Unlock()

		// Check if IP exists, then increment count
		if count, exists := rateLimitMap[clientIP]; exists {
			if count >= limit {
				c.AbortWithError(http.StatusTooManyRequests, errors.New("too many request"))
				return
			}
			rateLimitMap[clientIP]++
		} else {
			rateLimitMap[clientIP] = 1
		}

		c.Next()
	}
}
