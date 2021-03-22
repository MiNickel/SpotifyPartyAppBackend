import express from 'express';
import logger from '../util/logger';
import { HttpError } from 'http-errors';

abstract class Controller {
  public router = express.Router();

  constructor() {
    this.initializeRoutes();
    this.initializeErrorHandlers();
  }

  protected abstract initializeRoutes(): void;

  private initializeErrorHandlers() {
    this.router.use((err: HttpError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error(`Status: ${err.status || 500}, Message: ${err.message}`);
      res.status(err.status || 500).json({
        status: err.status || 500,
        message: err.message,
      });
    });
  }
}

export default Controller;
