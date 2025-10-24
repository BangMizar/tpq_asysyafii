package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SyahriahController struct {
	db *gorm.DB
}

func NewSyahriahController(db *gorm.DB) *SyahriahController {
	return &SyahriahController{db: db}
}

// Request structs
type CreateSyahriahRequest struct {
	IDWali  string  `json:"id_wali" binding:"required"`
	Bulan   string  `json:"bulan" binding:"required"` // format YYYY-MM
	Nominal float64 `json:"nominal"`
	Status  string  `json:"status"`
}

type UpdateSyahriahRequest struct {
	Nominal float64 `json:"nominal"`
	Status  string  `json:"status"`
}

type BayarSyahriahRequest struct {
	Status string `json:"status" binding:"required"` // hanya untuk update status menjadi lunas
}

// Helper function untuk check role admin
func (ctrl *SyahriahController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *SyahriahController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

func (ctrl *SyahriahController) updateRekapOtomatis(syahriah models.Syahriah) {
	rekapController := NewRekapController(ctrl.db)
	
	// Parse bulan untuk dapat time.Time
	bulanTime, err := time.Parse("2006-01", syahriah.Bulan)
	if err != nil {
		fmt.Printf("Gagal parse bulan: %v\n", err)
		return
	}
	
	if err := rekapController.UpdateRekapOtomatis(bulanTime); err != nil {
		// Log error tapi jangan gagalkan operasi utama
		fmt.Printf("Gagal update rekap: %v\n", err)
	}
}

// CreateSyahriah membuat data syahriah baru (hanya admin)
func (ctrl *SyahriahController) CreateSyahriah(c *gin.Context) {
	// Hanya admin yang bisa create
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat data syahriah"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req CreateSyahriahRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi format bulan (YYYY-MM)
	_, err := time.Parse("2006-01", req.Bulan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format bulan tidak valid. Gunakan format YYYY-MM"})
		return
	}

	// Cek apakah wali exists
	var wali models.User
	if err := ctrl.db.Where("id_user = ?", req.IDWali).First(&wali).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wali tidak ditemukan"})
		return
	}

	// Cek apakah sudah ada syahriah untuk bulan dan wali yang sama
	var existingSyahriah models.Syahriah
	if err := ctrl.db.Where("id_wali = ? AND bulan = ?", req.IDWali, req.Bulan).First(&existingSyahriah).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Syahriah untuk bulan ini sudah ada"})
		return
	}

	// Set default nominal jika tidak diisi
	if req.Nominal == 0 {
		req.Nominal = 110000 // default value
	}

	// Validasi status
	var status models.StatusSyahriah
	if req.Status != "" {
		status = models.StatusSyahriah(req.Status)
		if status != models.StatusBelum && status != models.StatusLunas {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'belum' atau 'lunas'"})
			return
		}
	} else {
		status = models.StatusBelum // default
	}

	// Buat data syahriah
	syahriah := models.Syahriah{
		IDSyahriah:  uuid.New().String(),
		IDWali:      req.IDWali,
		Bulan:       req.Bulan,
		Nominal:     req.Nominal,
		Status:      status,
		DicatatOleh: adminID,
		WaktuCatat:  time.Now(),
	}

	// Simpan ke database
	if err := ctrl.db.Create(&syahriah).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat data syahriah: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").Preload("Admin").First(&syahriah, "id_syahriah = ?", syahriah.IDSyahriah)

	ctrl.updateRekapOtomatis(syahriah)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Data syahriah berhasil dibuat",
		"data":    syahriah,
	})
}

// GetAllSyahriah mendapatkan semua data syahriah (admin) atau hanya milik sendiri (wali)
func (ctrl *SyahriahController) GetAllSyahriah(c *gin.Context) {
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	bulan := c.Query("bulan")
	status := c.Query("status")
	idWali := c.Query("id_wali") // untuk filter oleh admin

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var syahriah []models.Syahriah
	var total int64

	// Build query
	query := ctrl.db.Preload("Wali").Preload("Admin")

	// Jika user adalah wali, hanya tampilkan data miliknya
	if !ctrl.isAdmin(c) {
		query = query.Where("id_wali = ?", userID)
	} else if idWali != "" {
		// Jika admin dan filter by id_wali
		query = query.Where("id_wali = ?", idWali)
	}

	// Apply filters
	if bulan != "" {
		query = query.Where("bulan = ?", bulan)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Hitung total records
	if err := query.Model(&models.Syahriah{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("bulan DESC, waktu_catat DESC").
		Offset(offset).
		Limit(limit).
		Find(&syahriah).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": syahriah,
		"meta": gin.H{
			"page":      page,
			"limit":     limit,
			"total":     total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetSyahriahByID mendapatkan syahriah berdasarkan ID
func (ctrl *SyahriahController) GetSyahriahByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID syahriah diperlukan"})
		return
	}

	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var syahriah models.Syahriah
	err := ctrl.db.Preload("Wali").Preload("Admin").Where("id_syahriah = ?", id).First(&syahriah).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data syahriah tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	// Authorization: hanya admin atau wali yang bersangkutan yang bisa lihat
	if !ctrl.isAdmin(c) && syahriah.IDWali != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses ke data ini"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": syahriah,
	})
}

// GetMySyahriah mendapatkan data syahriah milik user yang login (untuk wali)
func (ctrl *SyahriahController) GetMySyahriah(c *gin.Context) {
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	bulan := c.Query("bulan")
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var syahriah []models.Syahriah
	var total int64

	// Build query hanya untuk user yang login
	query := ctrl.db.Preload("Wali").Preload("Admin").Where("id_wali = ?", userID)

	// Apply filters
	if bulan != "" {
		query = query.Where("bulan = ?", bulan)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Hitung total records
	if err := query.Model(&models.Syahriah{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("bulan DESC, waktu_catat DESC").
		Offset(offset).
		Limit(limit).
		Find(&syahriah).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": syahriah,
		"meta": gin.H{
			"page":      page,
			"limit":     limit,
			"total":     total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// UpdateSyahriah mengupdate data syahriah (hanya admin)
func (ctrl *SyahriahController) UpdateSyahriah(c *gin.Context) {
	// Hanya admin yang bisa update
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate data syahriah"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID syahriah diperlukan"})
		return
	}

	var req UpdateSyahriahRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek apakah syahriah exists
	var existingSyahriah models.Syahriah
	err := ctrl.db.Where("id_syahriah = ?", id).First(&existingSyahriah).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data syahriah tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	// Update fields
	if req.Nominal > 0 {
		existingSyahriah.Nominal = req.Nominal
	}
	if req.Status != "" {
		status := models.StatusSyahriah(req.Status)
		if status != models.StatusBelum && status != models.StatusLunas {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'belum' atau 'lunas'"})
			return
		}
		existingSyahriah.Status = status
	}

	// Simpan perubahan
	if err := ctrl.db.Save(&existingSyahriah).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate data syahriah: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").Preload("Admin").First(&existingSyahriah, "id_syahriah = ?", existingSyahriah.IDSyahriah)

	ctrl.updateRekapOtomatis(existingSyahriah)

	c.JSON(http.StatusOK, gin.H{
		"message": "Data syahriah berhasil diupdate",
		"data":    existingSyahriah,
	})
}

// BayarSyahriah update status menjadi lunas (bisa oleh wali untuk bayar)
func (ctrl *SyahriahController) BayarSyahriah(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID syahriah diperlukan"})
		return
	}

	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req BayarSyahriahRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi status
	if req.Status != string(models.StatusLunas) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status harus 'lunas' untuk pembayaran"})
		return
	}

	// Cek apakah syahriah exists
	var existingSyahriah models.Syahriah
	err := ctrl.db.Where("id_syahriah = ?", id).First(&existingSyahriah).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data syahriah tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	// Authorization: hanya admin atau wali yang bersangkutan yang bisa bayar
	if !ctrl.isAdmin(c) && existingSyahriah.IDWali != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses untuk melakukan pembayaran ini"})
		return
	}

	// Update status menjadi lunas
	existingSyahriah.Status = models.StatusLunas

	// Simpan perubahan
	if err := ctrl.db.Save(&existingSyahriah).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal melakukan pembayaran: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").Preload("Admin").First(&existingSyahriah, "id_syahriah = ?", existingSyahriah.IDSyahriah)

	ctrl.updateRekapOtomatis(existingSyahriah)

	c.JSON(http.StatusOK, gin.H{
		"message": "Pembayaran syahriah berhasil",
		"data":    existingSyahriah,
	})
}

// DeleteSyahriah menghapus data syahriah (hanya admin)
func (ctrl *SyahriahController) DeleteSyahriah(c *gin.Context) {
	// Hanya admin yang bisa delete
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus data syahriah"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID syahriah diperlukan"})
		return
	}

	// Cek apakah syahriah exists
	var syahriah models.Syahriah
	err := ctrl.db.Where("id_syahriah = ?", id).First(&syahriah).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data syahriah tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	bulan := syahriah.Bulan

	// Hapus syahriah
	if err := ctrl.db.Where("id_syahriah = ?", id).Delete(&models.Syahriah{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data syahriah: " + err.Error()})
		return
	}

	rekapController := NewRekapController(ctrl.db)
	if err := rekapController.UpdateRekapByBulan(bulan); err != nil {
		fmt.Printf("Gagal update rekap: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data syahriah berhasil dihapus",
	})
}

// GetSyahriahSummary mendapatkan summary syahriah
func (ctrl *SyahriahController) GetSyahriahSummary(c *gin.Context) {
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Build query berdasarkan role
	query := ctrl.db.Model(&models.Syahriah{})
	if !ctrl.isAdmin(c) {
		query = query.Where("id_wali = ?", userID)
	}

	// Hitung total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total syahriah: " + err.Error()})
		return
	}

	// Hitung lunas
	var lunas int64
	if err := query.Where("status = ?", models.StatusLunas).Count(&lunas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung syahriah lunas: " + err.Error()})
		return
	}

	// Hitung belum lunas
	var belum int64
	if err := query.Where("status = ?", models.StatusBelum).Count(&belum).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung syahriah belum lunas: " + err.Error()})
		return
	}

	// Total nominal
	var totalNominal float64
	if err := query.Select("COALESCE(SUM(nominal), 0)").Scan(&totalNominal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total nominal: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"total":        total,
			"lunas":        lunas,
			"belum_lunas":  belum,
			"total_nominal": totalNominal,
		},
	})
}

// BatchCreateSyahriah membuat data syahriah untuk semua wali yang belum memiliki data di bulan tertentu
func (ctrl *SyahriahController) BatchCreateSyahriah(c *gin.Context) {
	// Hanya admin yang bisa create batch
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat data syahriah batch"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req struct {
		Bulan   string  `json:"bulan" binding:"required"` // format YYYY-MM
		Nominal float64 `json:"nominal"`
		Status  string  `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi format bulan (YYYY-MM)
	_, err := time.Parse("2006-01", req.Bulan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format bulan tidak valid. Gunakan format YYYY-MM"})
		return
	}

	// Set default nominal jika tidak diisi
	if req.Nominal == 0 {
		req.Nominal = 110000 // default value
	}

	// Validasi status
	var status models.StatusSyahriah
	if req.Status != "" {
		status = models.StatusSyahriah(req.Status)
		if status != models.StatusBelum && status != models.StatusLunas {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'belum' atau 'lunas'"})
			return
		}
	} else {
		status = models.StatusBelum // default
	}

	// Dapatkan semua wali
	var waliList []models.User
	if err := ctrl.db.Where("role = ?", "wali").Find(&waliList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data wali: " + err.Error()})
		return
	}

	if len(waliList) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tidak ada data wali yang tersedia"})
		return
	}

	// Dapatkan wali yang sudah memiliki syahriah di bulan ini
	var existingWali []string
	if err := ctrl.db.Model(&models.Syahriah{}).
		Where("bulan = ?", req.Bulan).
		Pluck("id_wali", &existingWali).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memeriksa data syahriah yang sudah ada: " + err.Error()})
		return
	}

	// Buat map untuk pengecekan cepat
	existingMap := make(map[string]bool)
	for _, id := range existingWali {
		existingMap[id] = true
	}

	// Buat data syahriah untuk wali yang belum memiliki
	var syahriahList []models.Syahriah
	var createdCount int

	for _, wali := range waliList {
		// Skip jika wali sudah memiliki syahriah di bulan ini
		if existingMap[wali.IDUser] {
			continue
		}

		syahriah := models.Syahriah{
			IDSyahriah:  uuid.New().String(),
			IDWali:      wali.IDUser,
			Bulan:       req.Bulan,
			Nominal:     req.Nominal,
			Status:      status,
			DicatatOleh: adminID,
			WaktuCatat:  time.Now(),
		}
		syahriahList = append(syahriahList, syahriah)
		createdCount++
	}

	if len(syahriahList) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": "Semua wali sudah memiliki data syahriah untuk bulan ini",
			"data": gin.H{
				"created": 0,
				"total_wali": len(waliList),
			},
		})
		return
	}

	// Simpan ke database dalam batch
	if err := ctrl.db.CreateInBatches(&syahriahList, 100).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat data syahriah batch: " + err.Error()})
		return
	}

	// Update rekap untuk bulan ini
	rekapController := NewRekapController(ctrl.db)
	bulanTime, _ := time.Parse("2006-01", req.Bulan)
	if err := rekapController.UpdateRekapOtomatis(bulanTime); err != nil {
		fmt.Printf("Gagal update rekap: %v\n", err)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": fmt.Sprintf("Berhasil membuat data syahriah untuk %d wali", createdCount),
		"data": gin.H{
			"created":     createdCount,
			"total_wali": len(waliList),
			"skipped":    len(waliList) - createdCount,
			"bulan":      req.Bulan,
		},
	})
}