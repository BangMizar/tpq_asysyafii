package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"tpq_asysyafii/config"
	"tpq_asysyafii/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	_ = godotenv.Load()

	// Setup router TERLEBIH DAHULU sebelum init DB
	r := gin.Default()

	// ✅ HEALTH CHECK SEDERHANA - respon immediate
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "TPQ Asy Syafii",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	r.GET("/kaithheathcheck", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Service is running",
			"timestamp": time.Now().Unix(),
		})
	})

	// Static files
	r.Static("/image/berita", "./image/berita")
	r.Static("/image/tpq", "./image/tpq")
	
	workDir, _ := os.Getwd()
	log.Printf("Working directory: %s", workDir)
	log.Printf("Image path: %s", filepath.Join(workDir, "image", "berita"))
	log.Printf("TPQ image path: %s", filepath.Join(workDir, "image", "tpq"))

	// CORS setup
	allowedOrigins := getOriginsFromEnv()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60,
	}))

	// ✅ START SERVER DULU dalam goroutine
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server in background
	server := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	go func() {
		log.Printf("🚀 Server starting on port %s", port)
		log.Printf("🌍 Allowed origins: %v", allowedOrigins)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Server failed to start: %v", err)
		}
	}()

	// ✅ INIT DB SETELAH SERVER RUNNING - dengan retry mechanism
	initDBWithRetry()

	// ✅ REGISTER ROUTES SETELAH DB READY
	routes.SetupRoutes(r)

	log.Printf("✅ All systems ready - DB connected and routes registered")

	// Keep application running
	select {}
}

func initDBWithRetry() {
	maxRetries := 5
	retryDelay := time.Second * 5

	for i := 0; i < maxRetries; i++ {
		log.Printf("🔄 Attempting to connect to database (attempt %d/%d)...", i+1, maxRetries)
		
		// Use a closure to handle connection without global state issues
		func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("⚠️ Database connection panic: %v", r)
				}
			}()
			
			config.InitDB()
		}()

		// Check if DB is connected
		if config.GetDB() != nil {
			log.Printf("✅ Database connected successfully")
			return
		}

		if i < maxRetries-1 {
			log.Printf("⏳ Retrying in %v...", retryDelay)
			time.Sleep(retryDelay)
			retryDelay *= 2 // Exponential backoff
		}
	}

	log.Fatalf("❌ Failed to connect to database after %d attempts", maxRetries)
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