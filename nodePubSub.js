/**
 * Created by tos on 02.04.14.
 */

// Start Log
console.log('Start Node.js Pub Sub. UTC time:  ' + new Date().toString());

var http = require('http');
var sockjs = require('sockjs');
var redis = require('redis');
var server = http.createServer();
var sockjsServer = sockjs.createServer();

var Config = {
    StatisticInChat: true,
    fullLogs: false,
    Debug: {
        enabled: true,
        options: { //опции соответствуют методам в Debug
            ping: {
                enabled: false,
                msgPerSecond: 1,
                channel: 'default',
                interval: function() {
                    return 1000/Config.Debug.options.ping.msgPerSecond
                }
            }
        }
    }
};

var localVar = {
    clients: {}, //объекты соединений
    clientsInfo: {}, //информацпия по соединениям openTime, closeTime
    clientRedisData: {} //все сообщения полученные от Redis (redis.on('data'))
};

//filter
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index && value;
}

/**TEST**/
var Debug = {
    stats: {
        http: 0
    },
    init: function(config) {
        this.config = config;

        if (config.enabled) {
            for (var key in config.options) {
                if (config.options[key].enabled) {
                    this[key](config.options[key]);
                }
            }
        }
    },
    /* следующие методы выводят в консоль информацию о включенном дебаге */
    ping: function(options) {
        console.log('Ping Enbaled on channel: '+ options.channel +'  with interval : ' + options.interval);
    }
};
Debug.init(Config.Debug);
/**END TEST**/

/** COMMANDS **/
var Commands = {
    auth: function(conn) { //отсылать айди для аутентификации
        var clientId = conn.id;
        conn.write(JSON.stringify({type:'system',mode:'auth_req',data:{clientId:clientId}}));
    },
    // подписывает клиента на канал и отсылает сообщения клиенту о подписке
    subscribe : function(conn,clientRedis,chanel) {
        for (var i=0; i < chanel.length; i++) {
            clientRedis.subscribe(chanel[i]);
        }
        if (conn) { // если нет, то значит оповещать клиента не нужно
            conn.write(JSON.stringify({type:'system',mode:'subscribe',chat:chanel}));
        }

    },
    unSubscribe : function(conn,clientRedis,chanel) {
        clientRedis.unsubscribe(chanel);
        if (conn) { // если нет, то значит оповещать клиента не нужно
            conn.write(JSON.stringify({type:'system',mode:'unSubscribe',chat:chanel}));
        }

    },
    // отсылает сообщение по каналу
    publish : function(clientRedis, chanel, message) {
        clientRedis.publish(chanel,message);
    }
};

/*** HTTP Server ***/
server.on('connection', function (socket) {
    socket.setNoDelay(); // Отключаем алгоритм Нагла.

});
server.addListener('request', function(req, res) {
    res.setHeader('content-type', 'text/plain');
    res.writeHead(404);
    res.end('404 - Nothing here (via sockjs-node test_server)');
});
server.addListener('upgrade', function(req, res){
    res.end();
});

/*** SOCKJS SERVER ***/
sockjsServer.on('connection', function(conn) {
    var remoteDebugAuth = false;
    Debug.stats.http++;
    var chanelClientID = conn.id; // канал для сообщений о подписках пользователя
    var chanelClientPublic = null; // канал, на который подписан пользователь

    localVar.clients[conn.id] = conn; //собираем всех клиентов
    localVar.clientsInfo[conn.id] = {openTime:'',closeTime:''};
    localVar.clientsInfo[conn.id]['openTime'] = new Date().toString() ;
    localVar.clientsInfo[conn.id]['userName'] = false;

    // сохраняем имя и айди, которые можно использовать в этом connection
    var userName,
        connId;

    //conn.on('data', function(message) { console.log(message); });
    conn.on('close', function() {
        if (Config.Debug.enabled) {
            Debug.stats.http--;
        }
        if (clientRedis) {
            clientRedis.quit();
        }
        var closeTime = new Date().toString();
        localVar.clientsInfo[conn.id]['closeTime'] = closeTime;

        if (Debug.fullLogs) console.log('>>> CLOSE conn.onClose ');
    });
    conn.on('error', function(e) {
        console.log('>>> ERROR conn.onError: ' + e);
        console.log(e);
        console.error('>>> ERROR conn.onError:   ' + new Date().toLocaleString());
        console.error(e);
    });
    conn.on('uncaughtException', function (e) {
        console.log('ERROR conn.onUncaughtException ' + e);
        console.error('>>> Error conn.onUncaughtException.  ' + new Date().toLocaleString());
        console.error(e);
    });

    conn.on('data', function(data) {
        /**HeartBeat**/
        try {
            var heartbeat = JSON.parse(data);
            if (heartbeat['mode'] == 'heartBeat') {
                conn.write(data);
            }
        } catch (e) {
            console.log('conn.on(data) catch Error from conn.id: ' + conn.id);
            conn.write('It\'s not possible to use "send"');
        }

        if (Config.Debug.enabled) {
            try {
                data = JSON.parse(data);
                if (data['type'] == 'system' && data['mode'] == 'error') {
                    console.log('ERROR: ошибка на клиенте');
                    console.log(data['data']);
                }
                // Remote Debug. Если клиент прошел авторизацию, то он может использовать функцуии remoteDebug
                if (data['type'] == 'remoteDebug') {
                    if (remoteDebugAuth) { //todo написать обработку команд с удаленного клиента
                        switch (data['mode']) {
                            case 'showClientInfo':
                                if (localVar.clients[data['clientId']]) {
                                    console.log('>>> remoteDebug: showClientInfo');
                                    //readyState: localVar.clients[data['clientId']]._session.readyState,
                                    conn.write(JSON.stringify({
                                        type:'remoteDebug',
                                        mode:'showClientInfo',
                                        data:localVar.clientsInfo[data['clientId']]
                                    }));
                                } else {
                                    conn.write(JSON.stringify({
                                        type:'remoteDebug',
                                        mode:'showClientInfo',
                                        data:{error:'Нет клента с таким clientId'}
                                    }));
                                }
                                break;
                            case 'showAllDataOnRedisClient': //вывод всех сообщений клиента, полученных нодой от Redis
                                if (localVar.clients[data['clientId']]) {
                                    console.log('>>> remoteDebug: showAllDataOnRedisClient');
                                    conn.write(JSON.stringify({
                                        type:'remoteDebug',
                                        mode:'showAllDataOnRedisClient',
                                        //data:localVar.clientsInfo[data['clientId']]
                                        data:localVar.clientRedisData[data['clientId']] //array
                                    }));
                                } else {
                                    conn.write(JSON.stringify({
                                        type:'remoteDebug',
                                        mode:'showClientInfo',
                                        data:{error:'Нет клента с таким clientId'}
                                    }));
                                }
                                break;
                            case 'showClients':
                                if (localVar.clients){
                                    var message = {
                                        count: 0,
                                        clientSid: []
                                    };
                                    for (var key in localVar.clients) {
                                        message.count++;
                                        message.clientSid.push(key);
                                    }
                                    conn.write(JSON.stringify({
                                        type:'remoteDebug',
                                        mode:'showClients',
                                        data:message
                                    }));
                                } else {
                                    conn.write(JSON.stringify({
                                        type:'remoteDebug',
                                        mode:'showClients',
                                        data:{error:'Нет клиентов'}
                                    }));
                                }
                                break;
                            default:
                                console.log('>>> remoteDebug. Неизвестный Mode ' + data['mode']);
                        }
                    }
                    if (data['data'] == '423423') {
                        remoteDebugAuth = true;
                        console.log('>>> RemoteDebug Enabled for client: ' + conn.id);
                    }
                }
            } catch (e) {
                console.log('conn.on(data) catch Error from conn.id: ' + conn.id);
                conn.write('It\'s not possible to use "send"');
            }
        }
    });

    /** REDIS PubSub**/
    var clientRedis = redis.createClient();
    //console.log(clientRedis);
    // подсключаемся к системному каналу
    Commands.subscribe(false,clientRedis, [chanelClientID]);
    //console.log('CONN ID: ' + conn.id);

    if (Config.Debug.options.ping.enabled) {
        Commands.subscribe(false,clientRedis, Config.Debug.options.ping.channel);
    }

    clientRedis.on('message', function (channel, message) {
        // если по системному каналу, то обработать сообщение json.parse
        // иначе это просто текст сообщения, отправленный конкретному чату

        var timeLocalRecMess = new Date().toLocaleString();

        //todo перенести parse только в к системному каналу в будущем
        try {
            var msg = JSON.parse(message);
        } catch (e) {
            console.log('>>> ERROR json.parse: clientRedis.onMessage: ' + e);
            console.error('>>> ERROR json.parse: clientRedis.onMessage: ' + e);
        }
        //console.log('new message', msg['type'], msg['mode']);
        if (channel == chanelClientID) { // КАНАЛ СИСТЕМНЫЙ
            if (msg['type'] == 'system') {
                //todo проверить, используется ли setUserName
                if (msg['mode'] == 'setUserName') {
                    conn.write(JSON.stringify({type:'system',mode:'setUserName',userName:[msg['userName']]}));
                }
                if (msg['mode'] == 'subscribe') {

                    //Commands.unSubscribe(conn,clientRedis, chanelClientPublic);
                    Commands.subscribe(conn,clientRedis, msg['data'].chat);

                    chanelClientPublic = msg['data'].chat;

                } else if (msg['mode'] == 'ping' && Config.Debug.enabled) {
                    conn.write(JSON.stringify({type:'system',mode:'pingFromNode'}));
                } else if ( msg['mode'] == 'userObject') {
                    conn.write(message);

                    // сохраняем имя и айди коннекта для этого соединения
                    userName = (msg.data.user) ? msg.data.user['userName'] : undefined;
                    connId = conn.id;

                } else {
                    //todo проверить вывод ошибки при неопознанном сообщении
                    //throw new Error('Неизвестный тип сообщения. type:"unknown"' + msg);
                    console.log('Неизвестный тип сообщения. type:"unknown"' + msg);
                }
                // система событий
                if (msg['mode'] == 'event' || msg['mode'] == 'trigger') {
                    conn.write(message);
                }

            } else if ( msg['type'] == 'message') { //отправить клиенту (либо просто сообщение, либо удалить)
                //console.log(msg);
                conn.write(message);
            } else if (msg['type'] == 'notice') {
                conn.write(message);
            }
        } else { // КАНАЛ ОБЩЕСТВЕННЫЙ
            conn.write(message);
        }
    });
    clientRedis.on('error', function(e) {
        console.log('>>> ERROR redis ' + e);
        console.error('>>> ERROR redis ' + e);
    });
    clientRedis.on('close', function (e) {
        if (Debug.fullLogs) console.log('Redis closed connection ' + e);
    });

    //отсылаем айди для привязки его к сессии пользователя
    Commands.auth(conn);

    //console.log('Hello' + conn.id);

});

/*** HTTP SERVER ***/
sockjsServer.installHandlers(server, {prefix:'/websocket'});
server.listen(9999, '0.0.0.0');

//******* SYSTEM

/* DEBUG */
var systemClientRedisSub = redis.createClient(), //для подписок
    systemClientRedisPub = redis.createClient(); //для сообщений

// Отправить всем клиентам уведомления
    function sendNoticeToAllClients (txt) {
        for (var key in localVar.clients) {
            systemClientRedisPub.publish(key,JSON.stringify({type:'notice',mode:'normal',data:txt}));
        }
    }

    // Уведомление о перезагрузке ноды
    var noticeTxt = 'Нода была перезагружена!';
    setTimeout(function () {
        //sendNoticeToAllClients(noticeTxt);
    }, 10000);
