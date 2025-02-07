package routes

import (
	"database/sql"
	"go-secure-file-management/handlers"

	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(db *sql.DB) *gin.Engine {
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Allow only frontend
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true, // Allow cookies/auth
		MaxAge:           12 * time.Hour,
	}))

	fileHandler := handlers.NewFileHandler(db)

	apiGroup := router.Group("/api")

	fileRouter := apiGroup.Group("file")
	fileRouter.POST("/upload-chunk", fileHandler.CreateFile)
	fileRouter.GET("/metadata/:fileId", fileHandler.GetFileMetadata)
	fileRouter.DELETE("/:fileId", fileHandler.DeleteFile)

	return router
}
