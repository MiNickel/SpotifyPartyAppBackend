"use strict";

var _express = _interopRequireDefault(require("express"));

var _cors = _interopRequireDefault(require("cors"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

require("dotenv/config");

var _axios = _interopRequireDefault(require("axios"));

var _mongodb = require("mongodb");

var _querystring = require("querystring");

var _functions = require("./functions");

var _qs = _interopRequireDefault(require("qs"));

var _regeneratorRuntime = _interopRequireDefault(require("regenerator-runtime"));

var _assert = require("assert");

var _winston = _interopRequireDefault(require("winston"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var logger = _winston["default"].createLogger({
  level: "info",
  format: _winston["default"].format.simple(),
  transports: [new _winston["default"].transports.Console()]
});

var uri = "mongodb+srv://".concat(process.env.USER, ":").concat(process.env.MONGODB_PW, "@cluster0.iy9j3.mongodb.net/<dbname>?retryWrites=true&w=majority");
var client = new _mongodb.MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

var ignoreFavicon = function ignoreFavicon(req, res, next) {
  if (req.originalUrl.includes("favicon.ico")) {
    res.status(204).end();
  }

  next();
};

var app = (0, _express["default"])();
app.use(ignoreFavicon);
app.use((0, _cors["default"])()).use((0, _cookieParser["default"])());
app.listen(process.env.PORT || 8000, function () {
  logger.info("Server started!");
  client.connect(function (err) {
    (0, _assert.strictEqual)(null, err);
    logger.info("Connected to MongoDB.");
  });
});
app.get("/playlist", /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime["default"].mark(function _callee(req, res) {
    var collection, document, tracks, access_token, _tracks;

    return _regeneratorRuntime["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            collection = client.db("spotify_party_app").collection("playlists");
            _context.next = 3;
            return collection.findOne({
              code: req.query.code
            });

          case 3:
            document = _context.sent;
            _context.prev = 4;
            _context.next = 7;
            return (0, _functions.getPlaylist)(document);

          case 7:
            tracks = _context.sent;
            res.json({
              tracks: tracks.data.items
            });
            _context.next = 22;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](4);
            _context.next = 15;
            return (0, _functions.getNewAccessToken)(document.refreshToken);

          case 15:
            access_token = _context.sent;
            document.accessToken = access_token;
            collection.updateOne({
              code: req.query.code
            }, {
              $set: document
            });
            _context.next = 20;
            return (0, _functions.getPlaylist)(document);

          case 20:
            _tracks = _context.sent;
            res.json({
              tracks: _tracks.data.items
            });

          case 22:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[4, 11]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());
app.get("/addTrack", /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime["default"].mark(function _callee2(req, res) {
    var trackId, code, collection, document, access_token;
    return _regeneratorRuntime["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            trackId = req.query.trackId;
            code = req.query.code;
            collection = client.db("spotify_party_app").collection("playlists");
            _context2.next = 5;
            return collection.findOne({
              code: req.query.code
            });

          case 5:
            document = _context2.sent;
            _context2.prev = 6;
            _context2.next = 9;
            return (0, _functions.addTrack)(trackId, document, collection, code);

          case 9:
            res.end();
            _context2.next = 22;
            break;

          case 12:
            _context2.prev = 12;
            _context2.t0 = _context2["catch"](6);
            _context2.next = 16;
            return (0, _functions.getNewAccessToken)(document.refreshToken);

          case 16:
            access_token = _context2.sent;
            document.accessToken = access_token;
            collection.updateOne({
              code: req.query.code
            }, {
              $set: document
            });
            _context2.next = 21;
            return (0, _functions.addTrack)(trackId, document, collection, code);

          case 21:
            res.end();

          case 22:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[6, 12]]);
  }));

  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());

Array.prototype.move = function (from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

app.get("/likeTrack", /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime["default"].mark(function _callee3(req, res) {
    var trackId, code, collection, document, access_token;
    return _regeneratorRuntime["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            trackId = req.query.trackId;
            code = req.query.code;
            collection = client.db("spotify_party_app").collection("playlists");
            _context3.next = 5;
            return collection.findOne({
              code: code
            });

          case 5:
            document = _context3.sent;
            _context3.prev = 6;
            _context3.next = 9;
            return (0, _functions.likeTrack)(trackId, code, document, collection);

          case 9:
            res.end();
            _context3.next = 22;
            break;

          case 12:
            _context3.prev = 12;
            _context3.t0 = _context3["catch"](6);
            _context3.next = 16;
            return (0, _functions.getNewAccessToken)(document.refreshToken);

          case 16:
            access_token = _context3.sent;
            document.accessToken = access_token;
            collection.updateOne({
              code: req.query.code
            }, {
              $set: document
            });
            _context3.next = 21;
            return (0, _functions.likeTrack)(trackId, code, document, collection);

          case 21:
            res.end();

          case 22:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[6, 12]]);
  }));

  return function (_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}());
app.get("/checkCode", /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime["default"].mark(function _callee4(req, res) {
    var collection;
    return _regeneratorRuntime["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            collection = client.db("spotify_party_app").collection("playlists");
            collection.findOne({
              code: req.query.code
            }, function (_err, result) {
              res.json(result);
            });

          case 2:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function (_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}());
app.get("/getAllTracks", /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime["default"].mark(function _callee5(req, res) {
    var collection, document;
    return _regeneratorRuntime["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            collection = client.db("spotify_party_app").collection("playlists");
            _context5.next = 3;
            return collection.findOne({
              code: req.query.code
            });

          case 3:
            document = _context5.sent;
            res.json(document.tracks);

          case 5:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function (_x9, _x10) {
    return _ref5.apply(this, arguments);
  };
}());
app.get("/currentlyPlayingTrack", /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime["default"].mark(function _callee6(req, res) {
    var collection, document, response, access_token, _response;

    return _regeneratorRuntime["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            collection = client.db("spotify_party_app").collection("playlists");
            _context6.next = 3;
            return collection.findOne({
              code: req.query.code
            });

          case 3:
            document = _context6.sent;
            _context6.prev = 4;
            _context6.next = 7;
            return (0, _functions.getCurrentlyPlayingTrack)(document);

          case 7:
            response = _context6.sent;

            if (response.status === 200) {
              res.json(response.data.item.id);
            } else {
              res.status(204).end();
            }

            _context6.next = 22;
            break;

          case 11:
            _context6.prev = 11;
            _context6.t0 = _context6["catch"](4);
            _context6.next = 15;
            return (0, _functions.getNewAccessToken)(document.refreshToken);

          case 15:
            access_token = _context6.sent;
            document.accessToken = access_token;
            collection.updateOne({
              code: req.query.code
            }, {
              $set: document
            });
            _context6.next = 20;
            return (0, _functions.getCurrentlyPlayingTrack)(document);

          case 20:
            _response = _context6.sent;

            if (_response.status === 200) {
              res.json(_response.data.item.id);
            } else {
              res.status(204).end();
            }

          case 22:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, null, [[4, 11]]);
  }));

  return function (_x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}());
app.get("/search", /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime["default"].mark(function _callee7(req, res) {
    var collection, document, response, access_token, test;
    return _regeneratorRuntime["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            collection = client.db("spotify_party_app").collection("playlists");
            _context7.next = 3;
            return collection.findOne({
              code: req.query.code
            });

          case 3:
            document = _context7.sent;
            _context7.prev = 4;
            _context7.next = 7;
            return (0, _functions.search)(req.query.search, document);

          case 7:
            response = _context7.sent;
            res.json({
              tracks: response.data.tracks.items
            });
            _context7.next = 20;
            break;

          case 11:
            _context7.prev = 11;
            _context7.t0 = _context7["catch"](4);
            _context7.next = 15;
            return (0, _functions.getNewAccessToken)(document.refreshToken);

          case 15:
            access_token = _context7.sent;
            document.accessToken = access_token;
            collection.updateOne({
              code: req.query.code
            }, {
              $set: document
            });
            test = (0, _functions.search)(req.query.search, document);
            test.then(function (response) {
              res.json({
                tracks: response.data.tracks.items
              });
            });

          case 20:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, null, [[4, 11]]);
  }));

  return function (_x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}());
app.get("/callback", function (req, res) {
  var code = req.query.code || null;
  var data = {
    code: code,
    redirect_uri: process.env.REDIRECT_URI,
    grant_type: "authorization_code"
  };
  var getAccessTokenConfig = {
    url: "https://accounts.spotify.com/api/token",
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET).toString("base64")
    },
    data: _qs["default"].stringify(data)
  };
  (0, _axios["default"])(getAccessTokenConfig).then(function (response) {
    if (response.status === 200) {
      var access_token = response.data.access_token;
      var refresh_token = response.data.refresh_token;
      var userId = (0, _functions.getUserId)(access_token);
      userId.then(function (userId) {
        var playlistId = (0, _functions.createNewPlaylist)(access_token, userId);
        playlistId.then(function (playlistId) {
          var code = (0, _functions.addPlaylistToDb)(client, access_token, refresh_token, userId, playlistId);
          code.then(function (code) {
            res.redirect("".concat(process.env.CLIENT_URI, "/#/party/") + code + "/new");
          });
        });
      });
    }
  })["catch"](function (error) {
    return logger.error("callback: " + JSON.stringify(error));
  });
});
app.get("/login", function (req, res) {
  var scope = "playlist-modify-private playlist-modify-public user-read-currently-playing user-read-playback-state";
  res.redirect("https://accounts.spotify.com/authorize?" + (0, _querystring.stringify)({
    response_type: "code",
    client_id: process.env.CLIENT_ID,
    scope: scope,
    redirect_uri: process.env.REDIRECT_URI
  }));
});