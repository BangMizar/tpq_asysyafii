package controllers

import (
	"net/http"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type KeluargaController struct {
	db *gorm.DB
}

func NewKeluargaController(db *gorm.DB) *KeluargaController {
	return &KeluargaController{db: db}
}

// Request structs
type CreateKeluargaRequest struct {
	IDWali    string `json:"id_wali"` // Opsional, akan diisi otomatis dari token
	NoKK      string `json:"no_kk" binding:"required"`
	Alamat    string `json:"alamat" binding:"required"`
	RTRW      string `json:"rt_rw"`
	Kelurahan string `json:"kelurahan"`
	Kecamatan string `json:"kecamatan"`
	Kota      string `json:"kota"`
	Provinsi  string `json:"provinsi"`
	KodePos   string `json:"kode_pos"`
}

type UpdateKeluargaRequest struct {
	NoKK      string `json:"no_kk"`
	Alamat    string `json:"alamat"`
	RTRW      string `json:"rt_rw"`
	Kelurahan string `json:"kelurahan"`
	Kecamatan string `json:"kecamatan"`
	Kota      string `json:"kota"`
	Provinsi  string `json:"provinsi"`
	KodePos   string `json:"kode_pos"`
}

// Helper function untuk get user ID dari context
func (ctrl *KeluargaController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// CreateKeluarga membuat data keluarga baru
func (ctrl *KeluargaController) CreateKeluarga(c *gin.Context) {
	// Get user ID dari token
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req CreateKeluargaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Jika IDWali kosong, gunakan user ID dari token
	if req.IDWali == "" {
		req.IDWali = userID
	}

	// Cek apakah NoKK sudah ada
	var existingKeluarga models.Keluarga
	if err := ctrl.db.Where("no_kk = ?", req.NoKK).First(&existingKeluarga).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No KK sudah terdaftar"})
		return
	}

	// Cek apakah wali exists
	var wali models.User
	if err := ctrl.db.Where("id_user = ?", req.IDWali).First(&wali).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wali tidak ditemukan"})
		return
	}

	// Buat data keluarga
	keluarga := models.Keluarga{
		IDKeluarga: uuid.New().String(),
		IDWali:     req.IDWali,
		NoKK:       req.NoKK,
		Alamat:     req.Alamat,
		RTRW:       req.RTRW,
		Kelurahan:  req.Kelurahan,
		Kecamatan:  req.Kecamatan,
		Kota:       req.Kota,
		Provinsi:   req.Provinsi,
		KodePos:    req.KodePos,
	}

	// Simpan ke database
	if err := ctrl.db.Create(&keluarga).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat data keluarga: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").Preload("AnggotaKeluarga").First(&keluarga, "id_keluarga = ?", keluarga.IDKeluarga)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Data keluarga berhasil dibuat",
		"data":    keluarga,
	})
}

// GetKeluargaByID mendapatkan keluarga berdasarkan ID
func (ctrl *KeluargaController) GetKeluargaByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID keluarga diperlukan"})
		return
	}

	var keluarga models.Keluarga
	err := ctrl.db.Preload("Wali").Preload("AnggotaKeluarga").Where("id_keluarga = ?", id).First(&keluarga).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data keluarga tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data keluarga: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": keluarga,
	})
}

// GetKeluargaByWali mendapatkan keluarga berdasarkan ID wali
func (ctrl *KeluargaController) GetKeluargaByWali(c *gin.Context) {
	idWali := c.Param("id_wali")
	if idWali == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID wali diperlukan"})
		return
	}

	var keluarga models.Keluarga
	err := ctrl.db.Preload("Wali").Preload("AnggotaKeluarga").
		Where("id_wali = ?", idWali).
		First(&keluarga).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data keluarga tidak ditemukan untuk wali ini"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data keluarga: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": keluarga,
	})
}

// GetMyKeluarga mendapatkan data keluarga dari user yang sedang login
func (ctrl *KeluargaController) GetMyKeluarga(c *gin.Context) {
	// Get user ID dari token
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var keluarga models.Keluarga
	err := ctrl.db.Preload("Wali").Preload("AnggotaKeluarga").
		Where("id_wali = ?", userID).
		First(&keluarga).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data keluarga tidak ditemukan untuk akun Anda"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data keluarga: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": keluarga,
	})
}

// GetAllKeluarga mendapatkan semua data keluarga (untuk admin)
func (ctrl *KeluargaController) GetAllKeluarga(c *gin.Context) {
	var keluarga []models.Keluarga

	err := ctrl.db.Preload("Wali").Preload("AnggotaKeluarga").
		Find(&keluarga).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data keluarga: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": keluarga,
	})
}

// UpdateKeluarga mengupdate data keluarga
func (ctrl *KeluargaController) UpdateKeluarga(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID keluarga diperlukan"})
		return
	}

	// Get user ID dari token untuk authorization check
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req UpdateKeluargaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek apakah keluarga exists
	var existingKeluarga models.Keluarga
	err := ctrl.db.Where("id_keluarga = ?", id).First(&existingKeluarga).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data keluarga tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data keluarga: " + err.Error()})
		return
	}

	// Authorization check: hanya wali yang bersangkutan atau admin yang bisa update
	userRole, _ := c.Get("role")
	role := userRole.(string)
	
	if existingKeluarga.IDWali != userID && role != "admin" && role != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses untuk mengupdate data keluarga ini"})
		return
	}

	// Cek jika NoKK diubah dan sudah ada
	if req.NoKK != "" && req.NoKK != existingKeluarga.NoKK {
		var keluargaWithNoKK models.Keluarga
		if err := ctrl.db.Where("no_kk = ?", req.NoKK).First(&keluargaWithNoKK).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No KK sudah digunakan oleh keluarga lain"})
			return
		}
		existingKeluarga.NoKK = req.NoKK
	}

	// Update fields
	if req.Alamat != "" {
		existingKeluarga.Alamat = req.Alamat
	}
	if req.RTRW != "" {
		existingKeluarga.RTRW = req.RTRW
	}
	if req.Kelurahan != "" {
		existingKeluarga.Kelurahan = req.Kelurahan
	}
	if req.Kecamatan != "" {
		existingKeluarga.Kecamatan = req.Kecamatan
	}
	if req.Kota != "" {
		existingKeluarga.Kota = req.Kota
	}
	if req.Provinsi != "" {
		existingKeluarga.Provinsi = req.Provinsi
	}
	if req.KodePos != "" {
		existingKeluarga.KodePos = req.KodePos
	}

	// Simpan perubahan
	if err := ctrl.db.Save(&existingKeluarga).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate data keluarga: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").Preload("AnggotaKeluarga").First(&existingKeluarga, "id_keluarga = ?", existingKeluarga.IDKeluarga)

	c.JSON(http.StatusOK, gin.H{
		"message": "Data keluarga berhasil diupdate",
		"data":    existingKeluarga,
	})
}

// DeleteKeluarga menghapus data keluarga
func (ctrl *KeluargaController) DeleteKeluarga(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID keluarga diperlukan"})
		return
	}

	// Get user ID dari token untuk authorization check
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah keluarga exists
	var keluarga models.Keluarga
	err := ctrl.db.Where("id_keluarga = ?", id).First(&keluarga).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data keluarga tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data keluarga: " + err.Error()})
		return
	}

	// Authorization check: hanya wali yang bersangkutan atau admin yang bisa delete
	userRole, _ := c.Get("role")
	role := userRole.(string)
	
	if keluarga.IDWali != userID && role != "admin" && role != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses untuk menghapus data keluarga ini"})
		return
	}

	// Hapus keluarga
	if err := ctrl.db.Where("id_keluarga = ?", id).Delete(&models.Keluarga{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data keluarga: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data keluarga berhasil dihapus",
	})
}

// SearchKeluarga mencari keluarga berdasarkan filter
func (ctrl *KeluargaController) SearchKeluarga(c *gin.Context) {
	noKK := c.Query("no_kk")
	kelurahan := c.Query("kelurahan")
	kecamatan := c.Query("kecamatan")
	kota := c.Query("kota")

	query := ctrl.db.Preload("Wali").Preload("AnggotaKeluarga")

	if noKK != "" {
		query = query.Where("no_kk LIKE ?", "%"+noKK+"%")
	}
	if kelurahan != "" {
		query = query.Where("kelurahan LIKE ?", "%"+kelurahan+"%")
	}
	if kecamatan != "" {
		query = query.Where("kecamatan LIKE ?", "%"+kecamatan+"%")
	}
	if kota != "" {
		query = query.Where("kota LIKE ?", "%"+kota+"%")
	}

	var keluarga []models.Keluarga
	if err := query.Find(&keluarga).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencari data keluarga: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": keluarga,
	})
}