package controllers

import (
	"net/http"
	"strconv"
	"strings"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProgramUnggulanController struct {
	db *gorm.DB
}

func NewProgramUnggulanController(db *gorm.DB) *ProgramUnggulanController {
	return &ProgramUnggulanController{db: db}
}

// Helper function untuk check role admin
func (ctrl *ProgramUnggulanController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *ProgramUnggulanController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// Helper function untuk generate slug dari nama program
func generateProgramSlug(namaProgram string) string {
	// Convert to lowercase
	slug := strings.ToLower(namaProgram)
	// Replace spaces with hyphens
	slug = strings.ReplaceAll(slug, " ", "-")
	// Remove special characters (hanya allow alphanumeric dan hyphen)
	var result strings.Builder
	for _, char := range slug {
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-' {
			result.WriteRune(char)
		}
	}
	return result.String()
}

// CreateProgramUnggulan membuat program unggulan baru
func (ctrl *ProgramUnggulanController) CreateProgramUnggulan(c *gin.Context) {
	// Hanya admin yang bisa create program unggulan
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat program unggulan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Manual parsing form data
	namaProgram := c.PostForm("nama_program")
	deskripsi := c.PostForm("deskripsi")
	fitur := c.PostForm("fitur")
	status := c.PostForm("status")

	// Validasi field required
	if namaProgram == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama program harus diisi"})
		return
	}
	if deskripsi == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deskripsi harus diisi"})
		return
	}

	// Generate slug dari nama program
	slug := generateProgramSlug(namaProgram)

	// Validasi status
	var statusEnum string
	if status != "" {
		switch status {
		case "aktif":
			statusEnum = "aktif"
		case "nonaktif":
			statusEnum = "nonaktif"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'aktif' atau 'nonaktif'"})
			return
		}
	} else {
		statusEnum = "aktif" // default
	}

	// Buat program unggulan
	program := models.ProgramUnggulan{
		IDProgram:      uuid.New().String(),
		NamaProgram:    namaProgram,
		Slug:           slug,
		Deskripsi:      deskripsi,
		Fitur:          fitur,
		Status:         statusEnum,
		DiupdateOlehID: &adminID,
	}

	// Simpan ke database
	if err := ctrl.db.Create(&program).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat program unggulan: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&program, "id_program = ?", program.IDProgram)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Program unggulan berhasil dibuat",
		"data":    program,
	})
}

// GetProgramUnggulanByID mendapatkan program unggulan berdasarkan ID
func (ctrl *ProgramUnggulanController) GetProgramUnggulanByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID program unggulan diperlukan"})
		return
	}

	var program models.ProgramUnggulan
	err := ctrl.db.Preload("DiupdateOleh").Where("id_program = ?", id).First(&program).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Program unggulan tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data program unggulan: " + err.Error()})
		return
	}

	// Untuk public access, hanya tampilkan yang aktif
	if !ctrl.isAdmin(c) && program.Status != "aktif" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Program unggulan tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": program,
	})
}

// GetProgramUnggulanBySlug mendapatkan program unggulan berdasarkan slug
func (ctrl *ProgramUnggulanController) GetProgramUnggulanBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Slug program unggulan diperlukan"})
		return
	}

	var program models.ProgramUnggulan
	err := ctrl.db.Preload("DiupdateOleh").Where("slug = ?", slug).First(&program).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Program unggulan tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data program unggulan: " + err.Error()})
		return
	}

	// Untuk user non-admin, hanya bisa lihat yang aktif
	if !ctrl.isAdmin(c) && program.Status != "aktif" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses ke program unggulan ini"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": program,
	})
}

// UpdateProgramUnggulan mengupdate program unggulan
func (ctrl *ProgramUnggulanController) UpdateProgramUnggulan(c *gin.Context) {
	// Hanya admin yang bisa update
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate program unggulan"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID program unggulan diperlukan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah program exists
	var existingProgram models.ProgramUnggulan
	err := ctrl.db.Where("id_program = ?", id).First(&existingProgram).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Program unggulan tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data program unggulan: " + err.Error()})
		return
	}

	// Manual parsing form data
	namaProgram := c.PostForm("nama_program")
	deskripsi := c.PostForm("deskripsi")
	fitur := c.PostForm("fitur")
	status := c.PostForm("status")

	// Update fields
	if namaProgram != "" {
		existingProgram.NamaProgram = namaProgram
		// Generate slug baru jika nama program berubah
		existingProgram.Slug = generateProgramSlug(namaProgram)
	}
	if deskripsi != "" {
		existingProgram.Deskripsi = deskripsi
	}
	if fitur != "" {
		existingProgram.Fitur = fitur
	}
	if status != "" {
		// Validasi status
		switch status {
		case "aktif":
			existingProgram.Status = "aktif"
		case "nonaktif":
			existingProgram.Status = "nonaktif"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'aktif' atau 'nonaktif'"})
			return
		}
	}

	// Update user yang melakukan perubahan
	existingProgram.DiupdateOlehID = &adminID

	// Simpan perubahan
	if err := ctrl.db.Save(&existingProgram).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate program unggulan: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&existingProgram, "id_program = ?", existingProgram.IDProgram)

	c.JSON(http.StatusOK, gin.H{
		"message": "Program unggulan berhasil diupdate",
		"data":    existingProgram,
	})
}

// DeleteProgramUnggulan menghapus program unggulan
func (ctrl *ProgramUnggulanController) DeleteProgramUnggulan(c *gin.Context) {
	// Hanya admin yang bisa delete
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus program unggulan"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID program unggulan diperlukan"})
		return
	}

	// Cek apakah program exists
	var program models.ProgramUnggulan
	err := ctrl.db.Where("id_program = ?", id).First(&program).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Program unggulan tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data program unggulan: " + err.Error()})
		return
	}

	// Hapus program
	if err := ctrl.db.Where("id_program = ?", id).Delete(&models.ProgramUnggulan{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus program unggulan: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Program unggulan berhasil dihapus",
	})
}

// AktifkanProgramUnggulan mengubah status program menjadi aktif
func (ctrl *ProgramUnggulanController) AktifkanProgramUnggulan(c *gin.Context) {
	// Hanya admin yang bisa mengaktifkan
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengaktifkan program unggulan"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID program unggulan diperlukan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah program exists
	var program models.ProgramUnggulan
	err := ctrl.db.Where("id_program = ?", id).First(&program).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Program unggulan tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data program unggulan: " + err.Error()})
		return
	}

	// Update status menjadi aktif
	program.Status = "aktif"
	program.DiupdateOlehID = &adminID

	// Simpan perubahan
	if err := ctrl.db.Save(&program).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengaktifkan program unggulan: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&program, "id_program = ?", program.IDProgram)

	c.JSON(http.StatusOK, gin.H{
		"message": "Program unggulan berhasil diaktifkan",
		"data":    program,
	})
}

// NonaktifkanProgramUnggulan mengubah status program menjadi nonaktif
func (ctrl *ProgramUnggulanController) NonaktifkanProgramUnggulan(c *gin.Context) {
	// Hanya admin yang bisa menonaktifkan
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menonaktifkan program unggulan"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID program unggulan diperlukan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah program exists
	var program models.ProgramUnggulan
	err := ctrl.db.Where("id_program = ?", id).First(&program).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Program unggulan tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data program unggulan: " + err.Error()})
		return
	}

	// Update status menjadi nonaktif
	program.Status = "nonaktif"
	program.DiupdateOlehID = &adminID

	// Simpan perubahan
	if err := ctrl.db.Save(&program).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menonaktifkan program unggulan: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&program, "id_program = ?", program.IDProgram)

	c.JSON(http.StatusOK, gin.H{
		"message": "Program unggulan berhasil dinonaktifkan",
		"data":    program,
	})
}

// GetAllProgramUnggulan mendapatkan semua program unggulan dengan filter (untuk admin)
func (ctrl *ProgramUnggulanController) GetAllProgramUnggulan(c *gin.Context) {
	// Hanya admin yang bisa akses semua data
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengakses semua program unggulan"})
		return
	}

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var programs []models.ProgramUnggulan
	var total int64

	// Build query
	query := ctrl.db.Preload("DiupdateOleh")

	// Apply filters
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("nama_program LIKE ? OR deskripsi LIKE ?", searchTerm, searchTerm)
	}

	// Hitung total records
	if err := query.Model(&models.ProgramUnggulan{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("diperbarui_pada DESC").
		Offset(offset).
		Limit(limit).
		Find(&programs).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data program unggulan: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": programs,
		"meta": gin.H{
			"page":      page,
			"limit":     limit,
			"total":     total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetProgramUnggulanPublic mendapatkan program unggulan untuk public (hanya yang aktif)
func (ctrl *ProgramUnggulanController) GetProgramUnggulanPublic(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 20 {
		limit = 10
	}

	var programs []models.ProgramUnggulan
	var total int64

	// Build query hanya untuk program yang aktif
	query := ctrl.db.Preload("DiupdateOleh").Where("status = ?", "aktif")

	// Apply search filter
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("nama_program LIKE ? OR deskripsi LIKE ?", searchTerm, searchTerm)
	}

	// Hitung total records
	if err := query.Model(&models.ProgramUnggulan{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("diperbarui_pada DESC").
		Offset(offset).
		Limit(limit).
		Find(&programs).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data program unggulan: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": programs,
		"meta": gin.H{
			"page":      page,
			"limit":     limit,
			"total":     total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}