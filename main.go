package main

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"tpq_asysyafii/config"
	"tpq_asysyafii/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	_ = godotenv.Load()

	// Init DB
	config.InitDB()

	// Setup router
	r := gin.Default()

	r.Static("/image/berita", "./image/berita")
	workDir, _ := os.Getwd()
    log.Printf("Working directory: %s", workDir)
    log.Printf("Image path: %s", filepath.Join(workDir, "image", "berita"))

	// CORS setup
	allowedOrigins := getOriginsFromEnv()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-API-Key"}, // Tambahkan X-API-Key di sini
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // 12 hours
	}))

	// Register routes
	routes.SetupRoutes(r)

	// Port setup
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	log.Printf("Allowed origins: %v", allowedOrigins)
	log.Printf("Allowed headers: Origin, Content-Type, Authorization, X-API-Key")
	r.Run(":" + port)
}

func getOriginsFromEnv() []string {
	defaultOrigins := []string{
		"http://localhost:5173",
		"http://localhost:5174",
		"http://localhost:3000",
	}

	envOrigins := os.Getenv("ALLOWED_ORIGINS")
	if envOrigins == "" {
		return defaultOrigins
	}

	var origins []string
	for _, origin := range strings.Split(envOrigins, ",") {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" {
			origins = append(origins, trimmed)
		}
	}

	return append(defaultOrigins, origins...)
}