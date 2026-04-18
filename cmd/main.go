package main

import (
	"context"
	"log"
	"os"
	"os/signal"

	"gbfw/internal/http/routes"
	"gbfw/internal/services/env"
	"gbfw/internal/services/vite"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/logger"
)

type Validator func(any) error

func (fn Validator) Validate(out any) error { return fn(out) }

func main() {
	app := fiber.New(fiber.Config{
		Services: []fiber.Service{
			&env.Service{},
			&vite.Service{},
		},
		StructValidator: Validator(validator.New().Struct),
	})
	app.Use(logger.New())
	routes.Routes(app)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, os.Kill)
	defer stop()

	go func() {
		if err := app.Listen(env.Get("LISTEN_ADDR"), fiber.ListenConfig{GracefulContext: ctx}); err != nil {
			log.Println(err)
		}
	}()

	<-ctx.Done()
}
