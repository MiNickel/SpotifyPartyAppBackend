"use strict";

var _express = _interopRequireDefault(require("express"));

var _cors = _interopRequireDefault(require("cors"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _querystring = require("querystring");

var _assert = require("assert");

var _axios = _interopRequireDefault(require("axios"));

var _qs = _interopRequireDefault(require("qs"));

require("dotenv/config");

var _mongodb = require("mongodb");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var redirectUri = "https://spotify-party-app-backend.herokuapp.com/callback";
var uri = "mongodb+srv://".concat(process.env.USER, ":").concat(process.env.MONGODB_PW, "@cluster0.iy9j3.mongodb.net/<dbname>?retryWrites=true&w=majority");
var client = new _mongodb.MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

var connect = function connect() {
  client.connect(function (err) {
    (0, _assert.strictEqual)(null, err);
    console.log("Connected to MongoDB"); // client.close();
  });
};

var createNewPlaylist = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(accessToken, userId) {
    var playlistId;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _axios["default"].post("https://api.spotify.com/v1/users/" + userId + "/playlists", {
              name: "NewPlaylist1",
              "public": "false",
              collaborative: "true"
            }, {
              headers: {
                Authorization: "Bearer " + accessToken,
                "Content-Type": "application/json"
              }
            }).then(function (response) {
              return response.data.id;
            })["catch"](function () {
              console.log("createNewPlaylist");
            });

          case 2:
            playlistId = _context.sent;
            return _context.abrupt("return", playlistId);

          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function createNewPlaylist(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var getNewAccessToken = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(refreshToken) {
    var authOptions, response;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // requesting access token from refresh token
            authOptions = {
              url: "https://accounts.spotify.com/api/token",
              method: "POST",
              headers: {
                Authorization: "Basic " + Buffer.from(process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET).toString("base64")
              },
              data: _qs["default"].stringify({
                grant_type: "refresh_token",
                refresh_token: refreshToken
              })
            };
            _context2.next = 3;
            return (0, _axios["default"])(authOptions);

          case 3:
            response = _context2.sent;
            return _context2.abrupt("return", response.data.access_token);

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function getNewAccessToken(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

var getUserId = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(accessToken) {
    var userId;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return _axios["default"].get("https://api.spotify.com/v1/me", {
              headers: {
                Authorization: "Bearer " + accessToken
              }
            }).then(function (response) {
              return response.data.id;
            })["catch"](function () {
              return console.log("getUserId");
            });

          case 2:
            userId = _context3.sent;
            return _context3.abrupt("return", userId);

          case 4:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function getUserId(_x4) {
    return _ref3.apply(this, arguments);
  };
}();

var addPlaylistToDb = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(accessToken, refreshToken, userId, playlistId) {
    var collection, code, result;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            collection = client.db("spotify_party_app").collection("playlists");
            code = Math.floor(Math.random() * 100000);
            _context4.next = 4;
            return collection.insertOne({
              accessToken: accessToken,
              refreshToken: refreshToken,
              playlistId: playlistId,
              userId: userId,
              code: code.toString()
            })["catch"](function () {
              return console.log("addPlaylistToDb");
            });

          case 4:
            result = _context4.sent;
            return _context4.abrupt("return", result.ops[0].code);

          case 6:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function addPlaylistToDb(_x5, _x6, _x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

var app = (0, _express["default"])();
app.use((0, _cors["default"])()).use((0, _cookieParser["default"])());
app.listen(process.env.PORT || 8000, function () {
  console.log("Server started!");
  connect();
});
app.get("/test", /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(req, res) {
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            res.send("Hello World");

          case 1:
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
app.get("/playlist", /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(req, res) {
    var collection, document, tracks;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            collection = client.db("spotify_party_app").collection("playlists");
            _context6.next = 3;
            return collection.findOne({
              code: req.query.code
            })["catch"](function (err) {
              return console.log(err);
            });

          case 3:
            document = _context6.sent;
            _context6.next = 6;
            return _axios["default"].get("https://api.spotify.com/v1/playlists/" + document.playlistId + "/tracks", {
              headers: {
                Authorization: "Bearer " + document.accessToken
              }
            })["catch"](function () {
              console.log("getPlaylist");
            });

          case 6:
            tracks = _context6.sent;
            res.json({
              tracks: tracks.data.items
            });

          case 8:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));

  return function (_x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}());
app.get("/addTrack", /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(req, res) {
    var trackId, collection, document;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            trackId = req.query.trackId;
            collection = client.db("spotify_party_app").collection("playlists");
            _context7.next = 4;
            return collection.findOne({
              code: req.query.code
            });

          case 4:
            document = _context7.sent;

            _axios["default"].post("https://api.spotify.com/v1/playlists/" + document.playlistId + "/tracks" + "?uris=spotify:track:" + trackId, {}, {
              headers: {
                Authorization: "Bearer " + document.accessToken,
                "Content-Type": "application/json"
              }
            }).then(function () {
              res.end();
            });

          case 6:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));

  return function (_x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}());
app.get("/checkCode", /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(req, res) {
    var collection;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            collection = client.db("spotify_party_app").collection("playlists");
            collection.findOne({
              code: req.query.code
            }, function (_err, result) {
              res.json(result);
            });

          case 2:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));

  return function (_x15, _x16) {
    return _ref8.apply(this, arguments);
  };
}());
app.get("/currentlyPlayingTrack", /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(req, res) {
    var collection, document, response;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            collection = client.db("spotify_party_app").collection("playlists");
            _context9.next = 3;
            return collection.findOne({
              code: req.query.code
            });

          case 3:
            document = _context9.sent;
            _context9.next = 6;
            return _axios["default"].get("https://api.spotify.com/v1/me/player/currently-playing", {
              headers: {
                Authorization: "Bearer " + document.accessToken,
                "Content-Type": "application/json"
              }
            })["catch"](function (error) {
              console.log(error);
            });

          case 6:
            response = _context9.sent;

            if (response.status === 200) {
              res.json(response.data.item.id);
            } else {
              res.status(204).end();
            }

          case 8:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9);
  }));

  return function (_x17, _x18) {
    return _ref9.apply(this, arguments);
  };
}());

var search = /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(searchString, document) {
    var tracks;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.next = 2;
            return _axios["default"].get("https://api.spotify.com/v1/search", {
              params: {
                q: searchString,
                type: "track"
              },
              headers: {
                Authorization: "Bearer " + document.accessToken,
                "Content-Type": "application/json"
              }
            })["catch"](function () {
              console.log("error");
            });

          case 2:
            tracks = _context10.sent;
            return _context10.abrupt("return", tracks);

          case 4:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10);
  }));

  return function search(_x19, _x20) {
    return _ref10.apply(this, arguments);
  };
}();

app.get("/search", /*#__PURE__*/function () {
  var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(req, res) {
    var collection, document, response;
    return regeneratorRuntime.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            collection = client.db("spotify_party_app").collection("playlists");
            _context11.next = 3;
            return collection.findOne({
              code: req.query.code
            });

          case 3:
            document = _context11.sent;
            response = search(req.query.search, document);
            response.then(function (response) {
              res.json({
                tracks: response.data.tracks.items
              });
            })["catch"](function () {
              var newResponse = getNewAccessToken(document.refreshToken);
              newResponse.then(function (access_token) {
                document.accessToken = access_token;
                collection.updateOne({
                  code: req.query.code
                }, {
                  $set: document
                });
                var test = search(req.query.search, document);
                test.then(function (response) {
                  res.json({
                    tracks: response.data.tracks.items
                  });
                });
              });
            });

          case 6:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11);
  }));

  return function (_x21, _x22) {
    return _ref11.apply(this, arguments);
  };
}());
app.get("/callback", function (req, res) {
  var code = req.query.code || null;
  var data = {
    code: code,
    redirect_uri: redirectUri,
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
      var userId = getUserId(access_token);
      userId.then(function (userId) {
        var playlistId = createNewPlaylist(access_token, userId);
        playlistId.then(function (playlistId) {
          var code = addPlaylistToDb(access_token, refresh_token, userId, playlistId);
          code.then(function (code) {
            res.redirect("http://localhost:8080/#/party/" + code);
          });
        });
      });
    }
  })["catch"](function () {
    return console.log("callback");
  });
});
app.get("/login", function (req, res) {
  var scope = "playlist-modify-private playlist-modify-public user-read-currently-playing user-read-playback-state";
  res.redirect("https://accounts.spotify.com/authorize?" + (0, _querystring.stringify)({
    response_type: "code",
    client_id: process.env.CLIENT_ID,
    scope: scope,
    redirect_uri: redirectUri
  }));
});