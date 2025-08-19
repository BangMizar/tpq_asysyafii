package models

import "time"

type StatusKeluarga string
type StatusPerkawinan string

const (
	StatusKepalaKeluarga StatusKeluarga = "Kepala Keluarga"
	StatusIstri           StatusKeluarga = "Istri"
	StatusAnak            StatusKeluarga = "Anak"
	StatusLainnya         StatusKeluarga = "Lainnya"

	PerkawinanBelumKawin StatusPerkawinan = "Belum Kawin"
	PerkawinanKawin       StatusPerkawinan = "Kawin"
	PerkawinanCeraiHidup  StatusPerkawinan = "Cerai Hidup"
	PerkawinanCeraiMati   StatusPerkawinan = "Cerai Mati"
)

type AnggotaKeluarga struct {
	IDAnggota       string            `json:"id_anggota" gorm:"type:char(36);primaryKey"`
	IDKeluarga      string            `json:"id_keluarga" gorm:"type:char(36);not null"`
	NIK             string            `json:"nik" gorm:"type:varchar(20);unique"`
	NamaLengkap     string            `json:"nama_lengkap" gorm:"type:varchar(100);not null"`
	JenisKelamin    string            `json:"jenis_kelamin" gorm:"type:enum('L','P');not null"`
	TempatLahir     string            `json:"tempat_lahir" gorm:"type:varchar(100)"`
	TanggalLahir    time.Time         `json:"tanggal_lahir"`
	Agama           string            `json:"agama" gorm:"type:varchar(50)"`
	Pendidikan      string            `json:"pendidikan" gorm:"type:varchar(100)"`
	Pekerjaan       string            `json:"pekerjaan" gorm:"type:varchar(100)"`
	StatusKeluarga  StatusKeluarga    `json:"status_keluarga" gorm:"type:enum('Kepala Keluarga','Istri','Anak','Lainnya')"`
	StatusPerkawinan StatusPerkawinan `json:"status_perkawinan" gorm:"type:enum('Belum Kawin','Kawin','Cerai Hidup','Cerai Mati')"`
	Kewarganegaraan string            `json:"kewarganegaraan" gorm:"type:varchar(50);default:'WNI'"`

	Keluarga Keluarga `json:"keluarga" gorm:"foreignKey:IDKeluarga;references:IDKeluarga"`
}

func (AnggotaKeluarga) TableName() string {
	return "anggotakeluarga"
}