package models

type Keluarga struct {
	IDKeluarga string `json:"id_keluarga" gorm:"type:char(36);primaryKey"`
	IDWali     string `json:"id_wali" gorm:"type:char(36);not null"`
	NoKK       string `json:"no_kk" gorm:"type:varchar(50);unique"`
	Alamat     string `json:"alamat" gorm:"type:text;not null"`
	RTRW       string `json:"rt_rw" gorm:"type:varchar(20)"`
	Kelurahan  string `json:"kelurahan" gorm:"type:varchar(100)"`
	Kecamatan  string `json:"kecamatan" gorm:"type:varchar(100)"`
	Kota       string `json:"kota" gorm:"type:varchar(100)"`
	Provinsi   string `json:"provinsi" gorm:"type:varchar(100)"`
	KodePos    string `json:"kode_pos" gorm:"type:varchar(10)"`

	AnggotaKeluarga []AnggotaKeluarga `json:"anggota_keluarga" gorm:"foreignKey:IDKeluarga;references:IDKeluarga"`
	Wali  User `json:"wali" gorm:"foreignKey:IDWali;references:IDUser"`
}

func (Keluarga) TableName() string {
	return "keluarga"
}