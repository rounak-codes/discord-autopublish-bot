if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
  
  const fs = require("fs");
  const path = require("path");
  const { Client, GatewayIntentBits, Collection } = require("discord.js");
  const mongoose = require("mongoose");
  
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages
    ]
  });
  
  client.commands = new Collection();
  
  /* Commands */
  const commandsPath = path.join(__dirname, "commands");
  for (const file of fs.readdirSync(commandsPath)) {
    if (!file.endsWith(".js")) continue;
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
  }
  
  /* Events */
  const eventsPath = path.join(__dirname, "events");
  for (const file of fs.readdirSync(eventsPath)) {
    if (!file.endsWith(".js")) continue;
    const event = require(path.join(eventsPath, file));
    const handler = (...args) => event.execute(...args);
    event.once
      ? client.once(event.name, handler)
      : client.on(event.name, handler);
  }
  
  /* Interactions */
  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
  
    try {
      await cmd.execute(interaction);
    } catch {
      await interaction.reply({
        content: "Command error.",
        ephemeral: true
      });
    }
  });
  
  /* Startup */
  (async () => {
    try {
      console.log("Connecting to MongoDB...");
      await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 3
      });
  
      console.log("Logging into Discord...");
      await client.login(process.env.DISCORD_TOKEN);
  
      console.log("Bot online.");
    } catch (err) {
      console.error("Startup failure:", err);
      process.exit(1);
    }
  })();
  
  /* Shutdown */
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    client.destroy();
    process.exit(0);
  });
  