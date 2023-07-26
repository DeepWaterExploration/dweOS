import http.server
from http.server import HTTPServer
import urllib.parse
import cpuHandler, memoryHandler, wifiHandler
import json


# ANSI escape codes for text colors
class TextColors:
    RESET = "\033[0m"
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"


# Function to print with colors
def print_with_color(text, color):
    print(f"{color}{text}{TextColors.RESET}")


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
        # Parse the request path and query parameters from the request
        parsed_url = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        print_with_color(f"GET request path: {parsed_url.path}", TextColors.YELLOW)
        match parsed_url.path:
            # when wifi is requested
            case "/getWifiStatus":
                # Set the response status code
                self.send_response(200)

                # Set the response headers
                self.send_header("Content-type", "application/json")
                self.end_headers()

                # Build the response content as a dictionary and convert to JSON format
                response_content = json.dumps(wifiHandler.get_wifi_info())

                # Send the response content encoded in utf-8
                self.wfile.write((response_content).encode("utf-8"))
            # connect to wifi with parameters
            # ?wifi_ssid=EvoNexusSD&wifi_password=S@nD1ego!
            case "/connectToWifi":
                # Set the response status code
                self.send_response(200)

                # Set the response headers
                self.send_header("Content-type", "application/json")
                self.end_headers()

                # Extract wifi_ssid and wifi_password from the query parameters
                wifi_ssid = query_params.get("wifi_ssid", [None])[0]
                wifi_password = query_params.get("wifi_password", [None])[0]

                # Build the response content as a dictionary and convert to JSON format
                response_content = json.dumps(
                    wifiHandler.connect_to_wifi(wifi_ssid, wifi_password)
                )

                # Send the response content encoded in utf-8
                self.wfile.write((response_content).encode("utf-8"))

            case "/getCPU":
                # Set the response status code
                self.send_response(200)

                # Set the response headers
                self.send_header("Content-type", "application/json")
                self.end_headers()

                # Build the response content as a dictionary and convert to JSON format
                response_content = json.dumps(cpuHandler.get_cpu_info())

                # Send the response content encoded in utf-8
                self.wfile.write((response_content).encode("utf-8"))

                self.wfile.write(
                    json.dumps(wifiHandler.get_wifi_status()).encode("utf-8")
                )
            case "/getMemory":
                # Set the response status code
                self.send_response(200)

                # Set the response headers
                self.send_header("Content-type", "application/json")
                self.end_headers()

                # Build the response content as a dictionary and convert to JSON format
                response_content = json.dumps(cpuHandler.get_cpu_info())

                # Send the response content encoded in utf-8
                self.wfile.write((response_content).encode("utf-8"))

                self.wfile.write(
                    json.dumps(wifiHandler.get_memory_info()).encode("utf-8")
                )
            case _:
                # Set the response status code
                self.send_response(404)

                # Set the response headers
                self.send_header("Content-type", "text/html")
                self.end_headers()

                # Build the response content in HTML format
                response_content = "<html><body><h1>404 Not Found</h1></body></html>"

                # Send the response content encoded in utf-8
                self.wfile.write((response_content).encode("utf-8"))

    def do_POST(self):
        # Handling POST requests
        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length)
        post_data = urllib.parse.parse_qs(post_data.decode("utf-8"))

        # Set the response status code
        self.send_response(200)

        # Set the response headers
        self.send_header("Content-type", "text/html")
        self.end_headers()

        # Send the response content encoded in utf-8
        self.wfile.write(
            b"<html><body><h1>Simple POST Request Received!</h1></body></html>"
        )


# Main function to run the server
def run_server():
    try:
        # Set up the server address and port
        PORT = 5050
        server = HTTPServer(("", PORT), HTTPRequestHandler)

        # Start the server
        print_with_color(
            f"Server started at http://localhost:{PORT}.", TextColors.GREEN
        )

        server.serve_forever()
    except KeyboardInterrupt:
        # Stop the server on keyboard interrupt
        print_with_color(
            "\nKeyboard Interrupt received, shutting down the server.", TextColors.RED
        )
        server.server_close()


if __name__ == "__main__":
    run_server()
