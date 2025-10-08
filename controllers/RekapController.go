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
	TipeSaldo        models.TipeSaldo `json:"tipe_saldo" binding:"required"`
	Periode          string           `json:"periode" binding:"required"` // format YYYY-MM
	PemasukanTotal   float64          `json:"pemasukan_total"`
	PengeluaranTotal float64          `json:"pengeluaran_total"`
	SaldoAkhir       float64          `json:"saldo_akhir"`
}

type UpdateRekapRequest struct {
	PemasukanTotal   float64 `json:"pemasukan_total"`
	PengeluaranTotal float64 `json:"pengeluaran_total"`
	SaldoAkhir       float64 `json:"saldo_akhir"`
}

// Response struct untuk summary
type RekapSummary struct {
	TotalPemasukan   float64 `json:"total_pemasukan"`
	TotalPengeluaran float64 `json:"total_pengeluaran"`
	SaldoAkhir       float64 `json:"saldo_akhir"`
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

// updateRekapSaldo - Internal function untuk update rekap otomatis
func (ctrl *RekapController) updateRekapSaldo(periode string, tipeSaldo models.TipeSaldo) error {
	var pemasukan float64
	var err error

	// Hitung pemasukan berdasarkan tipe saldo
	switch tipeSaldo {
	case models.SaldoSyahriah:
		// ✅ PERBAIKAN: Pastikan hanya menghitung syahriah dengan status LUNAS
		err = ctrl.db.Model(&models.Syahriah{}).
			Where("bulan = ? AND status = ?", periode, models.StatusLunas).
			Select("COALESCE(SUM(nominal), 0)").
			Scan(&pemasukan).Error
		
		// Debug log untuk troubleshooting
		if err == nil {
			fmt.Printf("DEBUG: Rekap syahriah periode %s - Status lunas: %.2f\n", periode, pemasukan)
		}

	case models.SaldoDonasi:
		startDate, _ := time.Parse("2006-01", periode)
		endDate := startDate.AddDate(0, 1, 0)
		
		err = ctrl.db.Model(&models.Donasi{}).
			Where("waktu_catat >= ? AND waktu_catat < ?", startDate, endDate).
			Select("COALESCE(SUM(nominal), 0)").
			Scan(&pemasukan).Error

		// Debug log untuk troubleshooting
		if err == nil {
			fmt.Printf("DEBUG: Rekap donasi periode %s - Total: %.2f\n", periode, pemasukan)
		}

	case models.SaldoTotal:
		// Hitung total dari syahriah dan donasi
		var syahriahTotal, donasiTotal float64
		
		err1 := ctrl.db.Model(&models.Syahriah{}).
			Where("bulan = ? AND status = ?", periode, models.StatusLunas).
			Select("COALESCE(SUM(nominal), 0)").
			Scan(&syahriahTotal).Error
			
		startDate, _ := time.Parse("2006-01", periode)
		endDate := startDate.AddDate(0, 1, 0)
		
		err2 := ctrl.db.Model(&models.Donasi{}).
			Where("waktu_catat >= ? AND waktu_catat < ?", startDate, endDate).
			Select("COALESCE(SUM(nominal), 0)").
			Scan(&donasiTotal).Error
			
		pemasukan = syahriahTotal + donasiTotal
		err = errors.Join(err1, err2)

		// Debug log untuk troubleshooting
		if err == nil {
			fmt.Printf("DEBUG: Rekap total periode %s - Syahriah: %.2f, Donasi: %.2f, Total: %.2f\n", 
				periode, syahriahTotal, donasiTotal, pemasukan)
		}
	}

	if err != nil {
		return err
	}

	// Untuk pengeluaran, bisa disesuaikan dengan kebutuhan
	pengeluaranTotal := 0.0
	saldoAkhir := pemasukan - pengeluaranTotal

	// Cek apakah sudah ada rekap untuk periode ini
	var existingRekap models.RekapSaldo
	if err := ctrl.db.Where("tipe_saldo = ? AND periode = ?", tipeSaldo, periode).First(&existingRekap).Error; err == nil {
		// Update existing rekap
		existingRekap.PemasukanTotal = pemasukan
		existingRekap.PengeluaranTotal = pengeluaranTotal
		existingRekap.SaldoAkhir = saldoAkhir
		existingRekap.TerakhirUpdate = time.Now()

		return ctrl.db.Save(&existingRekap).Error
	} else {
		// Buat rekap baru
		rekap := models.RekapSaldo{
			IDSaldo:          uuid.New().String(),
			TipeSaldo:        tipeSaldo,
			Periode:          periode,
			PemasukanTotal:   pemasukan,
			PengeluaranTotal: pengeluaranTotal,
			SaldoAkhir:       saldoAkhir,
			TerakhirUpdate:   time.Now(),
		}
		return ctrl.db.Create(&rekap).Error
	}
}

// UpdateRekapOtomatis - Dipanggil setelah ada transaksi donasi/syahriah
func (ctrl *RekapController) UpdateRekapOtomatis(transaksiTime time.Time) error {
	periode := transaksiTime.Format("2006-01")
	
	// Update semua tipe saldo untuk periode tersebut
	tipes := []models.TipeSaldo{models.SaldoSyahriah, models.SaldoDonasi, models.SaldoTotal}
	
	for _, tipe := range tipes {
		if err := ctrl.updateRekapSaldo(periode, tipe); err != nil {
			return err
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

	// Validasi tipe saldo
	if req.TipeSaldo != models.SaldoSyahriah && req.TipeSaldo != models.SaldoDonasi && req.TipeSaldo != models.SaldoTotal {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipe saldo tidak valid. Gunakan 'syahriah', 'donasi', atau 'total'"})
		return
	}

	// Cek apakah sudah ada rekap untuk tipe saldo dan periode yang sama
	var existingRekap models.RekapSaldo
	if err := ctrl.db.Where("tipe_saldo = ? AND periode = ?", req.TipeSaldo, req.Periode).First(&existingRekap).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rekap saldo untuk periode ini sudah ada"})
		return
	}

	// Set default values jika tidak diisi
	if req.PemasukanTotal < 0 {
		req.PemasukanTotal = 0
	}
	if req.PengeluaranTotal < 0 {
		req.PengeluaranTotal = 0
	}
	if req.SaldoAkhir < 0 {
		req.SaldoAkhir = 0
	}

	// Buat data rekap
	rekap := models.RekapSaldo{
		IDSaldo:          uuid.New().String(),
		TipeSaldo:        req.TipeSaldo,
		Periode:          req.Periode,
		PemasukanTotal:   req.PemasukanTotal,
		PengeluaranTotal: req.PengeluaranTotal,
		SaldoAkhir:       req.SaldoAkhir,
		TerakhirUpdate:   time.Now(),
	}

	// Simpan ke database
	if err := ctrl.db.Create(&rekap).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat data rekap: " + err.Error()})
		return
	}

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

	// Update fields
	if req.PemasukanTotal >= 0 {
		existingRekap.PemasukanTotal = req.PemasukanTotal
	}
	if req.PengeluaranTotal >= 0 {
		existingRekap.PengeluaranTotal = req.PengeluaranTotal
	}
	if req.SaldoAkhir >= 0 {
		existingRekap.SaldoAkhir = req.SaldoAkhir
	}

	existingRekap.TerakhirUpdate = time.Now()

	// Simpan perubahan
	if err := ctrl.db.Save(&existingRekap).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate data rekap: " + err.Error()})
		return
	}

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

	// Hapus rekap
	if err := ctrl.db.Where("id_saldo = ?", id).Delete(&models.RekapSaldo{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data rekap: " + err.Error()})
		return
	}

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

	// Generate rekap untuk masing-masing tipe saldo
	tipes := []models.TipeSaldo{models.SaldoSyahriah, models.SaldoDonasi, models.SaldoTotal}
	results := make([]models.RekapSaldo, 0)

	for _, tipe := range tipes {
		if err := ctrl.updateRekapSaldo(periode, tipe); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate rekap " + string(tipe) + ": " + err.Error()})
			return
		}

		// Ambil data yang baru saja di-generate
		var rekap models.RekapSaldo
		if err := ctrl.db.Where("tipe_saldo = ? AND periode = ?", tipe, periode).First(&rekap).Error; err == nil {
			results = append(results, rekap)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Rekap berhasil digenerate otomatis",
		"data":    results,
		"periode": periode,
	})
}

// GetAllRekap mendapatkan semua data rekap saldo
func (ctrl *RekapController) GetAllRekap(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	tipeSaldo := c.Query("tipe_saldo")
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
	if tipeSaldo != "" {
		query = query.Where("tipe_saldo = ?", tipeSaldo)
	}
	if periode != "" {
		query = query.Where("periode = ?", periode)
	}

	// Validate sort parameters
	allowedSortFields := map[string]bool{
		"periode":           true,
		"terakhir_update":   true,
		"pemasukan_total":   true,
		"pengeluaran_total": true,
		"saldo_akhir":       true,
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

// GetRekapByPeriode mendapatkan rekap berdasarkan tipe saldo dan periode
func (ctrl *RekapController) GetRekapByPeriode(c *gin.Context) {
	tipeSaldo := c.Query("tipe_saldo")
	periode := c.Query("periode")

	if tipeSaldo == "" || periode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tipe_saldo dan periode diperlukan"})
		return
	}

	// Validasi tipe saldo
	if tipeSaldo != string(models.SaldoSyahriah) && 
	   tipeSaldo != string(models.SaldoDonasi) && 
	   tipeSaldo != string(models.SaldoTotal) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipe saldo tidak valid. Gunakan 'syahriah', 'donasi', atau 'total'"})
		return
	}

	var rekap models.RekapSaldo
	err := ctrl.db.Where("tipe_saldo = ? AND periode = ?", tipeSaldo, periode).First(&rekap).Error
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
	tipeSaldo := c.Query("tipe_saldo")
	startPeriod := c.Query("start_period")
	endPeriod := c.Query("end_period")

	var rekap []models.RekapSaldo
	var summary RekapSummary

	// Build query
	query := ctrl.db.Model(&models.RekapSaldo{})

	// Apply filters
	if tipeSaldo != "" {
		query = query.Where("tipe_saldo = ?", tipeSaldo)
	}
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
		summary.SaldoAkhir = latest.SaldoAkhir
	}

	c.JSON(http.StatusOK, gin.H{
		"data": summary,
		"meta": gin.H{
			"total_records": len(rekap),
			"tipe_saldo":    tipeSaldo,
			"start_period":  startPeriod,
			"end_period":    endPeriod,
		},
	})
}

// GetLatestRekap mendapatkan rekap terbaru untuk setiap tipe saldo
func (ctrl *RekapController) GetLatestRekap(c *gin.Context) {
	var latestRekap []models.RekapSaldo

	// Query untuk mendapatkan rekap terbaru per tipe saldo
	err := ctrl.db.Raw(`
		SELECT rs1.* 
		FROM rekapsaldo rs1
		INNER JOIN (
			SELECT tipe_saldo, MAX(periode) as max_periode
			FROM rekapsaldo
			GROUP BY tipe_saldo
		) rs2 ON rs1.tipe_saldo = rs2.tipe_saldo AND rs1.periode = rs2.max_periode
		ORDER BY rs1.tipe_saldo
	`).Scan(&latestRekap).Error

	if err != nil {
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
	
	// Update rekap untuk setiap periode
	for periode := range periodMap {
		tipes := []models.TipeSaldo{models.SaldoSyahriah, models.SaldoDonasi, models.SaldoTotal}
		for _, tipe := range tipes {
			if err := ctrl.updateRekapSaldo(periode, tipe); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal sync rekap untuk periode " + periode + ": " + err.Error()})
				return
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sync rekap berhasil",
		"total_periode": len(periodMap),
		"periods": periodMap,
	})
}

// updateRekapSaldoDenganPengeluaran - Update rekap dengan tambahan pengeluaran
func (ctrl *RekapController) updateRekapSaldoDenganPengeluaran(periode string, tipeSaldo models.TipeSaldo, pengeluaran float64) error {
	var existingRekap models.RekapSaldo
	if err := ctrl.db.Where("tipe_saldo = ? AND periode = ?", tipeSaldo, periode).First(&existingRekap).Error; err != nil {
		// Jika tidak ada rekap, buat baru dengan data dari transaksi
		return ctrl.updateRekapSaldo(periode, tipeSaldo)
	}
	
	// Update pengeluaran dan saldo
	existingRekap.PengeluaranTotal += pengeluaran
	existingRekap.SaldoAkhir -= pengeluaran
	existingRekap.TerakhirUpdate = time.Now()
	
	return ctrl.db.Save(&existingRekap).Error
}

// updateRekapSaldoDenganPemasukan - Update rekap dengan tambahan pemasukan (untuk koreksi)
func (ctrl *RekapController) updateRekapSaldoDenganPemasukan(periode string, tipeSaldo models.TipeSaldo, pemasukan float64) error {
	var existingRekap models.RekapSaldo
	if err := ctrl.db.Where("tipe_saldo = ? AND periode = ?", tipeSaldo, periode).First(&existingRekap).Error; err != nil {
		// Jika tidak ada rekap, buat baru dengan data dari transaksi
		return ctrl.updateRekapSaldo(periode, tipeSaldo)
	}
	
	// Update pemasukan dan saldo
	existingRekap.PemasukanTotal += pemasukan
	existingRekap.SaldoAkhir += pemasukan
	existingRekap.TerakhirUpdate = time.Now()
	
	return ctrl.db.Save(&existingRekap).Error
}