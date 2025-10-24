package models

import "time"

type InformasiTPQ struct {
	IDTPQ           string     `json:"id_tpq" gorm:"column:id_tpq;primaryKey;type:char(36)"`
	NamaTPQ         string     `json:"nama_tpq" gorm:"type:varchar(200);not null"`
	Tempat          *string    `json:"tempat,omitempty" gorm:"type:varchar(200)"`
	Logo            *string    `json:"logo,omitempty" gorm:"type:varchar(255)"`
	Visi            *string    `json:"visi,omitempty" gorm:"type:text"`
	Misi            *string    `json:"misi,omitempty" gorm:"type:text"`
	Deskripsi       *string    `json:"deskripsi,omitempty" gorm:"type:text"`
	NoTelp          *string    `json:"no_telp,omitempty" gorm:"type:varchar(20)"`
	Email           *string    `json:"email,omitempty" gorm:"type:varchar(100)"`
	Alamat          *string    `json:"alamat,omitempty" gorm:"type:text"`
	LinkAlamat      *string    `json:"link_alamat,omitempty" gorm:"type:varchar(500)"`
	HariJamBelajar  *string    `json:"hari_jam_belajar,omitempty" gorm:"type:text"`
	DiupdateOlehID  *string    `json:"diupdate_oleh_id,omitempty" gorm:"column:diupdate_oleh_id;type:char(36)"`
	DibuatPada      time.Time  `json:"dibuat_pada" gorm:"autoCreateTime"`
	DiperbaruiPada  time.Time  `json:"diperbarui_pada" gorm:"autoUpdateTime"`
	
	DiupdateOleh *User `json:"diupdate_oleh,omitempty" gorm:"foreignKey:DiupdateOlehID;references:IDUser"`
}

func (InformasiTPQ) TableName() string {
	return "informasi_tpq"
}