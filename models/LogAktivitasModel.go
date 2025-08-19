package models

import "time"

type LogAktivitas struct {
	IDLog     string    `json:"id_log" gorm:"type:char(36);primaryKey"`
	IDUser    string    `json:"id_user" gorm:"type:char(36);not null"`
	Aksi      string    `json:"aksi" gorm:"type:varchar(100);not null"`
	TipeTarget string   `json:"tipe_target" gorm:"type:varchar(50)"`
	IDTarget  string    `json:"id_target" gorm:"type:char(36)"`
	Keterangan string   `json:"keterangan" gorm:"type:text"`
	WaktuAksi time.Time `json:"waktu_aksi" gorm:"autoCreateTime"`

	User User `json:"user" gorm:"foreignKey:IDUser;references:IDUser"`
}

func (LogAktivitas) TableName() string {
	return "logaktivitas"
}
