package models

import (
	"time"
)

type Fasilitas struct {
	IDFasilitas    string    `json:"id_fasilitas" gorm:"column:id_fasilitas;primaryKey;type:char(36)"`
	Icon           string    `json:"icon" gorm:"type:varchar(100);not null"`
	Judul          string    `json:"judul" gorm:"type:varchar(200);not null"`
	Deskripsi      string    `json:"deskripsi" gorm:"type:text;not null"`
	UrutanTampil   int       `json:"urutan_tampil" gorm:"type:int;default:0"`
	Status         string    `json:"status" gorm:"type:enum('aktif','nonaktif');default:'aktif'"`
	DiupdateOlehID *string   `json:"diupdate_oleh_id,omitempty" gorm:"column:diupdate_oleh_id;type:char(36)"`
	DibuatPada     time.Time `json:"dibuat_pada" gorm:"autoCreateTime"`
	DiperbaruiPada time.Time `json:"diperbarui_pada" gorm:"autoUpdateTime"`
	
	DiupdateOleh   *User     `json:"diupdate_oleh,omitempty" gorm:"foreignKey:DiupdateOlehID;references:IDUser"`
}

func (Fasilitas) TableName() string {
	return "fasilitas"
}