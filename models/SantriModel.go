package models

import "time"

type StatusSantri string

const (
	StatusAktifSantri       StatusSantri = "aktif"
	StatusLulusSantri       StatusSantri = "lulus"
	StatusPindahSantri      StatusSantri = "pindah"
	StatusBerhentiSantri    StatusSantri = "berhenti"
)

type JenisKelamin string

const (
	LakiLaki  JenisKelamin = "L"
	Perempuan JenisKelamin = "P"
)

type Santri struct {
	IDSantri        string        `json:"id_santri" gorm:"column:id_santri;primaryKey;type:char(36)"`
	IDWali          string        `json:"id_wali" gorm:"column:id_wali;type:char(36);not null"`
	NamaLengkap     string        `json:"nama_lengkap" gorm:"type:varchar(100);not null"`
	JenisKelamin    JenisKelamin  `json:"jenis_kelamin" gorm:"type:enum('L','P');not null"`
	TempatLahir     string        `json:"tempat_lahir" gorm:"type:varchar(50)"`
	TanggalLahir    time.Time     `json:"tanggal_lahir" gorm:"type:date"`
	Alamat          string        `json:"alamat" gorm:"type:text"`
	Foto            string        `json:"foto" gorm:"type:varchar(255)"`
	Status          StatusSantri  `json:"status" gorm:"type:enum('aktif','lulus','pindah','berhenti');default:'aktif'"`
	TanggalMasuk    time.Time     `json:"tanggal_masuk" gorm:"type:date"`
	TanggalKeluar   *time.Time    `json:"tanggal_keluar,omitempty" gorm:"type:date"`
	DibuatPada      time.Time     `json:"dibuat_pada" gorm:"autoCreateTime"`
	DiperbaruiPada  time.Time     `json:"diperbarui_pada" gorm:"autoUpdateTime"`
	
	Wali            User          `json:"wali,omitempty" gorm:"foreignKey:IDWali;references:IDUser"`
}

func (Santri) TableName() string {
	return "santri"
}