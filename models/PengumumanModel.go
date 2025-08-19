package models

import "time"

type TipePengumuman string
type StatusPengumuman string

const (
	PengumumanPublik   TipePengumuman   = "publik"
	PengumumanInternal TipePengumuman   = "internal"

	StatusAktif   StatusPengumuman = "aktif"
	StatusNonaktif StatusPengumuman = "nonaktif"
)

type Pengumuman struct {
	IDPengumuman string            `json:"id_pengumuman" gorm:"type:char(36);primaryKey"`
	Judul        string            `json:"judul" gorm:"type:varchar(255);not null"`
	Isi          string            `json:"isi" gorm:"type:text;not null"`
	Tipe         TipePengumuman    `json:"tipe" gorm:"type:enum('publik','internal');default:'publik'"`
	DibuatOleh   string            `json:"dibuat_oleh" gorm:"type:char(36);not null"`
	TanggalDibuat time.Time        `json:"tanggal_dibuat" gorm:"autoCreateTime"`
	TanggalMulai  *time.Time       `json:"tanggal_mulai,omitempty"`
	TanggalSelesai *time.Time      `json:"tanggal_selesai,omitempty"`
	Status        StatusPengumuman `json:"status" gorm:"type:enum('aktif','nonaktif');default:'aktif'"`

	Author User `json:"author" gorm:"foreignKey:DibuatOleh;references:IDUser"`
}
