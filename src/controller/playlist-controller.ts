import express from 'express';
import { Request, ParamsDictionary, Response } from 'express-serve-static-core';
import { Collection } from 'mongodb';
import { ParsedQs } from 'qs';
import { PlayerService } from '../services/player.service';
import { PlaylistService } from '../services/playlist.service';
import { Playlist } from '../types/playlist';
import logger from '../util/logger';
import verifyToken from '../util/verifyToken';
import Controller from './controller';

class PlaylistController extends Controller {
  public playlistService = new PlaylistService();
  public playerService = new PlayerService();

  constructor() {
    super();
  }

  initializeRoutes() {
    this.router.get('/playlist', verifyToken, (req, res) => this.getCurrentPlaylist(req, res));
    this.router.post('/addTrack', verifyToken, (req, res) => this.addTrackToPlaylist(req, res));
    this.router.put('/likeTrack', verifyToken, (req, res) => this.likeTrack(req, res));
    this.router.get('/users', verifyToken, (req, res) => this.getUsers(req, res));
  }

  async getUsers(req: express.Request, res: express.Response) {
    const collection: Collection<Playlist> = req.app.locals.collection;
    const code = req.query.code as string;
    const document = await collection.findOne({ code });

    if (!document) {
      res.end();
      return;
    }
    const usersList = document.users;
    res.json(usersList);
  }

  async getCurrentPlaylist(req: express.Request, res: express.Response) {
    const collection: Collection<Playlist> = req.app.locals.collection;
    const code = req.query.code as string;
    const document = await collection.findOne({ code });

    if (!document) {
      res.end();
    } else {
      try {
        const tracks = await this.playlistService.getPlaylist(document);
        const currentlyPlayingTrack = await this.playerService.getCurrentlyPlayingTrack(document.accessToken);
        if (
          currentlyPlayingTrack === '' ||
          !tracks.items.find((item) => item.track.id === currentlyPlayingTrack.item?.id)
        ) {
          res.json({ tracks: tracks.items }).end();
        } else {
          const newTracks = this.playlistService.splitPlaylist(currentlyPlayingTrack.item!.id, tracks.items);
          res.json({
            tracks: newTracks,
            currentlyPlayingTrack: currentlyPlayingTrack.item!.id,
          });
        }
      } catch (error) {
        logger.error(`error while getting current playlist: ${error}`);
      }
    }
  }

  public async addTrackToPlaylist(req: express.Request, res: express.Response) {
    const trackId = req.body.trackId as string;
    const code = req.body.code as string;
    const nickname = req.body.nickname as string;
    const collection: Collection<Playlist> = req.app.locals.collection;
    const document = await collection.findOne({ code });
    try {
      await this.playlistService.addTrack(trackId, document!, collection, code, nickname);
      res.end();
    } catch (error) {
      logger.error(`error while adding track to playlist: ${error}`);
      res.end();
    }
  }

  public async likeTrack(req: express.Request, res: express.Response) {
    const trackId = req.body.trackId as string;
    const code = req.body.code as string;
    const nickname = req.body.nickname as string;
    const collection: Collection<Playlist> = req.app.locals.collection;
    const document = await collection.findOne({ code });
    try {
      if (document) {
        await this.playlistService.likeTrack(trackId, code, document, collection, nickname);
      }
      res.end();
    } catch (error) {
      logger.error(`error liking a track: ${error}`);
      res.end();
    }
  }
}

export default PlaylistController;
