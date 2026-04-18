package env

import (
	"fmt"
	"os"
	"strings"
	"sync"

	"github.com/joho/godotenv"
)

type Environment string

const (
	EnvironmentKey = "ENVIRONMENT"

	EnvironmentDevelopment Environment = "development"
	EnvironmentProduction  Environment = "production"
)

var (
	environment Environment
	once        sync.Once
)

func Load() (err error) {
	once.Do(func() {
		// Load .env if exists else fail silently
		if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
			return
		}

		environment = Environment(Get(EnvironmentKey))
		switch environment {
		case EnvironmentDevelopment, EnvironmentProduction:
			return
		default:
			err = fmt.Errorf(
				"unexpected %s value: expected: %q or %q, got %q",
				EnvironmentKey,
				EnvironmentDevelopment,
				EnvironmentProduction,
				environment,
			)
		}
	})
	return err
}

func Get[T ~string](key T, defaultValue ...T) T {
	var val string

	if value, ok := os.LookupEnv(string(key)); ok {
		val = value
	} else if len(defaultValue) > 0 {
		val = string(defaultValue[0])
	} else {
		return ""
	}

	if strings.IndexByte(val, '$') >= 0 {
		val = os.ExpandEnv(val)
	}

	return T(val)
}

func IsDev() bool { return environment == EnvironmentDevelopment }
