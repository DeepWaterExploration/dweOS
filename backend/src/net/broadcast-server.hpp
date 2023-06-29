#ifndef BROADCAST_SERVER_HPP
#define BROADCAST_SERVER_HPP

#include <set>
#include <websocketpp/server.hpp>
#include <websocketpp/config/asio_no_tls.hpp>
#include <pthread.h>

typedef websocketpp::server<websocketpp::config::asio> server;

using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;

typedef server::message_ptr message_ptr;

class BroadcastServer {
public:
    void start(int port);

    void stop();

    void broadcast(std::string msg);

private:
    typedef std::set<websocketpp::connection_hdl,std::owner_less<websocketpp::connection_hdl>> con_list;

    void _run(void *);

    void _on_open(websocketpp::connection_hdl hdl);

    void _on_close(websocketpp::connection_hdl hdl);

    server _ws;
    con_list _connections;
    pthread_t _thread;
};

#endif
