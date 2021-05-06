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

const imageMargin = 17;
const imageScale = 0.7;

// Builtins
const numberEmotes = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

const tiers = ["bronze", "silver", "gold", "platinum"];

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

const cardsSchema = new Schema({
    name: String,
    series: String,
    tier: String,
    image: String
})
const cardsModel = mongoose.model("cardsCollection", cardsSchema);
var cardsArray = [[], [], [], []];

// Additional
var messages = [];




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
                OpenPack(message, 0);
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




// On reaction
client.on('messageReactionAdd', (reaction, user) => {
    // Own vote doesn't count
    if (user == botID) return;

    console.log("reaction");

    // Only listen for numbers
    var found = false;
    console.log(reaction.emoji.name);
    for (var i = 0; i < numberEmotes.length; i++) {
        console.log("Looking at " + numberEmotes[i]);
        if (reaction.emoji.name == numberEmotes[i]) {
            found = true;
            break;
        }
    }
    if (!found) return;

    console.log("correct emote");

    // Only listen for the last vote
    //if (reaction.message.id != lastVoteId) return;

    // Only councillors can vote
    //var member = guild.member(user);
    //if (!member.roles.cache.some(role => role.id == roleCouncillor)) {
    //    reaction.message.reactions.resolve(voteFor).users.remove(user.id);
    //    reaction.message.reactions.resolve(voteAgainst).users.remove(user.id);
    //    return;
    //} else {
    //    if (reaction.emoji.name == voteFor) { reaction.message.reactions.resolve(voteAgainst).users.remove(user.id); }
    //    if (reaction.emoji.name == voteAgainst) { reaction.message.reactions.resolve(voteFor).users.remove(user.id); }
    //}
})




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

    // Load the cards into an array
    cardsModel.find({}).then(function (result) {
        for (var i = 0; i < result.length; i++) {
            cardsArray[result[i].tier].length++;
            cardsArray[result[i].tier][cardsArray[result[i].tier].length - 1] = result[i];
        }

        //for (var i = 0; i < cardsArray.length; i++) {
        //    for (var o = 0; o < cardsArray[i].length; o++) {
        //        console.log(tiers[i] + ": " + cardsArray[i][o].name);
        //    }
        //}
    })

    // Test
    //var card = new cardsModel({
    //    name: "Mario",
    //    series: "Mario Bros.",
    //    tier: "0",
    //    image: "https://i.imgur.com/RuCku1F.png"
    //});
    //card.save();
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

// Open a card pack
function OpenPack(message, pack) {

    // Generate the cards
    var cards = [];
    for (var i = 0; i < 3; i++) {
        cards.length++;
        cards[cards.length - 1] = RandomCard(RandomTier());
    }

    // Generate an image
    images = [];
    for (var i = 0; i < cards.length; i++) {
        images.length++;
        images[images.length - 1] = cards[i].image;
    }

    // Display the cards
    Combine(images).then(value => {
        const embed = new Discord.MessageEmbed()
            //.setTitle('Some title')
            .setAuthor(message.guild.member(message.author.id).nickname + ", your card pack contained the following cards")
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

// Generate a random tier
function RandomTier() {
    var rng = Math.floor(Math.random() * 100);
    if (rng <= 0)
        return 3;
    if (rng <= 5)
        return 2;
    if (rng <= 25)
        return 1;
    else
        return 0;
}

// Generate a random card
function RandomCard(tier) {
    var options = cardsArray[tier].length;
    var rng = Math.floor(Math.random() * options);
    return cardsArray[tier][rng];
}




// Login
client.login(process.env.BOT_TOKEN);