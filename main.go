package main

import (
	"go-secure-file-management/db"
	"go-secure-file-management/routes"

	"fmt"

	"github.com/gin-contrib/cors"
)

func main() {
	db.Init("./my_db.db")
	defer db.DB.Close()

	r := routes.SetupRouter(db.DB)
	r.Static("/uploads", "./uploads")
	r.Use(cors.Default())

	fmt.Printf("Starting server...\n")
	r.Run()
}
