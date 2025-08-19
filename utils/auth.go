package utils

import (
	"time"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte(os.Getenv("JWT_SECRET"))

type JWTClaim struct {
	IDUser string `json:"id_user"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateJWT(idUser string, role string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour) // 1 hari

	claims := &JWTClaim{
		IDUser: idUser,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func ValidateToken(signedToken string) (*JWTClaim, error) {
	token, err := jwt.ParseWithClaims(
		signedToken,
		&JWTClaim{},
		func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		},
	)
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaim)
	if !ok || !token.Valid {
		return nil, err
	}

	return claims, nil
}
