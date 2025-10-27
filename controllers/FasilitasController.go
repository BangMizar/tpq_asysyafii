package controllers

import (
	"net/http"
	"strconv"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FasilitasController struct {
	db *gorm.DB
}

func NewFasilitasController(db *gorm.DB) *FasilitasController {
	return &FasilitasController{db: db}
}

// Helper function untuk check role admin
func (ctrl *FasilitasController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *FasilitasController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// CreateFasilitas membuat fasilitas baru
func (ctrl *FasilitasController) CreateFasilitas(c *gin.Context) {
	// Hanya admin yang bisa create fasilitas
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat fasilitas"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Manual parsing form data
	icon := c.PostForm("icon")
	judul := c.PostForm("judul")
	deskripsi := c.PostForm("deskripsi")
	urutanTampilStr := c.PostForm("urutan_tampil")
	status := c.PostForm("status")

	// Validasi field required
	if icon == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Icon harus diisi"})
		return
	}
	if judul == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Judul harus diisi"})
		return
	}
	if deskripsi == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deskripsi harus diisi"})
		return
	}


	// Parse urutan tampil
	urutanTampil := 0
	if urutanTampilStr != "" {
		parsed, err := strconv.Atoi(urutanTampilStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Urutan tampil harus berupa angka"})
			return
		}
		urutanTampil = parsed
	}

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

	// Buat fasilitas
	fasilitas := models.Fasilitas{
		IDFasilitas:  uuid.New().String(),
		Icon:         icon,
		Judul:        judul,
		Deskripsi:    deskripsi,
		UrutanTampil: urutanTampil,
		Status:       statusEnum,
		DiupdateOlehID: &adminID,
	}

	// Simpan ke database
	if err := ctrl.db.Create(&fasilitas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat fasilitas: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&fasilitas, "id_fasilitas = ?", fasilitas.IDFasilitas)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Fasilitas berhasil dibuat",
		"data":    fasilitas,
	})
}

// GetFasilitasByID mendapatkan fasilitas berdasarkan ID
func (ctrl *FasilitasController) GetFasilitasByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID fasilitas diperlukan"})
		return
	}

	var fasilitas models.Fasilitas
	err := ctrl.db.Preload("DiupdateOleh").Where("id_fasilitas = ?", id).First(&fasilitas).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Fasilitas tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data fasilitas: " + err.Error()})
		return
	}

	// Untuk public access, hanya tampilkan yang aktif
	if !ctrl.isAdmin(c) && fasilitas.Status != "aktif" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Fasilitas tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": fasilitas,
	})
}

// GetFasilitasBySlug mendapatkan fasilitas berdasarkan slug
func (ctrl *FasilitasController) GetFasilitasBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Slug fasilitas diperlukan"})
		return
	}

	var fasilitas models.Fasilitas
	err := ctrl.db.Preload("DiupdateOleh").Where("slug = ?", slug).First(&fasilitas).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Fasilitas tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data fasilitas: " + err.Error()})
		return
	}

	// Untuk user non-admin, hanya bisa lihat yang aktif
	if !ctrl.isAdmin(c) && fasilitas.Status != "aktif" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses ke fasilitas ini"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": fasilitas,
	})
}

// UpdateFasilitas mengupdate fasilitas
func (ctrl *FasilitasController) UpdateFasilitas(c *gin.Context) {
	// Hanya admin yang bisa update
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate fasilitas"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID fasilitas diperlukan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah fasilitas exists
	var existingFasilitas models.Fasilitas
	err := ctrl.db.Where("id_fasilitas = ?", id).First(&existingFasilitas).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Fasilitas tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data fasilitas: " + err.Error()})
		return
	}

	// Manual parsing form data
	icon := c.PostForm("icon")
	judul := c.PostForm("judul")
	deskripsi := c.PostForm("deskripsi")
	urutanTampilStr := c.PostForm("urutan_tampil")
	status := c.PostForm("status")

	// Update fields
	if icon != "" {
		existingFasilitas.Icon = icon
	}
	if judul != "" {
		existingFasilitas.Judul = judul
		// Generate slug baru jika judul berubah
	}
	if deskripsi != "" {
		existingFasilitas.Deskripsi = deskripsi
	}
	if urutanTampilStr != "" {
		urutanTampil, err := strconv.Atoi(urutanTampilStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Urutan tampil harus berupa angka"})
			return
		}
		existingFasilitas.UrutanTampil = urutanTampil
	}
	if status != "" {
		// Validasi status
		switch status {
		case "aktif":
			existingFasilitas.Status = "aktif"
		case "nonaktif":
			existingFasilitas.Status = "nonaktif"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'aktif' atau 'nonaktif'"})
			return
		}
	}

	// Update user yang melakukan perubahan
	existingFasilitas.DiupdateOlehID = &adminID

	// Simpan perubahan
	if err := ctrl.db.Save(&existingFasilitas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate fasilitas: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&existingFasilitas, "id_fasilitas = ?", existingFasilitas.IDFasilitas)

	c.JSON(http.StatusOK, gin.H{
		"message": "Fasilitas berhasil diupdate",
		"data":    existingFasilitas,
	})
}

// DeleteFasilitas menghapus fasilitas
func (ctrl *FasilitasController) DeleteFasilitas(c *gin.Context) {
	// Hanya admin yang bisa delete
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus fasilitas"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID fasilitas diperlukan"})
		return
	}

	// Cek apakah fasilitas exists
	var fasilitas models.Fasilitas
	err := ctrl.db.Where("id_fasilitas = ?", id).First(&fasilitas).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Fasilitas tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data fasilitas: " + err.Error()})
		return
	}

	// Hapus fasilitas
	if err := ctrl.db.Where("id_fasilitas = ?", id).Delete(&models.Fasilitas{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus fasilitas: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Fasilitas berhasil dihapus",
	})
}

// AktifkanFasilitas mengubah status fasilitas menjadi aktif
func (ctrl *FasilitasController) AktifkanFasilitas(c *gin.Context) {
	// Hanya admin yang bisa mengaktifkan
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengaktifkan fasilitas"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID fasilitas diperlukan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah fasilitas exists
	var fasilitas models.Fasilitas
	err := ctrl.db.Where("id_fasilitas = ?", id).First(&fasilitas).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Fasilitas tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data fasilitas: " + err.Error()})
		return
	}

	// Update status menjadi aktif
	fasilitas.Status = "aktif"
	fasilitas.DiupdateOlehID = &adminID

	// Simpan perubahan
	if err := ctrl.db.Save(&fasilitas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengaktifkan fasilitas: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&fasilitas, "id_fasilitas = ?", fasilitas.IDFasilitas)

	c.JSON(http.StatusOK, gin.H{
		"message": "Fasilitas berhasil diaktifkan",
		"data":    fasilitas,
	})
}

// NonaktifkanFasilitas mengubah status fasilitas menjadi nonaktif
func (ctrl *FasilitasController) NonaktifkanFasilitas(c *gin.Context) {
	// Hanya admin yang bisa menonaktifkan
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menonaktifkan fasilitas"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID fasilitas diperlukan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah fasilitas exists
	var fasilitas models.Fasilitas
	err := ctrl.db.Where("id_fasilitas = ?", id).First(&fasilitas).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Fasilitas tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data fasilitas: " + err.Error()})
		return
	}

	// Update status menjadi nonaktif
	fasilitas.Status = "nonaktif"
	fasilitas.DiupdateOlehID = &adminID

	// Simpan perubahan
	if err := ctrl.db.Save(&fasilitas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menonaktifkan fasilitas: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&fasilitas, "id_fasilitas = ?", fasilitas.IDFasilitas)

	c.JSON(http.StatusOK, gin.H{
		"message": "Fasilitas berhasil dinonaktifkan",
		"data":    fasilitas,
	})
}

// GetAllFasilitas mendapatkan semua fasilitas dengan filter (untuk admin)
func (ctrl *FasilitasController) GetAllFasilitas(c *gin.Context) {
	// Hanya admin yang bisa akses semua data
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengakses semua fasilitas"})
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

	var fasilitas []models.Fasilitas
	var total int64

	// Build query
	query := ctrl.db.Preload("DiupdateOleh")

	// Apply filters
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("judul LIKE ? OR deskripsi LIKE ?", searchTerm, searchTerm)
	}

	// Hitung total records
	if err := query.Model(&models.Fasilitas{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("urutan_tampil ASC, diperbarui_pada DESC").
		Offset(offset).
		Limit(limit).
		Find(&fasilitas).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data fasilitas: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": fasilitas,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetFasilitasPublic mendapatkan fasilitas untuk public (hanya yang aktif)
func (ctrl *FasilitasController) GetFasilitasPublic(c *gin.Context) {
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

	var fasilitas []models.Fasilitas
	var total int64

	// Build query hanya untuk fasilitas yang aktif
	query := ctrl.db.Preload("DiupdateOleh").Where("status = ?", "aktif")

	// Apply search filter
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("judul LIKE ? OR deskripsi LIKE ?", searchTerm, searchTerm)
	}

	// Hitung total records
	if err := query.Model(&models.Fasilitas{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination dan urutan
	offset := (page - 1) * limit
	err := query.Order("urutan_tampil ASC, dibuat_pada DESC").
		Offset(offset).
		Limit(limit).
		Find(&fasilitas).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data fasilitas: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": fasilitas,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}