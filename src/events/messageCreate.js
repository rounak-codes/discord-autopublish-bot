const { ChannelType } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // 1. Basic Filters
        if (message.author.bot) return;
        if (!message.guild) return;
        if (message.channel.type !== ChannelType.GuildAnnouncement) return;

        // 2. Fetch Config
        const config = await GuildConfig.findOne({ guildId: message.guild.id });
        if (!config || !config.enabled) return;

        // 3. Whitelist Check (If whitelist is empty, allow all announcement channels)
        if (config.whitelistedChannels.length > 0 && !config.whitelistedChannels.includes(message.channel.id)) {
            return;
        }

        // 4. Publish Logic
        try {
            // Check if the bot actually has permission to publish here
            if (!message.crosspostable) {
                console.warn(`[Warn] Message in ${message.channel.name} is not crosspostable (Rate limit or missing perms).`);
                return;
            }

            await message.crosspost();
            console.log(`[Success] Published message in ${message.guild.name} -> #${message.channel.name}`);
            
            // Optional: Log to a specific channel if configured in .env
            if (process.env.LOG_CHANNEL_ID) {
                const logChannel = message.client.channels.cache.get(process.env.LOG_CHANNEL_ID);
                if (logChannel) logChannel.send(`📢 **Published:** ${message.guild.name} (#${message.channel.name})`);
            }

        } catch (error) {
            console.error(`[Error] Failed to publish in ${message.guild.name}:`, error);
        }
    }
};