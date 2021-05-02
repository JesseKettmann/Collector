// .env
require("dotenv").config();

// Discord
const Discord = require('discord.js');
const client = new Discord.Client();
const botID = "838126284843778089";
var channelSent;

// Cronjob
const CronJob = require('cron').CronJob;

// Canvas
const Canvas = require('canvas');

// Settings
const prefix = ".c";

const packsPerDay = 2;
const maxDailyPacks = 5;

const imageMargin = 20;
const imageScale = 0.7;

// Builtins
const numberEmotes = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

// MongoDB
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Mongo schemas
const globalSchema = new Schema({
    lastUpdate: String
})
const globalModel = mongoose.model("globalCollection", globalSchema);

const statsSchema = new Schema({
    userID: String,
    shitCoins: String,
    packsDaily: String,
})
const statsModel = mongoose.model("statsCollection", statsSchema);
var statsArray = [];



// On startup
client.on("ready", () => {
    // Log
    console.log("Bot succesfully started");

    // Connect to MongoDB
    mongoose.connect(process.env.BOT_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    }).then(() => {
        console.log("Connected to MongoDB");
        OnStartup();
    }).catch((err) => {
        console.log("Failed to connect to MongoDB")
        console.log(err);
    });

    // Stay active
    var job = new CronJob('0 * * * * *', function () {
        console.log('Keepalive Ping');
    }, null, true, 'America/Los_Angeles');
    job.start();
});




// On message
client.on('message', message => {
    // Check if the message is not sent by the bot
    if (message.author == botID) return;

    // Get the channel
    channelSent = message.channel;

    // if a command is used
    var text = message.content.toLowerCase();
    if (text.startsWith(prefix + " ")) {
        text = text.replace(prefix + " ", "", 1);

        // New user
        AddUser(message.author.id);

        // Execute
        switch (text) {
            case "embed":
                Embed(message);
                break;
            case "help":
                Say("Test");
                break;
            case "new":
                Say(Combine(["https://i.imgur.com/2hZprJE.png", "https://i.imgur.com/2hZprJE.png"]));
                break;
            default:
                Say("Unknown command. Use '" + prefix + " help' for instuctions.");
        }
    }

    if (message.content.includes("date ")) {
        globalModel.findOne({}).then(function (result) {
            var dateArray = message.content.split(" ");
            result.lastUpdate = dateArray[1];
            result.save();
        })
    }
});




// Functions

// When the bot launches and is connected to the database
function OnStartup() {
    // Check if a day has been missed
    globalModel.findOne({}).then(function (result) {
        if (result != null) {
            var dateStringNow = GetDateString();
            var dateStringLast = result.lastUpdate;
            var dateArrayNow = dateStringNow.split("-");
            var dateArrayLast = dateStringLast.split("-");
            var dateNow = new Date(dateArrayNow[2], parseInt(dateArrayNow[1]) - 1, dateArrayNow[0]);
            var dateLast = new Date(dateArrayLast[2], parseInt(dateArrayLast[1]) - 1, dateArrayLast[0]);

            var daysMissed = Math.round((dateNow - dateLast) / (1000 * 60 * 60 * 24));

            // If some days have been missed
            if (daysMissed > 0) {
                giveDailies(daysMissed);
            }
        }
    })

    // Start the daily cron
    var job = new CronJob('0 0 0 * * *', function () {
        // Update
        console.log('New day');
        globalModel.findOne({}).then(function (result) {
            var dateString = GetDateString();
            if (result != null) {
                result.lastUpdate = dateString;
                result.save();
            } else {
                var global = new globalModel({
                    lastUpdate: dateString
                })
                global.save();
            }
        })

        // Give everyone their daily packs
        giveDailies(1);
    }, null, true, 'America/Los_Angeles');
    job.start();

    // Load the player stats into an array
    statsModel.find({}).then(function (result) {
        statsArray = result;
    })
}

function Say(value) {
    return channelSent.send(value);
}

// Add a user to the database
function AddUser(userID) {
    // Get the userID
    userID = userID.toString();

    // Check if the user already exists
    for (var i = 0; i < statsArray.length; i++) {
        if (userID == statsArray[i].userID) {
            return;
        }
    }

    // Create a new user
    var stats = new statsModel({
        userID: userID,
        shitCoins: "0",
        packsDaily: "1",
    })

    // Save the user
    statsArray.length++;
    statsArray[statsArray.length - 1] = stats;
    stats.save();
}

// Get the string representing todays date
function GetDateString() {
    var date = new Date();
    return date.getDate() + "-" + (parseInt(date.getMonth()) + 1) + "-" + date.getFullYear();
}

// Give everyone their daily card packs
function giveDailies(days) {
    for (var i = 0; i < statsArray.length; i++) {
        var dailiesOld = parseInt(statsArray[i].packsDaily);
        var dailiesNew = Math.min(dailiesOld + packsPerDay * days, maxDailyPacks);
        if (dailiesNew == dailiesOld)
            continue;

        // Save if the amount has changed
        statsArray[i].packsDaily = dailiesNew.toString();
        statsArray[i].save();
    }
}

// Generate an embed
function Embed(message) {
    var images = ["https://i.imgur.com/2hZprJE.png", "https://i.imgur.com/2hZprJE.png", "https://i.imgur.com/2hZprJE.png"];
    Combine(images).then(value => {
        const embed = new Discord.MessageEmbed()
            //.setTitle('Some title')
            .setAuthor(message.guild.member(message.author).nickname + ", your card pack contained the following cards")
            .setDescription("React within a minute to claim one of them")
            .setColor("#6E46FF")
            .attachFiles(value)
            .setImage('attachment://image.png');

        Say(embed).then(async message => {
            for (var i = 0; i < images.length; i++) {
                await new Promise((resolve, reject) => {
                    message.react(numberEmotes[i]).then(() => { resolve(); });
                });
            }
        });
    })
}

// Combine images
function Combine(images) {
    // Return a promise
    return new Promise((resolve, reject) => {
        // Create a canvas
        var canvas = Canvas.createCanvas(images.length * (250 * imageScale + imageMargin) - imageMargin, 350 * imageScale);
        const ctx = canvas.getContext('2d');

        // Draw the images
        var promises = [];
        promises.length = images.length;
        for (var i = 0; i < images.length; i++) {
            promises[i] = new Promise((resolve, reject) => {
                var number = i;
                Canvas.loadImage(images[number]).then((image) => {
                    ctx.drawImage(image, number * (250 * imageScale + imageMargin), 0, 250 * imageScale, 350 * imageScale);
                    resolve();
                })
            });
        }

        // Resolve
        Promise.all(promises).then(() => {
            var buffer = canvas.toBuffer();
            var attachment = new Discord.MessageAttachment(buffer, 'image.png');
            resolve(attachment);
        });
    })
    //var attachment = new Discord.MessageAttachment(canvas.toBuffer());
    //channelSent.send('', attachment);
}




// Login
client.login(process.env.BOT_TOKEN);