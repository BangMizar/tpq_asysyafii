package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"tpq_asysyafii/utils"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token tidak ada"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token tidak valid"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.IDUser)
		c.Set("role", claims.Role)

		c.Next()
	}
}
