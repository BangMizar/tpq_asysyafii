package routes

import (
	"github.com/gin-gonic/gin"
	"tpq_asysyafii/controllers"
	"tpq_asysyafii/middleware"
)

func UserRoutes(r *gin.Engine) {
	// Public
	r.POST("/register", controllers.RegisterUser)
	r.POST("/login", controllers.LoginUser)

	// Protected
	protected := r.Group("/users")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/", controllers.GetUsers)
		protected.GET("/:id", controllers.GetUserByID)
		protected.PUT("/:id", controllers.UpdateUser)
		protected.DELETE("/:id", controllers.DeleteUser)
	}
}
