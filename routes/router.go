package routes

import (
	"database/sql"
	"go-secure-file-management/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRouter(db *sql.DB) *gin.Engine {
	router := gin.Default()

	fileHandler := handlers.NewFileHandler(db)

	apiGroup := router.Group("/api")

	fileRouter := apiGroup.Group("file")
	fileRouter.POST("/upload-chunk", fileHandler.CreateFile)
	fileRouter.GET("/metadata/:fileId", fileHandler.GetFileMetadata)
	fileRouter.DELETE("/:fileId", fileHandler.DeleteFile)

	return router
}
