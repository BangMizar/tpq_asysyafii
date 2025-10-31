package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"fmt"

	"tpq_asysyafii/config"
	"tpq_asysyafii/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	_ = godotenv.Load()

	// ⚡ SET GIN MODE RELEASE untuk performance
	gin.SetMode(gin.ReleaseMode)

	// Setup router
	r := gin.New()
	
	// Middleware dasar
	r.Use(gin.Recovery())
	
	// Custom logger middleware yang lebih sederhana
	r.Use(func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		
		c.Next()
		
		latency := time.Since(start)
		if latency > time.Second {
			log.Printf("[GIN] %3d | %13v | %15s | %-7s %s",
				c.Writer.Status(),
				latency,
				c.ClientIP(),
				c.Request.Method,
				path,
			)
		}
	})

	// ✅ HEALTH CHECK SEDERHANA & CEPAT - HARUS PERTAMA
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "healthy",
			"service":   "TPQ Asy Syafii",
			"timestamp": time.Now().Unix(),
			"version":   "1.0.0",
		})
	})

	// ✅ FIX TYPO: kaithheathcheck -> healthcheck
	r.GET("/healthcheck", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Service is running",
		})
	})

	r.GET("/kaithheathcheck", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok", 
			"message": "Legacy health check",
		})
	})

	// Static files dengan path yang benar
	workDir, _ := os.Getwd()
	beritaPath := filepath.Join(workDir, "image", "berita")
	tpqPath := filepath.Join(workDir, "image", "tpq")
	
	// Pastikan directory exists atau buat
	os.MkdirAll(beritaPath, 0755)
	os.MkdirAll(tpqPath, 0755)
	
	r.Static("/image/berita", beritaPath)
	r.Static("/image/tpq", tpqPath)

	log.Printf("Working directory: %s", workDir)
	log.Printf("Berita image path: %s", beritaPath)
	log.Printf("TPQ image path: %s", tpqPath)

	// CORS setup
	allowedOrigins := getOriginsFromEnv()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-API-Key", "Accept"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ✅ INIT DATABASE DENGAN CONTEXT TIMEOUT
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	if err := initDBWithRetry(ctx); err != nil {
		log.Printf("❌ Database initialization failed: %v", err)
		// Jangan exit, biarkan aplikasi tetap running tanpa DB
	} else {
		log.Printf("✅ Database connected successfully")
	}

	// ✅ REGISTER ROUTES - bahkan jika DB gagal
	routes.SetupRoutes(r)

	// Port setup
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// ✅ GRACEFUL SHUTDOWN SETUP
	server := &http.Server{
		Addr:    ":" + port,
		Handler: r,
		// Timeout configuration
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("🚀 Server starting on port %s", port)
		log.Printf("🌍 Allowed origins: %v", allowedOrigins)
		log.Printf("✅ Health checks available at: /health, /healthcheck, /kaithheathcheck")
		
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	
	log.Println("🛑 Shutting down server gracefully...")
	
	ctxShutdown, cancelShutdown := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelShutdown()
	
	if err := server.Shutdown(ctxShutdown); err != nil {
		log.Fatalf("❌ Server forced to shutdown: %v", err)
	}
	
	// Close DB connection if exists
	if config.GetDB() != nil {
		if sqlDB, err := config.GetDB().DB(); err == nil {
			sqlDB.Close()
			log.Println("✅ Database connection closed")
		}
	}
	
	log.Println("✅ Server exited properly")
}

func initDBWithRetry(ctx context.Context) error {
	maxRetries := 3
	retryDelay := time.Second * 5

	for i := 0; i < maxRetries; i++ {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			log.Printf("🔄 Database connection attempt %d/%d...", i+1, maxRetries)
			
			// Try to initialize DB
			config.InitDB()
			
			// Check if DB is connected and healthy
			if config.GetDB() != nil {
				if sqlDB, err := config.GetDB().DB(); err == nil {
					if err := sqlDB.Ping(); err == nil {
						log.Printf("✅ Database connected successfully")
						return nil
					}
				}
			}
			
			if i < maxRetries-1 {
				log.Printf("⏳ Retrying in %v...", retryDelay)
				time.Sleep(retryDelay)
				retryDelay *= 2 // Exponential backoff
			}
		}
	}
	
	return fmt.Errorf("failed to connect to database after %d attempts", maxRetries)
}

func getOriginsFromEnv() []string {
	envOrigins := os.Getenv("ALLOWED_ORIGINS")
	if envOrigins == "" {
		return []string{
			"http://localhost:5173",
			"http://localhost:5174", 
			"http://localhost:3000",
			"https://tpq-asysyafii.vercel.app",
		}
	}

	origins := strings.Split(envOrigins, ",")
	for i, origin := range origins {
		origins[i] = strings.TrimSpace(origin)
	}
	return origins
}
