const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    // Array of specific channel IDs to watch. If empty, watches all announcement channels.
    whitelistedChannels: { type: [String], default: [] } 
});

module.exports = mongoose.model('GuildConfig', guildConfigSchema);