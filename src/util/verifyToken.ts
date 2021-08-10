import express from 'express';
import moment from 'moment';
import { Collection } from 'mongodb';
import { Playlist } from '../types/playlist';
import { decrypt, encrypt } from './crypto';
import { getNewAccessToken } from './refreshToken';

const verifyToken = async (req: express.Request, _res: express.Response, next: express.NextFunction): Promise<void> => {
  const code = req.query.code as string;
  const collection: Collection<Playlist> = req.app.locals.collection;

  const document = await collection.findOne({ code: code });

  if (document) {
    const expired = document.expireDate < moment().format();
    if (expired) {
      const response = await getNewAccessToken(decrypt(document.refreshToken));
      document.accessToken = encrypt(response.accessToken);
      document.expireDate = moment().add(response.expiresIn, 'seconds').format();
      await collection.updateOne({ code: code }, { $set: document });
    }
  }
  next();
};

export default verifyToken;
