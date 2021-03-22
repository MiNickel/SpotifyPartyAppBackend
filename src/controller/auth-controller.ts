import axios, { AxiosRequestConfig } from 'axios';
import express from 'express';
import moment from 'moment';
import { Collection } from 'mongodb';
import qs from 'qs';
import { stringify } from 'querystring';
import { Playlist } from '../types/playlist';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../services/user.service';
import { PlaylistService } from '../services/playlist.service';
import Controller from './controller';
import { encrypt } from '../util/crypto';
import IAuthService, { AuthService } from '../services/auth.service';

class AuthController extends Controller {
  private userService = new UserService();
  private playlistService = new PlaylistService();
  private readonly authService: IAuthService = new AuthService();

  constructor() {
    super();
  }

  initializeRoutes() {
    this.router.get('/checkCode', (req, res, next) => this.checkCode(req, res).catch(next));
    this.router.get('/checkAdminId', (req, res, next) => this.checkAdminId(req, res).catch(next));
    this.router.get('/login', (req, res) => this.login(req, res));
    this.router.get('/callback', (req, res, next) => this.callbackAfterLogin(req, res).catch(next));
  }

  async callbackAfterLogin(req: express.Request, res: express.Response) {
    const authCode = req.query.code as string;
    const collection: Collection<Playlist> = req.app.locals.collection;

    const playlistData = await this.authService.getAccessToken(authCode);
    const accessToken: string = encrypt(playlistData.access_token);
    const userId: string = await this.userService.getUserId(accessToken);
    const adminId = uuidv4();
    const code = await this.authService.generateCode(collection);
    const playlist: Playlist = {
      accessToken: accessToken,
      refreshToken: encrypt(playlistData.refresh_token),
      expireDate: moment().add(playlistData.expires_in, 'seconds').format(),
      userId,
      playlistId: await this.playlistService.createNewPlaylist(accessToken, userId),
      adminId,
      code,
      tracks: [],
    };
    const playlistCode = await this.playlistService.addPlaylistToDb(playlist, collection);
    res.redirect(`${process.env.CLIENT_URI}/#/party/` + playlistCode + '/' + adminId);
  }

  login(_req: express.Request, res: express.Response): void {
    const scope =
      'playlist-modify-private playlist-modify-public user-read-currently-playing user-read-playback-state user-modify-playback-state';
    res.redirect(
      'https://accounts.spotify.com/authorize?' +
        stringify({
          response_type: 'code',
          client_id: process.env.CLIENT_ID,
          scope: scope,
          redirect_uri: process.env.REDIRECT_URI,
        })
    );
  }

  async checkCode(req: express.Request, res: express.Response): Promise<void> {
    const collection: Collection<Playlist> = req.app.locals.collection;
    const code = req.query.code as string;
    const result = await this.authService.checkCode(code, collection);
    res.json(result);
  }

  async checkAdminId(req: express.Request, res: express.Response): Promise<void> {
    const collection: Collection<Playlist> = req.app.locals.collection;
    const adminId = req.query.adminId as string;
    const document = await collection.findOne({ adminId });
    if (document === null) {
      res.status(404).end();
    }
    res.status(200).end();
  }
}

export default AuthController;
