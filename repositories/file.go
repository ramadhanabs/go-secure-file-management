package repositories

import (
	"database/sql"
	"fmt"
	"go-secure-file-management/db"
	"go-secure-file-management/models"
	"log"
)

type FileRepository struct {
	DB *sql.DB
}

func NewFileRepository(db *sql.DB) *FileRepository {
	return &FileRepository{DB: db}
}

func (r *FileRepository) CreateFile(path string, userId uint, filename string, size int, mimeType string) error {
	query := "INSERT INTO files (user_id, path, filename, size, mime_type) VALUES (?, ?, ?, ?, ?)"
	_, err := db.DB.Exec(query, userId, path, filename, size, mimeType)

	if err != nil {
		fmt.Printf("Failed to create file: %v", err)
	}

	return err
}

func (r *FileRepository) DeleteFile(id int, userId uint) error {
	query := "DELETE FROM files WHERE id = ? AND id = ?"
	_, err := db.DB.Exec(query, id, userId)

	if err != nil {
		log.Printf("Failed to delete file: %v", err)
	}

	return err
}

func (r *FileRepository) GetFileById(id int) (models.Files, error) {
	query := "SELECT * FROM files WHERE id = ?"
	var file models.Files

	row := db.DB.QueryRow(query, id)

	err := row.Scan(&file.ID, &file.UserId, &file.Path, &file.Filename, &file.Size, &file.MimeType, &file.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.Files{}, fmt.Errorf("No file found with ID: %d", id)
		}
		return models.Files{}, err
	}

	return file, nil
}

func (r *FileRepository) GetFilesByUserId(userId uint) ([]models.Files, error) {
	query := "SELECT * FROM files WHERE user_id = ?"
	rows, err := db.DB.Query(query, userId)
	if err != nil {
		return nil, err
	}

	var files []models.Files
	for rows.Next() {
		var file models.Files
		if err := rows.Scan(&file.ID, &file.UserId, &file.Path, &file.Filename, &file.Size, &file.MimeType, &file.CreatedAt); err != nil {
			return nil, err
		}
		files = append(files, file)
	}

	return files, nil

}
