import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 8080, (err) => {
    if (err) throw err;
    console.log('Server running on port', process.env.PORT || 8080);
  });
});
