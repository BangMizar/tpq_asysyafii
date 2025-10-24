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
	JudulPemakaian  string                `json:"judul_pemakaian" binding:"required"`
	Deskripsi       string                `json:"deskripsi" binding:"required"`
	Nominal         float64               `json:"nominal" binding:"required,gt=0"`
	TipePemakaian   models.TipePemakaian  `json:"tipe_pemakaian" binding:"required"`
	SumberDana      models.SumberDana     `json:"sumber_dana" binding:"required"`
	TanggalPemakaian *string              `json:"tanggal_pemakaian"`
	Keterangan      *string               `json:"keterangan"`
}

type UpdatePemakaianRequest struct {
	JudulPemakaian   *string               `json:"judul_pemakaian"`
	Deskripsi        *string               `json:"deskripsi"`
	Nominal          *float64              `json:"nominal"`
	TipePemakaian    *models.TipePemakaian `json:"tipe_pemakaian"`
	SumberDana       *models.SumberDana    `json:"sumber_dana"`
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

	// Validasi sumber dana
	if req.SumberDana != models.SumberSyahriah && 
	   req.SumberDana != models.SumberDonasi && 
	   req.SumberDana != models.SumberCampuran {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sumber dana tidak valid. Gunakan 'syahriah', 'donasi', atau 'campuran'"})
		return
	}

	// Validasi nominal
	if req.Nominal <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nominal harus lebih besar dari 0"})
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

	// Cek saldo tersedia berdasarkan sumber dana
	if !ctrl.cekSaldoTersedia(req.SumberDana, req.Nominal) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Saldo tidak mencukupi untuk sumber dana yang dipilih"})
		return
	}

	// Buat data pemakaian
	pemakaian := models.PemakaianSaldo{
		IDPemakaian:      uuid.New().String(),
		JudulPemakaian:   req.JudulPemakaian,
		Deskripsi:        req.Deskripsi,
		Nominal:          req.Nominal,
		TipePemakaian:    req.TipePemakaian,
		SumberDana:       req.SumberDana,
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
	sumberDana := c.Query("sumber_dana")
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
	if sumberDana != "" {
		query = query.Where("sumber_dana = ?", sumberDana)
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
		"nominal":          true,
		"judul_pemakaian":  true,
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
	nominalLama := existingPemakaian.Nominal
	sumberDanaLama := existingPemakaian.SumberDana

	// Update fields
	if req.JudulPemakaian != nil {
		existingPemakaian.JudulPemakaian = *req.JudulPemakaian
	}
	if req.Deskripsi != nil {
		existingPemakaian.Deskripsi = *req.Deskripsi
	}
	if req.Nominal != nil {
		if *req.Nominal <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nominal harus lebih besar dari 0"})
			return
		}
		existingPemakaian.Nominal = *req.Nominal
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
	if req.SumberDana != nil {
		// Validasi sumber dana
		if *req.SumberDana != models.SumberSyahriah && 
		   *req.SumberDana != models.SumberDonasi && 
		   *req.SumberDana != models.SumberCampuran {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Sumber dana tidak valid"})
			return
		}
		existingPemakaian.SumberDana = *req.SumberDana
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

	// Cek saldo tersedia jika nominal atau sumber dana berubah
	if (req.Nominal != nil && *req.Nominal != nominalLama) || 
	   (req.SumberDana != nil && *req.SumberDana != sumberDanaLama) {
		sumberDanaBaru := existingPemakaian.SumberDana
		nominalBaru := existingPemakaian.Nominal
		
		if !ctrl.cekSaldoTersedia(sumberDanaBaru, nominalBaru) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Saldo tidak mencukupi untuk sumber dana yang dipilih"})
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

	// Update rekap saldo jika nominal atau sumber dana berubah
	if (req.Nominal != nil && *req.Nominal != nominalLama) || 
	   (req.SumberDana != nil && *req.SumberDana != sumberDanaLama) {
		if err := ctrl.updateRekapSaldoSetelahUpdate(existingPemakaian, nominalLama, sumberDanaLama); err != nil {
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
	sumberDana := c.Query("sumber_dana")

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
	if sumberDana != "" {
		query = query.Where("sumber_dana = ?", sumberDana)
	}

	// Hitung total nominal
	if err := query.Select("COALESCE(SUM(nominal), 0)").Scan(&summary.TotalNominal).Error; err != nil {
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
	if err := query.Select("COALESCE(MAX(nominal), 0)").Scan(&maxNominal).Error; err != nil {
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
			"sumber_dana":    sumberDana,
		},
	})
}

// ========== HELPER FUNCTIONS ==========

// cekSaldoTersedia - Cek apakah saldo mencukupi untuk pemakaian
func (ctrl *PemakaianSaldoController) cekSaldoTersedia(sumberDana models.SumberDana, nominal float64) bool {
	var saldoTersedia float64
    
    // Get latest rekap saldo
    var rekap models.RekapSaldo
    err := ctrl.db.Order("periode DESC").First(&rekap).Error
    
    if err != nil {
        fmt.Printf("Gagal mendapatkan saldo: %v\n", err)
        return false
    }
    
    // Tentukan saldo berdasarkan sumber dana
    switch sumberDana {
    case models.SumberSyahriah:
        saldoTersedia = rekap.SaldoAkhirSyahriah
    case models.SumberDonasi:
        saldoTersedia = rekap.SaldoAkhirDonasi
    case models.SumberCampuran:
        saldoTersedia = rekap.SaldoAkhirTotal
    default:
        saldoTersedia = rekap.SaldoAkhirTotal
    }
    
    return saldoTersedia >= nominal
}

// updateRekapSaldoSetelahPemakaian - Update rekap saldo setelah pemakaian
func (ctrl *PemakaianSaldoController) updateRekapSaldoSetelahPemakaian(pemakaian models.PemakaianSaldo) error {
    rekapController := NewRekapController(ctrl.db)
    
    // Get periode from tanggal pemakaian
    var periode string
    if pemakaian.TanggalPemakaian != nil {
        periode = pemakaian.TanggalPemakaian.Format("2006-01")
    } else {
        periode = time.Now().Format("2006-01")
    }
    
    // Tentukan pengeluaran berdasarkan sumber dana
    var pengeluaranSyahriah, pengeluaranDonasi, pengeluaranTotal float64
    
    switch pemakaian.SumberDana {
    case models.SumberSyahriah:
        pengeluaranSyahriah = pemakaian.Nominal
        pengeluaranTotal = pemakaian.Nominal
    case models.SumberDonasi:
        pengeluaranDonasi = pemakaian.Nominal
        pengeluaranTotal = pemakaian.Nominal
    case models.SumberCampuran:
        // Untuk campuran, bagi secara proporsional atau sesuai kebijakan
        // Sementara kita anggap 50-50
        pengeluaranSyahriah = pemakaian.Nominal * 0.5
        pengeluaranDonasi = pemakaian.Nominal * 0.5
        pengeluaranTotal = pemakaian.Nominal
    }
    
    return rekapController.updateRekapSaldoDenganPengeluaran(
        periode, 
        pengeluaranSyahriah, 
        pengeluaranDonasi, 
        pengeluaranTotal,
    )
}

// updateRekapSaldoSetelahUpdate - Update rekap saldo setelah update pemakaian
func (ctrl *PemakaianSaldoController) updateRekapSaldoSetelahUpdate(pemakaian models.PemakaianSaldo, nominalLama float64, sumberDanaLama models.SumberDana) error {
    rekapController := NewRekapController(ctrl.db)
    
    // Get periode from tanggal pemakaian
    var periode string
    if pemakaian.TanggalPemakaian != nil {
        periode = pemakaian.TanggalPemakaian.Format("2006-01")
    } else {
        periode = time.Now().Format("2006-01")
    }
    
    // Jika sumber dana berubah atau nominal berubah
    if sumberDanaLama != pemakaian.SumberDana || nominalLama != pemakaian.Nominal {
        // 1. Kembalikan saldo dari sumber dana lama
        var pengembalianSyahriah, pengembalianDonasi, pengembalianTotal float64
        
        switch sumberDanaLama {
        case models.SumberSyahriah:
            pengembalianSyahriah = nominalLama
            pengembalianTotal = nominalLama
        case models.SumberDonasi:
            pengembalianDonasi = nominalLama
            pengembalianTotal = nominalLama
        case models.SumberCampuran:
            pengembalianSyahriah = nominalLama * 0.5
            pengembalianDonasi = nominalLama * 0.5
            pengembalianTotal = nominalLama
        }
        
        if err := rekapController.updateRekapSaldoDenganPemasukan(
            periode,
            pengembalianSyahriah,
            pengembalianDonasi,
            pengembalianTotal,
        ); err != nil {
            return err
        }
        
        // 2. Kurangi saldo dari sumber dana baru
        var pengeluaranSyahriah, pengeluaranDonasi, pengeluaranTotal float64
        
        switch pemakaian.SumberDana {
        case models.SumberSyahriah:
            pengeluaranSyahriah = pemakaian.Nominal
            pengeluaranTotal = pemakaian.Nominal
        case models.SumberDonasi:
            pengeluaranDonasi = pemakaian.Nominal
            pengeluaranTotal = pemakaian.Nominal
        case models.SumberCampuran:
            pengeluaranSyahriah = pemakaian.Nominal * 0.5
            pengeluaranDonasi = pemakaian.Nominal * 0.5
            pengeluaranTotal = pemakaian.Nominal
        }
        
        return rekapController.updateRekapSaldoDenganPengeluaran(
            periode,
            pengeluaranSyahriah,
            pengeluaranDonasi,
            pengeluaranTotal,
        )
    }
    
    return nil
}

// updateRekapSaldoSetelahHapus - Update rekap saldo setelah hapus pemakaian
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
    var pengembalianSyahriah, pengembalianDonasi, pengembalianTotal float64
    
    switch pemakaian.SumberDana {
    case models.SumberSyahriah:
        pengembalianSyahriah = pemakaian.Nominal
        pengembalianTotal = pemakaian.Nominal
    case models.SumberDonasi:
        pengembalianDonasi = pemakaian.Nominal
        pengembalianTotal = pemakaian.Nominal
    case models.SumberCampuran:
        pengembalianSyahriah = pemakaian.Nominal * 0.5
        pengembalianDonasi = pemakaian.Nominal * 0.5
        pengembalianTotal = pemakaian.Nominal
    }
    
    return rekapController.updateRekapSaldoDenganPemasukan(
        periode,
        pengembalianSyahriah,
        pengembalianDonasi,
        pengembalianTotal,
    )
}