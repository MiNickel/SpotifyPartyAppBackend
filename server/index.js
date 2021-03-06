import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import axios from "axios";
import { MongoClient } from "mongodb";
import { stringify } from "querystring";
import {
  getCurrentlyPlayingTrack,
  search,
  createNewPlaylist,
  getNewAccessToken,
  getUserId,
  addPlaylistToDb,
  addTrack,
  likeTrack,
  getPlaylist,
  playTrack,
  splitPlaylist,
} from "./functions";
import { v4 as uuidv4 } from "uuid";
import qs from "qs";
// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from "regenerator-runtime";
import { strictEqual } from "assert";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

const uri = `mongodb+srv://${process.env.USER}:${process.env.MONGODB_PW}@cluster0.iy9j3.mongodb.net/<dbname>?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
let collection;

const corsOptions = {
  origin: process.env.CLIENT_URI,
  optionsSuccessStatus: 200,
};

const ignoreFavicon = (req, res, next) => {
  if (req.originalUrl.includes("favicon.ico")) {
    res.status(204).end();
  }
  next();
};

const app = express();

app.use(ignoreFavicon);

app.use(cors(corsOptions)).use(cookieParser());

app.listen(process.env.PORT || 8000, () => {
  logger.info("Server started!");
  client.connect(err => {
    strictEqual(null, err);
    logger.info("Connected to MongoDB.");
    collection = client.db("spotify_party_app").collection("playlists");
  });
});

app.get("/playlist", async (req, res) => {
  const document = await collection.findOne({ code: req.query.code });
  try {
    const tracks = await getPlaylist(document);
    const currentlyPlayingTrack = await getCurrentlyPlayingTrack(
      document.accessToken
    );
    if (currentlyPlayingTrack.data === "") {
      res.json({ tracks: tracks.data.items });
    }
    const newTracks = splitPlaylist(
      currentlyPlayingTrack.data.item.id,
      tracks.data.items
    );
    res.json({
      tracks: newTracks,
      currentlyPlayingTrack: currentlyPlayingTrack.data.item.id,
    });
  } catch (error) {
    const access_token = await getNewAccessToken(document.refreshToken);
    document.accessToken = access_token;
    collection.updateOne({ code: req.query.code }, { $set: document });
    const tracks = await getPlaylist(document);
    res.json({ tracks: tracks.data.items });
  }
});

app.get("/addTrack", async (req, res) => {
  const trackId = req.query.trackId;
  const code = req.query.code;
  const document = await collection.findOne({ code: req.query.code });
  try {
    await addTrack(trackId, document, collection, code);
    res.end();
  } catch (error) {
    const access_token = await getNewAccessToken(document.refreshToken);
    document.accessToken = access_token;
    collection.updateOne({ code: req.query.code }, { $set: document });
    await addTrack(trackId, document, collection, code);
    res.end();
  }
});

Array.prototype.move = function (from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

app.get("/likeTrack", async (req, res) => {
  const trackId = req.query.trackId;
  const code = req.query.code;
  const document = await collection.findOne({ code });
  try {
    await likeTrack(trackId, code, document, collection);
    res.end();
  } catch (error) {
    const access_token = await getNewAccessToken(document.refreshToken);
    document.accessToken = access_token;
    collection.updateOne({ code: req.query.code }, { $set: document });
    await likeTrack(trackId, code, document, collection);
    res.end();
  }
});

app.get("/playTrack", async (req, res) => {
  const trackId = req.query.trackId;
  const code = req.query.code;
  const adminId = req.query.adminId;
  const document = await collection.findOne({ code });
  if (document.adminId !== adminId) {
    res.status(403).end();
  }
  const response = await playTrack(trackId, document);
  if (response.response && response.response.status === 404) {
    res.status(404).end();
  }
  res.end();
});

app.get("/checkCode", async (req, res) => {
  collection.findOne({ code: req.query.code }, (_err, result) => {
    res.json(result);
  });
});

app.get("/currentlyPlayingTrack", async (req, res) => {
  const document = await collection.findOne({ code: req.query.code });
  try {
    const response = await getCurrentlyPlayingTrack(document.accessToken);
    if (response.status === 200) {
      res.json(response.data.item.id);
    } else {
      res.status(204).end();
    }
  } catch (error) {
    const access_token = await getNewAccessToken(document.refreshToken);
    document.accessToken = access_token;
    collection.updateOne({ code: req.query.code }, { $set: document });
    const response = await getCurrentlyPlayingTrack(document);
    if (response.status === 200) {
      res.json(response.data.item.id);
    } else {
      res.status(204).end();
    }
  }
});

app.get("/search", async (req, res) => {
  const document = await collection.findOne({ code: req.query.code });
  try {
    const response = await search(req.query.search, document);
    res.json({ tracks: response.data.tracks.items });
  } catch (error) {
    const access_token = await getNewAccessToken(document.refreshToken);
    document.accessToken = access_token;
    collection.updateOne({ code: req.query.code }, { $set: document });
    const test = search(req.query.search, document);
    test.then(response => {
      res.json({ tracks: response.data.tracks.items });
    });
  }
});

app.get("/checkAdminId", async (req, res) => {
  const document = await collection.findOne({ adminId: req.query.adminId });
  if (document === null) {
    res.status(404).end();
  }
  res.status(200).end();
});

app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code || null;
    const data = {
      code: code,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: "authorization_code",
    };

    const getAccessTokenConfig = {
      url: "https://accounts.spotify.com/api/token",
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
          ).toString("base64"),
      },
      data: qs.stringify(data),
    };

    const response = await axios(getAccessTokenConfig);
    if (response.status === 200) {
      const access_token = response.data.access_token;
      const refresh_token = response.data.refresh_token;
      const userId = await getUserId(access_token);
      const playlistId = await createNewPlaylist(access_token, userId);
      const uuid = uuidv4();
      const code = await addPlaylistToDb(
        collection,
        access_token,
        refresh_token,
        userId,
        playlistId,
        uuid
      );
      res.redirect(`${process.env.CLIENT_URI}/#/party/` + code + "/" + uuid);
    }
  } catch (error) {
    logger.error("callback: " + JSON.stringify(error));
  }
});

app.get("/login", (req, res) => {
  const scope =
    "playlist-modify-private playlist-modify-public user-read-currently-playing user-read-playback-state user-modify-playback-state";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      stringify({
        response_type: "code",
        client_id: process.env.CLIENT_ID,
        scope: scope,
        redirect_uri: process.env.REDIRECT_URI,
      })
  );
});
