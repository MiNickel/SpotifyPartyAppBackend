import axios from "axios";
import qs from "qs";
// eslint-disable-next-line no-unused-vars
import regeneratorRuntime from "regenerator-runtime";
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

export const createNewPlaylist = async (accessToken, userId) => {
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
    .catch(error => {
      logger.error("createNewPlaylist: " + JSON.stringify(error));
    });

  return playlistId;
};

export const addTrack = async (trackId, document, collection, code) => {
  await axios
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
      const newTrack = { trackId, likes: 1 };
      collection.updateOne({ code }, { $push: { tracks: newTrack } });
    })
    .catch(error =>
      logger.error("addTrack: " + logger.error(JSON.stringify(error)))
    );
};

export const likeTrack = async (trackId, code, document, collection) => {
  const documentTracks = document.tracks;

  const response = await getCurrentlyPlayingTrack(document);
  let currentlyPlayingTrackIndex = -1;
  if (response.data !== "") {
    const currentlyPlayingTrackId = response.data.item.id;
    currentlyPlayingTrackIndex = documentTracks.findIndex(
      item => item.trackId === currentlyPlayingTrackId
    );
  }

  const rangeStart = documentTracks.findIndex(item => item.trackId === trackId);

  if (rangeStart < currentlyPlayingTrackIndex) {
    return;
  }

  documentTracks[rangeStart].likes += 1;

  const documentTrackToSort = documentTracks.slice(
    currentlyPlayingTrackIndex + 1
  );

  const sortedTrackList = documentTrackToSort.sort((a, b) => {
    return b.likes - a.likes;
  });

  const trackIndexAfter = sortedTrackList.findIndex(
    item => item.trackId === trackId
  );

  let insertBefore = trackIndexAfter + currentlyPlayingTrackIndex + 1;
  documentTracks.move(rangeStart, insertBefore);

  axios
    .put(
      "https://api.spotify.com/v1/playlists/" + document.playlistId + "/tracks",
      {
        range_start: rangeStart,
        insert_before: insertBefore
      },
      {
        headers: {
          Authorization: "Bearer " + document.accessToken,
          "Content-Type": "application/json"
        }
      }
    )
    .catch(error => logger.error("likeTrack: " + JSON.stringify(error)));
  collection.updateOne({ code }, { $set: { tracks: documentTracks } });
};

export const getPlaylist = async document => {
  return axios.get(
    "https://api.spotify.com/v1/playlists/" + document.playlistId + "/tracks",
    {
      headers: {
        Authorization: "Bearer " + document.accessToken
      }
    }
  );
};

export const getNewAccessToken = async refreshToken => {
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

export const getUserId = async accessToken => {
  const userId = await axios
    .get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: "Bearer " + accessToken
      }
    })
    .then(response => {
      return response.data.id;
    })
    .catch(error => logger.error("getUserId" + JSON.stringify(error)));
  return userId;
};

export const addPlaylistToDb = async (
  client,
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
      code: code.toString(),
      tracks: []
    })
    .catch(error => logger.error("addPlaylistToDb: " + JSON.stringify(error)));
  return result.ops[0].code;
};

export const getCurrentlyPlayingTrack = async document => {
  return axios
    .get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: "Bearer " + document.accessToken,
        "Content-Type": "application/json"
      }
    })
    .catch(error => {
      logger.error("getCurrentlyPlayingTrack: " + JSON.stringify(error));
    });
};

export const search = async (searchString, document) => {
  return axios
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
    .catch(error => {
      logger.error("search: " + JSON.stringify(error));
    });
};
