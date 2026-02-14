const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autopublish')
        .setDescription('Configure auto-publishing for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => 
            sub.setName('toggle')
               .setDescription('Turn auto-publishing on or off globally for this server')
               .addBooleanOption(option => option.setName('state').setDescription('On or Off').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('channel')
               .setDescription('Add/Remove a specific channel from the whitelist')
               .addChannelOption(option => option.setName('target').setDescription('The announcement channel').setRequired(true))
               .addStringOption(option => 
                   option.setName('action')
                         .setDescription('Add or Remove')
                         .setRequired(true)
                         .addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' })
               )
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const sub = interaction.options.getSubcommand();
        let config = await GuildConfig.findOne({ guildId: interaction.guild.id });

        if (!config) {
            config = new GuildConfig({ guildId: interaction.guild.id });
        }

        if (sub === 'toggle') {
            const state = interaction.options.getBoolean('state');
            config.enabled = state;
            await config.save();
            return interaction.editReply(
                `✅ Auto-publish system has been **${state ? 'ENABLED' : 'DISABLED'}** for this server.`
            );
        }

        if (sub === 'channel') {
            const channel = interaction.options.getChannel('target');
            const action = interaction.options.getString('action');

            if (!channel.isAnnouncement()) {
                return interaction.editReply('❌ That is not an Announcement channel.');
            }

            if (action === 'add') {
                if (!config.whitelistedChannels.includes(channel.id)) {
                    config.whitelistedChannels.push(channel.id);
                }
            } else {
                config.whitelistedChannels = config.whitelistedChannels.filter(id => id !== channel.id);
            }

            await config.save();
            return interaction.editReply(
                `✅ Channel ${channel} has been **${action === 'add' ? 'added to' : 'removed from'}** the publish list.`
            );
        }}

};