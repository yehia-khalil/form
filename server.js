const express = require("express");
const bodyparser = require("body-parser");
const mongoClient = require("mongodb").MongoClient;
const opjId = require("mongodb").ObjectId;
const md5 = require("md5");//generate hash for a string (hash password)
const uuid = require("uuid").v4;//generate random string (session id or token)
const cookieParser = require("cookie-parser");
const { ReplSet } = require("mongodb");
var app = express();
let fs = require('fs');
const bodyparserForm = bodyparser.urlencoded();
mongoClient.connect("mongodb+srv://user:123@cluster0.4ggak.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", function (err, db) {
    app.db = db.db("testing");
})

app.set("view-engine", "ejs");
app.use("/css", express.static(__dirname + "/public/css"))
app.use("/fonts", express.static(__dirname + "/public/fonts"))
app.use("/images", express.static(__dirname + "/public/images"))
app.use("/js", express.static(__dirname + "/public/js"))
app.use(cookieParser());
/*
let attempts = 0;

fs.readFile("attemptsfile.json", function (err, data) {
    if (data) {
        console.log("read file success");
        attempts = JSON.parse(data);
    }
})*/

app.get("/", function (req, res) {
    if (req.cookies["sessionId"]) {
        console.log(req.cookies["sessionId"]);
        let session = req.cookies["sessionId"];
        app.db.collection('users').findOne({ sessionId: session }, function (err, succ) {
            if (err) {
                res.render("index.ejs", { username: "server error" })
            } else {
                if (succ) {
                    res.render("index.ejs", { username: succ.username })
                }
                else {
                    res.render("index.ejs")
                }
            }
        })
    }else{
        res.render("index.ejs");    
    }
});

app.get("/register", function (req, res) {
    res.render("register.ejs");
})

app.get("/login", function (req, res) {
    res.render("login.ejs");
})

app.post("/register", bodyparserForm, function (req, res) {
    req.body.password = md5(req.body.password);
    req.body.sessionId = uuid();
    console.log(req.body);
    app.db.collection('users').insertOne(req.body, function (err, succ) {
        if (err)
            res.render("login.ejs", { message: "error registering" })
        else
            res.render("login.ejs", { message: "Registerd successfully" });
    })
})

app.post("/login", bodyparserForm, function (req, res) {
    app.db.collection('users').findOne({ username: req.body.username, password: md5(req.body.password) }, function (err, succ) {
        if (err) {
            res.render("login.ejs", { message: "server error" });
        } else {
            if (succ) {
                res.cookie('sessionId', succ.sessionId);
                res.render("index.ejs", { username: succ.username });
                fs.writeFile("attemptsfile.json", 0, function (err) {
                    console.log(err);
                })
            } else {
                if (attempts > 3) {
                    res.send(`<script>alert ("YOU HAVE BEEN BLOCED");</script>`)
                } else {
                   /* attempts++;
                    console.log(attempts);
                    fs.writeFile("attemptsfile.json", JSON.stringify(attempts), function (err) {
                        console.log(err);
                    })*/
                    res.render("login.ejs", { message: "wronge id or password" });
                }
            }
        }

    })
})




const PORT = process.env.PORT || 9090;

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));
