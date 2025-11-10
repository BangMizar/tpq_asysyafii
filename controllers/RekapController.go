package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RekapController struct {
	db *gorm.DB
}

func NewRekapController(db *gorm.DB) *RekapController {
	return &RekapController{db: db}
}

// Request structs
type CreateRekapRequest struct {
	Periode              string  `json:"periode" binding:"required"` // format YYYY-MM
	PemasukanSyahriah    float64 `json:"pemasukan_syahriah"`
	PengeluaranSyahriah  float64 `json:"pengeluaran_syahriah"`
	SaldoAkhirSyahriah   float64 `json:"saldo_akhir_syahriah"`
	PemasukanDonasi      float64 `json:"pemasukan_donasi"`
	PengeluaranDonasi    float64 `json:"pengeluaran_donasi"`
	SaldoAkhirDonasi     float64 `json:"saldo_akhir_donasi"`
	PemasukanTotal       float64 `json:"pemasukan_total"`
	PengeluaranTotal     float64 `json:"pengeluaran_total"`
	SaldoAkhirTotal      float64 `json:"saldo_akhir_total"`
}

type UpdateRekapRequest struct {
	PemasukanSyahriah    float64 `json:"pemasukan_syahriah"`
	PengeluaranSyahriah  float64 `json:"pengeluaran_syahriah"`
	SaldoAkhirSyahriah   float64 `json:"saldo_akhir_syahriah"`
	PemasukanDonasi      float64 `json:"pemasukan_donasi"`
	PengeluaranDonasi    float64 `json:"pengeluaran_donasi"`
	SaldoAkhirDonasi     float64 `json:"saldo_akhir_donasi"`
	PemasukanTotal       float64 `json:"pemasukan_total"`
	PengeluaranTotal     float64 `json:"pengeluaran_total"`
	SaldoAkhirTotal      float64 `json:"saldo_akhir_total"`
}

type RekapSummary struct {
	TotalPemasukanSyahriah   float64 `json:"total_pemasukan_syahriah"`
	TotalPengeluaranSyahriah float64 `json:"total_pengeluaran_syahriah"`
	SaldoAkhirSyahriah       float64 `json:"saldo_akhir_syahriah"`
	TotalPemasukanDonasi     float64 `json:"total_pemasukan_donasi"`
	TotalPengeluaranDonasi   float64 `json:"total_pengeluaran_donasi"`
	SaldoAkhirDonasi         float64 `json:"saldo_akhir_donasi"`
	TotalPemasukan           float64 `json:"total_pemasukan"`
	TotalPengeluaran         float64 `json:"total_pengeluaran"`
	SaldoAkhir               float64 `json:"saldo_akhir"`
}

// Helper function untuk check role admin
func (ctrl *RekapController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// getSaldoAwalBulan - Mendapatkan saldo awal bulan dari saldo akhir bulan sebelumnya
func (ctrl *RekapController) getSaldoAwalBulan(periode string) (float64, float64, float64, error) {
	// Parse periode current
	currentPeriod, err := time.Parse("2006-01", periode)
	if err != nil {
		return 0, 0, 0, err
	}

	// Hitung periode sebelumnya
	previousPeriod := currentPeriod.AddDate(0, -1, 0).Format("2006-01")

	// Cari rekap bulan sebelumnya
	var previousRekap models.RekapSaldo
	err = ctrl.db.Where("periode = ?", previousPeriod).First(&previousRekap).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Jika tidak ada data bulan sebelumnya, mulai dari 0
			fmt.Printf("DEBUG: Tidak ditemukan rekap untuk periode sebelumnya %s, menggunakan saldo awal 0\n", previousPeriod)
			return 0, 0, 0, nil
		}
		return 0, 0, 0, err
	}

	fmt.Printf("DEBUG: Saldo awal periode %s - Syahriah: %.2f, Donasi: %.2f, Total: %.2f\n", 
		periode, previousRekap.SaldoAkhirSyahriah, previousRekap.SaldoAkhirDonasi, previousRekap.SaldoAkhirTotal)
	
	return previousRekap.SaldoAkhirSyahriah, previousRekap.SaldoAkhirDonasi, previousRekap.SaldoAkhirTotal, nil
}

// updateRekapSaldo - Internal function untuk update rekap otomatis dengan saldo berjalan
func (ctrl *RekapController) updateRekapSaldo(periode string) error {
	// Dapatkan saldo awal dari bulan sebelumnya
	saldoAwalSyahriah, saldoAwalDonasi, saldoAwalTotal, err := ctrl.getSaldoAwalBulan(periode)
	if err != nil {
		return err
	}

	// Hitung pemasukan syahriah bulan ini
	var pemasukanSyahriah float64
	err = ctrl.db.Model(&models.Syahriah{}).
		Where("bulan = ? AND status = ?", periode, models.StatusLunas).
		Select("COALESCE(SUM(nominal), 0)").
		Scan(&pemasukanSyahriah).Error
	if err != nil {
		return err
	}

	// Hitung pengeluaran syahriah bulan ini (jika ada log pengeluaran)
	var pengeluaranSyahriah float64
	// TODO: Tambahkan logika untuk menghitung pengeluaran syahriah jika diperlukan
	// Untuk sekarang di-set 0, bisa disesuaikan dengan kebutuhan

	// Hitung pemasukan donasi bulan ini
	var pemasukanDonasi float64
	startDate, _ := time.Parse("2006-01", periode)
	endDate := startDate.AddDate(0, 1, 0)
	
	err = ctrl.db.Model(&models.Donasi{}).
		Where("waktu_catat >= ? AND waktu_catat < ?", startDate, endDate).
		Select("COALESCE(SUM(nominal), 0)").
		Scan(&pemasukanDonasi).Error
	if err != nil {
		return err
	}

	// Hitung pengeluaran donasi bulan ini (jika ada log pengeluaran)
	var pengeluaranDonasi float64
	// TODO: Tambahkan logika untuk menghitung pengeluaran donasi jika diperlukan

	// Hitung saldo akhir dengan rumus: Saldo Awal + Pemasukan - Pengeluaran
	saldoAkhirSyahriah := saldoAwalSyahriah + pemasukanSyahriah - pengeluaranSyahriah
	saldoAkhirDonasi := saldoAwalDonasi + pemasukanDonasi - pengeluaranDonasi
	
	// Total
	pemasukanTotal := pemasukanSyahriah + pemasukanDonasi
	pengeluaranTotal := pengeluaranSyahriah + pengeluaranDonasi
	saldoAkhirTotal := saldoAwalTotal + pemasukanTotal - pengeluaranTotal

	// Debug log untuk troubleshooting
	fmt.Printf("DEBUG: Rekap periode %s\n", periode)
	fmt.Printf("DEBUG: Saldo Awal - Syahriah: %.2f, Donasi: %.2f, Total: %.2f\n", 
		saldoAwalSyahriah, saldoAwalDonasi, saldoAwalTotal)
	fmt.Printf("DEBUG: Pemasukan - Syahriah: %.2f, Donasi: %.2f, Total: %.2f\n", 
		pemasukanSyahriah, pemasukanDonasi, pemasukanTotal)
	fmt.Printf("DEBUG: Pengeluaran - Syahriah: %.2f, Donasi: %.2f, Total: %.2f\n", 
		pengeluaranSyahriah, pengeluaranDonasi, pengeluaranTotal)
	fmt.Printf("DEBUG: Saldo Akhir - Syahriah: %.2f, Donasi: %.2f, Total: %.2f\n", 
		saldoAkhirSyahriah, saldoAkhirDonasi, saldoAkhirTotal)

	// Cek apakah sudah ada rekap untuk periode ini
	var existingRekap models.RekapSaldo
	if err := ctrl.db.Where("periode = ?", periode).First(&existingRekap).Error; err == nil {
		// Update existing rekap
		existingRekap.PemasukanSyahriah = pemasukanSyahriah
		existingRekap.PengeluaranSyahriah = pengeluaranSyahriah
		existingRekap.SaldoAkhirSyahriah = saldoAkhirSyahriah
		existingRekap.PemasukanDonasi = pemasukanDonasi
		existingRekap.PengeluaranDonasi = pengeluaranDonasi
		existingRekap.SaldoAkhirDonasi = saldoAkhirDonasi
		existingRekap.PemasukanTotal = pemasukanTotal
		existingRekap.PengeluaranTotal = pengeluaranTotal
		existingRekap.SaldoAkhirTotal = saldoAkhirTotal
		existingRekap.TerakhirUpdate = time.Now()

		return ctrl.db.Save(&existingRekap).Error
	} else {
		// Buat rekap baru
		rekap := models.RekapSaldo{
			IDSaldo:            uuid.New().String(),
			Periode:            periode,
			PemasukanSyahriah:  pemasukanSyahriah,
			PengeluaranSyahriah: pengeluaranSyahriah,
			SaldoAkhirSyahriah: saldoAkhirSyahriah,
			PemasukanDonasi:    pemasukanDonasi,
			PengeluaranDonasi:  pengeluaranDonasi,
			SaldoAkhirDonasi:   saldoAkhirDonasi,
			PemasukanTotal:     pemasukanTotal,
			PengeluaranTotal:   pengeluaranTotal,
			SaldoAkhirTotal:    saldoAkhirTotal,
			TerakhirUpdate:     time.Now(),
		}
		return ctrl.db.Create(&rekap).Error
	}
}

// updateRekapPemasukan - Update hanya bagian pemasukan saja dengan saldo berjalan
func (ctrl *RekapController) updateRekapPemasukan(periode string) error {
	// Dapatkan saldo awal dari bulan sebelumnya
	saldoAwalSyahriah, saldoAwalDonasi, saldoAwalTotal, err := ctrl.getSaldoAwalBulan(periode)
	if err != nil {
		return err
	}

	// Hitung pemasukan syahriah
	var pemasukanSyahriah float64
	err = ctrl.db.Model(&models.Syahriah{}).
		Where("bulan = ? AND status = ?", periode, models.StatusLunas).
		Select("COALESCE(SUM(nominal), 0)").
		Scan(&pemasukanSyahriah).Error
	if err != nil {
		return err
	}

	// Hitung pemasukan donasi
	var pemasukanDonasi float64
	startDate, _ := time.Parse("2006-01", periode)
	endDate := startDate.AddDate(0, 1, 0)
	
	err = ctrl.db.Model(&models.Donasi{}).
		Where("waktu_catat >= ? AND waktu_catat < ?", startDate, endDate).
		Select("COALESCE(SUM(nominal), 0)").
		Scan(&pemasukanDonasi).Error
	if err != nil {
		return err
	}

	// Hitung total
	pemasukanTotal := pemasukanSyahriah + pemasukanDonasi

	// Update HANYA pemasukan dan saldo akhir dengan memperhitungkan saldo awal
	var existingRekap models.RekapSaldo
	if err := ctrl.db.Where("periode = ?", periode).First(&existingRekap).Error; err == nil {
		existingRekap.PemasukanSyahriah = pemasukanSyahriah
		existingRekap.SaldoAkhirSyahriah = saldoAwalSyahriah + pemasukanSyahriah - existingRekap.PengeluaranSyahriah
		existingRekap.PemasukanDonasi = pemasukanDonasi
		existingRekap.SaldoAkhirDonasi = saldoAwalDonasi + pemasukanDonasi - existingRekap.PengeluaranDonasi
		existingRekap.PemasukanTotal = pemasukanTotal
		existingRekap.SaldoAkhirTotal = saldoAwalTotal + pemasukanTotal - existingRekap.PengeluaranTotal
		existingRekap.TerakhirUpdate = time.Now()
		return ctrl.db.Save(&existingRekap).Error
	}
	
	// Jika tidak ada rekap, buat baru dengan pengeluaran 0
	rekap := models.RekapSaldo{
		IDSaldo:            uuid.New().String(),
		Periode:            periode,
		PemasukanSyahriah:  pemasukanSyahriah,
		PengeluaranSyahriah: 0,
		SaldoAkhirSyahriah: saldoAwalSyahriah + pemasukanSyahriah,
		PemasukanDonasi:    pemasukanDonasi,
		PengeluaranDonasi:  0,
		SaldoAkhirDonasi:   saldoAwalDonasi + pemasukanDonasi,
		PemasukanTotal:     pemasukanTotal,
		PengeluaranTotal:   0,
		SaldoAkhirTotal:    saldoAwalTotal + pemasukanTotal,
		TerakhirUpdate:     time.Now(),
	}
	return ctrl.db.Create(&rekap).Error
}

// UpdateRekapOtomatis - Dipanggil setelah ada transaksi donasi/syahriah
func (ctrl *RekapController) UpdateRekapOtomatis(transaksiTime time.Time) error {
	periode := transaksiTime.Format("2006-01")
	return ctrl.updateRekapPemasukan(periode)
}

// UpdateRekapBerantai - Update rekap untuk periode tertentu dan semua periode setelahnya
func (ctrl *RekapController) UpdateRekapBerantai(startPeriode string) error {
	// Parse start periode
	start, err := time.Parse("2006-01", startPeriode)
	if err != nil {
		return err
	}

	// Dapatkan semua periode dari start periode hingga sekarang
	currentTime := time.Now()
	currentPeriod := currentTime.Format("2006-01")
	
	periods := []string{startPeriode}
	
	// Generate periode berikutnya sampai current period
	next := start.AddDate(0, 1, 0)
	for next.Format("2006-01") <= currentPeriod {
		periods = append(periods, next.Format("2006-01"))
		next = next.AddDate(0, 1, 0)
	}

	// Update setiap periode
	for _, periode := range periods {
		if err := ctrl.updateRekapSaldo(periode); err != nil {
			return fmt.Errorf("gagal update rekap periode %s: %v", periode, err)
		}
	}

	return nil
}

// CreateRekap membuat data rekap saldo baru (MANUAL - Admin Only)
func (ctrl *RekapController) CreateRekap(c *gin.Context) {
	// Hanya admin yang bisa create manual
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat data rekap"})
		return
	}

	var req CreateRekapRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi format periode (YYYY-MM)
	_, err := time.Parse("2006-01", req.Periode)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format periode tidak valid. Gunakan format YYYY-MM"})
		return
	}

	// Cek apakah sudah ada rekap untuk periode yang sama
	var existingRekap models.RekapSaldo
	if err := ctrl.db.Where("periode = ?", req.Periode).First(&existingRekap).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rekap saldo untuk periode ini sudah ada"})
		return
	}

	// Set default values jika tidak diisi
	if req.PemasukanSyahriah < 0 {
		req.PemasukanSyahriah = 0
	}
	if req.PengeluaranSyahriah < 0 {
		req.PengeluaranSyahriah = 0
	}
	if req.SaldoAkhirSyahriah < 0 {
		req.SaldoAkhirSyahriah = 0
	}
	if req.PemasukanDonasi < 0 {
		req.PemasukanDonasi = 0
	}
	if req.PengeluaranDonasi < 0 {
		req.PengeluaranDonasi = 0
	}
	if req.SaldoAkhirDonasi < 0 {
		req.SaldoAkhirDonasi = 0
	}
	if req.PemasukanTotal < 0 {
		req.PemasukanTotal = 0
	}
	if req.PengeluaranTotal < 0 {
		req.PengeluaranTotal = 0
	}
	if req.SaldoAkhirTotal < 0 {
		req.SaldoAkhirTotal = 0
	}

	// Buat data rekap
	rekap := models.RekapSaldo{
		IDSaldo:            uuid.New().String(),
		Periode:            req.Periode,
		PemasukanSyahriah:  req.PemasukanSyahriah,
		PengeluaranSyahriah: req.PengeluaranSyahriah,
		SaldoAkhirSyahriah: req.SaldoAkhirSyahriah,
		PemasukanDonasi:    req.PemasukanDonasi,
		PengeluaranDonasi:  req.PengeluaranDonasi,
		SaldoAkhirDonasi:   req.SaldoAkhirDonasi,
		PemasukanTotal:     req.PemasukanTotal,
		PengeluaranTotal:   req.PengeluaranTotal,
		SaldoAkhirTotal:    req.SaldoAkhirTotal,
		TerakhirUpdate:     time.Now(),
	}

	// Simpan ke database
	if err := ctrl.db.Create(&rekap).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat data rekap: " + err.Error()})
		return
	}

	// Update rekap berantai untuk periode setelahnya
	go func() {
		if err := ctrl.UpdateRekapBerantai(req.Periode); err != nil {
			fmt.Printf("WARNING: Gagal update rekap berantai: %v\n", err)
		}
	}()

	c.JSON(http.StatusCreated, gin.H{
		"message": "Data rekap berhasil dibuat",
		"data":    rekap,
	})
}

// UpdateRekapByBulan - Untuk update berdasarkan bulan syahriah
func (ctrl *RekapController) UpdateRekapByBulan(bulan string) error {
	// Parse bulan untuk dapat time.Time
	bulanTime, err := time.Parse("2006-01", bulan)
	if err != nil {
		return err
	}
	
	return ctrl.UpdateRekapOtomatis(bulanTime)
}

// UpdateRekap mengupdate data rekap saldo (MANUAL - Admin Only)
func (ctrl *RekapController) UpdateRekap(c *gin.Context) {
	// Hanya admin yang bisa update manual
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate data rekap"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID rekap diperlukan"})
		return
	}

	var req UpdateRekapRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek apakah rekap exists
	var existingRekap models.RekapSaldo
	err := ctrl.db.Where("id_saldo = ?", id).First(&existingRekap).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data rekap tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap: " + err.Error()})
		return
	}

	// Update fields (hanya jika nilainya >= 0)
	if req.PemasukanSyahriah >= 0 {
		existingRekap.PemasukanSyahriah = req.PemasukanSyahriah
	}
	if req.PengeluaranSyahriah >= 0 {
		existingRekap.PengeluaranSyahriah = req.PengeluaranSyahriah
	}
	if req.SaldoAkhirSyahriah >= 0 {
		existingRekap.SaldoAkhirSyahriah = req.SaldoAkhirSyahriah
	}
	if req.PemasukanDonasi >= 0 {
		existingRekap.PemasukanDonasi = req.PemasukanDonasi
	}
	if req.PengeluaranDonasi >= 0 {
		existingRekap.PengeluaranDonasi = req.PengeluaranDonasi
	}
	if req.SaldoAkhirDonasi >= 0 {
		existingRekap.SaldoAkhirDonasi = req.SaldoAkhirDonasi
	}
	if req.PemasukanTotal >= 0 {
		existingRekap.PemasukanTotal = req.PemasukanTotal
	}
	if req.PengeluaranTotal >= 0 {
		existingRekap.PengeluaranTotal = req.PengeluaranTotal
	}
	if req.SaldoAkhirTotal >= 0 {
		existingRekap.SaldoAkhirTotal = req.SaldoAkhirTotal
	}

	existingRekap.TerakhirUpdate = time.Now()

	// Simpan perubahan
	if err := ctrl.db.Save(&existingRekap).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate data rekap: " + err.Error()})
		return
	}

	// Update rekap berantai untuk periode setelahnya
	go func() {
		if err := ctrl.UpdateRekapBerantai(existingRekap.Periode); err != nil {
			fmt.Printf("WARNING: Gagal update rekap berantai: %v\n", err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Data rekap berhasil diupdate",
		"data":    existingRekap,
	})
}

// DeleteRekap menghapus data rekap saldo (MANUAL - Admin Only)
func (ctrl *RekapController) DeleteRekap(c *gin.Context) {
	// Hanya admin yang bisa delete manual
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus data rekap"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID rekap diperlukan"})
		return
	}

	// Cek apakah rekap exists
	var rekap models.RekapSaldo
	err := ctrl.db.Where("id_saldo = ?", id).First(&rekap).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data rekap tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap: " + err.Error()})
		return
	}

	// Simpan periode sebelum menghapus (untuk update berantai)
	periode := rekap.Periode

	// Hapus rekap
	if err := ctrl.db.Where("id_saldo = ?", id).Delete(&models.RekapSaldo{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data rekap: " + err.Error()})
		return
	}

	// Update rekap berantai untuk periode setelahnya
	go func() {
		if err := ctrl.UpdateRekapBerantai(periode); err != nil {
			fmt.Printf("WARNING: Gagal update rekap berantai: %v\n", err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Data rekap berhasil dihapus",
	})
}

// GenerateRekapOtomatis menghasilkan rekap saldo secara otomatis berdasarkan data syahriah dan donasi
func (ctrl *RekapController) GenerateRekapOtomatis(c *gin.Context) {
	// Hanya admin yang bisa generate otomatis
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat generate rekap otomatis"})
		return
	}

	periode := c.Query("periode")
	if periode == "" {
		// Default ke bulan sebelumnya
		lastMonth := time.Now().AddDate(0, -1, 0)
		periode = lastMonth.Format("2006-01")
	}

	// Validasi format periode
	_, err := time.Parse("2006-01", periode)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format periode tidak valid. Gunakan format YYYY-MM"})
		return
	}

	// Generate rekap
	if err := ctrl.updateRekapSaldo(periode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate rekap: " + err.Error()})
		return
	}

	// Ambil data yang baru saja di-generate
	var rekap models.RekapSaldo
	if err := ctrl.db.Where("periode = ?", periode).First(&rekap).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap yang baru digenerate: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Rekap berhasil digenerate otomatis",
		"data":    rekap,
		"periode": periode,
	})
}

// GetAllRekap mendapatkan semua data rekap saldo
func (ctrl *RekapController) GetAllRekap(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	periode := c.Query("periode")
	sortBy := c.DefaultQuery("sort_by", "periode")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var rekap []models.RekapSaldo
	var total int64

	// Build query
	query := ctrl.db.Model(&models.RekapSaldo{})

	// Apply filters
	if periode != "" {
		query = query.Where("periode = ?", periode)
	}

	// Validate sort parameters
	allowedSortFields := map[string]bool{
		"periode":           true,
		"terakhir_update":   true,
		"pemasukan_syahriah": true,
		"pengeluaran_syahriah": true,
		"saldo_akhir_syahriah": true,
		"pemasukan_donasi":   true,
		"pengeluaran_donasi": true,
		"saldo_akhir_donasi": true,
		"pemasukan_total":    true,
		"pengeluaran_total":  true,
		"saldo_akhir_total":  true,
	}

	sortField := sortBy
	if !allowedSortFields[sortField] {
		sortField = "periode"
	}

	sortDirection := "DESC"
	if sortOrder == "asc" {
		sortDirection = "ASC"
	}

	orderClause := sortField + " " + sortDirection

	// Hitung total records
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order(orderClause).
		Offset(offset).
		Limit(limit).
		Find(&rekap).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": rekap,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetRekapByID mendapatkan rekap berdasarkan ID
func (ctrl *RekapController) GetRekapByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID rekap diperlukan"})
		return
	}

	var rekap models.RekapSaldo
	err := ctrl.db.Where("id_saldo = ?", id).First(&rekap).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data rekap tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": rekap,
	})
}

// GetRekapByPeriode mendapatkan rekap berdasarkan periode
func (ctrl *RekapController) GetRekapByPeriode(c *gin.Context) {
	periode := c.Query("periode")

	if periode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "periode diperlukan"})
		return
	}

	var rekap models.RekapSaldo
	err := ctrl.db.Where("periode = ?", periode).First(&rekap).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data rekap tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": rekap,
	})
}

// GetRekapSummary mendapatkan summary rekap saldo
func (ctrl *RekapController) GetRekapSummary(c *gin.Context) {
	// Parse query parameters
	startPeriod := c.Query("start_period")
	endPeriod := c.Query("end_period")

	var rekap []models.RekapSaldo
	var summary RekapSummary

	// Build query
	query := ctrl.db.Model(&models.RekapSaldo{})

	// Apply filters
	if startPeriod != "" {
		query = query.Where("periode >= ?", startPeriod)
	}
	if endPeriod != "" {
		query = query.Where("periode <= ?", endPeriod)
	}

	// Eksekusi query
	err := query.Find(&rekap).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap: " + err.Error()})
		return
	}

	// Hitung summary
	for _, r := range rekap {
		summary.TotalPemasukanSyahriah += r.PemasukanSyahriah
		summary.TotalPengeluaranSyahriah += r.PengeluaranSyahriah
		summary.TotalPemasukanDonasi += r.PemasukanDonasi
		summary.TotalPengeluaranDonasi += r.PengeluaranDonasi
		summary.TotalPemasukan += r.PemasukanTotal
		summary.TotalPengeluaran += r.PengeluaranTotal
	}

	// Saldo akhir diambil dari record terbaru jika ada
	if len(rekap) > 0 {
		// Urutkan berdasarkan periode descending untuk mendapatkan yang terbaru
		latest := rekap[0]
		for _, r := range rekap {
			if r.Periode > latest.Periode {
				latest = r
			}
		}
		summary.SaldoAkhirSyahriah = latest.SaldoAkhirSyahriah
		summary.SaldoAkhirDonasi = latest.SaldoAkhirDonasi
		summary.SaldoAkhir = latest.SaldoAkhirTotal
	}

	c.JSON(http.StatusOK, gin.H{
		"data": summary,
		"meta": gin.H{
			"total_records": len(rekap),
			"start_period":  startPeriod,
			"end_period":    endPeriod,
		},
	})
}

// GetLatestRekap mendapatkan rekap terbaru
func (ctrl *RekapController) GetLatestRekap(c *gin.Context) {
	var latestRekap models.RekapSaldo

	// Query untuk mendapatkan rekap terbaru
	err := ctrl.db.Order("periode DESC").First(&latestRekap).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data rekap tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap terbaru: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": latestRekap,
	})
}

// SyncAllRekap - Sync semua rekap (admin only, untuk maintenance)
func (ctrl *RekapController) SyncAllRekap(c *gin.Context) {
	// Hanya admin yang bisa sync
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat sync rekap"})
		return
	}

	// Ambil semua periode unik dari syahriah dan donasi
	var periods []string
	
	// Dari syahriah
	ctrl.db.Model(&models.Syahriah{}).
		Distinct("bulan").
		Pluck("bulan", &periods)
	
	// Dari donasi (convert waktu_catat ke periode YYYY-MM)
	var donasiPeriods []string
	ctrl.db.Model(&models.Donasi{}).
		Select("DISTINCT DATE_FORMAT(waktu_catat, '%Y-%m') as periode").
		Pluck("periode", &donasiPeriods)
	
	// Gabungkan periods
	periodMap := make(map[string]bool)
	for _, p := range periods {
		periodMap[p] = true
	}
	for _, p := range donasiPeriods {
		periodMap[p] = true
	}
	
	// Update rekap untuk setiap periode (dalam urutan kronologis)
	var sortedPeriods []string
	for periode := range periodMap {
		sortedPeriods = append(sortedPeriods, periode)
	}
	
	// Sort periods chronologically
	for i := 0; i < len(sortedPeriods)-1; i++ {
		for j := i + 1; j < len(sortedPeriods); j++ {
			if sortedPeriods[i] > sortedPeriods[j] {
				sortedPeriods[i], sortedPeriods[j] = sortedPeriods[j], sortedPeriods[i]
			}
		}
	}
	
	// Update rekap untuk setiap periode secara berurutan
	for _, periode := range sortedPeriods {
		if err := ctrl.updateRekapSaldo(periode); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal sync rekap untuk periode " + periode + ": " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sync rekap berhasil",
		"total_periode": len(periodMap),
		"periods": sortedPeriods,
	})
}

// InitializeFirstRekap - Inisialisasi rekap pertama (untuk setup awal)
func (ctrl *RekapController) InitializeFirstRekap(c *gin.Context) {
	// Hanya admin yang bisa inisialisasi
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat inisialisasi rekap"})
		return
	}

	// Cek apakah sudah ada data rekap
	var count int64
	ctrl.db.Model(&models.RekapSaldo{}).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sudah ada data rekap, tidak perlu inisialisasi"})
		return
	}

	// Buat rekap untuk bulan sebelumnya sebagai starting point
	lastMonth := time.Now().AddDate(0, -1, 0)
	periode := lastMonth.Format("2006-01")

	rekap := models.RekapSaldo{
		IDSaldo:            uuid.New().String(),
		Periode:            periode,
		PemasukanSyahriah:  0,
		PengeluaranSyahriah: 0,
		SaldoAkhirSyahriah: 0,
		PemasukanDonasi:    0,
		PengeluaranDonasi:  0,
		SaldoAkhirDonasi:   0,
		PemasukanTotal:     0,
		PengeluaranTotal:   0,
		SaldoAkhirTotal:    0,
		TerakhirUpdate:     time.Now(),
	}

	if err := ctrl.db.Create(&rekap).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal inisialisasi rekap pertama: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Rekap pertama berhasil diinisialisasi",
		"data":    rekap,
	})
}

// updateRekapSaldoDenganPengeluaran - Update rekap dengan tambahan pengeluaran
func (ctrl *RekapController) updateRekapSaldoDenganPengeluaran(periode string, pengeluaranSyahriah, pengeluaranDonasi, pengeluaranTotal float64) error {
    var existingRekap models.RekapSaldo
    if err := ctrl.db.Where("periode = ?", periode).First(&existingRekap).Error; err != nil {
        // Jika tidak ada rekap, buat baru dengan data dari transaksi
        return ctrl.updateRekapSaldo(periode)
    }
    
    // PERBAIKAN: Update HANYA pengeluaran dan saldo akhir, jangan sentuh pemasukan
    existingRekap.PengeluaranSyahriah += pengeluaranSyahriah
    existingRekap.SaldoAkhirSyahriah -= pengeluaranSyahriah
    existingRekap.PengeluaranDonasi += pengeluaranDonasi
    existingRekap.SaldoAkhirDonasi -= pengeluaranDonasi
    existingRekap.PengeluaranTotal += pengeluaranTotal
    existingRekap.SaldoAkhirTotal -= pengeluaranTotal
    existingRekap.TerakhirUpdate = time.Now()
    
    // Debug log
    fmt.Printf("DEBUG: Update Pengeluaran - Periode: %s, Syahriah: %.0f, Donasi: %.0f, Total: %.0f\n",
        periode, pengeluaranSyahriah, pengeluaranDonasi, pengeluaranTotal)
    
    return ctrl.db.Save(&existingRekap).Error
}

// updateRekapSaldoDenganPemasukan - Update rekap saldo dengan tambahan pemasukan (untuk koreksi) (PERBAIKAN)
func (ctrl *RekapController) updateRekapSaldoDenganPemasukan(periode string, pemasukanSyahriah, pemasukanDonasi, pemasukanTotal float64) error {
    var existingRekap models.RekapSaldo
    if err := ctrl.db.Where("periode = ?", periode).First(&existingRekap).Error; err != nil {
        // Jika tidak ada rekap, buat baru dengan data dari transaksi
        return ctrl.updateRekapSaldo(periode)
    }
    
    // PERBAIKAN: Untuk pemasukan (koreksi), kita KURANGI pengeluaran dan TAMBAH saldo
    existingRekap.PengeluaranSyahriah -= pemasukanSyahriah
    existingRekap.SaldoAkhirSyahriah += pemasukanSyahriah
    existingRekap.PengeluaranDonasi -= pemasukanDonasi
    existingRekap.SaldoAkhirDonasi += pemasukanDonasi
    existingRekap.PengeluaranTotal -= pemasukanTotal
    existingRekap.SaldoAkhirTotal += pemasukanTotal
    existingRekap.TerakhirUpdate = time.Now()
    
    // Debug log
    fmt.Printf("DEBUG: Update Pemasukan (Koreksi) - Periode: %s, Syahriah: %.0f, Donasi: %.0f, Total: %.0f\n",
        periode, pemasukanSyahriah, pemasukanDonasi, pemasukanTotal)
    
    return ctrl.db.Save(&existingRekap).Error
}

// GetRekapPublic mendapatkan data rekap saldo untuk public (tanpa auth)
func (ctrl *RekapController) GetRekapPublic(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	periode := c.Query("periode")
	sortBy := c.DefaultQuery("sort_by", "periode")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 { // Limit lebih kecil untuk public
		limit = 10
	}

	var rekap []models.RekapSaldo
	var total int64

	// Build query - hanya ambil field yang diperlukan untuk public
	query := ctrl.db.Model(&models.RekapSaldo{}).Select(
		"periode", 
		"pemasukan_syahriah",
		"pengeluaran_syahriah", 
		"saldo_akhir_syahriah",
		"pemasukan_donasi",
		"pengeluaran_donasi", 
		"saldo_akhir_donasi",
		"pemasukan_total",
		"pengeluaran_total", 
		"saldo_akhir_total",
		"terakhir_update",
	)

	// Apply filters
	if periode != "" {
		query = query.Where("periode = ?", periode)
	}

	// Validate sort parameters - hanya field yang aman untuk public
	allowedSortFields := map[string]bool{
		"periode":           true,
		"terakhir_update":   true,
		"pemasukan_syahriah": true,
		"pengeluaran_syahriah": true,
		"saldo_akhir_syahriah": true,
		"pemasukan_donasi":   true,
		"pengeluaran_donasi": true,
		"saldo_akhir_donasi": true,
		"pemasukan_total":    true,
		"pengeluaran_total":  true,
		"saldo_akhir_total":  true,
	}

	sortField := sortBy
	if !allowedSortFields[sortField] {
		sortField = "periode"
	}

	sortDirection := "DESC"
	if sortOrder == "asc" {
		sortDirection = "ASC"
	}

	orderClause := sortField + " " + sortDirection

	// Hitung total records
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data"})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order(orderClause).
		Offset(offset).
		Limit(limit).
		Find(&rekap).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap"})
		return
	}

	// Response untuk public - tanpa informasi sensitif
	c.JSON(http.StatusOK, gin.H{
		"data": rekap,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetLatestRekapPublic mendapatkan rekap terbaru untuk public
func (ctrl *RekapController) GetLatestRekapPublic(c *gin.Context) {
	var latestRekap models.RekapSaldo

	// Query untuk mendapatkan rekap terbaru - hanya field yang diperlukan
	err := ctrl.db.Select(
		"periode", 
		"pemasukan_syahriah",
		"pengeluaran_syahriah", 
		"saldo_akhir_syahriah",
		"pemasukan_donasi",
		"pengeluaran_donasi", 
		"saldo_akhir_donasi",
		"pemasukan_total",
		"pengeluaran_total", 
		"saldo_akhir_total",
		"terakhir_update",
	).Order("periode DESC").First(&latestRekap).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data rekap tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap terbaru"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": latestRekap,
	})
}

// GetRekapSummaryPublic mendapatkan summary rekap saldo untuk public
func (ctrl *RekapController) GetRekapSummaryPublic(c *gin.Context) {
	// Parse query parameters
	startPeriod := c.Query("start_period")
	endPeriod := c.Query("end_period")

	var rekap []models.RekapSaldo
	var summary RekapSummary

	// Build query - hanya field yang diperlukan
	query := ctrl.db.Model(&models.RekapSaldo{}).Select(
		"periode", 
		"pemasukan_syahriah",
		"pengeluaran_syahriah", 
		"saldo_akhir_syahriah",
		"pemasukan_donasi",
		"pengeluaran_donasi", 
		"saldo_akhir_donasi",
		"pemasukan_total",
		"pengeluaran_total", 
		"saldo_akhir_total",
	)

	// Apply filters
	if startPeriod != "" {
		query = query.Where("periode >= ?", startPeriod)
	}
	if endPeriod != "" {
		query = query.Where("periode <= ?", endPeriod)
	}

	// Eksekusi query
	err := query.Find(&rekap).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap"})
		return
	}

	// Hitung summary
	for _, r := range rekap {
		summary.TotalPemasukanSyahriah += r.PemasukanSyahriah
		summary.TotalPengeluaranSyahriah += r.PengeluaranSyahriah
		summary.TotalPemasukanDonasi += r.PemasukanDonasi
		summary.TotalPengeluaranDonasi += r.PengeluaranDonasi
		summary.TotalPemasukan += r.PemasukanTotal
		summary.TotalPengeluaran += r.PengeluaranTotal
	}

	// Saldo akhir diambil dari record terbaru jika ada
	if len(rekap) > 0 {
		// Urutkan berdasarkan periode descending untuk mendapatkan yang terbaru
		latest := rekap[0]
		for _, r := range rekap {
			if r.Periode > latest.Periode {
				latest = r
			}
		}
		summary.SaldoAkhirSyahriah = latest.SaldoAkhirSyahriah
		summary.SaldoAkhirDonasi = latest.SaldoAkhirDonasi
		summary.SaldoAkhir = latest.SaldoAkhirTotal
	}

	c.JSON(http.StatusOK, gin.H{
		"data": summary,
		"meta": gin.H{
			"total_records": len(rekap),
			"start_period":  startPeriod,
			"end_period":    endPeriod,
		},
	})
}

// GetRekapByPeriodePublic mendapatkan rekap berdasarkan periode untuk public
func (ctrl *RekapController) GetRekapByPeriodePublic(c *gin.Context) {
	periode := c.Query("periode")

	if periode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "periode diperlukan"})
		return
	}

	var rekap models.RekapSaldo
	
	// Query dengan hanya field yang diperlukan untuk public
	err := ctrl.db.Select(
		"periode", 
		"pemasukan_syahriah",
		"pengeluaran_syahriah", 
		"saldo_akhir_syahriah",
		"pemasukan_donasi",
		"pengeluaran_donasi", 
		"saldo_akhir_donasi",
		"pemasukan_total",
		"pengeluaran_total", 
		"saldo_akhir_total",
		"terakhir_update",
	).Where("periode = ?", periode).First(&rekap).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data rekap tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data rekap"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": rekap,
	})
}

// GetRekapPeriodsPublic mendapatkan daftar periode yang tersedia untuk public
func (ctrl *RekapController) GetRekapPeriodsPublic(c *gin.Context) {
	var periods []string

	// Ambil semua periode yang tersedia
	err := ctrl.db.Model(&models.RekapSaldo{}).
		Distinct("periode").
		Order("periode DESC").
		Pluck("periode", &periods).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar periode"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": periods,
		"meta": gin.H{
			"total_periods": len(periods),
		},
	})
}