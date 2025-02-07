package repositories

import (
	"database/sql"
	"fmt"
	"go-secure-file-management/db"
	"go-secure-file-management/models"
)

type UserRepository struct {
	DB *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{DB: db}
}

func (r *UserRepository) CreateUser(email string, password string) (models.User, error) {
	query := "INSERT INTO users (email, password) VALUES (?, ?) RETURNING id, email"

	var user models.User
	err := db.DB.QueryRow(query, email, password).Scan(&user.ID, &user.Email)
	if err != nil {
		return models.User{}, fmt.Errorf("failed to create user: %v", err)
	}

	return user, nil
}

func (r *UserRepository) FindUserByEmail(email string) (models.User, error) {
	query := "SELECT id, email, password FROM users WHERE email = ?"
	var user models.User

	row := db.DB.QueryRow(query, email)

	err := row.Scan(&user.ID, &user.Email, &user.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Print("User not found")
			return models.User{}, fmt.Errorf("no user found with email: %s", email)
		}
		return models.User{}, err
	}

	return user, nil
}
