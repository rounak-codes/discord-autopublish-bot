// --- KEEP-ALIVE SERVER ---
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is Alive! 🤖');
});

app.listen(port, () => {
    console.log(`Keep-Alive Server listening on port ${port}`);
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
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        client.login(process.env.DISCORD_TOKEN);
    })
    .catch((err) => console.error('Database connection failed:', err));

// --- GRACEFUL SHUTDOWN ---
const shutdown = async () => {
    console.log('🛑 Shutting down...');
    await client.destroy();
    await mongoose.connection.close();
    console.log('👋 Connections closed. Bye!');
    process.exit(0);
};

// Handle generic process termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);