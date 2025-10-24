package models

import (
	"time"
)

type ProgramUnggulan struct {
	IDProgram      string    `json:"id_program" gorm:"column:id_program;primaryKey;type:char(36)"`
	NamaProgram    string    `json:"nama_program" gorm:"type:varchar(200);not null"`
	Slug           string    `json:"slug" gorm:"type:varchar(255);not null;unique"`
	Deskripsi      string    `json:"deskripsi" gorm:"type:text;not null"`
	Fitur          string    `json:"fitur" gorm:"type:json"`
	Status         string    `json:"status" gorm:"type:enum('aktif','nonaktif');default:'aktif'"`
	DiupdateOlehID *string   `json:"diupdate_oleh_id,omitempty" gorm:"column:diupdate_oleh_id;type:char(36)"`
	DibuatPada     time.Time `json:"dibuat_pada" gorm:"autoCreateTime"`
	DiperbaruiPada time.Time `json:"diperbarui_pada" gorm:"autoUpdateTime"`
	
	DiupdateOleh *User `json:"diupdate_oleh,omitempty" gorm:"foreignKey:DiupdateOlehID;references:IDUser"`
}