package routes

import (
	"database/sql"
	"go-secure-file-management/handlers"
	"go-secure-file-management/middleware"
	"os"

	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(db *sql.DB) *gin.Engine {
	clientUrl := os.Getenv("CLIENT_URL")
	router := gin.Default()
	jwtMiddleware := middleware.JWTAuth()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{clientUrl}, // Allow only frontend
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition"},
		AllowCredentials: true, // Allow cookies/auth
		MaxAge:           12 * time.Hour,
	}))
	router.Use(middleware.CSPMiddleware())
	router.Use(middleware.SecureHeadersMiddleware())

	fileHandler := handlers.NewFileHandler(db)
	userHandler := handlers.NewUserHandler(db)

	apiGroup := router.Group("/api")

	apiGroup.POST("/login", userHandler.Login)
	apiGroup.POST("/register", userHandler.Register)

	fileRouter := apiGroup.Group("file")
	fileRouter.Use(jwtMiddleware)
	fileRouter.GET("", fileHandler.GetFiles)
	fileRouter.POST("/upload-chunk", middleware.RateLimiter(), fileHandler.CreateFile)
	fileRouter.GET("/metadata/:fileId", fileHandler.GetFileMetadata)
	fileRouter.GET("/download/:fileId", fileHandler.DownloadFile)
	fileRouter.DELETE("/:fileId", fileHandler.DeleteFile)

	return router
}
