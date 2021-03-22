import 'dotenv/config';
import moment from 'moment';
import App from './app';
import AuthController from './controller/auth-controller';
import PlayerController from './controller/player-controller';
import PlaylistController from './controller/playlist-controller';
import SearchController from './controller/search-controller';

const app = new App([new PlaylistController(), new AuthController(), new PlayerController(), new SearchController()]);

moment.locale('de');
app.listen();
