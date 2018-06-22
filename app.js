/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , bodyPaser = require('body-parser')
 // , cookieParser = require('cookie-parser')
  , mysql = require('mysql')
  , session = require('express-session')
  , MySQLStore = require('express-mysql-session')(session);

var dbconfig = {
		   hostname:"127.0.0.1:3306", 
		   user : "root",
		   password:"1234",
		   database:"darack"
		};
var client = mysql.createConnection(dbconfig);

client.connect(function(err){
   console.log('MysqlConnection');
   if(err){console.error(err);
   throw err;
}
});
var sessionStore = new MySQLStore(dbconfig);
app.use(session({
	key: 'sid',
	secret: 'secret',
	resave: false,
	store: sessionStore,
	saveUninitialized: true,
	/*cookie: {
		maxAge:1000*60*60	// 쿠키 유효시간 1시간
	}*/
}));

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
//app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));




if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res){
	console.log(req.session);
	if(req.session.sessionId)
		res.redirect('/main1');
		else
	res.render('index.html');
});
app.get('/signup', function(req, res){
	if(req.session.sessionId)
		res.redirect('/');
	else{
	res.render('./signup.html');
	}
	});

app.get('/board', function(req, res){
	if(!req.session.sessionId){
		res.redirect('/');
	}else{
			if(err) console.error('err',err);
			res.render('./board', {
				id: req.session.sessionId,
		});
	}
});
app.get('/main:number', function(req, res){
	if(!req.session.sessionId){
		res.redirect('/');
	}else{
		client.query('SELECT count(*) cnt FROM board', function(err,rows){
			var cnt=rows;
				client.query('SELECT id, writer, title, content, viewcount, date_format(board.wdate, "%Y-%m-%d") as wdate FROM board order by id desc limit ?, 10',[10*(req.params.number-1)], function(err,rows){

				if(err) console.error('err',err);
				res.render('./main', {
					id: req.session.sessionId,
					rows: rows,
					cnt: cnt
				});				
			})
		});
	}
});
app.get('/look:number',function(req,res){
	   client.query('UPDATE board SET viewcount=viewcount+1 where id=?',[req.params.number]);
	   var query = client.query('SELECT * from board WHERE id=?',[req.params.number],function(err, rows){
	      if(err) console.error('err', err);
	      
	      res.render('look',{
			id: req.session.sessionId,
	    	  rows:rows[0]
	      });
	   });
	});   
app.post('/delete',function(req,res){
	client.query('DELETE FROM board where id=?',[req.body.id*1], function(err,rows){
	      if(err) console.error('err', err);
	      console.log("hii");
	      res.redirect('/main1');
	});
});
app.post('/logincheck', function(req, res){
   var uid=req.body.id;
   var upw=req.body.pw;
   var connection=client.query
   ('SELECT count(*) cnt,user_nickname FROM user WHERE user_id=? and user_pw=?', [uid, upw], function(err,rows){
      if(err) console.error('err', err);
      var cnt = rows[0].cnt;

      if(cnt===1){
// req.session.user_id=id;
    	  req.session.sessionId=uid;
    	  res.send('<script>location.href="../board"; </script>');
   }
      else{
    	  res.send('<script> alert('+'"id or password is wrong"'+'); history.back(); </script>');
       	  res.json({result:'fail'});
       	  
      }
   });
});
app.post('/signupcheck', function(req, res){
	var nid=req.body.newid;
	var nnn=req.body.newnickname;
	var nem=req.body.newemail;
	var npw=req.body.newpw;
	var nn=req.body.newname;
	var npn=req.body.newpn;
	var nbd=req.body.newbd;
	var connection=client.query
	('INSERT INTO user (user_id, user_nickname, user_email,	 user_pw, user_name, user_pn, user_bd) VALUES (?, ?, ?, ?, ?, ?, ?)',
			[nid, nnn, nem, npw, nn, npn, nbd] ,function(err,result){
	      if(err) console.error('err', err);

	    });
		res.send('<script> alert("'+nid+'"); location.href="/";</script>');
	    });
app.get('/logout',function(req, res){ 
	delete req.session.sessionId;
	res.redirect("/"); 
}); 
app.get('/write', function(req,res){
	res.render('./board', {
		id: req.session.sessionId
	});
});
app.post('/write', function(req,res){
	var writer=req.session.sessionId;
	var title=req.body.title;
	var content=req.body.content;
	var connection=client.query('INSERT INTO board (writer, title, content) VALUES (?, ?, ?)',[writer, title, content], function(err, result){
		if(err) console.error('err', err);
	});
	res.redirect('/main');
});
app.get('/rewrite:number', function(req,res){
	client.query('SELECT * FROM board WHERE id=?',[req.params.number],function(err,rows){
		if(err) console.error('err', err);
		if(rows[0].writer==req.session.sessionId){
		res.render('./rewrite.ejs',{
			id: req.session.sessionId,			
			rows:rows[0]
		});
		}else{
			res.send('<script>alert("당신은 수정할 수 없습니다."); location.href="/main1" </script>');			
		}
	});

});
app.post('/rewrite', function(req,res){
	var writer=req.session.sessionId;
	var title=req.body.title;
	var content=req.body.content;
	client.query('UPDATE board SET title=? content=? WHERE writer=?',[title, content,writer],function(err,rows){
		if(err) console.error('err', err);
	});
	res.redirect('/main');
});
app.get('/', routes.index);
app.get('/users', user.list);


var server = app.listen(3001, function(){
	console.log('suyeon server');
})

/*
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});*/