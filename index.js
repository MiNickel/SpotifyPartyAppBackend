import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { stringify } from "querystring";
import { strictEqual } from "assert";
import axios from "axios";
import qs from "qs";
import "dotenv/config";
import { MongoClient } from "mongodb";

const redirectUri = "https://spotify-party-app-backend.herokuapp.com/callback";
const uri = `mongodb+srv://${process.env.USER}:${process.env.MONGODB_PW}@cluster0.iy9j3.mongodb.net/<dbname>?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const connect = () => {
  client.connect(err => {
    strictEqual(null, err);
    console.log("Connected to MongoDB");
    // client.close();
  });
};

const createNewPlaylist = async (accessToken, userId) => {
  const playlistId = await axios
    .post(
      "https://api.spotify.com/v1/users/" + userId + "/playlists",
      {
        name: "NewPlaylist1",
        public: "false",
        collaborative: "true"
      },
      {
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json"
        }
      }
    )
    .then(response => {
      return response.data.id;
    })
    .catch(() => {
      console.log("createNewPlaylist");
    });

  return playlistId;
};

const getNewAccessToken = async refreshToken => {
  // requesting access token from refresh token
  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
        ).toString("base64")
    },
    data: qs.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  };

  const response = await axios(authOptions);
  return response.data.access_token;
};

const getUserId = async accessToken => {
  const userId = await axios
    .get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: "Bearer " + accessToken
      }
    })
    .then(response => {
      return response.data.id;
    })
    .catch(() => console.log("getUserId"));
  return userId;
};

const addPlaylistToDb = async (
  accessToken,
  refreshToken,
  userId,
  playlistId
) => {
  const collection = client.db("spotify_party_app").collection("playlists");
  const code = Math.floor(Math.random() * 100000);
  const result = await collection
    .insertOne({
      accessToken,
      refreshToken,
      playlistId,
      userId,
      code: code.toString()
    })
    .catch(() => console.log("addPlaylistToDb"));
  return result.ops[0].code;
};

const app = express();

app.use(cors()).use(cookieParser());

app.listen(8000, () => {
  console.log("Server started!");
  connect();
});

app.get("/test", async (req, res) => {
  res.send("Hello World");
});

app.get("/playlist", async (req, res) => {
  const collection = client.db("spotify_party_app").collection("playlists");
  const document = await collection
    .findOne({ code: req.query.code })
    .catch(err => console.log(err));
  const tracks = await axios
    .get(
      "https://api.spotify.com/v1/playlists/" + document.playlistId + "/tracks",
      {
        headers: {
          Authorization: "Bearer " + document.accessToken
        }
      }
    )
    .catch(() => {
      console.log("getPlaylist");
    });
  res.json({ tracks: tracks.data.items });
});

app.get("/addTrack", async (req, res) => {
  const trackId = req.query.trackId;
  const collection = client.db("spotify_party_app").collection("playlists");
  const document = await collection.findOne({ code: req.query.code });
  axios
    .post(
      "https://api.spotify.com/v1/playlists/" +
        document.playlistId +
        "/tracks" +
        "?uris=spotify:track:" +
        trackId,
      {},
      {
        headers: {
          Authorization: "Bearer " + document.accessToken,
          "Content-Type": "application/json"
        }
      }
    )
    .then(() => {
      res.end();
    });
});

app.get("/checkCode", async (req, res) => {
  const collection = client.db("spotify_party_app").collection("playlists");
  collection.findOne({ code: req.query.code }, (_err, result) => {
    res.json(result);
  });
});

app.get("/currentlyPlayingTrack", async (req, res) => {
  const collection = client.db("spotify_party_app").collection("playlists");
  const document = await collection.findOne({ code: req.query.code });
  const response = await axios
    .get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: "Bearer " + document.accessToken,
        "Content-Type": "application/json"
      }
    })
    .catch(error => {
      console.log(error);
    });
  if (response.status === 200) {
    res.json(response.data.item.id);
  } else {
    res.status(204).end();
  }
});

const search = async (searchString, document) => {
  const tracks = await axios
    .get("https://api.spotify.com/v1/search", {
      params: {
        q: searchString,
        type: "track"
      },
      headers: {
        Authorization: "Bearer " + document.accessToken,
        "Content-Type": "application/json"
      }
    })
    .catch(() => {
      console.log("error");
    });
  return tracks;
};

app.get("/search", async (req, res) => {
  const collection = client.db("spotify_party_app").collection("playlists");
  const document = await collection.findOne({ code: req.query.code });
  const response = search(req.query.search, document);
  response
    .then(response => {
      res.json({ tracks: response.data.tracks.items });
    })
    .catch(() => {
      const newResponse = getNewAccessToken(document.refreshToken);
      newResponse.then(access_token => {
        document.accessToken = access_token;
        collection.updateOne({ code: req.query.code }, { $set: document });
        const test = search(req.query.search, document);
        test.then(response => {
          res.json({ tracks: response.data.tracks.items });
        });
      });
    });
});

app.get("/callback", (req, res) => {
  const code = req.query.code || null;

  const data = {
    code: code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  };

  const getAccessTokenConfig = {
    url: "https://accounts.spotify.com/api/token",
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
        ).toString("base64")
    },
    data: qs.stringify(data)
  };

  axios(getAccessTokenConfig)
    .then(response => {
      if (response.status === 200) {
        const access_token = response.data.access_token;
        const refresh_token = response.data.refresh_token;
        const userId = getUserId(access_token);
        userId.then(userId => {
          const playlistId = createNewPlaylist(access_token, userId);
          playlistId.then(playlistId => {
            const code = addPlaylistToDb(
              access_token,
              refresh_token,
              userId,
              playlistId
            );
            code.then(code => {
              res.redirect("http://localhost:8080/#/party/" + code);
            });
          });
        });
      }
    })
    .catch(() => console.log("callback"));
});

app.get("/login", (req, res) => {
  const scope =
    "playlist-modify-private playlist-modify-public user-read-currently-playing user-read-playback-state";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      stringify({
        response_type: "code",
        client_id: process.env.CLIENT_ID,
        scope: scope,
        redirect_uri: redirectUri
      })
  );
});
