package vite

import (
	"embed"
	"io/fs"
	"os"
	"os/exec"
	"sync"

	"gbfw/internal/resources/env"
)

var (
	//go:embed build/*
	productionFS embed.FS

	FS   fs.FS
	once sync.Once
)

func Load() (err error) {
	once.Do(func() {
		FS, err = fs.Sub(productionFS, "build")
		if env.IsDev() {
			cmd := exec.Command(string(env.Get("JS_RUNTIME", "node")), "node_modules/vite/bin/vite", "--host")
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			err = cmd.Start()
			FS = os.DirFS("internal/resources/vite/dev")
		}
	})

	return err
}
