package env

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

const (
	ServiceName                        = "Environment"
	EnvironmentKey                     = "ENVIRONMENT"
	EnvironmentDevelopment Environment = "development"
	EnvironmentProduction  Environment = "production"
)

type Environment string

type Service struct{ Environment }

var IsDev bool

// Start initializes and starts the service. It implements the [fiber.Service] interface.
func (s *Service) Start(ctx context.Context) (err error) {
	// Shadowed on purpose
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		return err
	}

	s.Environment = Environment(Get("ENVIRONMENT"))
	IsDev = s.Environment == EnvironmentDevelopment
	switch s.Environment {
	case EnvironmentDevelopment, EnvironmentProduction:
		return err
	default:
		return fmt.Errorf(
			"unexpected %s value: expected: %q or %q, got %q",
			EnvironmentKey,
			EnvironmentDevelopment,
			EnvironmentProduction,
			s.Environment,
		)
	}
}

// String returns a string representation of the service.
// It is used to print a human-readable name of the service in the startup message.
// It implements the [fiber.Service] interface.
func (s *Service) String() string { return ServiceName }

// State returns the current state of the service.
// It implements the [fiber.Service] interface.
func (s *Service) State(context.Context) (string, error) {
	return fmt.Sprintf("running in %s mode", s.Environment), nil
}

// Terminate stops and removes the service. It implements the [fiber.Service] interface.
func (s *Service) Terminate(ctx context.Context) error { return nil }

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
