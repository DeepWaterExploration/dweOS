package main

import (
	"fmt"
	"net/http"
)

func main() {
	const port = 8080
	const host = "localhost"
	http.HandleFunc("/", hello)
	Log.Info("This is an info message.")
	Log.Info(fmt.Sprintf("Server started at http://%s:%d.", host, port))
	http.ListenAndServe(fmt.Sprintf("%s:%d", host, port), nil)
}

func hello(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("hello!"))
}
