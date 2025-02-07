package handlers

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"go-secure-file-management/repositories"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"

	"github.com/gin-gonic/gin"
)

type FileHandler struct {
	Repo *repositories.FileRepository
}

func NewFileHandler(db *sql.DB) *FileHandler {
	return &FileHandler{
		Repo: repositories.NewFileRepository(db),
	}
}

type Metadata struct {
	Order    int    `json:"order"`
	FileId   string `json:"fileId"`
	Offset   int    `json:"offset"`
	Limit    int    `json:"limit"`
	FileSize int    `json:"fileSize"`
	FileName string `json:"fileName"`
	CheckSum string `json:"checkSum"`
}

func (h *FileHandler) CreateFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	openedFile, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer openedFile.Close()

	var metadata Metadata
	metadataJSON := c.Request.FormValue("metadata")
	err = json.Unmarshal([]byte(metadataJSON), &metadata)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid meta data"})
		return
	}

	expectedChecksum := metadata.CheckSum // handle checksum
	hasher := sha256.New()
	if _, err := io.Copy(hasher, openedFile); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file content"})
		return
	}
	computedChecksum := hex.EncodeToString(hasher.Sum(nil))

	if computedChecksum != expectedChecksum {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "Invalid checksum value"})
		return
	}

	if err := c.SaveUploadedFile(file, fmt.Sprintf("./uploads/temp/%v_%v", metadata.Order, metadata.FileId)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload chunk file"})
		return
	}

	if metadata.FileSize == metadata.Limit {
		chunks, err := filepath.Glob(filepath.Join("./uploads/temp", fmt.Sprintf("*_%s", metadata.FileId)))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed finding chunk file"})
			return
		}

		sort.Slice(chunks, func(i, j int) bool {
			orderI, _ := strconv.Atoi(string(filepath.Base(chunks[i])[0]))
			orderJ, _ := strconv.Atoi(string(filepath.Base(chunks[j])[0]))

			return orderI < orderJ
		})

		finalPath := filepath.Join("./uploads", metadata.FileName)
		finalFile, err := os.Create(finalPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed creating final file"})
			return
		}
		defer finalFile.Close()

		for _, chunk := range chunks {
			chunkFile, err := os.Open(chunk)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			_, err = io.Copy(finalFile, chunkFile)
			chunkFile.Close()

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		for _, chunk := range chunks {
			os.Remove(chunk)
		}

		err = h.Repo.CreateFile(finalPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		println("Chunk upload complete, merging chunkable files...")
	}

	c.SaveUploadedFile(file, "./uploads/temp/")
	c.JSON(http.StatusCreated, gin.H{
		"message": "Success Upload",
	})
}

func (h *FileHandler) GetFileMetadata(c *gin.Context) {
	fileId := c.Param("fileId")
	if fileId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File ID is required"})
		return
	}

	parsedFileId, err := strconv.Atoi(fileId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse activity id"})
		return
	}

	file, err := h.Repo.GetFileById(parsedFileId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": file,
	})
}

func (h *FileHandler) DeleteFile(c *gin.Context) {
	fileId := c.Param("fileId")
	if fileId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File ID is required"})
		return
	}

	parsedFileId, err := strconv.Atoi(fileId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse activity id"})
		return
	}

	err = h.Repo.DeleteFile(parsedFileId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Success delete file",
	})
}
