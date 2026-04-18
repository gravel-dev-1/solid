package routes

import (
	"gbfw/internal/http/handlers"
	"gbfw/internal/resources/vite"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/static"
)

func Routes(router fiber.Router) {
	router.Get("/api/health", handlers.Health)
	router.Use("/api/", func(c fiber.Ctx) error { return c.SendStatus(fiber.StatusNotFound) })
	router.Use(static.New("", static.Config{FS: vite.FS}))
	router.Use(func(c fiber.Ctx) error { return c.SendFile("/index.html", fiber.SendFile{FS: vite.FS}) })
}
