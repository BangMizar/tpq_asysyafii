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
		api.POST("/register", controllers.RegisterUser)
		api.POST("/login", controllers.LoginUser)
		donasiController := controllers.NewDonasiController(config.GetDB())
		api.GET("/donasi-public", donasiController.GetDonasiPublic)
    	api.GET("/donasi-public/summary", donasiController.GetDonasiSummaryPublic)

		protected := api.Group("/")
		protected.Use(middlewares.AuthMiddleware())
		{
			protected.GET("/users", controllers.GetUsers)
			protected.GET("/users/:id", controllers.GetUserByID)
			protected.PUT("/users/:id", controllers.UpdateUser)
			protected.DELETE("/users/:id", controllers.DeleteUser)

			keluargaController := controllers.NewKeluargaController(config.DB)
			protected.POST("/keluarga", keluargaController.CreateKeluarga)
			protected.GET("/keluarga", keluargaController.GetAllKeluarga)
			protected.GET("/keluarga/my", keluargaController.GetMyKeluarga)
			protected.GET("/keluarga/search", keluargaController.SearchKeluarga)
			protected.GET("/keluarga/:id", keluargaController.GetKeluargaByID)
			protected.GET("/keluarga/wali/:id_wali", keluargaController.GetKeluargaByWali)
			protected.PUT("/keluarga/:id", keluargaController.UpdateKeluarga)
			protected.DELETE("/keluarga/:id", keluargaController.DeleteKeluarga)

			syahriahController := controllers.NewSyahriahController(config.DB)
			protected.GET("/syahriah", syahriahController.GetAllSyahriah)
			protected.GET("/syahriah/my", syahriahController.GetMySyahriah)	
			protected.GET("/syahriah/summary", syahriahController.GetSyahriahSummary)
			protected.GET("/syahriah/:id", syahriahController.GetSyahriahByID)

			pengumumanController := controllers.NewPengumumanController(config.DB)
			protected.GET("/pengumuman", pengumumanController.GetAllPengumuman)
			protected.GET("/pengumuman/aktif", pengumumanController.GetPengumumanAktif)
			protected.GET("/pengumuman/:id", pengumumanController.GetPengumumanByID)

			rekapController := controllers.NewRekapController(config.DB)
			protected.GET("/rekap", rekapController.GetAllRekap)
			protected.GET("/rekap/summary", rekapController.GetRekapSummary)
			protected.GET("/rekap/latest", rekapController.GetLatestRekap)
			protected.GET("/rekap/period", rekapController.GetRekapByPeriode)
			protected.GET("/rekap/:id", rekapController.GetRekapByID)

			pemakaianController := controllers.NewPemakaianSaldoController(config.DB)
			protected.GET("/pemakaian", pemakaianController.GetAllPemakaian)
			protected.GET("/pemakaian/summary", pemakaianController.GetPemakaianSummary)
			protected.GET("/pemakaian/:id", pemakaianController.GetPemakaianByID)
		}

		admin := api.Group("/admin")
		admin.Use(middlewares.AuthMiddleware(), middlewares.AdminMiddleware())
		{
			admin.GET("/users", controllers.GetUsers)
			admin.GET("/wali",controllers.GetWali)
			admin.POST("/users", controllers.RegisterUser)

			donasiController := controllers.NewDonasiController(config.GetDB())
			admin.POST("/donasi", donasiController.CreateDonasi)
			admin.GET("/donasi", donasiController.GetAllDonasi)
			admin.GET("/donasi/summary", donasiController.GetDonasiSummary)
			admin.GET("/donasi/by-date", donasiController.GetDonasiByDateRange)
			admin.GET("/donasi/:id", donasiController.GetDonasiByID)
			admin.PUT("/donasi/:id", donasiController.UpdateDonasi)
			admin.DELETE("/donasi/:id", donasiController.DeleteDonasi)

			syahriahController := controllers.NewSyahriahController(config.DB)
			admin.POST("/syahriah", syahriahController.CreateSyahriah)
        	admin.PUT("/syahriah/:id", syahriahController.UpdateSyahriah)
        	admin.DELETE("/syahriah/:id", syahriahController.DeleteSyahriah)
			admin.GET("/syahriah", syahriahController.GetAllSyahriah)
			admin.GET("/syahriah/my", syahriahController.GetMySyahriah)	
			admin.GET("/syahriah/summary", syahriahController.GetSyahriahSummary)
			admin.GET("/syahriah/:id", syahriahController.GetSyahriahByID)
			admin.PUT("/syahriah/:id/bayar", syahriahController.BayarSyahriah)

			pengumumanController := controllers.NewPengumumanController(config.DB)
			admin.POST("/pengumuman", pengumumanController.CreatePengumuman)
			admin.PUT("/pengumuman/:id", pengumumanController.UpdatePengumuman)
			admin.DELETE("/pengumuman/:id", pengumumanController.DeletePengumuman)
			admin.GET("/pengumuman/summary", pengumumanController.GetPengumumanSummary)

			logController := controllers.NewLogAktivitasController(config.GetDB())
			admin.GET("/logs", logController.GetAllLogAktivitas)
			admin.GET("/logs/summary", logController.GetLogSummary)
			admin.GET("/logs/:id", logController.GetLogAktivitasByID)

			rekapController := controllers.NewRekapController(config.DB)
			admin.POST("/rekap", rekapController.CreateRekap)
			admin.PUT("/rekap/:id", rekapController.UpdateRekap)
			admin.DELETE("/rekap/:id", rekapController.DeleteRekap)
			admin.POST("/rekap/generate", rekapController.GenerateRekapOtomatis)

			pemakaianController := controllers.NewPemakaianSaldoController(config.DB)
			admin.POST("/pemakaian", pemakaianController.CreatePemakaian)
			admin.PUT("/pemakaian/:id", pemakaianController.UpdatePemakaian)
			admin.DELETE("/pemakaian/:id", pemakaianController.DeletePemakaian)
		}

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