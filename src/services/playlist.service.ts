import axios from 'axios';
import { Collection } from 'mongodb';
import { Playlist } from '../types/playlist';
import { decrypt } from '../util/crypto';
import { PlayerService } from './player.service';

export class PlaylistService {
  private playerService = new PlayerService();

  async addPlaylistToDb(playlist: Playlist, collection: Collection<Playlist>): Promise<string> {
    const result = await collection.insertOne(playlist);

    return result.ops[0].code;
  }

  async createNewPlaylist(accessToken: string, userId: string): Promise<string> {
    const response = await axios.post(
      'https://api.spotify.com/v1/users/' + userId + '/playlists',
      {
        name: 'NewPlaylist1',
        public: 'false',
        collaborative: 'true',
      },
      {
        headers: {
          Authorization: 'Bearer ' + decrypt(accessToken),
          'Content-Type': 'application/json',
        },
      }
    );
    const playlistId = response.data.id as string;

    return playlistId;
  }

  public getPlaylist = async (document: Playlist) => {
    const response = await axios.get('https://api.spotify.com/v1/playlists/' + document.playlistId + '/tracks', {
      headers: {
        Authorization: 'Bearer ' + decrypt(document.accessToken),
      },
    });
    const playlist: SpotifyApi.PagingObject<SpotifyApi.PlaylistTrackObject> = response.data;
    return playlist;
  };

  public splitPlaylist = (currentlyPlayingTrackId: string, tracks: SpotifyApi.PlaylistTrackObject[]) => {
    const indexToSplitAt = tracks.findIndex((item) => item.track.id === currentlyPlayingTrackId);
    if (indexToSplitAt === -1) return tracks;
    const newTracks = tracks.slice(indexToSplitAt);
    return newTracks;
  };

  public addTrack = async (trackId: string, document: Playlist, collection: Collection<Playlist>, code: string) => {
    await axios.post(
      'https://api.spotify.com/v1/playlists/' + document.playlistId + '/tracks' + '?uris=spotify:track:' + trackId,
      {},
      {
        headers: {
          Authorization: 'Bearer ' + decrypt(document.accessToken),
          'Content-Type': 'application/json',
        },
      }
    );
    const newTrack = { trackId, likes: 1 };
    collection.updateOne({ code }, { $push: { tracks: newTrack } });
  };

  public likeTrack = async (trackId: string, code: string, document: Playlist, collection: Collection<Playlist>) => {
    const documentTracks = document.tracks;

    const currentlyPlayingTrack = await this.playerService.getCurrentlyPlayingTrack(document.accessToken);
    let currentlyPlayingTrackIndex = -1;
    if (currentlyPlayingTrack !== '') {
      const currentlyPlayingTrackId = currentlyPlayingTrack.item!.id;
      currentlyPlayingTrackIndex = documentTracks.findIndex((item) => item.trackId === currentlyPlayingTrackId);
    }

    const rangeStart = documentTracks.findIndex((item) => item.trackId === trackId);

    if (rangeStart < currentlyPlayingTrackIndex) {
      return;
    }

    documentTracks[rangeStart].likes += 1;

    const documentTrackToSort = documentTracks.slice(currentlyPlayingTrackIndex + 1);

    const sortedTrackList = documentTrackToSort.sort((a, b) => {
      return b.likes - a.likes;
    });

    const trackIndexAfter = sortedTrackList.findIndex((item) => item.trackId === trackId);

    const insertBefore = trackIndexAfter + currentlyPlayingTrackIndex + 1;
    documentTracks.splice(insertBefore, 0, documentTracks.splice(rangeStart, 1)[0]);

    axios.put(
      'https://api.spotify.com/v1/playlists/' + document.playlistId + '/tracks',
      {
        range_start: rangeStart,
        insert_before: insertBefore,
      },
      {
        headers: {
          Authorization: 'Bearer ' + decrypt(document.accessToken),
          'Content-Type': 'application/json',
        },
      }
    );
    collection.updateOne({ code }, { $set: { tracks: documentTracks } });
  };
}
