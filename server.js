var express = require('express'),
app = express.createServer();

var sys = require("sys");
var url = require("url");
var qs = require("querystring");

// when the daemon started
var starttime = (new Date()).getTime();

app.configure(function(){
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.set('views', __dirname + '/views');
    app.set('views');
    app.set('view engine', 'jade');
});

app.get("/", function(req, res){
    res.render('index', {
            channel: "pizzastore"
    } );
});

app.get("/join", function(req, res){
    res.contentType('json');

    var nick = qs.parse(url.parse(req.url).query).nick;
    if (nick == null || nick.length == 0) {
        res.send(JSON.stringify({error: "Bad nick."}, 400));
        return;
    }

    var channel_id = qs.parse(url.parse(req.url).query).channel;
    if (channel_id == null || channel_id.length == 0) {
        res.send(JSON.stringify({error: "Bad channel."}, 400));
        return;
    }

    var session = createSession(nick);
    if (session == null) {
        res.send(JSON.stringify({error: "Nick in use."}, 400));
        return;
    }
    sys.puts("url :" + req.url  );
    sys.puts("channel :" + channel_id  );
    sys.puts("connection: " + nick + "@" + res.connection.remoteAddress);


    channel.appendMessage(channel_id, session.nick, "join");
    res.send(JSON.stringify({ id: session.id
                            , nick: session.nick
                            , rss: mem.rss
                            , starttime: starttime
                            , channel: channel_id
                            },
                          200));
});

// Should this be quit? Session is destroyed on quit not part to a diff channel
app.get("/part", function (req, res) {
    var id = qs.parse(url.parse(req.url).query).id;
    var session;
    if (id && sessions[id]) {
        session = sessions[id];
        session.destroy();
    }
    res.send(JSON.stringify({ rss: mem.rss }), 200);
});

app.get("/recv", function (req, res) {
    if (!qs.parse(url.parse(req.url).query).since) {
        res.send(JSON.stringify({error: "Must supply since parameter"}, 400));
        return;
    }
    var id = qs.parse(url.parse(req.url).query).id;

    if (!qs.parse(url.parse(req.url).query).channel) {
        res.send(JSON.stringify({error: "Must supply channel parameter"}, 400));
        return;
    }
    var channel_id = qs.parse(url.parse(req.url).query).channel;

    var session;
    if (id && sessions[id]) {
        session = sessions[id];
        session.poke();
    }
    var since = parseInt(qs.parse(url.parse(req.url).query).since, 10);

    channel.query(channel_id, since, function (messages) {
        if (session) session.poke();
        res.send(JSON.stringify({ messages: messages, rss: mem.rss }, 200));
    });

});
app.get("/send", function (req, res) {
    var id = qs.parse(url.parse(req.url).query).id;
    var text = qs.parse(url.parse(req.url).query).text;

    if (!qs.parse(url.parse(req.url).query).channel) {
        res.send(JSON.stringify({error: "Must supply channel parameter"}, 400));
        return;
    }
    var channel_id = qs.parse(url.parse(req.url).query).channel;

    var session = sessions[id];
    if (!session || !text) {
        res.send(JSON.stringify({ error: "No such session id" }, 400));
        return;
    }

    session.poke();

    channel.appendMessage(channel_id, session.nick, "msg", text);
    res.send(JSON.stringify({ rss: mem.rss }, 200));
});



var mem = process.memoryUsage();
// every 10 seconds poll for the memory.
setInterval(function () {
    mem = process.memoryUsage();
}, 10*1000);


var sessions = {};
function createSession (nick) {
    if (nick.length > 50) return null;
    if (/[^\w_\-^!]/.exec(nick)) return null;

    for (var i in sessions) {
        var session = sessions[i];
        if (session && session.nick === nick) return null;
    }
    var session = {
        nick: nick,
        id: Math.floor(Math.random()*99999999999).toString(),
        timestamp: new Date(),

        poke: function () {
            session.timestamp = new Date();
        },

        destroy: function () {
            channel.appendMessage(channel_id, session.nick, "part");
            delete sessions[session.id];
        }
    };


    sessions[session.id] = session;
    return session;
}
var MESSAGE_BACKLOG = 200,
SESSION_TIMEOUT = 60 * 1000;


var channel = new function () {
    var channels = []
        , callbacks = [];

    //this.appendMessage = function (nick, type, text) {
    this.appendMessage = function (channel_id, nick, type, text) {
        var m = { nick: nick
                  , type: type // "msg", "join", "part"
                  , text: text
                  , timestamp: (new Date()).getTime()
                };

        switch (type) {
        case "msg":
            sys.puts("<" + nick + "> " + text);
            break;
        case "join":
            sys.puts(nick + " join");
            break;
        case "part":
            sys.puts(nick + " part");
            break;
        }

        // Create channel if it does not exist
        if(!channels[channel_id]){
            channels[channel_id] = [];
            callbacks[channel_id] = [];

        }

        console.log(channels[channel_id]);

        //messages.push( m );
        channels[channel_id].push( m );

//        while (callbacks.length > 0) {
//            callbacks.shift().callback([m]);
//        }
        while (callbacks[channel_id].length > 0) {
            callbacks[channel_id].shift().callback([m]);
        }

        //while (messages.length > MESSAGE_BACKLOG)
        //    messages.shift();
        while (channels[channel_id].length > MESSAGE_BACKLOG)
            channels[channel_id].shift();
    };

    this.query = function (channel_id, since, callback) {
        var matching = [];
        //for (var i = 0; i < messages.length; i++) {
        //   var message = messages[i];
        //    if (message.timestamp > since)
        //        matching.push(message)
        //}

        if(channels[channel_id]) {
            console.log('query: ' + channel_id + " length: " + channels[channel_id].length );
            for (var i = 0; i < channels[channel_id].length; i++) {
                var message = channels[channel_id][i];
                if (message.timestamp > since)
                    matching.push(message)
            }
        }

        if (matching.length != 0) {
            callback(matching);
        } else {
            callbacks[channel_id].push({ timestamp: new Date(), callback: callback });
        }
    };

    // clear old callbacks
    // they can hang around for at most 30 seconds.
    setInterval(function (channel_id) {
        if(callbacks[channel_id]){
            var now = new Date();
            while (callbacks[channel_id].length > 0 && now - callbacks[channel_id][0].timestamp > 30*1000) {
                callbacks[channe_id].shift().callback([]);
            }
        }
    }, 3000);
};
var port = process.env.C9_PORT || 3000;
app.listen(port);
console.log('Express server started on port %s', app.address().port);
