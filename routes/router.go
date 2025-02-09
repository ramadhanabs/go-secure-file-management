package routes

import (
	"database/sql"
	"go-secure-file-management/handlers"
	"go-secure-file-management/middleware"

	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CSPMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Content-Security-Policy",
			"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none';")
		c.Next()
	}
}

func SecureHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")                                         // Prevent MIME-type sniffing
		c.Writer.Header().Set("X-Frame-Options", "DENY")                                                   // disallow embedding in iframes
		c.Writer.Header().Set("X-XSS-Protection", "1; mode=block")                                         // prevent XSS
		c.Writer.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload") // Enforce HTTPS (HSTS - HTTP Strict Transport Security)

		c.Next()
	}
}

func SetupRouter(db *sql.DB) *gin.Engine {
	router := gin.Default()
	jwtMiddleware := middleware.JWTAuth()

	router.Use(CSPMiddleware())
	router.Use(SecureHeadersMiddleware())
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Allow only frontend
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition"},
		AllowCredentials: true, // Allow cookies/auth
		MaxAge:           12 * time.Hour,
	}))

	fileHandler := handlers.NewFileHandler(db)
	userHandler := handlers.NewUserHandler(db)

	apiGroup := router.Group("/api")

	apiGroup.POST("/login", userHandler.Login)
	apiGroup.POST("/register", userHandler.Register)

	fileRouter := apiGroup.Group("file")
	fileRouter.Use(jwtMiddleware)
	fileRouter.GET("", fileHandler.GetFiles)
	fileRouter.POST("/upload-chunk", fileHandler.CreateFile)
	fileRouter.GET("/metadata/:fileId", fileHandler.GetFileMetadata)
	fileRouter.GET("/download/:fileId", fileHandler.DownloadFile)
	fileRouter.DELETE("/:fileId", fileHandler.DeleteFile)

	return router
}
