var createError = require('http-errors');
var express = require('express');
const session = require("express-session")
require('dotenv').config();
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const db =  require('./config/db.js');
const expressLayouts = require('express-ejs-layouts');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var api = require('./routes/api');
var admin = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//layout setup
app.use(expressLayouts);
app.set('layout', 'layout/main-layout');

app.use(logger('dev'));
app.use("/uploads",express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: false
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api',api);
app.use('/admin',admin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
