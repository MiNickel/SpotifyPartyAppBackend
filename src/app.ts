import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { MongoClient } from 'mongodb';
import { strictEqual } from 'assert';
import logger from './util/logger';
import Controller from './controller/controller';
import bodyParser from 'body-parser';

const corsOptions = {
  origin: process.env.CLIENT_URI,
  optionsSuccessStatus: 200,
};

class App {
  public app: express.Application;
  private uri = `mongodb+srv://${process.env.USER}:${process.env.MONGODB_PW}@cluster0.iy9j3.mongodb.net/<dbname>?retryWrites=true&w=majority`;
  private client = new MongoClient(this.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  constructor(controllers: Controller[]) {
    this.app = express();

    this.initializeMiddleware();
    this.initializeControllers(controllers);
  }

  private ignoreFavicon = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.originalUrl.includes('favicon.ico')) {
      res.status(204).end();
    }
    next();
  };

  private initializeMiddleware = () => {
    this.app.use(this.ignoreFavicon);
    this.app.use(bodyParser.json());
    this.app.use(cors(corsOptions)).use(cookieParser());
  };

  private initializeControllers = (controllers: Controller[]) => {
    controllers.forEach((controller) => {
      this.app.use('/', controller.router);
    });
  };

  public listen = (): void => {
    this.client.connect((err) => {
      strictEqual(null, err);
      logger.info('Connected to MongoDB.');
      const collection = this.client.db('spotify_party_app').collection('playlists');
      this.app.locals.collection = collection;
      this.app.listen(process.env.PORT || 8000, () => {
        logger.info('Server started!');
      });
    });
  };
}

export default App;
