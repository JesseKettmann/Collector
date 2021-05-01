// .env
require("dotenv").config();

// Discord
const Discord = require('discord.js');
const client = new Discord.Client();
const botID = "838126284843778089";

// MongoDB
const mongoose = require("mongoose");
const MongoClient = require('mongodb').MongoClient;

// Cronjob
const CronJob = require('cron').CronJob;

// Settings
const prefix = ".c";

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
        //OnStartup();
    }).catch((err) => {
        console.log("Failed to connect to MongoDB")
        console.log(err);
    });

    // Stay active
    var job = new CronJob('* 20 * * * *', function () {
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

    
    if (message.content.includes("Ping")) {
        channelSent.send("Pong");
    }
});


// Login
client.login(process.env.BOT_TOKEN);