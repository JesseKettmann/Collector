// .env
require("dotenv").config();

// Discord
const Discord = require('discord.js');
const client = new Discord.Client();




// Login
client.login(process.env.BOT_TOKEN);