package models

import (
	"time"
)

type UserRole string

const (
	RoleSuperAdmin UserRole = "super_admin"
	RoleAdmin      UserRole = "admin"
	RoleWali       UserRole = "wali"
)

type User struct {
	IDUser        string    `json:"id_user" gorm:"type:char(36);primaryKey"`
	NamaLengkap   string    `json:"nama_lengkap" gorm:"type:varchar(100);not null"`
	Email         *string   `json:"email" gorm:"type:varchar(100);unique"`
	NoTelp        string    `json:"no_telp" gorm:"type:varchar(20)"`
	Password      string    `json:"-" gorm:"type:varchar(255);not null"`
	Role          UserRole  `json:"role" gorm:"type:enum('super_admin','admin','wali');default:'wali'"`
	StatusAktif   bool      `json:"status_aktif" gorm:"default:true"`
	DibuatPada    time.Time `json:"dibuat_pada" gorm:"autoCreateTime"`
	DiperbaruiPada time.Time `json:"diperbarui_pada" gorm:"autoUpdateTime"`

	Keluarga Keluarga `json:"keluarga" gorm:"foreignKey:IDUser;references:IDUser"`
	LogAktivitas []LogAktivitas `json:"log_aktivitas" gorm:"foreignKey:IDUser;references:IDUser"`
}


func (User) TableName() string {
	return "users"
}
