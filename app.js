let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let CryptoJS = require("crypto-js");
let jwt = require("jsonwebtoken");
let bodyParser = require('body-parser');
let swig = require('swig');
let mongoose = require('mongoose');
let Promise = require('bluebird');
let index = require('./routes/index');
let users = require('./routes/users');
let admin = require('./routes/admin');
let role = require('./routes/role');
let log = require('./routes/log');
let data = require('./routes/data');
let template = require('./routes/template');
let client = require('./routes/client');
let location = require('./routes/location')
let compression = require('compression')
let replyManager = require('./routes/replyManager')
let validword = require('./routes/validword')
let app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'twig');
global.secretOrPrivateKey = 'gt-admin'
global.uploadPath = path.join(__dirname, 'public', 'upload')

app.engine('html', swig.renderFile)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html')
swig.setDefaults({cache: false})

// twig.cache = false;
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(compression())

app.use(bodyParser.json({limit: '100mb'}))
app.use(bodyParser.urlencoded({
    limit: '100mb',
    extended: true
}))
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('/Users/pt/Work/NodeJS/Business/Qingtime/Service/gt-service/public/upload'))

global.Promise = Promise
mongoose.Promise = Promise
mongoose.connect('mongodb://gt:admin@127.0.0.1/gt', {useMongoClient:true}, function (error) {
    if (error) {
        console.log('mongoDB连接失败')
    } else {
        console.error('mongoDB连接成功')
    }
})

app.use(async function (req, res, next) {
    if (req.originalUrl.indexOf('/login') !== 0 && req.originalUrl !== '/' && req.originalUrl !== '/login') {
        let token = req.body.token || req.headers["x-access-token"] // 从body或query或者header中获取token
        let encrypted = ''
        if (!token) {
            let url = req.url.toString()
            if (url.indexOf('?') > 0) {
                url = url.substring(url.indexOf('?') + 1)
                encrypted = url
            }
        } else {
            encrypted = token
        }
        let bytes  = CryptoJS.AES.decrypt(encrypted, '_SALT_G(T#*)')
        token = CryptoJS.enc.Utf8.stringify(bytes)
        await jwt.verify(token, secretOrPrivateKey, function (err, decode) {
            if (err) {  //  时间失效的时候/ 伪造的token
                res.write('<script language=\'javascript\'>window.parent.location.href=\'/\'</script>');
                res.end();
            } else {
                req.token = token
                req.adminId = decode.v
                req.roleId = decode.r
                req.aesToken = encrypted
                next()
            }
        })
    } else {
        next()
    }
})

app.use('/users', users)
app.use('/admins', admin)
app.use('/role', role)
app.use('/data', data)
app.use('/template', template)
app.use('/log', log)
app.use('/client', client)
app.use('/location', location)
app.use('/replyManager', replyManager)
app.use('/validword', validword)
app.use('/', index)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
