package routes

import (
	"tpq_asysyafii/controllers"
	"tpq_asysyafii/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// Auth
		api.POST("/register", controllers.RegisterUser)
		api.POST("/login", controllers.LoginUser)

		// Public donasi list (anonim)
		// api.GET("/donasi", controllers.GetDonasiPublik)

		// Protected routes (wali, admin, superadmin)
		protected := api.Group("/")
		protected.Use(middlewares.AuthMiddleware())
		{
			// User routes
			protected.GET("/users", controllers.GetUsers)
			protected.GET("/users/:id", controllers.GetUserByID)
			protected.PUT("/users/:id", controllers.UpdateUser)
			protected.DELETE("/users/:id", controllers.DeleteUser)

			// Wali: riwayat syahriah & profil keluarga
			// protected.GET("/syahriah/riwayat", controllers.GetRiwayatSyahriah)
			// protected.GET("/keluarga/:id", controllers.GetKeluargaByUser)
			// protected.PUT("/keluarga/:id", controllers.UpdateKeluarga)
		}

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middlewares.AuthMiddleware(), middlewares.AdminMiddleware())
		{
			// Admin kelola user
			admin.POST("/users", controllers.RegisterUser)

		}
	}
}
