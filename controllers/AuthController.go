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
)

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
		NamaLengkap string `json:"nama_lengkap" binding:"required"`
		Email       *string `json:"email"`
		NoTelp      string `json:"no_telp"`
		Password    string `json:"password" binding:"required"`
		Role        string `json:"role"`
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
		IDUser:        customID,
		NamaLengkap:   input.NamaLengkap,
		Email:         input.Email,
		NoTelp:        input.NoTelp,
		Password:      string(hashedPass),
		Role:          role,
		StatusAktif:   false,
		DibuatPada:    time.Now(),
		DiperbaruiPada: time.Now(),
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal menyimpan user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "registrasi berhasil", "user": user})
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "akun anda tidak aktif, hubungi pengurus TPQ untuk aktivasi akun"})
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
	c.JSON(http.StatusOK, users)
}

func GetUserByID(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, "id_user = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User

	if err := config.DB.First(&user, "id_user = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user tidak ditemukan"})
		return
	}

	var input struct {
		NamaLengkap string `json:"nama_lengkap"`
		Email       *string `json:"email"`
		NoTelp      string `json:"no_telp"`
		Password    string `json:"password"`
		Role        string `json:"role"`
		StatusAktif *bool  `json:"status_aktif"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
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

	c.JSON(http.StatusOK, gin.H{"message": "user berhasil diperbarui", "user": user})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.User{}, "id_user = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal hapus user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user berhasil dihapus"})
}

func GetWali(c *gin.Context) {
	var wali []models.User
	
	// Filter hanya users dengan role wali
	if err := config.DB.Where("role = ?", models.RoleWali).Find(&wali).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal mengambil data wali"})
		return
	}
	
	c.JSON(http.StatusOK, wali)
}