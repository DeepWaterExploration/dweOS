from src import Server, logging, ServerOptions

logging.getLogger().setLevel(logging.INFO)

server = Server(server_options=ServerOptions(False))
server.serve()
