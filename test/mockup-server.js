import options from './.options.js';
import express from 'express';
const app = express();

app.use(express.json());

app.get('/ontology.json', (req, res, next) => {
  res.sendFile('./ontology.json');
  next();
});

app.get('/authenticate', (req, res, next) => {
  if (req.query.username === 'veda') {
    res.status(200).json({
      id: 'test-ticket1',
      user_uri: 'cfg:VedaSystem',
      end_time: (Date.now() + 1 * 60 * 1000) * 1000 + 621355968000000000,
    });
  } else {
    res.status(401).send();
  }
  next();
});

app.post('/set_in_individual', (req, res, next) => {
  if (req.query.ticket === 'test-ticket') {
    res.status(200).send();
  } else {
    res.status(500).send();
  }
  next();
});

app.post('/eduupb/hs/mondiedu/education/entry', (req, res, next) => {
  res.status(200);
  next();
});

const status = {ready: false};

app.listen(
  OPTIONS.port,
  OPTIONS.host,
  () => {
    console.log(new Date().toISOString(), 'mockup server started');
    status.ready = true;
  },
);

export default status;
