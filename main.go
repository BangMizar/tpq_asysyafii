package main

import (
	"github.com/gin-gonic/gin"
	"tpq_asysyafii/models"
	"tpq_asysyafii/routes"
)

func main() {
	models.ConnectDatabase()

	r := gin.Default()

	routes.UserRoutes(r)

	r.Run(":8080")
}
