import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';

type RefreshTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
};

export const getNewAccessToken = async (refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> => {
  // requesting access token from refresh token
  const authOptions: AxiosRequestConfig = {
    url: 'https://accounts.spotify.com/api/token',
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'),
    },
    data: qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  };

  const response = await axios(authOptions);
  const data: RefreshTokenResponse = response.data;
  const accessToken = data.access_token;
  const expiresIn = data.expires_in;
  return { accessToken, expiresIn };
};
