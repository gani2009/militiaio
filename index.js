require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportlocalmongoose = require('passport-local-mongoose');
var randomColor = require('randomcolor');
mongoose.connect(process.env.MONGODB);

const app = express();
var expressWs = require('express-ws')(app);
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
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

let version = '0.05.02';

// Home page
app.get("/", function(req, res) {
  if (req.isAuthenticated()) {
    res.render('loggedhome', { user: req.user, page: 'home', version: version });
  } else {
    res.render("home", { page: 'home', version: version });
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
  res.render("register", { page: 'register' });
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

app.get("/road-trip", function(req, res) {
  res.render("roadtrip", { page: 'game' });
});

let currentPlayers = [];

app.get("/game", function(req, res) {
  res.redirect("/");
});
app.post("/game", function(req, res) {
  if (req.body.name2 === '') {
    req.body.name2 = 'Player 2'
  }
  if (req.body.name3 === '') {
    req.body.name3 = 'Player 3'
  }
  if (req.body.name4 === '') {
    req.body.name4 = 'Player 4'
  }
  let names = [req.body.name, req.body.name2, req.body.name3, req.body.name4];
  for (i in names) {
    if (names[i] === names[i - 1]) {
      names[i] = names[i] + i;
    };
    if (names[i] === names[i - 2]) {
      names[i] = names[i] + (i * 2);
    };
    if (names[i] !== undefined && names[i].length > 10) {
      names[i] = names[i].slice(0, 10) + "...";
    };
  };
  if (req.body.mode === 'online') {
    if (currentPlayers.indexOf(names[0]) !== -1) {
      currentPlayers.splice(currentPlayers.indexOf(names[0]), 1);
      res.redirect("/")
    } else {
      currentPlayers.push(names[0]);
      let color = randomColor();
      let color2 = randomColor();
      let color3 = randomColor();
      let color4 = randomColor();
      let ais = req.body.ai;
      res.render("game", { page: 'game', name: names[0], color: color, color2: color2, color3: color3, color4: color4, mode: req.body.mode, player2Name: names[1], player3Name: names[2], player4Name: names[3], ais: ais });
    };
  } else {
    let color = randomColor();
    let color2 = randomColor();
    let color3 = randomColor();
    let color4 = randomColor();
    let ais = req.body.ai;
    res.render("game", { page: 'game', name: names[0], color: color, color2: color2, color3: color3, color4: color4, mode: req.body.mode, player2Name: names[1], player3Name: names[2], player4Name: names[3], ais: ais });
  };
});

app.ws('/chat', function(ws, req) {
  ws.on('message', function(msg) {
    expressWs.getWss().clients.forEach(client => {
      client.send(msg);
    });
    console.log(msg);
  });
});

app.ws('/game', function(ws, req) {
  ws.on('message', function(msg) {
    expressWs.getWss().clients.forEach(client => {
      client.send(msg);
    });
  });
});
app.use((req, res) => {
  //render page not found
  res.redirect('/');
})
//Start Server
app.listen(process.env.PORT, () => {
  console.log("Server listening on port " + process.env.PORT);
});