package models

import "time"

type SosialMedia struct {
	IDSosmed       string    `json:"id_sosmed" gorm:"column:id_sosmed;primaryKey;type:char(36)"`
	NamaSosmed     string    `json:"nama_sosmed" gorm:"type:varchar(100);not null"` // Contoh: "Facebook", "Instagram", "YouTube"
	IconSosmed     *string   `json:"icon_sosmed,omitempty" gorm:"type:varchar(255)"` // Contoh: "fa-facebook", "mdi-instagram", atau path file icon
	LinkSosmed     *string   `json:"link_sosmed,omitempty" gorm:"type:varchar(500)"`
	DiupdateOlehID *string   `json:"diupdate_oleh_id,omitempty" gorm:"column:diupdate_oleh_id;type:char(36)"`
	DibuatPada     time.Time `json:"dibuat_pada" gorm:"autoCreateTime"`
	DiperbaruiPada time.Time `json:"diperbarui_pada" gorm:"autoUpdateTime"`
	
	DiupdateOleh *User `json:"diupdate_oleh,omitempty" gorm:"foreignKey:DiupdateOlehID;references:IDUser"`
}

func (SosialMedia) TableName() string {
	return "sosial_media"
}