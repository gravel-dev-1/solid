package inertia

import (
	"embed"
	"encoding/json"
	"fmt"
	"html/template"
	"path/filepath"
	"strings"

	"gravel/internal/services/env"
	"gravel/internal/services/vite"

	"github.com/gofiber/fiber/v3"
)

//go:embed index.go.html
var FS embed.FS

const (
	Header         = "X-Inertia"
	HeaderLocation = "X-Inertia-Location"
)

type TemplateData struct {
	Page    string
	Inertia template.JS
}

func (TemplateData) AppName() string { return env.Get("APP_NAME", "Application") }

type ManifestEntry struct {
	File    string   `json:"file"`
	Imports []string `json:"imports"`
	CSS     []string `json:"css"`
}

func (t TemplateData) Vite(entrypoints ...string) template.HTML {
	builder := new(strings.Builder)
	if env.IsDev() {
		for _, entrypoint := range append([]string{"@vite/client"}, entrypoints...) {
			fmt.Fprintf(builder, `<script type="module" src="http://localhost:5173/%s"></script>`, entrypoint)
		}
		return template.HTML(builder.String())
	}

	manifest, err := vite.FS.Open(filepath.Join(".vite", "manifest.json"))
	if err != nil {
		panic(err)
	}

	chunks := make(map[string]ManifestEntry)
	if err = json.NewDecoder(manifest).Decode(&chunks); err != nil {
		panic(err)
	}

	visited := make(map[string]bool)
	var generate func(entry string, builder *strings.Builder)
	generate = func(entry string, builder *strings.Builder) {
		if visited[entry] {
			return
		}
		visited[entry] = true

		e, ok := chunks[entry]
		if !ok {
			return
		}

		// 1. process dependencies
		for _, imp := range e.Imports {
			generate(imp, builder)
		}

		// 2. then emit CSS
		for _, css := range e.CSS {
			fmt.Fprintf(builder, `<link rel="stylesheet" href="/%s">`, css)
		}

		// 3. then emit JS
		if e.File != "" {
			fmt.Fprintf(builder, `<script type="module" src="/%s"></script>`, e.File)
		}
	}

	for _, entry := range append(entrypoints, fmt.Sprintf("resources/js/%s.tsx", t.Page)) {
		generate(entry, builder)
	}

	return template.HTML(builder.String())
}

func Render(c fiber.Ctx, name string, props fiber.Map) error {
	if props == nil {
		props = make(fiber.Map, 0)
	}

	page := fiber.Map{
		"component": name,
		"props":     props,
		"url":       c.OriginalURL(),
	}

	if c.Get(Header) == "true" {
		c.Set(Header, "true")
		return c.JSON(page)
	}

	pageBytes, err := json.Marshal(page)
	if err != nil {
		return err
	}

	data := TemplateData{
		Page:    name,
		Inertia: template.JS(pageBytes),
	}

	return c.Render("index", data)
}

func Location(c fiber.Ctx, url string) error {
	c.Set(HeaderLocation, url)
	return c.SendStatus(fiber.StatusConflict)
}
