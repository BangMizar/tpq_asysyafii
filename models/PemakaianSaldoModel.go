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

type PemakaianSaldo struct {
	IDPemakaian          string        `json:"id_pemakaian" gorm:"type:char(36);primaryKey"`
	JudulPemakaian       string        `json:"judul_pemakaian" gorm:"type:varchar(255);not null"`
	Deskripsi            string        `json:"deskripsi" gorm:"type:text"`
	NominalSyahriah      float64       `json:"nominal_syahriah" gorm:"type:decimal(14,2);not null;default:0"`
	NominalDonasi        float64       `json:"nominal_donasi" gorm:"type:decimal(14,2);not null;default:0"`
	NominalTotal         float64       `json:"nominal_total" gorm:"type:decimal(14,2);not null;check:nominal_total > 0"`
	TipePemakaian        TipePemakaian `json:"tipe_pemakaian" gorm:"type:enum('operasional','investasi','lainnya');not null"`
	TanggalPemakaian     *time.Time    `json:"tanggal_pemakaian" gorm:"null"`
	DiajukanOleh         string        `json:"diajukan_oleh" gorm:"type:char(36);not null"`
	Keterangan           *string       `json:"keterangan" gorm:"type:text;null"`
	CreatedAt            time.Time     `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt            time.Time     `json:"updated_at" gorm:"autoUpdateTime"`

	Pengaju  User `json:"pengaju" gorm:"foreignKey:DiajukanOleh;references:IDUser"`
}

func (PemakaianSaldo) TableName() string {
	return "pemakaian_saldo"
}