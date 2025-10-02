package services

import (
	"tpq_asysyafii/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type LogService struct {
	db *gorm.DB
}

func NewLogService(db *gorm.DB) *LogService {
	return &LogService{db: db}
}

// LogAktivitas membuat log aktivitas otomatis
func (s *LogService) LogAktivitas(adminID, aksi, tipeTarget, idTarget, keterangan string) error {
	logAktivitas := models.LogAktivitas{
		IDLog:      uuid.New().String(),
		IDAdmin:    adminID,
		Aksi:       aksi,
		TipeTarget: tipeTarget,
		IDTarget:   idTarget,
		Keterangan: keterangan,
		WaktuAksi:  time.Now(),
	}

	return s.db.Create(&logAktivitas).Error
}

// Constants untuk aksi-aksi standar
const (
	AksiCreate = "CREATE"
	AksiUpdate = "UPDATE" 
	AksiDelete = "DELETE"
	AksiLogin  = "LOGIN"
)

// Constants untuk tipe target
const (
	TargetDonasi   = "DONASI"
	TargetUser     = "USER"
	TargetSyahriah = "SYAHRIAH"
)	