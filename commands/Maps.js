const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("maps")
    .setDescription("Gives a direct link to the latest Bedwars map rotation on the Hypixel forums")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    try {
      // URL to the forum page
      const forumUrl = 'https://hypixel.net/threads/bed-wars-map-rotation-log.4441812/page-8';

      // Embed with the URL and preview description
      const embed = new EmbedBuilder()
        .setColor("#A8D8FF")
        .setTitle("🗺️  Latest Bedwars Maps in Rotation")
        .setDescription(`Check out the latest Bedwars map rotation details on the Hypixel forum!`)
        .setURL(forumUrl) // Link the URL directly in the embed
        .setFooter({ text: "Preview may not be accurate/up-to-date"})
        .setImage("https://cdn.discordapp.com/attachments/1303549001827745852/1305340753811341352/image.png?ex=6732accf&is=67315b4f&hm=e820a0f5c266ddb207e315a37da168b8b180cdff97a94580c10335637df66462&")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching Bedwars maps:", error);
      await interaction.reply("There was an error fetching the Bedwars maps. Please try again later.");
    }
  }
};
