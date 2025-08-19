package models

import "time"

type StatusSyahriah string

const (
	StatusBelum StatusSyahriah = "belum"
	StatusLunas StatusSyahriah = "lunas"
)

type Syahriah struct {
	IDSyahriah string         `json:"id_syahriah" gorm:"type:char(36);primaryKey"`
	IDUser     string         `json:"id_user" gorm:"type:char(36);not null"`
	Bulan      string         `json:"bulan" gorm:"type:varchar(7);not null"` // format YYYY-MM
	Nominal    float64        `json:"nominal" gorm:"type:decimal(12,2);not null;default:110000"`
	Status     StatusSyahriah `json:"status" gorm:"type:enum('belum','lunas');default:'belum'"`
	DicatatOleh string        `json:"dicatat_oleh" gorm:"type:char(36);not null"`
	WaktuCatat time.Time      `json:"waktu_catat" gorm:"autoCreateTime"`

	User   User `json:"user" gorm:"foreignKey:IDUser;references:IDUser"`
	Admin  User `json:"admin" gorm:"foreignKey:DicatatOleh;references:IDUser"`
}

func (Syahriah) TableName() string {
	return "syahriah"
}
