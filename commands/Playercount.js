const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playercount")
    .setDescription("Displays the overall player count and the player count for selected Bedwars modes.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      // Fetch player count data from the Hypixel API
      const response = await fetch(`https://api.hypixel.net/v2/counts?key=${process.env.HYPIXEL_API_KEY}`);
      const data = await response.json();

      // Check if the API response was successful
      if (!data.success) {
        await interaction.editReply("Failed to retrieve player count data from Hypixel.");
        return;
      }

      const overallPlayerCount = data.games.BEDWARS.players; // Overall player count for Bedwars
      const bedwarsData = data.games.BEDWARS.modes;

      if (!bedwarsData) {
        await interaction.editReply("Bedwars data is not currently available.");
        return;
      }

      // Prepare the embed message
      const embed = new EmbedBuilder()
        .setTitle("⛦ Hypixel Bedwars Player Count")
        .setColor("#A1C6EA")
        .setDescription("The current player count for Bedwars modes:");

      // Display overall player count
      embed.addFields({
        name: "Total Count",
        value: `**${formatNumber(overallPlayerCount)} players** currently playing Bedwars.`,
        inline: false,
      });

      // Add an empty field for spacing
      embed.addFields({
        name: " ",
        value: ` `,
        inline: false,
      });

      // Customize field for BEDWARS_EIGHT_ONE (Solos)
      embed.addFields({
        name: "Solos",
        value: `››  ${formatNumber(bedwarsData.BEDWARS_EIGHT_ONE)} players currently playing in the solos mode.`,
        inline: false,
      });

      // Customize field for BEDWARS_EIGHT_TWO (Doubles)
      embed.addFields({
        name: "Doubles",
        value: `››  ${formatNumber(bedwarsData.BEDWARS_EIGHT_TWO)} players currently playing in the doubles mode.`,
        inline: false,
      });

      // Customize field for BEDWARS_FOUR_THREE (Threes)
      embed.addFields({
        name: "Threes",
        value: `››  ${formatNumber(bedwarsData.BEDWARS_FOUR_THREE)} players currently playing in the 3v3v3v3 mode.`,
        inline: false,
      });

      // Customize field for BEDWARS_FOUR_FOUR (Fours)
      embed.addFields({
        name: "Fours",
        value: `››  ${formatNumber(bedwarsData.BEDWARS_FOUR_FOUR)} players currently playing in the 4v4v4v4 mode.`,
        inline: false,
      });

      // Add image to the embed
      embed.setImage("https://cdn.discordapp.com/attachments/1303549001827745852/1305259957905653780/PLAYERCOUTNSDMCMCDMD.png?ex=67326190&is=67311010&hm=29b734e67f4cc391077301da9e89c76c58c53c9a031da957924b75e05c6d62a2&");

      // Add footer and timestamp
      embed.setFooter({ text: "Player count data" });
      embed.setTimestamp();

      // Send the embed with the player counts
      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error fetching player count:", error);
      await interaction.editReply("An error occurred while fetching the player count.");
    }
  },
};

// Helper function to format numbers with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
