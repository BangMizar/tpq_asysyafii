package controllers

import (
	"net/http"
	"strconv"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TestimoniController struct {
	db *gorm.DB
}

func NewTestimoniController(db *gorm.DB) *TestimoniController {
	return &TestimoniController{db: db}
}

// Helper function untuk check role admin
func (ctrl *TestimoniController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *TestimoniController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// CreateTestimoni membuat testimoni baru
func (ctrl *TestimoniController) CreateTestimoni(c *gin.Context) {
	// Get user ID dari token (wali yang membuat testimoni)
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Manual parsing form data
	komentar := c.PostForm("komentar")
	ratingStr := c.PostForm("rating")
	status := c.PostForm("status")

	// Validasi field required
	if komentar == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Komentar harus diisi"})
		return
	}
	if ratingStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rating harus diisi"})
		return
	}

	// Parse rating
	rating, err := strconv.Atoi(ratingStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rating harus berupa angka"})
		return
	}

	// Validasi rating range (1-5)
	if rating < 1 || rating > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rating harus antara 1 sampai 5"})
		return
	}

	// Validasi status
	var statusEnum string
	if status != "" {
		switch status {
		case "show":
			statusEnum = "show"
		case "hide":
			statusEnum = "hide"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'show' atau 'hide'"})
			return
		}
	} else {
		statusEnum = "show" // default
	}

	// Cek apakah user sudah pernah memberikan testimoni
	var existingTestimoni models.Testimoni
	err = ctrl.db.Where("id_wali = ?", userID).First(&existingTestimoni).Error
	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anda sudah memberikan testimoni sebelumnya"})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memeriksa testimoni: " + err.Error()})
		return
	}

	// Buat testimoni
	testimoni := models.Testimoni{
		IDTestimoni: uuid.New().String(),
		IdWali:      userID,
		Komentar:    komentar,
		Rating:      rating,
		Status:      statusEnum,
	}

	// Simpan ke database
	if err := ctrl.db.Create(&testimoni).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat testimoni: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").Preload("DiupdateOleh").First(&testimoni, "id_testimoni = ?", testimoni.IDTestimoni)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Testimoni berhasil dibuat",
		"data":    testimoni,
	})
}

// GetTestimoniByID mendapatkan testimoni berdasarkan ID
func (ctrl *TestimoniController) GetTestimoniByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID testimoni diperlukan"})
		return
	}

	var testimoni models.Testimoni
	err := ctrl.db.Preload("Wali").Preload("DiupdateOleh").Where("id_testimoni = ?", id).First(&testimoni).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Testimoni tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data testimoni: " + err.Error()})
		return
	}

	// Untuk public access, hanya tampilkan yang status show
	if !ctrl.isAdmin(c) && testimoni.Status != "show" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Testimoni tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": testimoni,
	})
}

// UpdateTestimoni mengupdate testimoni
func (ctrl *TestimoniController) UpdateTestimoni(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID testimoni diperlukan"})
		return
	}

	// Get user ID dari token
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah testimoni exists
	var existingTestimoni models.Testimoni
	err := ctrl.db.Preload("Wali").Where("id_testimoni = ?", id).First(&existingTestimoni).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Testimoni tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data testimoni: " + err.Error()})
		return
	}

	// Cek authorization: hanya admin atau pemilik testimoni yang bisa update
	if !ctrl.isAdmin(c) && existingTestimoni.IdWali != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses untuk mengupdate testimoni ini"})
		return
	}

	// Manual parsing form data
	komentar := c.PostForm("komentar")
	ratingStr := c.PostForm("rating")
	status := c.PostForm("status")

	// Update fields
	if komentar != "" {
		existingTestimoni.Komentar = komentar
	}
	if ratingStr != "" {
		rating, err := strconv.Atoi(ratingStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Rating harus berupa angka"})
			return
		}
		// Validasi rating range (1-5)
		if rating < 1 || rating > 5 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Rating harus antara 1 sampai 5"})
			return
		}
		existingTestimoni.Rating = rating
	}

	// Hanya admin yang bisa mengubah status
	if status != "" && ctrl.isAdmin(c) {
		// Validasi status
		switch status {
		case "show":
			existingTestimoni.Status = "show"
		case "hide":
			existingTestimoni.Status = "hide"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'show' atau 'hide'"})
			return
		}
	}

	// Set diupdate_oleh_id hanya jika admin yang mengupdate
	if ctrl.isAdmin(c) {
		existingTestimoni.DiupdateOlehID = &userID
	}

	// Simpan perubahan
	if err := ctrl.db.Save(&existingTestimoni).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate testimoni: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").Preload("DiupdateOleh").First(&existingTestimoni, "id_testimoni = ?", existingTestimoni.IDTestimoni)

	c.JSON(http.StatusOK, gin.H{
		"message": "Testimoni berhasil diupdate",
		"data":    existingTestimoni,
	})
}

// DeleteTestimoni menghapus testimoni
func (ctrl *TestimoniController) DeleteTestimoni(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID testimoni diperlukan"})
		return
	}

	// Get user ID dari token
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah testimoni exists
	var testimoni models.Testimoni
	err := ctrl.db.Where("id_testimoni = ?", id).First(&testimoni).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Testimoni tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data testimoni: " + err.Error()})
		return
	}

	// Cek authorization: hanya admin atau pemilik testimoni yang bisa hapus
	if !ctrl.isAdmin(c) && testimoni.IdWali != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses untuk menghapus testimoni ini"})
		return
	}

	// Hapus testimoni
	if err := ctrl.db.Where("id_testimoni = ?", id).Delete(&models.Testimoni{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus testimoni: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Testimoni berhasil dihapus",
	})
}

// ShowTestimoni mengubah status testimoni menjadi show (hanya admin)
func (ctrl *TestimoniController) ShowTestimoni(c *gin.Context) {
	// Hanya admin yang bisa mengubah status
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengubah status testimoni"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID testimoni diperlukan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah testimoni exists
	var testimoni models.Testimoni
	err := ctrl.db.Where("id_testimoni = ?", id).First(&testimoni).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Testimoni tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data testimoni: " + err.Error()})
		return
	}

	// Update status menjadi show
	testimoni.Status = "show"
	testimoni.DiupdateOlehID = &adminID

	// Simpan perubahan
	if err := ctrl.db.Save(&testimoni).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengubah status testimoni: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").Preload("DiupdateOleh").First(&testimoni, "id_testimoni = ?", testimoni.IDTestimoni)

	c.JSON(http.StatusOK, gin.H{
		"message": "Testimoni berhasil ditampilkan",
		"data":    testimoni,
	})
}

// HideTestimoni mengubah status testimoni menjadi hide (hanya admin)
func (ctrl *TestimoniController) HideTestimoni(c *gin.Context) {
	// Hanya admin yang bisa mengubah status
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengubah status testimoni"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID testimoni diperlukan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah testimoni exists
	var testimoni models.Testimoni
	err := ctrl.db.Where("id_testimoni = ?", id).First(&testimoni).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Testimoni tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data testimoni: " + err.Error()})
		return
	}

	// Update status menjadi hide
	testimoni.Status = "hide"
	testimoni.DiupdateOlehID = &adminID

	// Simpan perubahan
	if err := ctrl.db.Save(&testimoni).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengubah status testimoni: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").Preload("DiupdateOleh").First(&testimoni, "id_testimoni = ?", testimoni.IDTestimoni)

	c.JSON(http.StatusOK, gin.H{
		"message": "Testimoni berhasil disembunyikan",
		"data":    testimoni,
	})
}

// GetAllTestimoni mendapatkan semua testimoni dengan filter (untuk admin)
func (ctrl *TestimoniController) GetAllTestimoni(c *gin.Context) {
	// Hanya admin yang bisa akses semua data
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengakses semua testimoni"})
		return
	}

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	search := c.Query("search")
	rating := c.Query("rating")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var testimoni []models.Testimoni
	var total int64

	// Build query
	query := ctrl.db.Preload("Wali").Preload("DiupdateOleh")

	// Apply filters
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if rating != "" {
		ratingInt, err := strconv.Atoi(rating)
		if err == nil {
			query = query.Where("rating = ?", ratingInt)
		}
	}
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Joins("JOIN user ON testimoni.id_wali = user.id_user").
			Where("testimoni.komentar LIKE ? OR user.nama LIKE ?", searchTerm, searchTerm)
	}

	// Hitung total records
	if err := query.Model(&models.Testimoni{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("dibuat_pada DESC").
		Offset(offset).
		Limit(limit).
		Find(&testimoni).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data testimoni: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": testimoni,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetTestimoniPublic mendapatkan testimoni untuk public (hanya yang status show)
func (ctrl *TestimoniController) GetTestimoniPublic(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	rating := c.Query("rating")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 20 {
		limit = 10
	}

	var testimoni []models.Testimoni
	var total int64

	// Build query hanya untuk testimoni yang status show
	query := ctrl.db.Preload("Wali").Where("status = ?", "show")

	// Apply rating filter
	if rating != "" {
		ratingInt, err := strconv.Atoi(rating)
		if err == nil && ratingInt >= 1 && ratingInt <= 5 {
			query = query.Where("rating = ?", ratingInt)
		}
	}

	// Hitung total records
	if err := query.Model(&models.Testimoni{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination dan urutan
	offset := (page - 1) * limit
	err := query.Order("rating DESC, dibuat_pada DESC").
		Offset(offset).
		Limit(limit).
		Find(&testimoni).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data testimoni: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": testimoni,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetMyTestimoni mendapatkan testimoni milik user yang login
func (ctrl *TestimoniController) GetMyTestimoni(c *gin.Context) {
	// Get user ID dari token
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var testimoni models.Testimoni
	err := ctrl.db.Preload("Wali").Preload("DiupdateOleh").
		Where("id_wali = ?", userID).
		First(&testimoni).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Anda belum membuat testimoni"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data testimoni: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": testimoni,
	})
}