package routes

import (
	"gbfw/internal/http/handlers"
	"gbfw/internal/services/vite"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/static"
)

func Routes(router *fiber.App) {
	router.Get("/api/health", handlers.Health)
	router.Use("/api/", func(c fiber.Ctx) error { return c.SendStatus(fiber.StatusNotFound) })
	vite, _ := fiber.GetService[*vite.Service](router.State(), vite.ServiceName)
	router.Use(static.New("", static.Config{FS: vite.FS}))
	router.Use(func(c fiber.Ctx) error { return c.SendFile("/index.html", fiber.SendFile{FS: vite.FS}) })
}
