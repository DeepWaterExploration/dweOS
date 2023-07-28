import http.server
from http.server import HTTPServer
import urllib.parse
import cpuHandler, memoryHandler, wifiHandler
import json
import os


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


class HTTPRequestHandler(http.server.BaseHTTPRequestHandler):
    def end_headers(self):
        # Set "Access-Control-Allow-Origin" header to the value of the "Origin" header
        # If "Origin" header is not present in the request, use "*" to allow requests from any origin
        self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", "*"))

        # Set "Access-Control-Allow-Methods" header to allow the specified HTTP methods for cross-origin requests
        # In this case, we allow "GET", "POST", and "OPTIONS" methods
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

        # Set "Access-Control-Allow-Headers" header to specify the allowed request headers for cross-origin requests
        # Here, we allow "X-Requested-With", "Content-Type", and "Accept" headers
        self.send_header(
            "Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept"
        )

        # Set "Access-Control-Allow-Credentials" header to "true" to allow sending credentials (e.g., cookies, HTTP authentication)
        # By default, it is set to "false", but in this case, we enable it to allow credentials for cross-origin requests
        self.send_header("Access-Control-Allow-Credentials", "true")

        # Call the end_headers method of the superclass to complete the headers of the response
        # This will send the headers to the client in the response
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.end_headers()

    def do_GET(self):
        # Handling GET requests asynchronously
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
                response_content = json.dumps(wifiHandler.get_is_wifi_on())

                # Send the response content encoded in utf-8
                self.wfile.write((response_content).encode("utf-8"))
            case "/getAvailabkeWifi":
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
        # Handling POST requests asynchronously
        # Parse the
        parsed_url = urllib.parse.urlparse(self.path)
        print_with_color(f"GET request path: {parsed_url.path}", TextColors.YELLOW)
        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length).decode("utf-8")
        parsed_data = json.loads(post_data)
        match parsed_url.path:
            case "/toggleWifiStatus":
                # Extract wifi_status from the query parameters
                wifi_status = parsed_data["wifi_status"]

                # Set the response status code
                self.send_response(200)

                # Set the response headers
                self.send_header("Content-type", "application/json")
                self.end_headers()

                # Build the response content as a dictionary and convert to JSON format
                response_content = json.dumps(
                    wifiHandler.toggle_wifi_status(wifi_status)
                )

                # Send the response content encoded in utf-8
                self.wfile.write((response_content).encode("utf-8"))
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

    async def handle_staticFiles(self):
        # Extract the file path from the request URL
        file_path = urllib.parse.urlparse(self.path).path

        # Remove the leading '/' from the file path
        file_path = file_path[1:]

        try:
            # Check if the requested file exists in the "static" directory
            if os.path.exists("static/" + file_path):
                # Open the requested file in binary mode
                with open("static/" + file_path, "rb") as file:
                    # Determine the file's content type based on the file extension
                    content_type = (
                        "text/html"
                        if file_path.endswith(".html")
                        else "text/css"
                        if file_path.endswith(".css")
                        else "application/javascript"
                    )

                    # Set the response status code
                    self.send_response(200)

                    # Set the response headers
                    self.send_header("Content-type", content_type)
                    self.end_headers()

                    # Send the file's content to the client
                    self.wfile.write(file.read())
            else:
                # If the file is not found, return a not found response
                self.send_response(404)
                self.send_header("Content-type", "text/plain")
                self.end_headers()
                self.wfile.write(b"File not found.")
        except FileNotFoundError:
            # If an exception occurs while reading the file, return an internal server error response
            self.send_response(500)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Internal Server Error.")

    # def do_GET(self):
    #     asyncio.run(self.async_do_GET())

    # def do_POST(self):
    #     asyncio.run(self.async_do_POST())


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
