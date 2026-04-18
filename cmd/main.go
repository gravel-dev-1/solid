package main

import (
	"context"
	"log"
	"os"
	"os/signal"

	"gbfw/internal/http/routes"
	"gbfw/internal/resources"
	"gbfw/internal/resources/env"
	"gbfw/internal/resources/vite"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/logger"
)

func main() {
	err := resources.Run(
		env.Load,
		vite.Load,
	)

	if err != nil {
		log.Fatalln(err)
		return
	}

	app := fiber.New()
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

	err = resources.Run(
		func() (err error) { return app.ShutdownWithContext(ctx) },
	)

	if err != nil {
		log.Fatalln(err)
	}
}
