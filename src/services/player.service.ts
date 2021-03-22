import axios from 'axios';
import { Playlist } from '../types/playlist';
import { decrypt } from '../util/crypto';

export class PlayerService {
  async playTrack(trackId: string, document: Playlist) {
    return await axios.put(
      'https://api.spotify.com/v1/me/player/play',
      {
        context_uri: 'spotify:playlist:' + document.playlistId,
        offset: { uri: 'spotify:track:' + trackId },
        position_ms: 0,
      },
      {
        headers: {
          Authorization: 'Bearer ' + decrypt(document.accessToken),
          'Content-Type': 'application/json',
        },
      }
    );
  }

  public getCurrentlyPlayingTrack = async (accessToken: string) => {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: 'Bearer ' + decrypt(accessToken),
        'Content-Type': 'application/json',
      },
    });
    const currentlyPlayingTrack: SpotifyApi.CurrentlyPlayingObject | '' = response.data;
    return currentlyPlayingTrack;
  };
}
