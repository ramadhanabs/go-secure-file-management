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

func (r *FileRepository) CreateFile(path string) error {
	query := "INSERT INTO files (path) VALUES (?)"
	_, err := db.DB.Exec(query, path)

	if err != nil {
		fmt.Printf("Failed to create file: %v", err)
	}

	return err
}

func (r *FileRepository) DeleteFile(id int) error {
	query := "DELETE FROM files WHERE id = ?"
	_, err := db.DB.Exec(query, id)

	if err != nil {
		log.Printf("Failed to delete file: %v", err)
	}

	return err
}

func (r *FileRepository) GetFileById(id int) (models.Files, error) {
	query := "SELECT id, path, created_at FROM files WHERE id = ?"
	var file models.Files

	row := db.DB.QueryRow(query, id)

	err := row.Scan(&file.ID, &file.UserId, &file.Path, &file.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.Files{}, fmt.Errorf("No file found with ID: %d", id)
		}
		return models.Files{}, err
	}

	return file, nil
}
