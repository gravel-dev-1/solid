package handlers

import (
	"gravel/internal/services/inertia"

	"github.com/gofiber/fiber/v3"
)

func Health(c fiber.Ctx) error { return c.JSON(fiber.Map{"status": "ok"}) }

func Index(c fiber.Ctx) error {
	return inertia.Render(c, "index", fiber.Map{"Hello": "World"})
}

func About(c fiber.Ctx) error {
	return inertia.Render(c, "about", fiber.Map{"foo": "bar"})
}
