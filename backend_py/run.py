from src import Server, logging, FeatureSupport

logging.getLogger().setLevel(logging.INFO)

server = Server(FeatureSupport(wifi=False, ttyd=False))
server.serve()
