package routes

import (
	"tpq_asysyafii/config"
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

		// Public donasi list (anonim) - jika diperlukan
		// api.GET("/donasi-public", controllers.GetDonasiPublik)

		// Protected routes (wali, admin, superadmin)
		protected := api.Group("/")
		protected.Use(middlewares.AuthMiddleware())
		{
			// User routes - bisa diakses semua role yang login
			protected.GET("/users", controllers.GetUsers)
			protected.GET("/users/:id", controllers.GetUserByID)
			protected.PUT("/users/:id", controllers.UpdateUser)
			protected.DELETE("/users/:id", controllers.DeleteUser)

			// Profile routes
			// protected.GET("/profile", controllers.GetProfile)
			// protected.PUT("/profile", controllers.UpdateProfile)

			// Wali: riwayat syahriah & profil keluarga
			// protected.GET("/syahriah/riwayat", controllers.GetRiwayatSyahriah)
			// protected.GET("/keluarga/:id", controllers.GetKeluargaByUser)
			// protected.PUT("/keluarga/:id", controllers.UpdateKeluarga)
		}

		// Admin routes (admin & super_admin)
		admin := api.Group("/admin")
		admin.Use(middlewares.AuthMiddleware(), middlewares.AdminMiddleware())
		{
			// Admin kelola user
			admin.POST("/users", controllers.RegisterUser)

			// Donasi routes - hanya admin & super_admin
			donasiController := controllers.NewDonasiController(config.GetDB())
			admin.POST("/donasi", donasiController.CreateDonasi)
			admin.GET("/donasi", donasiController.GetAllDonasi)
			admin.GET("/donasi/summary", donasiController.GetDonasiSummary)
			admin.GET("/donasi/by-date", donasiController.GetDonasiByDateRange)
			admin.GET("/donasi/:id", donasiController.GetDonasiByID)
			admin.PUT("/donasi/:id", donasiController.UpdateDonasi)
			admin.DELETE("/donasi/:id", donasiController.DeleteDonasi)

			// Log routes (read only)
			logController := controllers.NewLogAktivitasController(config.GetDB())
			admin.GET("/logs", logController.GetAllLogAktivitas)
			admin.GET("/logs/summary", logController.GetLogSummary)
			admin.GET("/logs/:id", logController.GetLogAktivitasByID)
		}

		// Super Admin only routes
		superAdmin := api.Group("/super-admin")
		superAdmin.Use(middlewares.AuthMiddleware(), middlewares.SuperAdminMiddleware())
		{
			// Routes khusus super admin
			// superAdmin.POST("/admin", controllers.CreateAdmin)
			// superAdmin.DELETE("/users/:id/hard", controllers.HardDeleteUser)
			// Tambahan routes khusus super admin lainnya
		}
	}
}