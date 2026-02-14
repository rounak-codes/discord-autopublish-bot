require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');

// --------------------
// Discord Client
// --------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Extra safety logging
client.on("error", console.error);
client.on("shardError", console.error);
client.on("shardDisconnect", console.log);
client.on("shardReconnecting", console.log);

// --------------------
// Command Handler
// --------------------
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// --------------------
// Event Handler
// --------------------
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

// --------------------
// Interaction Handler
// --------------------
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error executing this command!',
      ephemeral: true
    });
  }
});

// --------------------
// Startup
// --------------------
(async () => {
  try {
    console.log('🔄 Attempting to connect to Database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN missing');
    }

    console.log('🔄 Attempting to log in to Discord...');
    await client.login(process.env.DISCORD_TOKEN);

  } catch (err) {
    console.error('❌ FATAL STARTUP ERROR');
    console.error(err);
    process.exit(1);
  }
})();

// --------------------
// Graceful Shutdown
// --------------------
const shutdown = async () => {
  console.log('🛑 Shutting down...');
  await client.destroy();
  await mongoose.connection.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
