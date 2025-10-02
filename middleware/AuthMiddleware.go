package middlewares

import (
	"net/http"
	"strings"
	"tpq_asysyafii/utils"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header kosong"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Format token salah (Bearer <token>)"})
			c.Abort()
			return
		}

		claims, err := utils.VerifyToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid"})
			c.Abort()
			return
		}

		// Simpan ke context
		if userID, ok := claims["user_id"].(string); ok {
			c.Set("user_id", userID)
		}
		if role, ok := claims["role"].(string); ok {
			c.Set("role", role)
		}

		c.Next()
	}
}

// Middleware untuk admin dan super_admin
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role tidak ditemukan"})
			c.Abort()
			return
		}

		roleStr := role.(string)
		if roleStr != "admin" && roleStr != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Hanya admin dan super admin yang bisa mengakses"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// Middleware hanya untuk super_admin
func SuperAdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role tidak ditemukan"})
			c.Abort()
			return
		}

		roleStr := role.(string)
		if roleStr != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Hanya super admin yang bisa mengakses"})
			c.Abort()
			return
		}
		c.Next()
	}
}