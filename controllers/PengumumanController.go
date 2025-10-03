package controllers

import (
	"net/http"
	"strconv"
	"time"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PengumumanController struct {
	db *gorm.DB
}

func NewPengumumanController(db *gorm.DB) *PengumumanController {
	return &PengumumanController{db: db}
}

// Request structs
type CreatePengumumanRequest struct {
	Judul         string     `json:"judul" binding:"required"`
	Isi           string     `json:"isi" binding:"required"`
	Tipe          string     `json:"tipe"`
	TanggalMulai  *time.Time `json:"tanggal_mulai"`
	TanggalSelesai *time.Time `json:"tanggal_selesai"`
	Status        string     `json:"status"`
}

type UpdatePengumumanRequest struct {
	Judul         string     `json:"judul"`
	Isi           string     `json:"isi"`
	Tipe          string     `json:"tipe"`
	TanggalMulai  *time.Time `json:"tanggal_mulai"`
	TanggalSelesai *time.Time `json:"tanggal_selesai"`
	Status        string     `json:"status"`
}

// Filter struct untuk pencarian
type PengumumanFilter struct {
	Page          int    `form:"page,default=1"`
	Limit         int    `form:"limit,default=10"`
	Search        string `form:"search"`
	Tipe          string `form:"tipe"`
	Status        string `form:"status"`
	TanggalMulai  string `form:"tanggal_mulai"`
	TanggalSelesai string `form:"tanggal_selesai"`
}

// Helper function untuk check role admin
func (ctrl *PengumumanController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *PengumumanController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// CreatePengumuman membuat pengumuman baru (hanya admin)
func (ctrl *PengumumanController) CreatePengumuman(c *gin.Context) {
	// Hanya admin yang bisa create
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat pengumuman"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req CreatePengumumanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi tipe
	var tipe models.TipePengumuman
	if req.Tipe != "" {
		tipe = models.TipePengumuman(req.Tipe)
		if tipe != models.PengumumanPublik && tipe != models.PengumumanInternal {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tipe tidak valid. Gunakan 'publik' atau 'internal'"})
			return
		}
	} else {
		tipe = models.PengumumanPublik // default
	}

	// Validasi status
	var status models.StatusPengumuman
	if req.Status != "" {
		status = models.StatusPengumuman(req.Status)
		if status != models.StatusAktif && status != models.StatusNonaktif {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'aktif' atau 'nonaktif'"})
			return
		}
	} else {
		status = models.StatusAktif // default
	}

	// Validasi tanggal
	if req.TanggalSelesai != nil && req.TanggalMulai != nil {
		if req.TanggalSelesai.Before(*req.TanggalMulai) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal selesai tidak boleh sebelum tanggal mulai"})
			return
		}
	}

	// Buat pengumuman
	pengumuman := models.Pengumuman{
		IDPengumuman:  uuid.New().String(),
		Judul:         req.Judul,
		Isi:           req.Isi,
		Tipe:          tipe,
		DibuatOleh:    adminID,
		TanggalDibuat: time.Now(),
		TanggalMulai:  req.TanggalMulai,
		TanggalSelesai: req.TanggalSelesai,
		Status:        status,
	}

	// Simpan ke database
	if err := ctrl.db.Create(&pengumuman).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pengumuman: " + err.Error()})
		return
	}

	// Preload author untuk response
	ctrl.db.Preload("Author").First(&pengumuman, "id_pengumuman = ?", pengumuman.IDPengumuman)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Pengumuman berhasil dibuat",
		"data":    pengumuman,
	})
}

// GetAllPengumuman mendapatkan semua pengumuman dengan filter
func (ctrl *PengumumanController) GetAllPengumuman(c *gin.Context) {
	// Parse query parameters
	var filter PengumumanFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 10
	}

	var pengumuman []models.Pengumuman
	var total int64

	// Build query
	query := ctrl.db.Preload("Author")

	// Jika user bukan admin, hanya tampilkan pengumuman publik dan aktif
	if !ctrl.isAdmin(c) {
		query = query.Where("tipe = ? AND status = ?", models.PengumumanPublik, models.StatusAktif)
		
		// Filter by tanggal aktif untuk non-admin
		now := time.Now()
		query = query.Where("(tanggal_mulai IS NULL OR tanggal_mulai <= ?) AND (tanggal_selesai IS NULL OR tanggal_selesai >= ?)", now, now)
	}

	// Apply filters
	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		query = query.Where("judul LIKE ? OR isi LIKE ?", searchPattern, searchPattern)
	}

	if filter.Tipe != "" {
		query = query.Where("tipe = ?", filter.Tipe)
	}

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	// Date range filters
	if filter.TanggalMulai != "" {
		tanggalMulai, err := time.Parse("2006-01-02", filter.TanggalMulai)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal_mulai tidak valid. Gunakan format YYYY-MM-DD"})
			return
		}
		query = query.Where("tanggal_mulai >= ?", tanggalMulai)
	}

	if filter.TanggalSelesai != "" {
		tanggalSelesai, err := time.Parse("2006-01-02", filter.TanggalSelesai)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal_selesai tidak valid. Gunakan format YYYY-MM-DD"})
			return
		}
		tanggalSelesai = tanggalSelesai.Add(24 * time.Hour)
		query = query.Where("tanggal_selesai < ?", tanggalSelesai)
	}

	// Hitung total records
	if err := query.Model(&models.Pengumuman{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (filter.Page - 1) * filter.Limit
	err := query.Order("tanggal_dibuat DESC").
		Offset(offset).
		Limit(filter.Limit).
		Find(&pengumuman).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pengumuman: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": pengumuman,
		"meta": gin.H{
			"page":       filter.Page,
			"limit":      filter.Limit,
			"total":      total,
			"total_page": (int(total) + filter.Limit - 1) / filter.Limit,
		},
	})
}

// GetPengumumanByID mendapatkan pengumuman berdasarkan ID
func (ctrl *PengumumanController) GetPengumumanByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pengumuman diperlukan"})
		return
	}

	var pengumuman models.Pengumuman
	err := ctrl.db.Preload("Author").Where("id_pengumuman = ?", id).First(&pengumuman).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pengumuman tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pengumuman: " + err.Error()})
		return
	}

	// Authorization check untuk non-admin
	if !ctrl.isAdmin(c) {
		// Cek jika pengumuman internal atau nonaktif
		if pengumuman.Tipe == models.PengumumanInternal || pengumuman.Status == models.StatusNonaktif {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses ke pengumuman ini"})
			return
		}

		// Cek tanggal aktif
		now := time.Now()
		if pengumuman.TanggalMulai != nil && pengumuman.TanggalMulai.After(now) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Pengumuman belum aktif"})
			return
		}
		if pengumuman.TanggalSelesai != nil && pengumuman.TanggalSelesai.Before(now) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Pengumuman sudah tidak aktif"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data": pengumuman,
	})
}

// GetPengumumanAktif mendapatkan pengumuman aktif untuk wali
func (ctrl *PengumumanController) GetPengumumanAktif(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}

	var pengumuman []models.Pengumuman
	var total int64

	// Build query khusus untuk pengumuman aktif dan publik
	now := time.Now()
	query := ctrl.db.Preload("Author").
		Where("tipe = ? AND status = ?", models.PengumumanPublik, models.StatusAktif).
		Where("(tanggal_mulai IS NULL OR tanggal_mulai <= ?) AND (tanggal_selesai IS NULL OR tanggal_selesai >= ?)", now, now)

	// Apply search filter
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("judul LIKE ? OR isi LIKE ?", searchPattern, searchPattern)
	}

	// Hitung total records
	if err := query.Model(&models.Pengumuman{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("tanggal_dibuat DESC").
		Offset(offset).
		Limit(limit).
		Find(&pengumuman).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pengumuman: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": pengumuman,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// UpdatePengumuman mengupdate pengumuman (hanya admin)
func (ctrl *PengumumanController) UpdatePengumuman(c *gin.Context) {
	// Hanya admin yang bisa update
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate pengumuman"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pengumuman diperlukan"})
		return
	}

	var req UpdatePengumumanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek apakah pengumuman exists
	var existingPengumuman models.Pengumuman
	err := ctrl.db.Where("id_pengumuman = ?", id).First(&existingPengumuman).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pengumuman tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pengumuman: " + err.Error()})
		return
	}

	// Update fields
	if req.Judul != "" {
		existingPengumuman.Judul = req.Judul
	}
	if req.Isi != "" {
		existingPengumuman.Isi = req.Isi
	}
	if req.Tipe != "" {
		tipe := models.TipePengumuman(req.Tipe)
		if tipe != models.PengumumanPublik && tipe != models.PengumumanInternal {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tipe tidak valid. Gunakan 'publik' atau 'internal'"})
			return
		}
		existingPengumuman.Tipe = tipe
	}
	if req.Status != "" {
		status := models.StatusPengumuman(req.Status)
		if status != models.StatusAktif && status != models.StatusNonaktif {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'aktif' atau 'nonaktif'"})
			return
		}
		existingPengumuman.Status = status
	}
	if req.TanggalMulai != nil {
		existingPengumuman.TanggalMulai = req.TanggalMulai
	}
	if req.TanggalSelesai != nil {
		existingPengumuman.TanggalSelesai = req.TanggalSelesai
	}

	// Validasi tanggal
	if existingPengumuman.TanggalSelesai != nil && existingPengumuman.TanggalMulai != nil {
		if existingPengumuman.TanggalSelesai.Before(*existingPengumuman.TanggalMulai) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal selesai tidak boleh sebelum tanggal mulai"})
			return
		}
	}

	// Simpan perubahan
	if err := ctrl.db.Save(&existingPengumuman).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate pengumuman: " + err.Error()})
		return
	}

	// Preload author untuk response
	ctrl.db.Preload("Author").First(&existingPengumuman, "id_pengumuman = ?", existingPengumuman.IDPengumuman)

	c.JSON(http.StatusOK, gin.H{
		"message": "Pengumuman berhasil diupdate",
		"data":    existingPengumuman,
	})
}

// DeletePengumuman menghapus pengumuman (hanya admin)
func (ctrl *PengumumanController) DeletePengumuman(c *gin.Context) {
	// Hanya admin yang bisa delete
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus pengumuman"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pengumuman diperlukan"})
		return
	}

	// Cek apakah pengumuman exists
	var pengumuman models.Pengumuman
	err := ctrl.db.Where("id_pengumuman = ?", id).First(&pengumuman).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pengumuman tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pengumuman: " + err.Error()})
		return
	}

	// Hapus pengumuman
	if err := ctrl.db.Where("id_pengumuman = ?", id).Delete(&models.Pengumuman{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus pengumuman: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pengumuman berhasil dihapus",
	})
}

// GetPengumumanSummary mendapatkan summary pengumuman (hanya admin)
func (ctrl *PengumumanController) GetPengumumanSummary(c *gin.Context) {
	// Hanya admin yang bisa akses summary
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengakses summary"})
		return
	}

	// Hitung total pengumuman
	var total int64
	if err := ctrl.db.Model(&models.Pengumuman{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total pengumuman: " + err.Error()})
		return
	}

	// Hitung pengumuman aktif
	var aktif int64
	if err := ctrl.db.Model(&models.Pengumuman{}).Where("status = ?", models.StatusAktif).Count(&aktif).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung pengumuman aktif: " + err.Error()})
		return
	}

	// Hitung pengumuman nonaktif
	var nonaktif int64
	if err := ctrl.db.Model(&models.Pengumuman{}).Where("status = ?", models.StatusNonaktif).Count(&nonaktif).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung pengumuman nonaktif: " + err.Error()})
		return
	}

	// Hitung per tipe
	var publik int64
	if err := ctrl.db.Model(&models.Pengumuman{}).Where("tipe = ?", models.PengumumanPublik).Count(&publik).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung pengumuman publik: " + err.Error()})
		return
	}

	var internal int64
	if err := ctrl.db.Model(&models.Pengumuman{}).Where("tipe = ?", models.PengumumanInternal).Count(&internal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung pengumuman internal: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"total":        total,
			"aktif":        aktif,
			"nonaktif":     nonaktif,
			"publik":       publik,
			"internal":     internal,
		},
	})
}