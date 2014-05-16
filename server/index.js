var http = require('http');

var express = require('express');
var i18n = require('i18n-abide');
var nunjucks = require('nunjucks');
var rewriteModule = require('http-rewrite-middleware');

var config = require('../config/');

var app = express();
var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(__dirname + '/templates'),
                                   {autoescape: true});

app.use(require('connect-livereload')({
  port: config.liveReloadPort,
}));

var servedViews = [
  'create-pin',
  'enter-pin',
  'locked',
  'login',
  'reset-pin',
  'reset-start',
  'wait-for-tx',
  'was-locked',
];

env.express(app);

app.use(i18n.abide({
  supported_languages: config.supportedLanguages,
  debug_lang: 'db-LB',
  default_lang: 'en-US',
  translation_directory: 'public/i18n'
}));

app.use(rewriteModule.getMiddleware([
  // 301 / -> /mozpay
  {from: '^/$', to: '/mozpay/', redirect: 'permanent'},
  {from: '^/mozpay$', to: '/mozpay/', redirect: 'permanent'},
  // Internally redirect urls to be handled by the client-side app serving view.
  {from: '^/mozpay/spa/(?:' + servedViews.join('|') + ')$', to: '/mozpay/'},
]));

app.get(/\/(?:css|fonts|i18n|images|js|lib)\/?.*/, express.static(__dirname + '/../public'));

app.get('/mozpay/', function (req, res) {
  res.render('index.html', {settings: config});
});

// Serve test assets.
app.get(/\/testlib\/?.*/, express.static(__dirname + '/../tests/static'));
app.get(/\/unit\/?.*/, express.static(__dirname + '/../tests/'));

function genFakeResp(pin, status) {

  status = status || 200;
  pin = pin === true ? true : false;

  return function(req, res) {

    var result = {
      pin: pin,
      pin_is_locked_out: false,
      pin_was_locked_out: false,
      pin_locked_out: null
    };

    if (req.query.pin_is_locked_out) {
      result.pin_is_locked_out = true;
    }

    if (req.query.pin) {
      result.pin = true;
    }

    res.send(status, result);
  };
}

// Fake API response.
app.get('/mozpay/v1/api/pin/', genFakeResp(true));
app.post('/mozpay/v1/api/pin/', genFakeResp(true));
app.post('/mozpay/v1/api/pin/check', genFakeResp(true));

// Fake verification.
app.post('/fake-verify', function (req, res) {
  var assertion = req.query.assertion ? req.query.assertion : '';
  var success = {
    'status': 'okay',
    'audience': 'http://localhost:' + config.test.port,
    'expires': Date.now(),
    'issuer': 'fake-persona'
  };
  success.email = assertion;
  res.send(success);
});

// Fake logout
app.post('/logout', function (req, res) {
  res.send({'msg': 'logout success'});
});

app.get('/unittests', function (req, res) {
  res.render('test.html');
});

console.log('Starting DEV Server');
var port = process.env.PORT || config.port;
http.createServer(app).listen(port, function() {
  console.log('listening on port: ' + port);
});
