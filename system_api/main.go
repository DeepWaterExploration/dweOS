package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

var wifiHandler *WifiHandler
var err error
var errs []error

func init() {
	// Initialize the logger
	initalizeLogger()

	// Initialize the Wi-Fi handler
	wifiHandler, err = NewWifiHandler()
	if err != nil {
		Log.Error(fmt.Sprintf("Error initializing wifi handler: %v", err))
		return
	}
}

func handleWifiStatus(w http.ResponseWriter, r *http.Request) {
	// Set the response status code
	w.WriteHeader(http.StatusOK)

	// Set the response headers to indicate the content type
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// Build the response content as a JSON struct
	responseContent, err := wifiHandler.NetworkStatus()

	// Check if there was an error
	if err != nil {
		// Log the error
		Log.Error(fmt.Sprintf("Error getting wifi status: %v", err))
		return
	} else {
		// Send the response content convert encoded in utf-8
		json.NewEncoder(w).Encode(responseContent)
	}
}

func handleWifiConnected(w http.ResponseWriter, r *http.Request) {
	// Set the response status code
	w.WriteHeader(http.StatusOK)

	// Set the response headers to indicate the content type
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// Build the response content as a JSON struct
	responseContent, err := wifiHandler.NetworkConnected()

	// Check if there was an error
	if err != nil {
		// Log the error
		Log.Error(fmt.Sprintf("Error getting the connected wifi network: %v", err))
		return
	} else {
		// Send the response content convert encoded in utf-8
		json.NewEncoder(w).Encode(responseContent)
	}
}

func handleWifiScan(w http.ResponseWriter, r *http.Request) {
	// Set the response status code
	w.WriteHeader(http.StatusOK)

	// Set the response headers to indicate the content type
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// Build the response content as a JSON struct
	responseContent, err := wifiHandler.NetworkScan()

	// Check if there was an error
	if err != nil {
		// Log the error
		Log.Error(fmt.Sprintf("Error getting the connected wifi network: %v", err))
		return
	} else {
		// Send the response content convert encoded in utf-8
		json.NewEncoder(w).Encode(responseContent)
	}
}

func main() {
	r := mux.NewRouter()
	// r.HandleFunc("/wifiStatus", handleWifiStatus).Methods("GET")
	r.HandleFunc("/wifiConnected", handleWifiConnected).Methods("GET")
	r.HandleFunc("/wifiScan", handleWifiScan).Methods("GET")
	// r.HandleFunc("/wifiSaved", handleWifiSaved).Methods("GET")
	// r.HandleFunc("/wifiToggle", toggleWifiStatus).Methods("POST")
	// r.HandleFunc("/wifiConnect", connectToWifi).Methods("POST")
	// r.HandleFunc("/wifiForget", forgetWifi).Methods("POST")
	// r.HandleFunc("/wifiDisconnect", disconnectFromWifi).Methods("POST")
	// r.HandleFunc("/shutDownMachine", shutdownMachine).Methods("POST")
	// r.HandleFunc("/restartMachine", restartMachine).Methods("POST")

	// Create a new HTTP server with the CORS (Cross-Origin Resource Sharing) middleware enabled
	corsOptions := handlers.CORS(
		handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Accept"}), // Allow only headers from the list
		handlers.AllowedOrigins([]string{"*"}),                                          // Allow requests from any origin
		handlers.AllowedMethods([]string{"GET", "POST", "OPTIONS"}),                     // Allow only GET and POST methods
	)

	// Set up the server address and port
	const port = 8080
	const host = "localhost"

	// Start the server
	Log.Info(fmt.Sprintf("Server started at http://%s:%d.", host, port))
	http.Handle("/", corsOptions(r))
	http.ListenAndServe(fmt.Sprintf("%s:%d", host, port), nil)
}
