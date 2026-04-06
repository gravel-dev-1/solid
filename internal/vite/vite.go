package vite

import (
	"embed"
	"io/fs"
	"log"
	"os"
	"os/exec"
	"sync"

	"gbfw/internal/env"
)

var (
	//go:embed build/*
	productionFS embed.FS

	FS   fs.FS
	once sync.Once
)

type JSRuntime string

const (
	JSRuntimeKey = "JS_RUNTIME"

	JSRuntimeNode JSRuntime = "node"
	JSRuntimeBun  JSRuntime = "bun"
)

func Load() (err error) {
	once.Do(func() {
		FS, err = fs.Sub(productionFS, "build")
		if env.IsDev() {
			cmd := exec.Command(string(env.Getenv(JSRuntimeKey, JSRuntimeNode)), "node_modules/vite/bin/vite", "--host")
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			if err := cmd.Start(); err != nil {
				log.Println(err)
			}
			FS = os.DirFS("internal/vite/dev")
		}
	})

	return err
}
