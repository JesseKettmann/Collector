// .env
require("dotenv").config();

// Discord
const Discord = require('discord.js');
const client = new Discord.Client();
const botID = "838126284843778089";

// On startup
client.on("ready", () => {
    // Log
    console.log("Bot succesfully started");

    // Connect to MongoDB
    //MongoDB.Connect();

    // Stay active
    //var job = new CronJob('* 20 * * * *', function () {
    //    console.log('Ping');
    //}, null, true, 'America/Los_Angeles');
    //job.start();
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