from src import Server, logging, FeatureSupport

logging.getLogger().setLevel(logging.INFO)

server = Server('./', FeatureSupport(wifi=True, ttyd=True))
server.serve()
