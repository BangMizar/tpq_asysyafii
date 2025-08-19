package models

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal koneksi ke database:", err)
	}

	DB = database

	err = DB.AutoMigrate(
		&User{},
		&Keluarga{},
		&AnggotaKeluarga{},
		&Syahriah{},
		&Donasi{},
		&RekapSaldo{},
		&Pengumuman{},
		&LogAktivitas{},
	)
	if err != nil {
		log.Fatal("Gagal migrate database:", err)
	}

	fmt.Println("Database terkoneksi & migrasi sukses")
}
