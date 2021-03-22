import axios, { AxiosRequestConfig } from 'axios';
import { Collection } from 'mongodb';
import qs from 'qs';
import { ApiTokenResponse, Playlist } from '../types/playlist';

interface IAuthService {
  getAccessToken(authCode: string): Promise<ApiTokenResponse>;
  checkCode(code: string, collection: Collection<Playlist>): Promise<Playlist | null>;
  generateCode(collection: Collection<Playlist>): Promise<string>;
}

export class AuthService implements IAuthService {
  async getAccessToken(authCode: string): Promise<ApiTokenResponse> {
    const data = {
      code: authCode,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: 'authorization_code',
    };

    const getAccessTokenConfig: AxiosRequestConfig = {
      url: 'https://accounts.spotify.com/api/token',
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' + Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'),
      },
      data: qs.stringify(data),
    };

    const response = await axios(getAccessTokenConfig);
    const responseBody: ApiTokenResponse = response.data;

    return responseBody;
  }
  async generateCode(collection: Collection<Playlist>): Promise<string> {
    let newCodeFound = false;
    let code = '';
    while (!newCodeFound) {
      code = Math.floor(Math.random() * (99999 - 10000) + 10000).toString();
      const result = await this.checkCode(code, collection);
      if (result === null) {
        newCodeFound = true;
      }
    }
    return code;
  }
  async checkCode(code: string, collection: Collection<Playlist>): Promise<Playlist | null> {
    const result = await collection.findOne({ code });
    return result;
  }
}

export default IAuthService;
