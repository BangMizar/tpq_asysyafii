package models

import "time"

type TipeSaldo string

const (
	SaldoSyahriah TipeSaldo = "syahriah"
	SaldoDonasi   TipeSaldo = "donasi"
	SaldoTotal    TipeSaldo = "total"
)

type RekapSaldo struct {
	IDSaldo          string    `json:"id_saldo" gorm:"type:char(36);primaryKey"`
	TipeSaldo        TipeSaldo `json:"tipe_saldo" gorm:"type:enum('syahriah','donasi','total');not null"`
	Periode          string    `json:"periode" gorm:"type:varchar(7);not null"` // format YYYY-MM
	PemasukanTotal   float64   `json:"pemasukan_total" gorm:"type:decimal(14,2);default:0"`
	PengeluaranTotal float64   `json:"pengeluaran_total" gorm:"type:decimal(14,2);default:0"`
	SaldoAkhir       float64   `json:"saldo_akhir" gorm:"type:decimal(14,2);default:0"`
	TerakhirUpdate   time.Time `json:"terakhir_update" gorm:"autoUpdateTime"`
}

func (RekapSaldo) TableName() string {
	return "rekapsaldo"
}
