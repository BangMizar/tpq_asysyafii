package models

import "time"

type RekapSaldo struct {
	IDSaldo            string    `json:"id_saldo" gorm:"type:char(36);primaryKey"`
	Periode            string    `json:"periode" gorm:"type:varchar(7);not null"` // format YYYY-MM
	
	// Saldo Syahriah
	PemasukanSyahriah  float64   `json:"pemasukan_syahriah" gorm:"type:decimal(14,2);default:0"`
	PengeluaranSyahriah float64   `json:"pengeluaran_syahriah" gorm:"type:decimal(14,2);default:0"`
	SaldoAkhirSyahriah float64   `json:"saldo_akhir_syahriah" gorm:"type:decimal(14,2);default:0"`
	
	// Saldo Donasi
	PemasukanDonasi    float64   `json:"pemasukan_donasi" gorm:"type:decimal(14,2);default:0"`
	PengeluaranDonasi  float64   `json:"pengeluaran_donasi" gorm:"type:decimal(14,2);default:0"`
	SaldoAkhirDonasi   float64   `json:"saldo_akhir_donasi" gorm:"type:decimal(14,2);default:0"`
	
	// Saldo Total
	PemasukanTotal     float64   `json:"pemasukan_total" gorm:"type:decimal(14,2);default:0"`
	PengeluaranTotal   float64   `json:"pengeluaran_total" gorm:"type:decimal(14,2);default:0"`
	SaldoAkhirTotal    float64   `json:"saldo_akhir_total" gorm:"type:decimal(14,2);default:0"`
	
	TerakhirUpdate     time.Time `json:"terakhir_update" gorm:"autoUpdateTime"`
}

func (RekapSaldo) TableName() string {
	return "rekap_saldo"
}