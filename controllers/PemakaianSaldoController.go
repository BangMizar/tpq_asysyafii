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

type PemakaianSaldoController struct {
	db *gorm.DB
}

func NewPemakaianSaldoController(db *gorm.DB) *PemakaianSaldoController {
	return &PemakaianSaldoController{db: db}
}

// Request structs
type CreatePemakaianRequest struct {
	JudulPemakaian   string                `json:"judul_pemakaian" binding:"required"`
	Deskripsi        string                `json:"deskripsi" binding:"required"`
	NominalSyahriah  float64               `json:"nominal_syahriah"`
	NominalDonasi    float64               `json:"nominal_donasi"`
	TipePemakaian    models.TipePemakaian  `json:"tipe_pemakaian" binding:"required"`
	TanggalPemakaian *string               `json:"tanggal_pemakaian"`
	Keterangan       *string               `json:"keterangan"`
}

type UpdatePemakaianRequest struct {
	JudulPemakaian   *string               `json:"judul_pemakaian"`
	Deskripsi        *string               `json:"deskripsi"`
	NominalSyahriah  *float64              `json:"nominal_syahriah"`
	NominalDonasi    *float64              `json:"nominal_donasi"`
	TipePemakaian    *models.TipePemakaian `json:"tipe_pemakaian"`
	TanggalPemakaian *string               `json:"tanggal_pemakaian"`
	Keterangan       *string               `json:"keterangan"`
}

type PemakaianSummary struct {
	TotalNominal      float64 `json:"total_nominal"`
	JumlahPemakaian   int64   `json:"jumlah_pemakaian"`
	RataRata          float64 `json:"rata_rata"`
	PemakaianTerbanyak float64 `json:"pemakaian_terbanyak"`
}

// Helper function untuk check role admin
func (ctrl *PemakaianSaldoController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *PemakaianSaldoController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// CreatePemakaian membuat data pemakaian saldo baru
func (ctrl *PemakaianSaldoController) CreatePemakaian(c *gin.Context) {
	// Hanya admin yang bisa create
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat data pemakaian saldo"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req CreatePemakaianRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi tipe pemakaian
	if req.TipePemakaian != models.PemakaianOperasional && 
	   req.TipePemakaian != models.PemakaianInvestasi && 
	   req.TipePemakaian != models.PemakaianLainnya {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipe pemakaian tidak valid. Gunakan 'operasional', 'investasi', atau 'lainnya'"})
		return
	}

	// Validasi nominal
	if req.NominalSyahriah < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nominal syahriah tidak boleh negatif"})
		return
	}
	if req.NominalDonasi < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nominal donasi tidak boleh negatif"})
		return
	}

	nominalTotal := req.NominalSyahriah + req.NominalDonasi
	if nominalTotal <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Total nominal harus lebih besar dari 0"})
		return
	}

	// Parse tanggal pemakaian jika ada
	var tanggalPemakaian *time.Time
	if req.TanggalPemakaian != nil {
		parsedDate, err := time.Parse("2006-01-02", *req.TanggalPemakaian)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal_pemakaian tidak valid. Gunakan format YYYY-MM-DD"})
			return
		}
		tanggalPemakaian = &parsedDate
	} else {
		// Default ke hari ini
		today := time.Now()
		tanggalPemakaian = &today
	}

	// Cek saldo tersedia
	if !ctrl.cekSaldoTersedia(req.NominalSyahriah, req.NominalDonasi) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Saldo tidak mencukupi"})
		return
	}

	// Buat data pemakaian
	pemakaian := models.PemakaianSaldo{
		IDPemakaian:      uuid.New().String(),
		JudulPemakaian:   req.JudulPemakaian,
		Deskripsi:        req.Deskripsi,
		NominalSyahriah:  req.NominalSyahriah,
		NominalDonasi:    req.NominalDonasi,
		NominalTotal:     nominalTotal,
		TipePemakaian:    req.TipePemakaian,
		TanggalPemakaian: tanggalPemakaian,
		DiajukanOleh:     adminID,
		Keterangan:       req.Keterangan,
	}

	// Simpan ke database
	if err := ctrl.db.Create(&pemakaian).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat data pemakaian saldo: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Pengaju").First(&pemakaian, "id_pemakaian = ?", pemakaian.IDPemakaian)

	// Update rekap saldo (kurangi saldo)
	if err := ctrl.updateRekapSaldoSetelahPemakaian(pemakaian); err != nil {
		// Log error tapi jangan gagalkan create
		fmt.Printf("Gagal update rekap saldo: %v\n", err)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Data pemakaian saldo berhasil dibuat",
		"data":    pemakaian,
	})
}

// GetAllPemakaian mendapatkan semua data pemakaian saldo
func (ctrl *PemakaianSaldoController) GetAllPemakaian(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	tipePemakaian := c.Query("tipe_pemakaian")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var pemakaian []models.PemakaianSaldo
	var total int64

	// Build query
	query := ctrl.db.Preload("Pengaju")

	// Apply filters
	if tipePemakaian != "" {
		query = query.Where("tipe_pemakaian = ?", tipePemakaian)
	}
	if startDate != "" {
		start, err := time.Parse("2006-01-02", startDate)
		if err == nil {
			query = query.Where("DATE(created_at) >= ?", start.Format("2006-01-02"))
		}
	}
	if endDate != "" {
		end, err := time.Parse("2006-01-02", endDate)
		if err == nil {
			query = query.Where("DATE(created_at) <= ?", end.Format("2006-01-02"))
		}
	}
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("judul_pemakaian LIKE ? OR deskripsi LIKE ?", searchPattern, searchPattern)
	}

	// Validate sort parameters
	allowedSortFields := map[string]bool{
		"created_at":        true,
		"updated_at":        true,
		"nominal_total":     true,
		"judul_pemakaian":   true,
		"tanggal_pemakaian": true,
	}

	sortField := sortBy
	if !allowedSortFields[sortField] {
		sortField = "created_at"
	}

	sortDirection := "DESC"
	if sortOrder == "asc" {
		sortDirection = "ASC"
	}

	orderClause := sortField + " " + sortDirection

	// Hitung total records
	if err := query.Model(&models.PemakaianSaldo{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order(orderClause).
		Offset(offset).
		Limit(limit).
		Find(&pemakaian).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pemakaian saldo: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": pemakaian,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetPemakaianByID mendapatkan pemakaian berdasarkan ID
func (ctrl *PemakaianSaldoController) GetPemakaianByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pemakaian diperlukan"})
		return
	}

	var pemakaian models.PemakaianSaldo
	err := ctrl.db.Preload("Pengaju").Where("id_pemakaian = ?", id).First(&pemakaian).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data pemakaian saldo tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pemakaian saldo: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": pemakaian,
	})
}

// UpdatePemakaian mengupdate data pemakaian saldo
func (ctrl *PemakaianSaldoController) UpdatePemakaian(c *gin.Context) {
	// Hanya admin yang bisa update
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate data pemakaian saldo"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pemakaian diperlukan"})
		return
	}

	var req UpdatePemakaianRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek apakah pemakaian exists
	var existingPemakaian models.PemakaianSaldo
	err := ctrl.db.Where("id_pemakaian = ?", id).First(&existingPemakaian).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data pemakaian saldo tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pemakaian saldo: " + err.Error()})
		return
	}

	// Simpan nominal lama untuk update rekap
	nominalSyahriahLama := existingPemakaian.NominalSyahriah
	nominalDonasiLama := existingPemakaian.NominalDonasi

	// Update fields
	if req.JudulPemakaian != nil {
		existingPemakaian.JudulPemakaian = *req.JudulPemakaian
	}
	if req.Deskripsi != nil {
		existingPemakaian.Deskripsi = *req.Deskripsi
	}
	if req.NominalSyahriah != nil {
		if *req.NominalSyahriah < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nominal syahriah tidak boleh negatif"})
			return
		}
		existingPemakaian.NominalSyahriah = *req.NominalSyahriah
	}
	if req.NominalDonasi != nil {
		if *req.NominalDonasi < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nominal donasi tidak boleh negatif"})
			return
		}
		existingPemakaian.NominalDonasi = *req.NominalDonasi
	}
	
	// Hitung ulang total
	existingPemakaian.NominalTotal = existingPemakaian.NominalSyahriah + existingPemakaian.NominalDonasi
	
	if existingPemakaian.NominalTotal <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Total nominal harus lebih besar dari 0"})
		return
	}

	if req.TipePemakaian != nil {
		// Validasi tipe pemakaian
		if *req.TipePemakaian != models.PemakaianOperasional && 
		   *req.TipePemakaian != models.PemakaianInvestasi && 
		   *req.TipePemakaian != models.PemakaianLainnya {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tipe pemakaian tidak valid"})
			return
		}
		existingPemakaian.TipePemakaian = *req.TipePemakaian
	}
	if req.TanggalPemakaian != nil {
		parsedDate, err := time.Parse("2006-01-02", *req.TanggalPemakaian)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal_pemakaian tidak valid. Gunakan format YYYY-MM-DD"})
			return
		}
		existingPemakaian.TanggalPemakaian = &parsedDate
	}
	if req.Keterangan != nil {
		existingPemakaian.Keterangan = req.Keterangan
	}

	// Cek saldo tersedia jika nominal berubah
	if (req.NominalSyahriah != nil && *req.NominalSyahriah != nominalSyahriahLama) || 
	   (req.NominalDonasi != nil && *req.NominalDonasi != nominalDonasiLama) {
		if !ctrl.cekSaldoTersedia(existingPemakaian.NominalSyahriah, existingPemakaian.NominalDonasi) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Saldo tidak mencukupi"})
			return
		}
	}

	// Simpan perubahan
	if err := ctrl.db.Save(&existingPemakaian).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate data pemakaian saldo: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Pengaju").First(&existingPemakaian, "id_pemakaian = ?", existingPemakaian.IDPemakaian)

	// Update rekap saldo jika nominal berubah
	if (req.NominalSyahriah != nil && *req.NominalSyahriah != nominalSyahriahLama) || 
	   (req.NominalDonasi != nil && *req.NominalDonasi != nominalDonasiLama) {
		if err := ctrl.updateRekapSaldoSetelahUpdate(existingPemakaian, nominalSyahriahLama, nominalDonasiLama); err != nil {
			fmt.Printf("Gagal update rekap saldo: %v\n", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data pemakaian saldo berhasil diupdate",
		"data":    existingPemakaian,
	})
}

// DeletePemakaian menghapus data pemakaian saldo
func (ctrl *PemakaianSaldoController) DeletePemakaian(c *gin.Context) {
	// Hanya admin yang bisa delete
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus data pemakaian saldo"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pemakaian diperlukan"})
		return
	}

	// Cek apakah pemakaian exists
	var pemakaian models.PemakaianSaldo
	err := ctrl.db.Where("id_pemakaian = ?", id).First(&pemakaian).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data pemakaian saldo tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pemakaian saldo: " + err.Error()})
		return
	}

	// Hapus pemakaian
	if err := ctrl.db.Where("id_pemakaian = ?", id).Delete(&models.PemakaianSaldo{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data pemakaian saldo: " + err.Error()})
		return
	}

	// Update rekap saldo (tambahkan kembali saldo yang dihapus)
	if err := ctrl.updateRekapSaldoSetelahHapus(pemakaian); err != nil {
		fmt.Printf("Gagal update rekap saldo: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data pemakaian saldo berhasil dihapus",
	})
}

// GetPemakaianSummary mendapatkan summary pemakaian saldo
func (ctrl *PemakaianSaldoController) GetPemakaianSummary(c *gin.Context) {
	// Parse query parameters
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	tipePemakaian := c.Query("tipe_pemakaian")

	var summary PemakaianSummary

	// Build query
	query := ctrl.db.Model(&models.PemakaianSaldo{})

	// Apply filters
	if startDate != "" {
		start, err := time.Parse("2006-01-02", startDate)
		if err == nil {
			query = query.Where("DATE(created_at) >= ?", start.Format("2006-01-02"))
		}
	}
	if endDate != "" {
		end, err := time.Parse("2006-01-02", endDate)
		if err == nil {
			query = query.Where("DATE(created_at) <= ?", end.Format("2006-01-02"))
		}
	}
	if tipePemakaian != "" {
		query = query.Where("tipe_pemakaian = ?", tipePemakaian)
	}

	// Hitung total nominal
	if err := query.Select("COALESCE(SUM(nominal_total), 0)").Scan(&summary.TotalNominal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total nominal: " + err.Error()})
		return
	}

	// Hitung jumlah pemakaian
	if err := query.Count(&summary.JumlahPemakaian).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung jumlah pemakaian: " + err.Error()})
		return
	}

	// Hitung rata-rata
	if summary.JumlahPemakaian > 0 {
		summary.RataRata = summary.TotalNominal / float64(summary.JumlahPemakaian)
	}

	// Hitung pemakaian terbanyak
	var maxNominal float64
	if err := query.Select("COALESCE(MAX(nominal_total), 0)").Scan(&maxNominal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung pemakaian terbanyak: " + err.Error()})
		return
	}
	summary.PemakaianTerbanyak = maxNominal

	c.JSON(http.StatusOK, gin.H{
		"data": summary,
		"filter": gin.H{
			"start_date":     startDate,
			"end_date":       endDate,
			"tipe_pemakaian": tipePemakaian,
		},
	})
}

// ========== HELPER FUNCTIONS ==========

// cekSaldoTersedia - Cek apakah saldo mencukupi untuk pemakaian
func (ctrl *PemakaianSaldoController) cekSaldoTersedia(nominalSyahriah, nominalDonasi float64) bool {
    // Get latest rekap saldo
    var rekap models.RekapSaldo
    err := ctrl.db.Order("periode DESC").First(&rekap).Error
    
    if err != nil {
        fmt.Printf("Gagal mendapatkan saldo: %v\n", err)
        return false
    }
    
    // Cek masing-masing saldo
    if nominalSyahriah > 0 && nominalSyahriah > rekap.SaldoAkhirSyahriah {
        return false
    }
    
    if nominalDonasi > 0 && nominalDonasi > rekap.SaldoAkhirDonasi {
        return false
    }
    
    return true
}

// updateRekapSaldoSetelahPemakaian - Update rekap saldo setelah pemakaian (SANGAT SEDERHANA SEKARANG)
func (ctrl *PemakaianSaldoController) updateRekapSaldoSetelahPemakaian(pemakaian models.PemakaianSaldo) error {
    rekapController := NewRekapController(ctrl.db)
    
    // Get periode from tanggal pemakaian
    var periode string
    if pemakaian.TanggalPemakaian != nil {
        periode = pemakaian.TanggalPemakaian.Format("2006-01")
    } else {
        periode = time.Now().Format("2006-01")
    }
    
    // Langsung gunakan nominal yang sudah ditentukan
    return rekapController.updateRekapSaldoDenganPengeluaran(
        periode, 
        pemakaian.NominalSyahriah, 
        pemakaian.NominalDonasi, 
        pemakaian.NominalTotal,
    )
}

// updateRekapSaldoSetelahUpdate - Update rekap saldo setelah update pemakaian (SANGAT SEDERHANA SEKARANG)
func (ctrl *PemakaianSaldoController) updateRekapSaldoSetelahUpdate(pemakaian models.PemakaianSaldo, nominalSyahriahLama, nominalDonasiLama float64) error {
    rekapController := NewRekapController(ctrl.db)
    
    // Get periode from tanggal pemakaian
    var periode string
    if pemakaian.TanggalPemakaian != nil {
        periode = pemakaian.TanggalPemakaian.Format("2006-01")
    } else {
        periode = time.Now().Format("2006-01")
    }
    
    // 1. Kembalikan saldo lama
    if err := rekapController.updateRekapSaldoDenganPemasukan(
        periode,
        nominalSyahriahLama,
        nominalDonasiLama,
        nominalSyahriahLama + nominalDonasiLama,
    ); err != nil {
        return err
    }
    
    // 2. Kurangi saldo baru
    return rekapController.updateRekapSaldoDenganPengeluaran(
        periode,
        pemakaian.NominalSyahriah,
        pemakaian.NominalDonasi,
        pemakaian.NominalTotal,
    )
}

// updateRekapSaldoSetelahHapus - Update rekap saldo setelah hapus pemakaian (SANGAT SEDERHANA SEKARANG)
func (ctrl *PemakaianSaldoController) updateRekapSaldoSetelahHapus(pemakaian models.PemakaianSaldo) error {
    rekapController := NewRekapController(ctrl.db)
    
    // Get periode from tanggal pemakaian
    var periode string
    if pemakaian.TanggalPemakaian != nil {
        periode = pemakaian.TanggalPemakaian.Format("2006-01")
    } else {
        periode = time.Now().Format("2006-01")
    }
    
    // Kembalikan saldo yang dihapus
    return rekapController.updateRekapSaldoDenganPemasukan(
        periode,
        pemakaian.NominalSyahriah,
        pemakaian.NominalDonasi,
        pemakaian.NominalTotal,
    )
}

func (ctrl *PemakaianSaldoController) GetAllPemakaianPublic(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	tipePemakaian := c.Query("tipe_pemakaian")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 { // Batasi limit untuk public
		limit = 10
	}

	var pemakaian []models.PemakaianSaldo
	var total int64

	// Build query - hanya ambil data yang diperlukan untuk public
	query := ctrl.db.Select("id_pemakaian", "judul_pemakaian", "deskripsi", "nominal_syahriah", 
		"nominal_donasi", "nominal_total", "tipe_pemakaian", "tanggal_pemakaian", "keterangan", 
		"created_at", "updated_at")

	// Apply filters
	if tipePemakaian != "" {
		query = query.Where("tipe_pemakaian = ?", tipePemakaian)
	}
	if startDate != "" {
		start, err := time.Parse("2006-01-02", startDate)
		if err == nil {
			query = query.Where("DATE(created_at) >= ?", start.Format("2006-01-02"))
		}
	}
	if endDate != "" {
		end, err := time.Parse("2006-01-02", endDate)
		if err == nil {
			query = query.Where("DATE(created_at) <= ?", end.Format("2006-01-02"))
		}
	}

	// Validate sort parameters
	allowedSortFields := map[string]bool{
		"created_at":        true,
		"updated_at":        true,
		"nominal_total":     true,
		"judul_pemakaian":   true,
		"tanggal_pemakaian": true,
	}

	sortField := sortBy
	if !allowedSortFields[sortField] {
		sortField = "created_at"
	}

	sortDirection := "DESC"
	if sortOrder == "asc" {
		sortDirection = "ASC"
	}

	orderClause := sortField + " " + sortDirection

	// Hitung total records
	if err := query.Model(&models.PemakaianSaldo{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order(orderClause).
		Offset(offset).
		Limit(limit).
		Find(&pemakaian).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pemakaian saldo: " + err.Error()})
		return
	}

	// Format response untuk public (hilangkan field sensitif)
	type PublicPemakaianResponse struct {
		IDPemakaian      string                `json:"id_pemakaian"`
		JudulPemakaian   string                `json:"judul_pemakaian"`
		Deskripsi        string                `json:"deskripsi"`
		NominalSyahriah  float64               `json:"nominal_syahriah"`
		NominalDonasi    float64               `json:"nominal_donasi"`
		NominalTotal     float64               `json:"nominal_total"`
		TipePemakaian    models.TipePemakaian  `json:"tipe_pemakaian"`
		TanggalPemakaian *string               `json:"tanggal_pemakaian,omitempty"`
		Keterangan       *string               `json:"keterangan,omitempty"`
		CreatedAt        time.Time             `json:"created_at"`
		UpdatedAt        time.Time             `json:"updated_at"`
	}

	publicData := make([]PublicPemakaianResponse, len(pemakaian))
	for i, p := range pemakaian {
		var tanggalStr *string
		if p.TanggalPemakaian != nil {
			formatted := p.TanggalPemakaian.Format("2006-01-02")
			tanggalStr = &formatted
		}

		publicData[i] = PublicPemakaianResponse{
			IDPemakaian:      p.IDPemakaian,
			JudulPemakaian:   p.JudulPemakaian,
			Deskripsi:        p.Deskripsi,
			NominalSyahriah:  p.NominalSyahriah,
			NominalDonasi:    p.NominalDonasi,
			NominalTotal:     p.NominalTotal,
			TipePemakaian:    p.TipePemakaian,
			TanggalPemakaian: tanggalStr,
			Keterangan:       p.Keterangan,
			CreatedAt:        p.CreatedAt,
			UpdatedAt:        p.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": publicData,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetPemakaianSummaryPublic mendapatkan summary pemakaian saldo untuk public
func (ctrl *PemakaianSaldoController) GetPemakaianSummaryPublic(c *gin.Context) {
	// Parse query parameters
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	tipePemakaian := c.Query("tipe_pemakaian")

	var summary struct {
		TotalNominal      float64 `json:"total_nominal"`
		JumlahPemakaian   int64   `json:"jumlah_pemakaian"`
		RataRata          float64 `json:"rata_rata"`
		PemakaianTerbanyak float64 `json:"pemakaian_terbanyak"`
		TotalSyahriah     float64 `json:"total_syahriah"`
		TotalDonasi       float64 `json:"total_donasi"`
	}

	// Build query
	query := ctrl.db.Model(&models.PemakaianSaldo{})

	// Apply filters
	if startDate != "" {
		start, err := time.Parse("2006-01-02", startDate)
		if err == nil {
			query = query.Where("DATE(created_at) >= ?", start.Format("2006-01-02"))
		}
	}
	if endDate != "" {
		end, err := time.Parse("2006-01-02", endDate)
		if err == nil {
			query = query.Where("DATE(created_at) <= ?", end.Format("2006-01-02"))
		}
	}
	if tipePemakaian != "" {
		query = query.Where("tipe_pemakaian = ?", tipePemakaian)
	}

	// Hitung total nominal
	if err := query.Select("COALESCE(SUM(nominal_total), 0)").Scan(&summary.TotalNominal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total nominal: " + err.Error()})
		return
	}

	// Hitung jumlah pemakaian
	if err := query.Count(&summary.JumlahPemakaian).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung jumlah pemakaian: " + err.Error()})
		return
	}

	// Hitung rata-rata
	if summary.JumlahPemakaian > 0 {
		summary.RataRata = summary.TotalNominal / float64(summary.JumlahPemakaian)
	}

	// Hitung pemakaian terbanyak
	var maxNominal float64
	if err := query.Select("COALESCE(MAX(nominal_total), 0)").Scan(&maxNominal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung pemakaian terbanyak: " + err.Error()})
		return
	}
	summary.PemakaianTerbanyak = maxNominal

	// Hitung total syahriah
	var totalSyahriah float64
	if err := query.Select("COALESCE(SUM(nominal_syahriah), 0)").Scan(&totalSyahriah).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total syahriah: " + err.Error()})
		return
	}
	summary.TotalSyahriah = totalSyahriah

	// Hitung total donasi
	var totalDonasi float64
	if err := query.Select("COALESCE(SUM(nominal_donasi), 0)").Scan(&totalDonasi).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total donasi: " + err.Error()})
		return
	}
	summary.TotalDonasi = totalDonasi

	c.JSON(http.StatusOK, gin.H{
		"data": summary,
		"filter": gin.H{
			"start_date":     startDate,
			"end_date":       endDate,
			"tipe_pemakaian": tipePemakaian,
		},
	})
}

// GetPemakaianByIDPublic mendapatkan pemakaian berdasarkan ID untuk public
func (ctrl *PemakaianSaldoController) GetPemakaianByIDPublic(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pemakaian diperlukan"})
		return
	}

	var pemakaian models.PemakaianSaldo
	err := ctrl.db.Select("id_pemakaian", "judul_pemakaian", "deskripsi", "nominal_syahriah", 
		"nominal_donasi", "nominal_total", "tipe_pemakaian", "tanggal_pemakaian", "keterangan", 
		"created_at", "updated_at").
		Where("id_pemakaian = ?", id).
		First(&pemakaian).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data pemakaian saldo tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pemakaian saldo: " + err.Error()})
		return
	}

	// Format response untuk public
	type PublicPemakaianResponse struct {
		IDPemakaian      string                `json:"id_pemakaian"`
		JudulPemakaian   string                `json:"judul_pemakaian"`
		Deskripsi        string                `json:"deskripsi"`
		NominalSyahriah  float64               `json:"nominal_syahriah"`
		NominalDonasi    float64               `json:"nominal_donasi"`
		NominalTotal     float64               `json:"nominal_total"`
		TipePemakaian    models.TipePemakaian  `json:"tipe_pemakaian"`
		TanggalPemakaian *string               `json:"tanggal_pemakaian,omitempty"`
		Keterangan       *string               `json:"keterangan,omitempty"`
		CreatedAt        time.Time             `json:"created_at"`
		UpdatedAt        time.Time             `json:"updated_at"`
	}

	var tanggalStr *string
	if pemakaian.TanggalPemakaian != nil {
		formatted := pemakaian.TanggalPemakaian.Format("2006-01-02")
		tanggalStr = &formatted
	}

	publicResponse := PublicPemakaianResponse{
		IDPemakaian:      pemakaian.IDPemakaian,
		JudulPemakaian:   pemakaian.JudulPemakaian,
		Deskripsi:        pemakaian.Deskripsi,
		NominalSyahriah:  pemakaian.NominalSyahriah,
		NominalDonasi:    pemakaian.NominalDonasi,
		NominalTotal:     pemakaian.NominalTotal,
		TipePemakaian:    pemakaian.TipePemakaian,
		TanggalPemakaian: tanggalStr,
		Keterangan:       pemakaian.Keterangan,
		CreatedAt:        pemakaian.CreatedAt,
		UpdatedAt:        pemakaian.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"data": publicResponse,
	})
}

// GetPemakaianStatsPublic mendapatkan statistik pemakaian untuk public
func (ctrl *PemakaianSaldoController) GetPemakaianStatsPublic(c *gin.Context) {
	// Parse query parameters
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var stats struct {
		TotalPemakaianOperasional float64 `json:"total_operasional"`
		TotalPemakaianInvestasi   float64 `json:"total_investasi"`
		TotalPemakaianLainnya     float64 `json:"total_lainnya"`
		JumlahOperasional         int64   `json:"jumlah_operasional"`
		JumlahInvestasi           int64   `json:"jumlah_investasi"`
		JumlahLainnya             int64   `json:"jumlah_lainnya"`
		TotalSemuaPemakaian       float64 `json:"total_semua_pemakaian"`
		TotalSemuaTransaksi       int64   `json:"total_semua_transaksi"`
	}

	// Build base query
	baseQuery := ctrl.db.Model(&models.PemakaianSaldo{})
	
	// Apply date filters
	if startDate != "" {
		start, err := time.Parse("2006-01-02", startDate)
		if err == nil {
			baseQuery = baseQuery.Where("DATE(created_at) >= ?", start.Format("2006-01-02"))
		}
	}
	if endDate != "" {
		end, err := time.Parse("2006-01-02", endDate)
		if err == nil {
			baseQuery = baseQuery.Where("DATE(created_at) <= ?", end.Format("2006-01-02"))
		}
	}

	// Hitung total untuk setiap tipe pemakaian
	var results []struct {
		TipePemakaian string  `json:"tipe_pemakaian"`
		TotalNominal  float64 `json:"total_nominal"`
		Jumlah        int64   `json:"jumlah"`
	}

	err := baseQuery.Select("tipe_pemakaian, SUM(nominal_total) as total_nominal, COUNT(*) as jumlah").
		Group("tipe_pemakaian").
		Scan(&results).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung statistik pemakaian: " + err.Error()})
		return
	}

	// Map results ke struct stats
	for _, result := range results {
		switch result.TipePemakaian {
		case string(models.PemakaianOperasional):
			stats.TotalPemakaianOperasional = result.TotalNominal
			stats.JumlahOperasional = result.Jumlah
		case string(models.PemakaianInvestasi):
			stats.TotalPemakaianInvestasi = result.TotalNominal
			stats.JumlahInvestasi = result.Jumlah
		case string(models.PemakaianLainnya):
			stats.TotalPemakaianLainnya = result.TotalNominal
			stats.JumlahLainnya = result.Jumlah
		}
	}

	// Hitung total semua
	stats.TotalSemuaPemakaian = stats.TotalPemakaianOperasional + stats.TotalPemakaianInvestasi + stats.TotalPemakaianLainnya
	stats.TotalSemuaTransaksi = stats.JumlahOperasional + stats.JumlahInvestasi + stats.JumlahLainnya

	c.JSON(http.StatusOK, gin.H{
		"data": stats,
		"filter": gin.H{
			"start_date": startDate,
			"end_date":   endDate,
		},
	})
}