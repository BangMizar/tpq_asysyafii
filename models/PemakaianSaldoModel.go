package models

import (
	"time"
)

type TipePemakaian string

const (
	PemakaianOperasional TipePemakaian = "operasional"
	PemakaianInvestasi   TipePemakaian = "investasi"
	PemakaianLainnya     TipePemakaian = "lainnya"
)

type SumberDana string

const (
	SumberSyahriah SumberDana = "syahriah"
	SumberDonasi   SumberDana = "donasi"
	SumberCampuran SumberDana = "campuran"
)

type PemakaianSaldo struct {
	IDPemakaian      string         `json:"id_pemakaian" gorm:"type:char(36);primaryKey"`
	JudulPemakaian   string         `json:"judul_pemakaian" gorm:"type:varchar(255);not null"`
	Deskripsi        string         `json:"deskripsi" gorm:"type:text"`
	Nominal          float64        `json:"nominal" gorm:"type:decimal(14,2);not null;check:nominal > 0"`
	TipePemakaian    TipePemakaian  `json:"tipe_pemakaian" gorm:"type:enum('operasional','investasi','lainnya');not null"`
	SumberDana       SumberDana     `json:"sumber_dana" gorm:"type:enum('syahriah','donasi','campuran');not null"`
	TanggalPemakaian *time.Time     `json:"tanggal_pemakaian" gorm:"null"`
	DiajukanOleh     string         `json:"diajukan_oleh" gorm:"type:char(36);not null"`
	Keterangan       *string        `json:"keterangan" gorm:"type:text;null"`
	CreatedAt        time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time      `json:"updated_at" gorm:"autoUpdateTime"`

	Pengaju  User `json:"pengaju" gorm:"foreignKey:DiajukanOleh;references:IDUser"`
}

func (PemakaianSaldo) TableName() string {
	return "pemakaian_saldo"
}
