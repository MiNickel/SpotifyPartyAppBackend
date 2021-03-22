import axios from 'axios';
import { decrypt } from '../util/crypto';

export class UserService {
  public getUserId = async (accessToken: string): Promise<string> => {
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: 'Bearer ' + decrypt(accessToken),
      },
    });
    const userId: string = response.data.id;
    return userId;
  };
}
