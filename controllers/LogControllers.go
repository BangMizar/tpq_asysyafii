package controllers

import (
	"net/http"
	"strconv"
	"time"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type LogAktivitasController struct {
	db *gorm.DB
}

func NewLogAktivitasController(db *gorm.DB) *LogAktivitasController {
	return &LogAktivitasController{db: db}
}

// Filter struct untuk pencarian log
type LogAktivitasFilter struct {
	Page      int    `form:"page,default=1"`
	Limit     int    `form:"limit,default=20"`
	Search    string `form:"search"`
	Aksi      string `form:"aksi"`
	TipeTarget string `form:"tipe_target"`
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
}

// Helper function untuk check role admin
func (ctrl *LogAktivitasController) checkAdminRole(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// GetAllLogAktivitas mendapatkan semua log aktivitas dengan filter
func (ctrl *LogAktivitasController) GetAllLogAktivitas(c *gin.Context) {
	// Check role
	if !ctrl.checkAdminRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin dan super_admin yang dapat akses"})
		return
	}

	// Parse query parameters
	var filter LogAktivitasFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 20
	}

	var logAktivitas []models.LogAktivitas
	var total int64

	// Build query
	query := ctrl.db.Preload("Admin")

	// Apply filters
	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		query = query.Where("aksi LIKE ? OR tipe_target LIKE ? OR keterangan LIKE ?", 
			searchPattern, searchPattern, searchPattern)
	}

	if filter.Aksi != "" {
		query = query.Where("aksi = ?", filter.Aksi)
	}

	if filter.TipeTarget != "" {
		query = query.Where("tipe_target = ?", filter.TipeTarget)
	}

	// Date range filter
	if filter.StartDate != "" {
		start, err := time.Parse("2006-01-02", filter.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format start_date tidak valid. Gunakan format YYYY-MM-DD"})
			return
		}
		query = query.Where("waktu_aksi >= ?", start)
	}

	if filter.EndDate != "" {
		end, err := time.Parse("2006-01-02", filter.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format end_date tidak valid. Gunakan format YYYY-MM-DD"})
			return
		}
		end = end.Add(24 * time.Hour) // Include entire end date
		query = query.Where("waktu_aksi < ?", end)
	}

	// Hitung total records
	if err := query.Model(&models.LogAktivitas{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (filter.Page - 1) * filter.Limit
	err := query.Order("waktu_aksi DESC").
		Offset(offset).
		Limit(filter.Limit).
		Find(&logAktivitas).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data log aktivitas: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": logAktivitas,
		"meta": gin.H{
			"page":       filter.Page,
			"limit":      filter.Limit,
			"total":      total,
			"total_page": (int(total) + filter.Limit - 1) / filter.Limit,
		},
	})
}

// GetLogAktivitasByID mendapatkan log aktivitas berdasarkan ID
func (ctrl *LogAktivitasController) GetLogAktivitasByID(c *gin.Context) {
	// Check role
	if !ctrl.checkAdminRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin dan super_admin yang dapat akses"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID log aktivitas diperlukan"})
		return
	}

	var logAktivitas models.LogAktivitas
	err := ctrl.db.Preload("Admin").Where("id_log = ?", id).First(&logAktivitas).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Log aktivitas tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data log aktivitas: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": logAktivitas,
	})
}

// GetLogSummary mendapatkan summary log aktivitas
func (ctrl *LogAktivitasController) GetLogSummary(c *gin.Context) {
	// Check role
	if !ctrl.checkAdminRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin dan super_admin yang dapat akses"})
		return
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var start, end time.Time
	var err error

	if startDate != "" {
		start, err = time.Parse("2006-01-02", startDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format start_date tidak valid"})
			return
		}
	}

	if endDate != "" {
		end, err = time.Parse("2006-01-02", endDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format end_date tidak valid"})
			return
		}
		end = end.Add(24 * time.Hour)
	}

	// Build query
	query := ctrl.db.Model(&models.LogAktivitas{})

	if !start.IsZero() {
		query = query.Where("waktu_aksi >= ?", start)
	}
	if !end.IsZero() {
		query = query.Where("waktu_aksi < ?", end)
	}

	// Hitung total aktivitas
	var totalAktivitas int64
	if err := query.Count(&totalAktivitas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total aktivitas: " + err.Error()})
		return
	}

	// Hitung aktivitas per tipe target
	var aktivitasPerTipe []struct {
		TipeTarget string `json:"tipe_target"`
		Count      int64  `json:"count"`
	}
	if err := query.Select("tipe_target, COUNT(*) as count").
		Group("tipe_target").
		Find(&aktivitasPerTipe).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung aktivitas per tipe: " + err.Error()})
		return
	}

	// Hitung aktivitas per aksi
	var aktivitasPerAksi []struct {
		Aksi  string `json:"aksi"`
		Count int64  `json:"count"`
	}
	if err := query.Select("aksi, COUNT(*) as count").
		Group("aksi").
		Find(&aktivitasPerAksi).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung aktivitas per aksi: " + err.Error()})
		return
	}

	// Aktivitas per admin
	var aktivitasPerAdmin []struct {
		AdminID   string `json:"admin_id"`
		NamaAdmin string `json:"nama_admin"`
		Count     int64  `json:"count"`
	}
	if err := ctrl.db.Model(&models.LogAktivitas{}).
		Select("log_aktivitas.id_admin, user.nama_lengkap as nama_admin, COUNT(*) as count").
		Joins("LEFT JOIN user ON user.id_user = log_aktivitas.id_admin").
		Group("log_aktivitas.id_admin, user.nama_lengkap").
		Find(&aktivitasPerAdmin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung aktivitas per admin: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"total_aktivitas":     totalAktivitas,
			"aktivitas_per_tipe":  aktivitasPerTipe,
			"aktivitas_per_aksi":  aktivitasPerAksi,
			"aktivitas_per_admin": aktivitasPerAdmin,
		},
		"filter": gin.H{
			"start_date": startDate,
			"end_date":   endDate,
		},
	})
}

// GetLogAktivitasByAdmin mendapatkan log aktivitas oleh admin tertentu
func (ctrl *LogAktivitasController) GetLogAktivitasByAdmin(c *gin.Context) {
	// Check role
	if !ctrl.checkAdminRole(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin dan super_admin yang dapat akses"})
		return
	}

	adminID := c.Param("admin_id")
	if adminID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID admin diperlukan"})
		return
	}

	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var logAktivitas []models.LogAktivitas
	var total int64

	// Query log oleh admin tertentu
	query := ctrl.db.Preload("Admin").Where("id_admin = ?", adminID)

	// Hitung total
	if err := query.Model(&models.LogAktivitas{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("waktu_aksi DESC").
		Offset(offset).
		Limit(limit).
		Find(&logAktivitas).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data log aktivitas: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": logAktivitas,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}