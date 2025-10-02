package controllers

import (
	"net/http"
	"time"
	"fmt"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"tpq_asysyafii/config" 
	"tpq_asysyafii/models"
	"tpq_asysyafii/utils"
	"tpq_asysyafii/services"
)

var logService = services.NewLogService(config.DB)

// Helper function untuk get user ID dari context
func getUserIDFromContext(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// Helper function untuk check admin role
func isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == string(models.RoleAdmin) || role == string(models.RoleSuperAdmin)
}

func generateCustomID(role models.UserRole) (string, error) {
	var prefix string
	switch role {
	case models.RoleAdmin:
		prefix = "A"
	case models.RoleSuperAdmin:
		prefix = "SA"
	case models.RoleWali:
		prefix = "W"
	default:
		return "", fmt.Errorf("role tidak valid")
	}

	// Cari ID terakhir untuk role tersebut
	var lastUser models.User
	err := config.DB.Where("id_user LIKE ?", prefix + "%").Order("id_user DESC").First(&lastUser).Error
	
	var nextNumber int
	if err != nil {
		// Jika tidak ada data sebelumnya, mulai dari 1
		nextNumber = 1
	} else {
		// Ekstrak angka dari ID terakhir dan increment
		var lastNumber int
		if role == models.RoleSuperAdmin {
			fmt.Sscanf(lastUser.IDUser, "SA%d", &lastNumber)
		} else {
			fmt.Sscanf(lastUser.IDUser, prefix + "%d", &lastNumber)
		}
		nextNumber = lastNumber + 1
	}

	// Format ID berdasarkan role
	var customID string
	switch role {
	case models.RoleSuperAdmin:
		customID = fmt.Sprintf("SA%02d", nextNumber)
	case models.RoleAdmin:
		customID = fmt.Sprintf("A%03d", nextNumber)
	case models.RoleWali:
		customID = fmt.Sprintf("W%03d", nextNumber)
	}

	return customID, nil
}

func RegisterUser(c *gin.Context) {
	var input struct {
		NamaLengkap string  `json:"nama_lengkap" binding:"required"`
		Email       *string `json:"email"`
		NoTelp      string  `json:"no_telp"`
		Password    string  `json:"password" binding:"required"`
		Role        string  `json:"role"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPass, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal enkripsi password"})
		return
	}

	// Default role = wali
	role := models.RoleWali
	if input.Role == string(models.RoleAdmin) || input.Role == string(models.RoleSuperAdmin) {
		role = models.UserRole(input.Role)
	}

	// Generate custom ID
	customID, err := generateCustomID(role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal generate ID user"})
		return
	}

	user := models.User{
		IDUser:         customID,
		NamaLengkap:    input.NamaLengkap,
		Email:          input.Email,
		NoTelp:         input.NoTelp,
		Password:       string(hashedPass),
		Role:           role,
		StatusAktif:    true,
		DibuatPada:     time.Now(),
		DiperbaruiPada: time.Now(),
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal menyimpan user"})
		return
	}

	// ✅ AUTO LOG: Jika register dilakukan oleh admin, catat aktivitas
	if adminID, exists := getUserIDFromContext(c); exists && isAdmin(c) {
		keterangan := "Membuat user baru: " + user.NamaLengkap + " dengan role: " + string(user.Role)
		logService.LogAktivitas(adminID, services.AksiCreate, services.TargetUser, user.IDUser, keterangan)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "registrasi berhasil", 
		"user": gin.H{
			"id_user":      user.IDUser,
			"nama_lengkap": user.NamaLengkap,
			"email":        user.Email,
			"no_telp":      user.NoTelp,
			"role":         user.Role,
			"status_aktif": user.StatusAktif,
		},
	})
}

func LoginUser(c *gin.Context) {
	var input struct {
		Email       *string `json:"email"`
		NamaLengkap string  `json:"nama_lengkap"`
		NoTelp      string  `json:"no_telp"`
		Password    string  `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	var err error

	// Cari user berdasarkan email, nama lengkap, atau no telp
	query := config.DB
	if input.Email != nil && *input.Email != "" {
		query = query.Where("email = ?", *input.Email)
	} else if input.NamaLengkap != "" {
		query = query.Where("nama_lengkap = ?", input.NamaLengkap)
	} else if input.NoTelp != "" {
		query = query.Where("no_telp = ?", input.NoTelp)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "masukkan email, nama_lengkap, atau no_telp"})
		return
	}

	err = query.First(&user).Error

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user tidak ditemukan"})
		return
	}

	// Periksa status aktif user
	if !user.StatusAktif {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "akun tidak aktif"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "password salah"})
		return
	}

	token, err := utils.GenerateJWT(user.IDUser, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal generate token"})
		return
	}

	// ✅ AUTO LOG: Catat aktivitas login
	keterangan := "Login ke sistem"
	logService.LogAktivitas(user.IDUser, services.AksiLogin, "SYSTEM", "", keterangan)

	c.JSON(http.StatusOK, gin.H{
		"message": "login berhasil",
		"token":   token,
		"user": gin.H{
			"id_user":      user.IDUser,
			"nama_lengkap": user.NamaLengkap,
			"email":        user.Email,
			"no_telp":      user.NoTelp,
			"role":         user.Role,
		},
	})
}

func GetUsers(c *gin.Context) {
	var users []models.User
	if err := config.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal mengambil data"})
		return
	}

	// Sembunyikan password dari response
	var safeUsers []gin.H
	for _, user := range users {
		safeUsers = append(safeUsers, gin.H{
			"id_user":       user.IDUser,
			"nama_lengkap":  user.NamaLengkap,
			"email":         user.Email,
			"no_telp":       user.NoTelp,
			"role":          user.Role,
			"status_aktif":  user.StatusAktif,
			"dibuat_pada":   user.DibuatPada,
			"diperbarui_pada": user.DiperbaruiPada,
		})
	}

	c.JSON(http.StatusOK, safeUsers)
}

func GetUserByID(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, "id_user = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user tidak ditemukan"})
		return
	}

	// Sembunyikan password dari response
	safeUser := gin.H{
		"id_user":       user.IDUser,
		"nama_lengkap":  user.NamaLengkap,
		"email":         user.Email,
		"no_telp":       user.NoTelp,
		"role":          user.Role,
		"status_aktif":  user.StatusAktif,
		"dibuat_pada":   user.DibuatPada,
		"diperbarui_pada": user.DiperbaruiPada,
	}

	c.JSON(http.StatusOK, safeUser)
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User

	if err := config.DB.First(&user, "id_user = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user tidak ditemukan"})
		return
	}

	var input struct {
		NamaLengkap string  `json:"nama_lengkap"`
		Email       *string `json:"email"`
		NoTelp      string  `json:"no_telp"`
		Password    string  `json:"password"`
		Role        string  `json:"role"`
		StatusAktif *bool   `json:"status_aktif"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Simpan data lama untuk log
	dataLama := gin.H{
		"nama_lengkap": user.NamaLengkap,
		"email":        user.Email,
		"no_telp":      user.NoTelp,
		"role":         user.Role,
		"status_aktif": user.StatusAktif,
	}

	// Jika role diubah, generate ID baru
	if input.Role != "" && input.Role != string(user.Role) {
		newRole := models.UserRole(input.Role)
		newID, err := generateCustomID(newRole)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal generate ID user baru"})
			return
		}
		user.IDUser = newID
		user.Role = newRole
	}

	if input.NamaLengkap != "" {
		user.NamaLengkap = input.NamaLengkap
	}
	if input.Email != nil {
		user.Email = input.Email
	}
	if input.NoTelp != "" {
		user.NoTelp = input.NoTelp
	}
	if input.Password != "" {
		hashedPass, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		user.Password = string(hashedPass)
	}
	if input.StatusAktif != nil {
		user.StatusAktif = *input.StatusAktif
	}

	user.DiperbaruiPada = time.Now()

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal update user"})
		return
	}

	// ✅ AUTO LOG: Catat aktivitas update user
	if adminID, exists := getUserIDFromContext(c); exists {
		keterangan := fmt.Sprintf("Update user: %s -> %s (Role: %s -> %s)", 
			dataLama["nama_lengkap"], user.NamaLengkap, 
			dataLama["role"], user.Role)
		logService.LogAktivitas(adminID, services.AksiUpdate, services.TargetUser, user.IDUser, keterangan)
	}

	// Sembunyikan password dari response
	safeUser := gin.H{
		"id_user":       user.IDUser,
		"nama_lengkap":  user.NamaLengkap,
		"email":         user.Email,
		"no_telp":       user.NoTelp,
		"role":          user.Role,
		"status_aktif":  user.StatusAktif,
		"diperbarui_pada": user.DiperbaruiPada,
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "user berhasil diperbarui", 
		"user": safeUser,
	})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	
	// Cari user terlebih dahulu untuk log
	var user models.User
	if err := config.DB.First(&user, "id_user = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user tidak ditemukan"})
		return
	}

	// ✅ AUTO LOG: Catat sebelum hapus
	if adminID, exists := getUserIDFromContext(c); exists {
		keterangan := "Menghapus user: " + user.NamaLengkap + " (" + string(user.Role) + ")"
		logService.LogAktivitas(adminID, services.AksiDelete, services.TargetUser, id, keterangan)
	}

	// Hapus user
	if err := config.DB.Delete(&models.User{}, "id_user = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal hapus user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user berhasil dihapus"})
}