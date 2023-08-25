package main

import (
	"fmt"
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func main() {

	// Initialize the Wi-Fi handler
	// wifiHandler = NewWifiHandler()

	r := mux.NewRouter()
	// r.HandleFunc("/wifiStatus", handleWifiStatus).Methods("GET")
	// r.HandleFunc("/wifiConnected", handleWifiConnected).Methods("GET")
	// r.HandleFunc("/wifiScan", handleWifiScan).Methods("GET")
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

func hello(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("hello!"))
}
