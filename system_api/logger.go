package main

import (
	"fmt"
	"io"
	"os"

	"github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
)

// Log is the central logger instance that can be used throughout the application.
var Log *logrus.Logger

func init() {
	// Read the value of the APP_ENV environment variable
	env := os.Getenv("APP_ENV")

	// Create a new logger instance
	log := logrus.New()

	// configure logrus to output to a file called server.log along with stdout
	log.SetOutput(io.MultiWriter(os.Stdout, &lumberjack.Logger{
		Filename:   "server.log",
		MaxSize:    10, // megabytes
		MaxBackups: 3,
		MaxAge:     28,   //days
		Compress:   true, // disabled by default
	}))

	// Configure the log level based on the environment
	if env == "development" {
		// Development log level
		log.SetLevel(logrus.DebugLevel)
	} else {
		// Default log level (e.g., production).
		log.SetLevel(logrus.InfoLevel)
	}

	// Set the logger instance to the package-level variable
	Log = log

	Log.Info(fmt.Sprintf("Running in %s environment", func() string {
		if env == "development" {
			return "development"
		} else {
			return "production"
		}
	}()))

	// Log an info message
	Log.Info("Logger initialized")
}
