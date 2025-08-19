package models

import "time"

type Donasi struct {
	IDDonasi    string    `json:"id_donasi" gorm:"type:char(36);primaryKey"`
	NamaDonatur string    `json:"nama_donatur" gorm:"type:varchar(100);default:'Anonim'"`
	Nominal     float64   `json:"nominal" gorm:"type:decimal(12,2);not null;check:nominal > 0"`
	DicatatOleh string    `json:"dicatat_oleh" gorm:"type:char(36);not null"`
	WaktuCatat  time.Time `json:"waktu_catat" gorm:"autoCreateTime"`

	Admin User `json:"admin" gorm:"foreignKey:DicatatOleh;references:IDUser"`
}
