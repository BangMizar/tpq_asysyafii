package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"tpq_asysyafii/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	// Ambil environment variables
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbname := os.Getenv("DB_NAME")

	// DSN MySQL dengan parameter optimasi
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local&timeout=30s&readTimeout=30s&writeTimeout=30s",
		user, pass, host, port, dbname)

	// Config dengan timeout
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NowFunc: func() time.Time {
			return time.Now().Local()
		},
	})
	if err != nil {
		log.Printf("❌ Gagal koneksi DB: %v", err)
		// Jangan fatal di sini, biarkan caller handle retry
		DB = nil
		return
	}

	// Ambil koneksi SQL mentah buat atur pooling
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("❌ Gagal ambil koneksi DB: %v", err)
		DB = nil
		return
	}

	// ⚡ OPTIMASI KRITIS: Kurangi koneksi untuk hindari max_user_connections
	sqlDB.SetMaxOpenConns(2)      // ⬇️ KURANGI dari 3 ke 2
	sqlDB.SetMaxIdleConns(1)      // ⬇️ KURANGI dari 2 ke 1  
	sqlDB.SetConnMaxLifetime(5 * time.Minute)
	sqlDB.SetConnMaxIdleTime(2 * time.Minute)

	// Test connection
	if err := sqlDB.Ping(); err != nil {
		log.Printf("❌ Database ping failed: %v", err)
		sqlDB.Close()
		DB = nil
		return
	}

	DB = db
	log.Printf("✅ Database terkoneksi dengan pool aman (MaxOpen: 2, MaxIdle: 1)")

	// AutoMigrate dengan timeout context
	// migrateDB(db)
}

// Pisahkan migrate agar tidak block startup lama
func migrateDB(db *gorm.DB) {
	log.Printf("🔄 Starting database migration...")
	
	start := time.Now()
	err := db.AutoMigrate(
		&models.User{},
		&models.Keluarga{},
		&models.Santri{},
		&models.Syahriah{},
		&models.Donasi{},
		&models.PemakaianSaldo{},
		&models.RekapSaldo{},
		&models.Pengumuman{},
		&models.Berita{},
		&models.Fasilitas{},
		&models.Testimoni{},
		&models.InformasiTPQ{},
		&models.SosialMedia{},
		&models.ProgramUnggulan{},
		&models.LogAktivitas{},
	)
	
	if err != nil {
		log.Printf("⚠️ Gagal migrate database: %v", err)
		// Jangan fatal, biarkan aplikasi tetap running
	} else {
		log.Printf("✅ Database migration completed in %v", time.Since(start))
	}
}

func GetDB() *gorm.DB {
	return DB
}

// Function untuk health check database
func CheckDBHealth() bool {
	if DB == nil {
		return false
	}
	
	sqlDB, err := DB.DB()
	if err != nil {
		return false
	}
	
	return sqlDB.Ping() == nil
}