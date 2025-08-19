package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"tpq_asysyafii/models"
	"tpq_asysyafii/utils"
)

func RegisterUser(c *gin.Context) {
	var input struct {
		NamaLengkap string `json:"nama_lengkap" binding:"required"`
		Email       string `json:"email" binding:"required,email"`
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

	user := models.User{
		IDUser:        uuid.New().String(),
		NamaLengkap:   input.NamaLengkap,
		Email:         input.Email,
		NoTelp:        input.NoTelp,
		Password:      string(hashedPass),
		Role:          role,
		StatusAktif:   true,
		DibuatPada:    time.Now(),
		DiperbaruiPada: time.Now(),
	}

	if err := models.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal menyimpan user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "registrasi berhasil", "user": user})
}

func LoginUser(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := models.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "email tidak ditemukan"})
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
			"role":         user.Role,
		},
	})
}

func GetUsers(c *gin.Context) {
	var users []models.User
	if err := models.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal mengambil data"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func GetUserByID(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := models.DB.First(&user, "id_user = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User

	if err := models.DB.First(&user, "id_user = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user tidak ditemukan"})
		return
	}

	var input struct {
		NamaLengkap string `json:"nama_lengkap"`
		Email       string `json:"email"`
		NoTelp      string `json:"no_telp"`
		Password    string `json:"password"`
		Role        string `json:"role"`
		StatusAktif *bool  `json:"status_aktif"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.NamaLengkap != "" {
		user.NamaLengkap = input.NamaLengkap
	}
	if input.Email != "" {
		user.Email = input.Email
	}
	if input.NoTelp != "" {
		user.NoTelp = input.NoTelp
	}
	if input.Password != "" {
		hashedPass, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		user.Password = string(hashedPass)
	}
	if input.Role != "" {
		user.Role = models.UserRole(input.Role)
	}
	if input.StatusAktif != nil {
		user.StatusAktif = *input.StatusAktif
	}

	user.DiperbaruiPada = time.Now()

	if err := models.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user berhasil diperbarui", "user": user})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := models.DB.Delete(&models.User{}, "id_user = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "gagal hapus user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user berhasil dihapus"})
}
