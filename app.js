/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , bodyPaser = require('body-parser')
var mysql= require('mysql');
var app = express();
var client = mysql.createConnection({
   hostname:"127.0.0.1:3306", 
   user : "root",
   password:"1234",
   database:"darack"
});
client.connect(function(err){
   console.log('MysqlConnection');
   if(err){console.error(err);
   throw err;
}
});
var session=require('express-session');
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: 'keboard cat',
	resace: false,
	saveUninitialized: true
}));
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res){
   res.render('index.html');
});
app.get('/signup', function(req, res){
   res.render('signup.html');
});

app.post('/logincheck', function(req, res){
   var uid=req.body.id;
   var upw=req.body.pw;
   var connection=client.query
   ('SELECT count(*) cnt FROM user WHERE user_email=? and user_pw=?', [uid, upw], function(err,rows){
      if(err) console.error('err', err);
      var cnt = rows[0].cnt;
      if(cnt===1){
//    	  req.session.user_id=id;
    	  res.send(
    			  '<h1>login success</h1>');
      }else{
    	  res.json({result:'fail'});
    	  res.send('<script> alert("id or password is wrong"); history.back(); </script>');
      }
   });
});

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});