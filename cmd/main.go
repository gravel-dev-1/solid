package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"

	"gravel/internal/http/routes"
	"gravel/internal/services/env"
	"gravel/internal/services/inertia"
	"gravel/internal/services/vite"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/template/html/v3"
)

type Validator func(any) error

func (fn Validator) Validate(out any) error { return fn(out) }

func main() {
	app := fiber.New(fiber.Config{
		Services: []fiber.Service{
			&env.Service{},
			&vite.Service{},
		},
		Views:           html.NewFileSystem(http.FS(inertia.FS), ".go.html"),
		StructValidator: Validator(validator.New().Struct),
	})
	app.Use(logger.New())
	routes.Routes(app)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGTERM)
	defer stop()

	go func() {
		if err := app.Listen(env.Get("LISTEN_ADDR"), fiber.ListenConfig{GracefulContext: ctx}); err != nil {
			log.Println(err)
		}
	}()

	<-ctx.Done()

	if err := app.Shutdown(); err != nil {
		log.Fatalln(err)
	}
}
