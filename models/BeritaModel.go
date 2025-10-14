package models

import "time"

type KategoriBerita string

const (
	KategoriUmum     KategoriBerita = "umum"
	KategoriPengumuman KategoriBerita = "pengumuman"
	KategoriAcara    KategoriBerita = "acara"
)

type StatusBerita string

const (
	StatusDraft     StatusBerita = "draft"
	StatusPublished StatusBerita = "published"
	StatusArsip     StatusBerita = "arsip"
)

type Berita struct {
	IDBerita        string         `json:"id_berita" gorm:"column:id_berita;primaryKey;type:char(36)"`
	Judul           string         `json:"judul" gorm:"type:varchar(200);not null"`
	Slug            string         `json:"slug" gorm:"type:varchar(255);not null;unique"`
	Konten          string         `json:"konten" gorm:"type:text;not null"`
	Kategori        KategoriBerita `json:"kategori" gorm:"type:enum('umum','pengumuman','acara');default:'umum'"`
	Status          StatusBerita   `json:"status" gorm:"type:enum('draft','published','arsip');default:'draft'"`
	GambarCover     *string        `json:"gambar_cover,omitempty" gorm:"type:varchar(255)"`
	PenulisID       string         `json:"penulis_id" gorm:"column:penulis_id;type:char(36);not null"`
	TanggalPublikasi *time.Time    `json:"tanggal_publikasi,omitempty" gorm:"type:timestamp"`
	DibuatPada      time.Time      `json:"dibuat_pada" gorm:"autoCreateTime"`
	DiperbaruiPada  time.Time      `json:"diperbarui_pada" gorm:"autoUpdateTime"`
	
	Penulis User `json:"penulis,omitempty" gorm:"foreignKey:PenulisID;references:IDUser"`
}

func (Berita) TableName() string {
	return "berita"
}