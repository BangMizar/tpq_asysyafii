package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type InformasiTPQController struct {
	db *gorm.DB
}

func NewInformasiTPQController(db *gorm.DB) *InformasiTPQController {
	return &InformasiTPQController{db: db}
}

// Helper function untuk check role admin
func (ctrl *InformasiTPQController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *InformasiTPQController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// Helper function untuk upload logo
func (ctrl *InformasiTPQController) uploadLogo(c *gin.Context) (string, error) {
	file, err := c.FormFile("logo")
	if err != nil {
		return "", err
	}

	// Validasi tipe file
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
		"image/svg+xml": true,
	}

	fileHeader, _ := file.Open()
	defer fileHeader.Close()

	buffer := make([]byte, 512)
	_, err = fileHeader.Read(buffer)
	if err != nil {
		return "", fmt.Errorf("gagal membaca file: %v", err)
	}

	contentType := http.DetectContentType(buffer)
	if !allowedTypes[contentType] {
		return "", fmt.Errorf("tipe file tidak diizinkan. Gunakan JPEG, PNG, GIF, WebP, atau SVG")
	}

	// Validasi ukuran file (max 2MB)
	if file.Size > 2<<20 {
		return "", fmt.Errorf("ukuran file terlalu besar. Maksimal 2MB")
	}

	// Buat nama file unik
	ext := filepath.Ext(file.Filename)
	filename := "logo_" + uuid.New().String() + ext
	
	// Path untuk menyimpan logo
	uploadPath := "./image/tpq/"
	
	// Pastikan folder exists
	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		return "", fmt.Errorf("gagal membuat folder: %v", err)
	}

	// Simpan file
	fullPath := filepath.Join(uploadPath, filename)
	if err := c.SaveUploadedFile(file, fullPath); err != nil {
		return "", fmt.Errorf("gagal menyimpan file: %v", err)
	}

	// Verifikasi file tersimpan
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return "", fmt.Errorf("file gagal disimpan: %v", err)
	}

	return filename, nil
}

// CreateInformasiTPQ membuat informasi TPQ baru
func (ctrl *InformasiTPQController) CreateInformasiTPQ(c *gin.Context) {
	// Hanya admin yang bisa create
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat informasi TPQ"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Manual parsing form data
	namaTPQ := c.PostForm("nama_tpq")
	tempat := c.PostForm("tempat")
	visi := c.PostForm("visi")
	misi := c.PostForm("misi")
	deskripsi := c.PostForm("deskripsi")
	noTelp := c.PostForm("no_telp")
	email := c.PostForm("email")
	alamat := c.PostForm("alamat")
	linkAlamat := c.PostForm("link_alamat")
	hariJamBelajar := c.PostForm("hari_jam_belajar")

	// Validasi field required
	if namaTPQ == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama TPQ harus diisi"})
		return
	}

	// Upload logo jika ada
	var logo *string
	filename, err := ctrl.uploadLogo(c)
	if err != nil && err.Error() != "http: no such file" {
		fmt.Printf("Error upload logo: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if filename != "" {
		logo = &filename
		fmt.Printf("Logo berhasil diupload: %s\n", filename)
	}

	// Buat informasi TPQ
	informasiTPQ := models.InformasiTPQ{
		IDTPQ:          uuid.New().String(),
		NamaTPQ:        namaTPQ,
		Tempat:         &tempat,
		Logo:           logo,
		Visi:           &visi,
		Misi:           &misi,
		Deskripsi:      &deskripsi,
		NoTelp:         &noTelp,
		Email:          &email,
		Alamat:         &alamat,
		LinkAlamat:     &linkAlamat,
		HariJamBelajar: &hariJamBelajar,
		DiupdateOlehID: &adminID,
	}

	// Simpan ke database
	if err := ctrl.db.Create(&informasiTPQ).Error; err != nil {
		// Hapus file yang sudah diupload jika gagal save
		if logo != nil {
			os.Remove("./image/tpq/" + *logo)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat informasi TPQ: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&informasiTPQ, "id_tpq = ?", informasiTPQ.IDTPQ)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Informasi TPQ berhasil dibuat",
		"data":    informasiTPQ,
	})
}

// GetInformasiTPQ mendapatkan informasi TPQ
func (ctrl *InformasiTPQController) GetInformasiTPQ(c *gin.Context) {
	var informasiTPQ models.InformasiTPQ
	
	// Ambil data pertama (asumsi hanya ada satu data informasi TPQ)
	err := ctrl.db.Preload("DiupdateOleh").First(&informasiTPQ).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Informasi TPQ tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data informasi TPQ: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": informasiTPQ,
	})
}

// UpdateInformasiTPQ mengupdate informasi TPQ
func (ctrl *InformasiTPQController) UpdateInformasiTPQ(c *gin.Context) {
	// Hanya admin yang bisa update
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate informasi TPQ"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID informasi TPQ diperlukan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah informasi TPQ exists
	var existingTPQ models.InformasiTPQ
	err := ctrl.db.Where("id_tpq = ?", id).First(&existingTPQ).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Informasi TPQ tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data informasi TPQ: " + err.Error()})
		return
	}

	// Manual parsing form data
	namaTPQ := c.PostForm("nama_tpq")
	tempat := c.PostForm("tempat")
	visi := c.PostForm("visi")
	misi := c.PostForm("misi")
	deskripsi := c.PostForm("deskripsi")
	noTelp := c.PostForm("no_telp")
	email := c.PostForm("email")
	alamat := c.PostForm("alamat")
	linkAlamat := c.PostForm("link_alamat")
	hariJamBelajar := c.PostForm("hari_jam_belajar")

	// Upload logo baru jika ada
	var newLogo *string
	oldLogo := existingTPQ.Logo

	filename, err := ctrl.uploadLogo(c)
	if err != nil && err.Error() != "http: no such file" {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if filename != "" {
		newLogo = &filename
	}

	// Update fields
	if namaTPQ != "" {
		existingTPQ.NamaTPQ = namaTPQ
	}
	if tempat != "" {
		existingTPQ.Tempat = &tempat
	}
	if visi != "" {
		existingTPQ.Visi = &visi
	}
	if misi != "" {
		existingTPQ.Misi = &misi
	}
	if deskripsi != "" {
		existingTPQ.Deskripsi = &deskripsi
	}
	if noTelp != "" {
		existingTPQ.NoTelp = &noTelp
	}
	if email != "" {
		existingTPQ.Email = &email
	}
	if alamat != "" {
		existingTPQ.Alamat = &alamat
	}
	if linkAlamat != "" {
		existingTPQ.LinkAlamat = &linkAlamat
	}
	if hariJamBelajar != "" {
		existingTPQ.HariJamBelajar = &hariJamBelajar
	}
	if newLogo != nil {
		existingTPQ.Logo = newLogo
	}

	// Update user yang mengubah
	existingTPQ.DiupdateOlehID = &adminID

	// Simpan perubahan
	if err := ctrl.db.Save(&existingTPQ).Error; err != nil {
		// Hapus file baru yang sudah diupload jika gagal save
		if newLogo != nil {
			os.Remove("./image/tpq/" + *newLogo)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate informasi TPQ: " + err.Error()})
		return
	}

	// Hapus file logo lama jika ada logo baru
	if newLogo != nil && oldLogo != nil {
		os.Remove("./image/tpq/" + *oldLogo)
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&existingTPQ, "id_tpq = ?", existingTPQ.IDTPQ)

	c.JSON(http.StatusOK, gin.H{
		"message": "Informasi TPQ berhasil diupdate",
		"data":    existingTPQ,
	})
}

// DeleteInformasiTPQ menghapus informasi TPQ
func (ctrl *InformasiTPQController) DeleteInformasiTPQ(c *gin.Context) {
	// Hanya admin yang bisa delete
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus informasi TPQ"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID informasi TPQ diperlukan"})
		return
	}

	// Cek apakah informasi TPQ exists
	var tpq models.InformasiTPQ
	err := ctrl.db.Where("id_tpq = ?", id).First(&tpq).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Informasi TPQ tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data informasi TPQ: " + err.Error()})
		return
	}

	// Hapus file logo jika ada
	if tpq.Logo != nil {
		os.Remove("./image/tpq/" + *tpq.Logo)
	}

	// Hapus informasi TPQ
	if err := ctrl.db.Where("id_tpq = ?", id).Delete(&models.InformasiTPQ{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus informasi TPQ: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Informasi TPQ berhasil dihapus",
	})
}