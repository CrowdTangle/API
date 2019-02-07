const express = require('express');
const app = express();
const port = 3000;
require('dotenv').load();
const CrowdTangle = require('./library/crowdtangle.js');

app.set('view engine', 'pug');


// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
  res.render('index', { title: 'CrowdTangle API Examples', message: 'Hello World!' })
});

app.get('/leaderboard', function (req, res) {
  new CrowdTangle().leaderboard({listId:process.env.LEADERBOARD_LIST_ID}).then(data => {
    res.render('leaderboard', {
      title: 'A CrowdTangle CrowdTangle Leaderboard',
      data
    })
  })

});

app.get('/twitter-example', function (req, res) {

  new CrowdTangle().twitterStream({listIds:process.env.TWITTER_LIST_ID}).then(data => {
    console.log(data);
    res.render('twitter', {
      title: 'Using Twitter with the CT API',
      data
    });
  })
});

app.get('/link-checker', function (req, res) {
  res.format({

    html() {
      res.render('links', { title: 'A link checker starter', link: req.query.link})
    },
    json() {
      console.log(req.query, req.query.link);
      new CrowdTangle().links({link: req.query.link}).then(data => {
          res.send(data);
      })
    }
  });

});



app.listen(port, () => console.log(`CT App listening on port ${port}!`));
