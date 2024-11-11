const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Get the bot's latency.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  
  async execute(interaction) {
    // Get the bot's ping (latency)
    const ping = interaction.client.ws.ping;

    // Create an embed with the bot's ping value
    const embed = new EmbedBuilder()
      .setColor("#A8D8FF") // Pastel blue color
      .setTitle("Bot Latency")
      .setDescription(`The bot's current latency is **${ping}ms**.`)
      .setTimestamp()
      .setImage("https://cdn.discordapp.com/attachments/1304152897000308777/1304938651876200530/latencyy.png?ex=67313653&is=672fe4d3&hm=7d3b6aed0e5c07b45e53ea3c1a981314e1f9f0a9514f8e3b9f10108c0c0ddd6a&")
      .setFooter({ text: "Latency data" });

    // Reply with the embed
    await interaction.reply({ embeds: [embed] });
  },
};
