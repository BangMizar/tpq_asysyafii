package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BeritaController struct {
	db *gorm.DB
}

func NewBeritaController(db *gorm.DB) *BeritaController {
	return &BeritaController{db: db}
}

// Request structs
type CreateBeritaRequest struct {
	Judul           string                  `json:"judul" binding:"required"`
	Konten          string                  `json:"konten" binding:"required"`
	Kategori        models.KategoriBerita   `json:"kategori" binding:"required"`
	Status          models.StatusBerita     `json:"status"`
	GambarCover     *string                 `json:"gambar_cover,omitempty"`
	TanggalPublikasi *time.Time             `json:"tanggal_publikasi,omitempty"`
}

type UpdateBeritaRequest struct {
	Judul           string                  `json:"judul"`
	Konten          string                  `json:"konten"`
	Kategori        models.KategoriBerita   `json:"kategori"`
	Status          models.StatusBerita     `json:"status"`
	GambarCover     *string                 `json:"gambar_cover,omitempty"`
	TanggalPublikasi *time.Time             `json:"tanggal_publikasi,omitempty"`
}

// Helper function untuk check role admin
func (ctrl *BeritaController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *BeritaController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// Helper function untuk generate slug dari judul
func generateSlug(judul string) string {
	// Convert to lowercase
	slug := strings.ToLower(judul)
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

// Helper function untuk upload gambar
func (ctrl *BeritaController) uploadGambar(c *gin.Context) (string, error) {
	file, err := c.FormFile("gambar_cover")
	if err != nil {
		return "", err // Tidak ada file yang diupload, bukan error
	}

	// Validasi tipe file
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
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
		return "", fmt.Errorf("tipe file tidak diizinkan. Gunakan JPEG, PNG, GIF, atau WebP")
	}

	// Validasi ukuran file (max 5MB)
	if file.Size > 5<<20 {
		return "", fmt.Errorf("ukuran file terlalu besar. Maksimal 5MB")
	}

	// Buat nama file unik
	ext := filepath.Ext(file.Filename)
	filename := uuid.New().String() + ext
	uploadPath := "../image/berita/"

	// Pastikan folder exists
	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		return "", fmt.Errorf("gagal membuat folder: %v", err)
	}

	// Simpan file
	fullPath := filepath.Join(uploadPath, filename)
	if err := c.SaveUploadedFile(file, fullPath); err != nil {
		return "", fmt.Errorf("gagal menyimpan file: %v", err)
	}

	return filename, nil
}

// CreateBerita membuat berita baru
func (ctrl *BeritaController) CreateBerita(c *gin.Context) {
	// Hanya admin yang bisa create berita
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat berita"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Handle form data (karena ada file upload)
	var req CreateBeritaRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Upload gambar jika ada
	var gambarCover *string
	if c.GetHeader("Content-Type") == "multipart/form-data" {
		filename, err := ctrl.uploadGambar(c)
		if err != nil && err.Error() != "http: no such file" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if filename != "" {
			gambarCover = &filename
		}
	}

	// Generate slug dari judul
	slug := generateSlug(req.Judul)

	// Validasi kategori
	if req.Kategori != models.KategoriUmum && req.Kategori != models.KategoriPengumuman && req.Kategori != models.KategoriAcara {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori tidak valid. Gunakan 'umum', 'pengumuman', atau 'acara'"})
		return
	}

	// Validasi status
	var status models.StatusBerita
	if req.Status != "" {
		status = req.Status
		if status != models.StatusDraft && status != models.StatusPublished && status != models.StatusArsip {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'draft', 'published', atau 'arsip'"})
			return
		}
	} else {
		status = models.StatusDraft // default
	}

	// Set tanggal publikasi jika status published dan tidak diset manual
	tanggalPublikasi := req.TanggalPublikasi
	if status == models.StatusPublished && tanggalPublikasi == nil {
		now := time.Now()
		tanggalPublikasi = &now
	}

	// Buat berita
	berita := models.Berita{
		IDBerita:        uuid.New().String(),
		Judul:           req.Judul,
		Slug:            slug,
		Konten:          req.Konten,
		Kategori:        req.Kategori,
		Status:          status,
		GambarCover:     gambarCover,
		PenulisID:       adminID,
		TanggalPublikasi: tanggalPublikasi,
	}

	// Simpan ke database
	if err := ctrl.db.Create(&berita).Error; err != nil {
		// Hapus file yang sudah diupload jika gagal save
		if gambarCover != nil {
			os.Remove("../image/berita/" + *gambarCover)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat berita: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Penulis").First(&berita, "id_berita = ?", berita.IDBerita)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Berita berhasil dibuat",
		"data":    berita,
	})
}

// GetAllBerita mendapatkan semua berita dengan filter dan pagination
func (ctrl *BeritaController) GetAllBerita(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	kategori := c.Query("kategori")
	status := c.Query("status")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var berita []models.Berita
	var total int64

	// Build query
	query := ctrl.db.Preload("Penulis")

	// Apply filters
	if kategori != "" {
		query = query.Where("kategori = ?", kategori)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("judul LIKE ? OR konten LIKE ?", searchTerm, searchTerm)
	}

	// Untuk user non-admin, hanya tampilkan yang published
	if !ctrl.isAdmin(c) {
		query = query.Where("status = ?", models.StatusPublished)
	}

	// Hitung total records
	if err := query.Model(&models.Berita{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("dibuat_pada DESC").
		Offset(offset).
		Limit(limit).
		Find(&berita).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": berita,
		"meta": gin.H{
			"page":      page,
			"limit":     limit,
			"total":     total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetBeritaByID mendapatkan berita berdasarkan ID
func (ctrl *BeritaController) GetBeritaByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID berita diperlukan"})
		return
	}

	var berita models.Berita
	err := ctrl.db.Preload("Penulis").Where("id_berita = ?", id).First(&berita).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	// Untuk user non-admin, hanya bisa lihat yang published
	if !ctrl.isAdmin(c) && berita.Status != models.StatusPublished {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses ke berita ini"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": berita,
	})
}

// GetBeritaBySlug mendapatkan berita berdasarkan slug (untuk public access)
func (ctrl *BeritaController) GetBeritaBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Slug berita diperlukan"})
		return
	}

	var berita models.Berita
	err := ctrl.db.Preload("Penulis").Where("slug = ?", slug).First(&berita).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	// Untuk user non-admin, hanya bisa lihat yang published
	if !ctrl.isAdmin(c) && berita.Status != models.StatusPublished {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses ke berita ini"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": berita,
	})
}

// UpdateBerita mengupdate berita (hanya admin)
func (ctrl *BeritaController) UpdateBerita(c *gin.Context) {
	// Hanya admin yang bisa update
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate berita"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID berita diperlukan"})
		return
	}

	// Cek apakah berita exists
	var existingBerita models.Berita
	err := ctrl.db.Where("id_berita = ?", id).First(&existingBerita).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	// Handle form data
	var req UpdateBeritaRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Upload gambar baru jika ada
	var newGambarCover *string
	oldGambarCover := existingBerita.GambarCover

	if c.GetHeader("Content-Type") == "multipart/form-data" {
		filename, err := ctrl.uploadGambar(c)
		if err != nil && err.Error() != "http: no such file" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if filename != "" {
			newGambarCover = &filename
		}
	}

	// Update fields
	if req.Judul != "" {
		existingBerita.Judul = req.Judul
		// Generate slug baru jika judul berubah
		existingBerita.Slug = generateSlug(req.Judul)
	}
	if req.Konten != "" {
		existingBerita.Konten = req.Konten
	}
	if req.Kategori != "" {
		// Validasi kategori
		if req.Kategori != models.KategoriUmum && req.Kategori != models.KategoriPengumuman && req.Kategori != models.KategoriAcara {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori tidak valid. Gunakan 'umum', 'pengumuman', atau 'acara'"})
			return
		}
		existingBerita.Kategori = req.Kategori
	}
	if req.Status != "" {
		// Validasi status
		if req.Status != models.StatusDraft && req.Status != models.StatusPublished && req.Status != models.StatusArsip {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'draft', 'published', atau 'arsip'"})
			return
		}
		existingBerita.Status = req.Status

		// Set tanggal publikasi jika status berubah menjadi published
		if req.Status == models.StatusPublished && existingBerita.TanggalPublikasi == nil {
			now := time.Now()
			existingBerita.TanggalPublikasi = &now
		}
	}
	if newGambarCover != nil {
		existingBerita.GambarCover = newGambarCover
	}
	if req.TanggalPublikasi != nil {
		existingBerita.TanggalPublikasi = req.TanggalPublikasi
	}

	// Simpan perubahan
	if err := ctrl.db.Save(&existingBerita).Error; err != nil {
		// Hapus file baru yang sudah diupload jika gagal save
		if newGambarCover != nil {
			os.Remove("../image/berita/" + *newGambarCover)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate berita: " + err.Error()})
		return
	}

	// Hapus file gambar lama jika ada gambar baru
	if newGambarCover != nil && oldGambarCover != nil {
		os.Remove("../image/berita/" + *oldGambarCover)
	}

	// Preload relations untuk response
	ctrl.db.Preload("Penulis").First(&existingBerita, "id_berita = ?", existingBerita.IDBerita)

	c.JSON(http.StatusOK, gin.H{
		"message": "Berita berhasil diupdate",
		"data":    existingBerita,
	})
}

// DeleteBerita menghapus berita (hanya admin)
func (ctrl *BeritaController) DeleteBerita(c *gin.Context) {
	// Hanya admin yang bisa delete
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus berita"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID berita diperlukan"})
		return
	}

	// Cek apakah berita exists
	var berita models.Berita
	err := ctrl.db.Where("id_berita = ?", id).First(&berita).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	// Hapus file gambar jika ada
	if berita.GambarCover != nil {
		os.Remove("../image/berita/" + *berita.GambarCover)
	}

	// Hapus berita
	if err := ctrl.db.Where("id_berita = ?", id).Delete(&models.Berita{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus berita: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Berita berhasil dihapus",
	})
}

// PublishBerita mengubah status berita menjadi published (hanya admin)
func (ctrl *BeritaController) PublishBerita(c *gin.Context) {
	// Hanya admin yang bisa publish
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mempublish berita"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID berita diperlukan"})
		return
	}

	// Cek apakah berita exists
	var berita models.Berita
	err := ctrl.db.Where("id_berita = ?", id).First(&berita).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	// Update status menjadi published
	berita.Status = models.StatusPublished
	now := time.Now()
	berita.TanggalPublikasi = &now

	// Simpan perubahan
	if err := ctrl.db.Save(&berita).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mempublish berita: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Penulis").First(&berita, "id_berita = ?", berita.IDBerita)

	c.JSON(http.StatusOK, gin.H{
		"message": "Berita berhasil dipublish",
		"data":    berita,
	})
}

// GetBeritaPublic mendapatkan berita untuk public (hanya yang published)
func (ctrl *BeritaController) GetBeritaPublic(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "6"))
	kategori := c.Query("kategori")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 20 {
		limit = 6
	}

	var berita []models.Berita
	var total int64

	// Build query hanya untuk berita yang published
	query := ctrl.db.Preload("Penulis").Where("status = ?", models.StatusPublished)

	// Apply filters
	if kategori != "" {
		query = query.Where("kategori = ?", kategori)
	}
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("judul LIKE ? OR konten LIKE ?", searchTerm, searchTerm)
	}

	// Hitung total records
	if err := query.Model(&models.Berita{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("tanggal_publikasi DESC, dibuat_pada DESC").
		Offset(offset).
		Limit(limit).
		Find(&berita).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": berita,
		"meta": gin.H{
			"page":      page,
			"limit":     limit,
			"total":     total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}