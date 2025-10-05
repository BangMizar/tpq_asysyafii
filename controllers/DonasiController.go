package controllers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DonasiController struct {
	db *gorm.DB
}

func NewDonasiController(db *gorm.DB) *DonasiController {
	return &DonasiController{db: db}
}

// Request structs
type CreateDonasiRequest struct {
	NamaDonatur string  `json:"nama_donatur" binding:"required"`
	NoTelp      string  `json:"no_telp"`
	Nominal     float64 `json:"nominal" binding:"required,gt=0"`
}

type UpdateDonasiRequest struct {
	NamaDonatur string  `json:"nama_donatur"`
	NoTelp      string  `json:"no_telp"`
	Nominal     float64 `json:"nominal" binding:"gt=0"`
}

type DonasiSummary struct {
	TotalNominal float64 `json:"total_nominal"`
	TotalDonatur int64   `json:"total_donatur"`
	RataRata     float64 `json:"rata_rata"`
}

// Helper function untuk check role
func (ctrl *DonasiController) checkAdminRole(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID
func (ctrl *DonasiController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// CreateDonasi membuat data donasi baru
func (ctrl *DonasiController) CreateDonasi(c *gin.Context) {
	// Check role
	if !ctrl.checkAdminRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin dan super_admin yang dapat akses"})
		return
	}

	// Get user ID
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req CreateDonasiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set nama donatur default jika kosong
	if req.NamaDonatur == "" {
		req.NamaDonatur = "Anonim"
	}

	// Buat data donasi
	donasi := models.Donasi{
		IDDonasi:    uuid.New().String(),
		NamaDonatur: req.NamaDonatur,
		NoTelp:      req.NoTelp,
		Nominal:     req.Nominal,
		DicatatOleh: userID,
		WaktuCatat:  time.Now(),
	}

	// Simpan ke database
	if err := ctrl.db.Create(&donasi).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat donasi: " + err.Error()})
		return
	}

	// Preload admin data untuk response
	ctrl.db.Preload("Admin").First(&donasi, "id_donasi = ?", donasi.IDDonasi)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Donasi berhasil dibuat",
		"data":    donasi,
	})
}

// GetDonasiByID mendapatkan donasi berdasarkan ID
func (ctrl *DonasiController) GetDonasiByID(c *gin.Context) {
	// Check role
	if !ctrl.checkAdminRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin dan super_admin yang dapat akses"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID donasi diperlukan"})
		return
	}

	var donasi models.Donasi
	err := ctrl.db.Preload("Admin").Where("id_donasi = ?", id).First(&donasi).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Donasi tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data donasi: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": donasi,
	})
}

// GetAllDonasi mendapatkan semua data donasi dengan pagination
func (ctrl *DonasiController) GetAllDonasi(c *gin.Context) {
	// Check role
	if !ctrl.checkAdminRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin dan super_admin yang dapat akses"})
		return
	}

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var donasi []models.Donasi
	var total int64

	// Build query
	query := ctrl.db.Preload("Admin")

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("nama_donatur LIKE ? OR no_telp LIKE ?", searchPattern, searchPattern)
	}

	// Hitung total records
	if err := query.Model(&models.Donasi{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("waktu_catat DESC").
		Offset(offset).
		Limit(limit).
		Find(&donasi).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data donasi: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": donasi,
		"meta": gin.H{
			"page":      page,
			"limit":     limit,
			"total":     total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// UpdateDonasi mengupdate data donasi
func (ctrl *DonasiController) UpdateDonasi(c *gin.Context) {
	// Check role
	if !ctrl.checkAdminRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin dan super_admin yang dapat akses"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID donasi diperlukan"})
		return
	}

	var req UpdateDonasiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek apakah donasi exists
	var existingDonasi models.Donasi
	err := ctrl.db.Where("id_donasi = ?", id).First(&existingDonasi).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Donasi tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data donasi: " + err.Error()})
		return
	}

	// Update fields
	if req.NamaDonatur != "" {
		existingDonasi.NamaDonatur = req.NamaDonatur
	}
	if req.NoTelp != "" {
		existingDonasi.NoTelp = req.NoTelp
	}
	if req.Nominal > 0 {
		existingDonasi.Nominal = req.Nominal
	}

	// Simpan perubahan
	if err := ctrl.db.Save(&existingDonasi).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate donasi: " + err.Error()})
		return
	}

	// Preload admin data untuk response
	ctrl.db.Preload("Admin").First(&existingDonasi, "id_donasi = ?", existingDonasi.IDDonasi)

	c.JSON(http.StatusOK, gin.H{
		"message": "Donasi berhasil diupdate",
		"data":    existingDonasi,
	})
}

// DeleteDonasi menghapus data donasi
func (ctrl *DonasiController) DeleteDonasi(c *gin.Context) {
	// Check role
	if !ctrl.checkAdminRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin dan super_admin yang dapat akses"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID donasi diperlukan"})
		return
	}

	// Cek apakah donasi exists
	var donasi models.Donasi
	err := ctrl.db.Where("id_donasi = ?", id).First(&donasi).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Donasi tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data donasi: " + err.Error()})
		return
	}

	// Hapus donasi
	if err := ctrl.db.Where("id_donasi = ?", id).Delete(&models.Donasi{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus donasi: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Donasi berhasil dihapus",
	})
}

// GetDonasiSummary mendapatkan summary donasi
func (ctrl *DonasiController) GetDonasiSummary(c *gin.Context) {
	// Check role
	if !ctrl.checkAdminRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin dan super_admin yang dapat akses"})
		return
	}

	// Parse date filters
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var start, end time.Time
	var err error

	if startDate != "" {
		start, err = time.Parse("2006-01-02", startDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format start_date tidak valid. Gunakan format YYYY-MM-DD"})
			return
		}
	}

	if endDate != "" {
		end, err = time.Parse("2006-01-02", endDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format end_date tidak valid. Gunakan format YYYY-MM-DD"})
			return
		}
		// Tambah 1 hari untuk mencakup seluruh hari end_date
		end = end.Add(24 * time.Hour)
	}

	// Build query
	query := ctrl.db.Model(&models.Donasi{})

	// Apply date filters jika ada
	if !start.IsZero() {
		query = query.Where("waktu_catat >= ?", start)
	}
	if !end.IsZero() {
		query = query.Where("waktu_catat < ?", end)
	}

	// Hitung total nominal
	var totalNominal float64
	if err := query.Select("COALESCE(SUM(nominal), 0)").Scan(&totalNominal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total nominal: " + err.Error()})
		return
	}

	// Hitung total donatur
	var totalDonatur int64
	if err := query.Count(&totalDonatur).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total donatur: " + err.Error()})
		return
	}

	// Hitung rata-rata
	var rataRata float64
	if totalDonatur > 0 {
		rataRata = totalNominal / float64(totalDonatur)
	}

	summary := DonasiSummary{
		TotalNominal: totalNominal,
		TotalDonatur: totalDonatur,
		RataRata:     rataRata,
	}

	c.JSON(http.StatusOK, gin.H{
		"data": summary,
		"filter": gin.H{
			"start_date": startDate,
			"end_date":   endDate,
		},
	})
}

// GetDonasiByDateRange mendapatkan donasi berdasarkan rentang tanggal
func (ctrl *DonasiController) GetDonasiByDateRange(c *gin.Context) {
	// Check role
	if !ctrl.checkAdminRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin dan super_admin yang dapat akses"})
		return
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_date dan end_date diperlukan"})
		return
	}

	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format start_date tidak valid"})
		return
	}

	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format end_date tidak valid"})
		return
	}
	end = end.Add(24 * time.Hour) // Include the entire end date

	var donasi []models.Donasi
	err = ctrl.db.Preload("Admin").
		Where("waktu_catat >= ? AND waktu_catat < ?", start, end).
		Order("waktu_catat DESC").
		Find(&donasi).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data donasi: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": donasi,
		"filter": gin.H{
			"start_date": startDate,
			"end_date":   endDate,
		},
	})
}

// GetDonasiPublic mendapatkan data donasi untuk dilihat publik (tanpa auth)
func (ctrl *DonasiController) GetDonasiPublic(c *gin.Context) {
    // Parse query parameters
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    startDate := c.Query("start_date")
    endDate := c.Query("end_date")

    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 50 {
        limit = 10
    }

    var donasi []models.Donasi
    var total int64

    // Build query untuk public - hanya field yang diperlukan
    query := ctrl.db.Select("id_donasi, nama_donatur, no_telp, nominal, waktu_catat")

    // Apply date filters jika ada
    if startDate != "" {
        // Validasi format tanggal
        _, err := time.Parse("2006-01-02", startDate)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Format start_date tidak valid. Gunakan format YYYY-MM-DD"})
            return
        }
        query = query.Where("DATE(waktu_catat) >= ?", startDate)
    }

    if endDate != "" {
        // Validasi format tanggal
        _, err := time.Parse("2006-01-02", endDate)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Format end_date tidak valid. Gunakan format YYYY-MM-DD"})
            return
        }
        query = query.Where("DATE(waktu_catat) <= ?", endDate)
    }

    // Hitung total records
    if err := query.Model(&models.Donasi{}).Count(&total).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
        return
    }

    // Apply pagination
    offset := (page - 1) * limit
    err := query.Order("waktu_catat DESC").
        Offset(offset).
        Limit(limit).
        Find(&donasi).Error

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data donasi: " + err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "data": donasi,
        "meta": gin.H{
            "page":       page,
            "limit":      limit,
            "total":      total,
            "total_page": (int(total) + limit - 1) / limit,
        },
    })
}

// GetDonasiSummaryPublic mendapatkan summary donasi untuk public (tanpa auth)
func (ctrl *DonasiController) GetDonasiSummaryPublic(c *gin.Context) {
    // Parse date filters
    startDate := c.Query("start_date")
    endDate := c.Query("end_date")

    // Build query
    query := ctrl.db.Model(&models.Donasi{})

    // Apply date filters jika ada
    if startDate != "" {
        // Validasi format tanggal
        _, err := time.Parse("2006-01-02", startDate)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Format start_date tidak valid. Gunakan format YYYY-MM-DD"})
            return
        }
        query = query.Where("DATE(waktu_catat) >= ?", startDate)
    }

    if endDate != "" {
        // Validasi format tanggal
        _, err := time.Parse("2006-01-02", endDate)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "Format end_date tidak valid. Gunakan format YYYY-MM-DD"})
            return
        }
        query = query.Where("DATE(waktu_catat) <= ?", endDate)
    }

    // Hitung total nominal
    var totalNominal float64
    if err := query.Select("COALESCE(SUM(nominal), 0)").Scan(&totalNominal).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total nominal: " + err.Error()})
        return
    }

    // Hitung total donatur
    var totalDonatur int64
    if err := query.Count(&totalDonatur).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total donatur: " + err.Error()})
        return
    }

    // Hitung rata-rata
    var rataRata float64
    if totalDonatur > 0 {
        rataRata = totalNominal / float64(totalDonatur)
    }

    // Data terbaru (5 donasi terbaru untuk preview)
    var donasiTerbaru []models.Donasi
    ctrl.db.Select("nama_donatur, nominal, waktu_catat").
        Order("waktu_catat DESC").
        Limit(5).
        Find(&donasiTerbaru)

    summary := gin.H{
        "total_nominal": totalNominal,
        "total_donatur": totalDonatur,
        "rata_rata":     rataRata,
        "donasi_terbaru": donasiTerbaru,
    }

    c.JSON(http.StatusOK, gin.H{
        "data": summary,
    })
}