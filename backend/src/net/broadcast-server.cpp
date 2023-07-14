#include "broadcast-server.hpp"

typedef void *(*THREADFUNCPTR)(void *);

void BroadcastServer::start(int port) {
    _ws.set_access_channels(websocketpp::log::alevel::all);
    _ws.clear_access_channels(websocketpp::log::alevel::frame_payload);

    _ws.init_asio();

    _ws.set_open_handler(bind(&BroadcastServer::_on_open, this, ::_1));
    _ws.set_close_handler(bind(&BroadcastServer::_on_close, this, ::_1));

    _ws.set_reuse_addr(true);
    _ws.listen(port);
    _ws.start_accept();
    pthread_create(&_thread, NULL, (THREADFUNCPTR)&BroadcastServer::_run, this);
}

void BroadcastServer::stop() {
    _ws.stop_listening();
    _ws.stop_perpetual();
    for (auto hdl : _connections) {
        _ws.close(hdl, websocketpp::close::status::going_away, "shutting down");
    }
    _connections.clear();
    pthread_join(_thread, 0);
}

void BroadcastServer::broadcast(std::string raw_msg) {
    for (auto itr = _connections.begin(); itr != _connections.end(); itr++) {
        _ws.send(*itr, raw_msg, websocketpp::frame::opcode::text);
    }
}

void BroadcastServer::emit(std::string event_name, json msg) {
    std::string raw_msg = event_name + "\n";
    raw_msg += msg.dump();
    broadcast(raw_msg);
}

void BroadcastServer::_run(void *) { _ws.run(); }

void BroadcastServer::_on_open(websocketpp::connection_hdl hdl) {
    /* connected */
    _connections.insert(hdl);
}

void BroadcastServer::_on_close(websocketpp::connection_hdl hdl) {
    /* disconnected */
    _connections.erase(hdl);
}
