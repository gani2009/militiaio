// the idea is like a army building but with villages, mountains and somekind of story line to make it better.
// I would also want different rooms that can be created in the URL and are multiplayer.
// Also add borders with diplomacy and mini-map with the borders which can be expanded.
// If you declare war or attack everyone in room get a pop-up that you did so.
// Gold can be found in mountains and villages next to lakes/oceans.
// Boats for troop transport or trade would be better.
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportlocalmongoose = require('passport-local-mongoose');
mongoose.connect(process.env.MONGODB);
mongoose.set('strictQuery', true);

const app = express();
const server = require('http').Server(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
var port = 1100;
app.use(passport.initialize());
app.use(passport.session());

const Schema = new mongoose.Schema({
  username: String,
  plays: Number,
  high: Number,
});

Schema.plugin(passportlocalmongoose);

const Player = mongoose.model("Millitia", Schema);
passport.use(Player.createStrategy());

passport.serializeUser(Player.serializeUser());
passport.deserializeUser(Player.deserializeUser());

// Home page
app.get("/", function(req, res) {
  if (req.isAuthenticated()) {
    res.render('loggedhome', { user: req.user});
  } else {
    res.render("home");
  }
});

//login
app.post("/login", function(req, res) {
  const player = new Player({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(player, function(err) {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      });
    };
  })
});

app.get("/register", function(req, res) {
  res.render("register");
});
app.post("/register", function(req, res) {
  Player.register({ username: req.body.username }, req.body.password, function(err, player) {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      });
    }
  });
});
app.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else {
      res.redirect("/");
    }
  })
});
app.get("/game", function(req, res){
  res.redirect("/");
});
app.post("/game", function(req, res) {
  let userId;
  if (req.isAuthenticated()) {
    userId = req.user.username
  } else {
    userId = req.body.name
  };
  res.render("game", { name: userId, country: req.body.countr.toLowerCase()});
});

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data.toString());
      }
    });
  });
});

//Secret page
app.get("/beta", function(req, res) {
  res.render("beta");
});
app.post("/beta", function(req, res) {
  res.render("betaGame", { name: req.body.name, country: req.body.countr.toLowerCase() });
});
//Start Server
server.listen(process.env.PORT);