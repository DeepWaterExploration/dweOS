from src import Server, logging

logging.getLogger().setLevel(logging.INFO)

server = Server()
server.serve()
