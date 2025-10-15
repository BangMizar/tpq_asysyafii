package models

import "time"

type UserRole string

const (
	RoleSuperAdmin UserRole = "super_admin"
	RoleAdmin      UserRole = "admin"
	RoleWali       UserRole = "wali"
)

type User struct {
	IDUser         string    `json:"id_user" gorm:"column:id_user;primaryKey;type:char(36)"`
	NamaLengkap    string    `json:"nama_lengkap" gorm:"type:varchar(100);not null"`
	Email          *string   `json:"email,omitempty" gorm:"type:varchar(100);unique"`
	NoTelp         string    `json:"no_telp,omitempty" gorm:"type:varchar(20)"`
	Password       string    `json:"password" gorm:"type:varchar(255);not null"`
	Role           UserRole  `json:"role" gorm:"type:enum('super_admin','admin','wali');default:'wali'"`
	StatusAktif    bool      `json:"status_aktif" gorm:"default:false"`
	DibuatPada     time.Time `json:"dibuat_pada" gorm:"autoCreateTime"`
	DiperbaruiPada time.Time `json:"diperbarui_pada" gorm:"autoUpdateTime"`
}

func (User) TableName() string {
	return "users"
}