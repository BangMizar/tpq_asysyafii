package models

import (
	"time"
)

type Testimoni struct {
	IDTestimoni    string    `json:"id_testimoni" gorm:"column:id_testimoni;primaryKey;type:char(36)"`
	IdWali         string    `json:"id_wali" gorm:"column:id_wali;type:char(36);not null"`
	Komentar       string    `json:"komentar" gorm:"type:text;not null"`
	Rating         int       `json:"rating" gorm:"type:int;not null;check:rating >= 1 AND rating <= 5"`
	Status         string    `json:"status" gorm:"type:enum('show','hide');default:'show'"`
	DiupdateOlehID *string   `json:"diupdate_oleh_id,omitempty" gorm:"column:diupdate_oleh_id;type:char(36)"`
	DibuatPada     time.Time `json:"dibuat_pada" gorm:"autoCreateTime"`
	DiperbaruiPada time.Time `json:"diperbarui_pada" gorm:"autoUpdateTime"`
	
	Wali         *User `json:"wali,omitempty" gorm:"foreignKey:IdWali;references:IDUser"`
	DiupdateOleh *User `json:"diupdate_oleh,omitempty" gorm:"foreignKey:DiupdateOlehID;references:IDUser"`
}

func (Testimoni) TableName() string {
	return "testimoni"
}