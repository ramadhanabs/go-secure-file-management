package db

import (
	"database/sql"
	"fmt"
	"log"
)

type Files struct {
	ID        int    `json:"id"`
	UserId    string `json:"user_id"`
	Path      string `json:"path"`
	CreatedAt string `json:"created_at"`
}

func CreateFile(userId string, path string) error {
	query := "INSERT INTO files (user_id, path) VALUES (?, ?)"
	_, err := DB.Exec(query, userId, path)

	if err != nil {
		log.Printf("Failed to create file: %v", err)
	}

	return err
}

func Delete(userId string, id string) error {
	query := "DELETE FROM files WHERE user_id = ? AND id = ?"
	_, err := DB.Exec(query, userId, id)

	if err != nil {
		log.Printf("Failed to delete file: %v", err)
	}

	return err
}

func GetById(id string) (Files, error) {
	query := "SELECT id, user_id, path, created_at FROM files WHERE id = ?"
	var file Files

	row := DB.QueryRow(query, id)

	err := row.Scan(&file.ID, &file.UserId, &file.Path, &file.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return Files{}, fmt.Errorf("no file found with ID: %s", id)
		}
		return Files{}, err
	}

	return file, nil
}

func GetFilesByUserId(userId string) ([]Files, error) {
	query := "SELECT * FROM files WHERE user_id = ?"
	rows, err := DB.Query(query, userId)
	if err != nil {
		return nil, err
	}

	var files []Files
	for rows.Next() {
		var file Files
		if err := rows.Scan(&file.ID, &file.UserId, &file.Path, &file.CreatedAt); err != nil {
			return nil, err
		}
		files = append(files, file)
	}

	return files, nil
}
