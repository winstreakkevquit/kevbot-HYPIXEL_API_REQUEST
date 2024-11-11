const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Displays a list of available commands with descriptions.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    // Create an embed for the help command
    const embed = new EmbedBuilder()
      .setColor("#A8D8FF")
      .setTitle("Command Information & Credits Page")
      .setDescription("Here’s a list of all executable commands on kevbot along with credits for data sources.")
      .addFields(
        {
          name: "›› Commands «",
          value: `
          **/bedwars {username}** → Displays Bedwars statistics for the specified user.
          **/challenges {username}** → How many challenges this player has completed.
          **/leaderboard** → Shows the top 50 players on the Bedwars Star Leaderboard.
          **/status** → Provides details about a player's last online time and activity.
          **/playercount** → Information about the player counts of Bedwars.
          **/ping** → Checks the bot’s latency to ensure it’s responsive.
          **/maps** → An easy way to check the map rotation.`,
          inline: false
        },
        {
          name: "›› Credits «",
          value: `
          **NameMC API** → Used to convert UUIDs, etc.
          **Hypixel API** → Fetches all stats for Bedwars.
          **Minetools** → Used to create Minecraft skin head images.`,
          inline: false
        }
      )
      .setImage("https://cdn.discordapp.com/attachments/1091747517366026441/1304954646913220778/info_cmddd.png?ex=67314538&is=672ff3b8&hm=cc07bf39db839c351c3bd1e00cf2a12d56ed62fff6817b1be61bc1eaba4bb915&")
      .setFooter({ text: "Use these commands to interact with Kevbot!" })
      .setTimestamp();

    // Reply with the embed
    await interaction.reply({ embeds: [embed] });
  },
};
