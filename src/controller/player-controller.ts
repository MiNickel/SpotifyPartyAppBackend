import express from 'express';
import { Collection } from 'mongodb';
import { PlayerService } from '../services/player.service';
import { Playlist } from '../types/playlist';
import logger from '../util/logger';
import verifyToken from '../util/verifyToken';
import Controller from './controller';

class PlayerController extends Controller {
  private playerService = new PlayerService();

  constructor() {
    super();
  }

  initializeRoutes(): void {
    this.router.put('/playTrack', verifyToken, (req, res) => this.playTrack(req, res));
    this.router.get('/currentlyPlayingTrack', verifyToken, (req, res) => this.getCurrentlyPlayingTrack(req, res));
  }

  getCurrentlyPlayingTrack = async (req: express.Request, res: express.Response): Promise<void> => {
    const collection: Collection<Playlist> = req.app.locals.collection;
    const code = req.query.code as string;
    const document = await collection.findOne({ code });
    try {
      if (document) {
        const response = await this.playerService.getCurrentlyPlayingTrack(document.accessToken);
        if (response !== '') {
          res.json(response.item!.id);
        } else {
          res.status(204).end();
        }
      }
    } catch (error) {
      logger.error(`error while getting currently playing track: ${error}`);
    }
  };

  playTrack = async (req: express.Request, res: express.Response): Promise<void> => {
    const trackId = req.body.trackId as string;
    const code = req.body.code as string;
    const adminId = req.body.adminId as string;
    const collection: Collection<Playlist> = req.app.locals.collection;
    const document = await collection.findOne({ code });
    if (document && document.adminId !== adminId) {
      res.status(403).end();
    }
    try {
      const response = await this.playerService.playTrack(trackId, document!);
      if (response && response.status === 404) {
        res.status(404).end();
      }
      res.end();
    } catch (error) {
      logger.error(`error while trying to play track: ${error}`);
    }
  };
}

export default PlayerController;
