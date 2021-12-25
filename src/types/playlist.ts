import { Track } from './track';

export type Playlist = {
  accessToken: string;
  refreshToken: string;
  playlistId: string;
  userId: string;
  code: string;
  expireDate: string;
  tracks: Track[];
  adminId: string;
  users: string[];
};

export type ApiTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: string;
  refresh_token: string;
};
