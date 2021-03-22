import axios from 'axios';
import { Playlist } from '../types/playlist';
import { decrypt } from '../util/crypto';

export class SearchService {
  public searchSong = async (searchString: string, accessToken: string) => {
    return axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: searchString,
        type: 'track',
      },
      headers: {
        Authorization: 'Bearer ' + decrypt(accessToken),
        'Content-Type': 'application/json',
      },
    });
  };
}
