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

	// Build the response content as a JSON struct
	_, err := NetworkToggle(true)

	// Check if there was an error
	if err != nil {
		// Log the error
		Log.Error(fmt.Sprintf("Error toggling the WiFi network: %v", err))
		return
	}

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

func handleWifiSaved(w http.ResponseWriter, r *http.Request) {
	// Set the response status code
	w.WriteHeader(http.StatusOK)

	// Set the response headers to indicate the content type
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// Build the response content as a JSON struct
	responseContent, err := wifiHandler.NetworkSaved()

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

func toggleWifiStatus(w http.ResponseWriter, r *http.Request) {
	// Set the response status code
	w.WriteHeader(http.StatusOK)

	// Set the response headers to indicate the content type
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// Parse the request body into a WifiToggleRequest struct
	var request WifiToggleRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to parse request body: %v", err), http.StatusBadRequest)
		return
	}

	// Build the response content as a JSON struct
	responseContent, err := NetworkToggle(request.WifiState)

	// Check if there was an error
	if err != nil {
		// Log the error
		Log.Error(fmt.Sprintf("Error toggling the WiFi network: %v", err))
		return
	} else {
		// Send the response content convert encoded in utf-8
		json.NewEncoder(w).Encode(responseContent)
	}
}

func connectToWifi(w http.ResponseWriter, r *http.Request) {
	// Set the response status code
	w.WriteHeader(http.StatusOK)

	// Set the response headers to indicate the content type
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// Parse the request body into a WifiToggleRequest struct
	var request WifiConnectRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to parse request body: %v", err), http.StatusBadRequest)
		return
	}

	// Build the response content as a JSON struct
	responseContent, err := wifiHandler.NetworkConnect(request.WifiSSID, request.WifiPassword)

	// Check if there was an error
	if err != nil {
		// Log the error
		Log.Error(fmt.Sprintf("Error connecting to the WiFi network: %v", err))
		return
	} else {
		// Send the response content convert encoded in utf-8
		json.NewEncoder(w).Encode(responseContent)
	}
}

func disconnectWifi(w http.ResponseWriter, r *http.Request) {
	// Set the response status code
	w.WriteHeader(http.StatusOK)

	// Set the response headers to indicate the content type
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// Parse the request body into a WifiToggleRequest struct
	var request WifiDisconnectRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to parse request body: %v", err), http.StatusBadRequest)
		return
	}

	// Build the response content as a JSON struct
	responseContent, err := wifiHandler.NetworkDisconnect(request.WifiSSID)

	// Check if there was an error
	if err != nil {
		// Log the error
		Log.Error(fmt.Sprintf("Error disconnecting from the WiFi network: %v", err))
		return
	} else {
		// Send the response content convert encoded in utf-8
		json.NewEncoder(w).Encode(responseContent)
	}
}

func forgetWifi(w http.ResponseWriter, r *http.Request) {
	// Set the response status code
	w.WriteHeader(http.StatusOK)

	// Set the response headers to indicate the content type
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// Parse the request body into a WifiToggleRequest struct
	var request WifiForgetRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to parse request body: %v", err), http.StatusBadRequest)
		return
	}

	// Build the response content as a JSON struct
	responseContent, err := wifiHandler.NetworkForget(request.WifiSSID)

	// Check if there was an error
	if err != nil {
		// Log the error
		Log.Error(fmt.Sprintf("Error forgetting the WiFi network: %v", err))
		return
	} else {
		// Send the response content convert encoded in utf-8
		json.NewEncoder(w).Encode(responseContent)
	}
}

func shutdownMachine(w http.ResponseWriter, r *http.Request) {
	// Set the response status code
	w.WriteHeader(http.StatusOK)

	// Set the response headers to indicate the content type
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// Build the response content as a JSON struct
	err := ShutDown()

	// Check if there was an error
	if err != nil {
		// Log the error
		Log.Error(fmt.Sprintf("Error forgetting the WiFi network: %v", err))
		return
	}
}

func restartMachine(w http.ResponseWriter, r *http.Request) {
	// Set the response status code
	w.WriteHeader(http.StatusOK)

	// Set the response headers to indicate the content type
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// Build the response content as a JSON struct
	err := Restart()

	// Check if there was an error
	if err != nil {
		// Log the error
		Log.Error(fmt.Sprintf("Error forgetting the WiFi network: %v", err))
		return
	}
}

func handleGetTemperature(w http.ResponseWriter, r *http.Request) {
	// Set the response status code
	w.WriteHeader(http.StatusOK)

	// Set the response headers to indicate the content type
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	// Build the response content as a JSON struct
	responseContent, err := GetTemperature()

	// Check if there was an error
	if err != nil {
		// Log the error
		Log.Error(fmt.Sprintf("Error getting the temperature: %v", err))
		return
	} else {
		// Send the response content convert encoded in utf-8
		json.NewEncoder(w).Encode(responseContent)
	}
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/wifiStatus", handleWifiStatus).Methods("GET")
	r.HandleFunc("/wifiScan", handleWifiScan).Methods("GET")
	r.HandleFunc("/wifiSaved", handleWifiSaved).Methods("GET")
	r.HandleFunc("/wifiConnected", handleWifiConnected).Methods("GET")
	r.HandleFunc("/wifiToggle", toggleWifiStatus).Methods("POST")
	r.HandleFunc("/wifiConnect", connectToWifi).Methods("POST")
	r.HandleFunc("/wifiDisconnect", disconnectWifi).Methods("POST")
	r.HandleFunc("/wifiForget", forgetWifi).Methods("POST")
	r.HandleFunc("/shutDownMachine", shutdownMachine).Methods("POST")
	r.HandleFunc("/restartMachine", restartMachine).Methods("POST")
	r.HandleFunc("/getTemperature", handleGetTemperature).Methods("GET")

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
