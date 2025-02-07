package main

import (
	"go-secure-file-management/db"
	"go-secure-file-management/routes"
	"log"

	"fmt"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	db.Init("./my_db.db")
	defer db.DB.Close()

	r := routes.SetupRouter(db.DB)
	r.Static("/uploads", "./uploads")

	fmt.Printf("Starting server...\n")
	r.Run()
}
