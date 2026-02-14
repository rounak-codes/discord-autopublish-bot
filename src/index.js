// --- KEEP-ALIVE SERVER ---
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const app = express();
const port = process.env.PORT;

app.get('/', (req, res) => {
    res.send('Bot is Alive! 🤖');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
// -------------------------

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // Required to read message content
    ]
    ws: {
        properties: {
            browser: "Discord iOS" // Tricks Discord into thinking this is an iPhone
        }
    }
});

// --- DEEP DEBUG LOGGING ---
client.on('debug', (info) => {
    // Only show login-related debug info
    if (info.toLowerCase().includes('heartbeat') || info.toLowerCase().includes('identif')) {
        console.log(`[DEBUG] ${info}`);
    }
});

client.commands = new Collection();

// --- Command Handler ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// --- Event Handler ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// --- Interaction Handler (for Slash Commands) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
});

// --- Database & Login ---
console.log('🔄 Attempting to connect to Database...');
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas');
        
        // DEBUG: Check if token exists and print partial (safe)
        const token = process.env.DISCORD_TOKEN;
        if (!token) {
            throw new Error('❌ CRITICAL: DISCORD_TOKEN is missing or empty!');
        }
        console.log(`🔎 Token detected (Length: ${token.length}). Starts with: ${token.substring(0, 5)}...`);
        
        console.log('🔄 Attempting to log in to Discord...');
        return client.login(token);
    })
    .then(() => {
        console.log(`✅ SUCCESS: Logged in as ${client.user.tag}!`);
    })
    .catch((err) => {
        console.error('❌ FATAL ERROR DURING STARTUP:');
        console.error(err);
    });

// --- GRACEFUL SHUTDOWN ---
const shutdown = async () => {
    console.log('🛑 Shutting down...');
    if (client) await client.destroy();
    if (mongoose) await mongoose.connection.close();
    console.log('👋 Connections closed. Bye!');
    process.exit(0);
};

// Handle generic process termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);