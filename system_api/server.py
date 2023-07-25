import http.server
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse
import cpuHandler
import json


class HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", "*"))
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept"
        )
        self.send_header("Access-Control-Allow-Credentials", "true")
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.end_headers()

    def do_GET(self):
        # Handling GET requests
        match self.path:
            # when wifi is requested
            case "/getWifi":
                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                self.wfile.write(
                    b"<html><body><h1>Simple GET Request Received!</h1></body></html>"
                )
            case "/getCPU":
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(cpuHandler.get_cpu_info()).encode("utf-8"))
            #     case pattern-3:
            #         action-3
            case _:
                self.send_response(404)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                self.wfile.write(b"<html><body><h1>404 Not Found</h1></body></html>")

    def do_POST(self):
        # Handling POST requests
        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length)
        post_data = urllib.parse.parse_qs(post_data.decode("utf-8"))

        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(
            b"<html><body><h1>Simple POST Request Received!</h1></body></html>"
        )


if __name__ == "__main__":
    PORT = 5050
    server = HTTPServer(("", PORT), HTTPRequestHandler)
    print(f"Server started at http://localhost:{PORT}")
    server.serve_forever()
