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

	// DSN MySQL
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local",
		user, pass, host, port, dbname)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent), 
	})
	if err != nil {
		log.Fatalf("Gagal koneksi DB: %v", err)
	}

	// Ambil koneksi SQL mentah buat atur pooling
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Gagal ambil koneksi DB: %v", err)
	}


	sqlDB.SetMaxOpenConns(3) 
	sqlDB.SetMaxIdleConns(2)
	sqlDB.SetConnMaxLifetime(2 * time.Minute) 

	DB = db
	fmt.Println("✅ Database terkoneksi dengan pool aman.")

	err = db.AutoMigrate(
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
		log.Fatalf("Gagal migrate database: %v", err)
	}
}

func GetDB() *gorm.DB {
	return DB
}
