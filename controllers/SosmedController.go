package controllers

import (
	"net/http"
	"strconv"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SosialMediaController struct {
	db *gorm.DB
}

func NewSosialMediaController(db *gorm.DB) *SosialMediaController {
	return &SosialMediaController{db: db}
}

// Helper function untuk check role admin
func (ctrl *SosialMediaController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *SosialMediaController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// CreateSosialMedia membuat sosial media baru
func (ctrl *SosialMediaController) CreateSosialMedia(c *gin.Context) {
	// Hanya admin yang bisa create
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat sosial media"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Bind JSON
	var request struct {
		NamaSosmed string  `json:"nama_sosmed" binding:"required"`
		IconSosmed *string `json:"icon_sosmed,omitempty"`
		LinkSosmed *string `json:"link_sosmed,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
		return
	}

	// Buat sosial media
	sosialMedia := models.SosialMedia{
		IDSosmed:       uuid.New().String(),
		NamaSosmed:     request.NamaSosmed,
		IconSosmed:     request.IconSosmed,
		LinkSosmed:     request.LinkSosmed,
		DiupdateOlehID: &adminID,
	}

	// Simpan ke database
	if err := ctrl.db.Create(&sosialMedia).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat sosial media: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&sosialMedia, "id_sosmed = ?", sosialMedia.IDSosmed)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Sosial media berhasil dibuat",
		"data":    sosialMedia,
	})
}

// GetAllSosialMedia mendapatkan semua sosial media
func (ctrl *SosialMediaController) GetAllSosialMedia(c *gin.Context) {
	var sosialMedia []models.SosialMedia

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var total int64

	// Hitung total records
	if err := ctrl.db.Model(&models.SosialMedia{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := ctrl.db.Preload("DiupdateOleh").
		Order("dibuat_pada DESC").
		Offset(offset).
		Limit(limit).
		Find(&sosialMedia).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data sosial media: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": sosialMedia,
		"meta": gin.H{
			"page":      page,
			"limit":     limit,
			"total":     total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetSosialMediaByID mendapatkan sosial media berdasarkan ID
func (ctrl *SosialMediaController) GetSosialMediaByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID sosial media diperlukan"})
		return
	}

	var sosialMedia models.SosialMedia
	err := ctrl.db.Preload("DiupdateOleh").Where("id_sosmed = ?", id).First(&sosialMedia).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sosial media tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data sosial media: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": sosialMedia,
	})
}

// UpdateSosialMedia mengupdate sosial media
func (ctrl *SosialMediaController) UpdateSosialMedia(c *gin.Context) {
	// Hanya admin yang bisa update
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate sosial media"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID sosial media diperlukan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah sosial media exists
	var existingSosmed models.SosialMedia
	err := ctrl.db.Where("id_sosmed = ?", id).First(&existingSosmed).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sosial media tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data sosial media: " + err.Error()})
		return
	}

	// Bind JSON
	var request struct {
		NamaSosmed string  `json:"nama_sosmed"`
		IconSosmed *string `json:"icon_sosmed,omitempty"`
		LinkSosmed *string `json:"link_sosmed,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
		return
	}

	// Update fields
	if request.NamaSosmed != "" {
		existingSosmed.NamaSosmed = request.NamaSosmed
	}
	if request.IconSosmed != nil {
		existingSosmed.IconSosmed = request.IconSosmed
	}
	if request.LinkSosmed != nil {
		existingSosmed.LinkSosmed = request.LinkSosmed
	}

	// Update user yang mengubah
	existingSosmed.DiupdateOlehID = &adminID

	// Simpan perubahan
	if err := ctrl.db.Save(&existingSosmed).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate sosial media: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&existingSosmed, "id_sosmed = ?", existingSosmed.IDSosmed)

	c.JSON(http.StatusOK, gin.H{
		"message": "Sosial media berhasil diupdate",
		"data":    existingSosmed,
	})
}

// DeleteSosialMedia menghapus sosial media
func (ctrl *SosialMediaController) DeleteSosialMedia(c *gin.Context) {
	// Hanya admin yang bisa delete
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus sosial media"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID sosial media diperlukan"})
		return
	}

	// Cek apakah sosial media exists
	var sosmed models.SosialMedia
	err := ctrl.db.Where("id_sosmed = ?", id).First(&sosmed).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sosial media tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data sosial media: " + err.Error()})
		return
	}

	// Hapus sosial media
	if err := ctrl.db.Where("id_sosmed = ?", id).Delete(&models.SosialMedia{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus sosial media: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Sosial media berhasil dihapus",
	})
}