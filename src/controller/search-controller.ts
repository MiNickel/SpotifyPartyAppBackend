import express from 'express';
import { Collection } from 'mongodb';
import { SearchService } from '../services/search.service';
import { Playlist } from '../types/playlist';
import logger from '../util/logger';
import verifyToken from '../util/verifyToken';
import Controller from './controller';

class SearchController extends Controller {
  private searchService = new SearchService();

  constructor() {
    super();
  }

  initializeRoutes() {
    this.router.get('/search', verifyToken, (req, res) => this.searchSong(req, res));
  }

  async searchSong(req: express.Request, res: express.Response) {
    const code = req.query.code as string;
    const searchString = req.query.search as string;
    const collection: Collection<Playlist> = req.app.locals.collection;
    const document = await collection.findOne({ code });
    try {
      const response = await this.searchService.searchSong(searchString, document!.accessToken);
      res.json({ tracks: response.data.tracks.items });
    } catch (error) {
      logger.error(`error while searching song: ${error}`);
    }
  }
}

export default SearchController;
