package config

import (
	"fmt"
	"log"
	"os"
	"tpq_asysyafii/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	// Ambil env
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbname := os.Getenv("DB_NAME")

	// DSN MySQL
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", user, pass, host, port, dbname)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal koneksi DB: ", err)
	}

	DB = db
	fmt.Println("Database terkoneksi.")

	err = db.AutoMigrate(
		&models.User{},
		&models.Keluarga{},
		&models.Santri{},
		&models.Syahriah{},
		&models.Donasi{},
		&models.PemakaianSaldo{},
		&models.RekapSaldo{},
		&models.Pengumuman{},
		&models.LogAktivitas{},
	)
	if err != nil {
		log.Fatal("Gagal migrate database:", err)
	}
}

func GetDB() *gorm.DB {
	return DB
}