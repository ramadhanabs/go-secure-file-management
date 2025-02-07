package routes

import (
	"database/sql"
	"go-secure-file-management/handlers"
	"go-secure-file-management/middleware"

	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(db *sql.DB) *gin.Engine {
	router := gin.Default()
	jwtMiddleware := middleware.JWTAuth()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Allow only frontend
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
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
	fileRouter.DELETE("/:fileId", fileHandler.DeleteFile)

	return router
}
