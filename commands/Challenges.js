const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

// Escape underscores in usernames
function escapeUsername(username) {
  return username.replace(/_/g, '\\_');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("challenges")
    .setDescription("Displays completed Bedwars challenges for a player!")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("Minecraft username to fetch challenges")
        .setRequired(true),
    ),

  async execute(interaction) {
    let username = interaction.options.getString("username")?.toLowerCase();

    // Function to fetch with exponential backoff
    async function fetchWithExponentialBackoff(url, retries = 5, delay = 1000) {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await axios.get(url);
          return response.data;
        } catch (error) {
          if (error.response && error.response.status === 429) {
            console.log(`Rate limit hit, retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
          } else {
            throw error; // Rethrow other errors
          }
        }
      }
      throw new Error('Failed to fetch data after multiple retries');
    }

    // Function to get exact username from Mojang API
    async function getExactUsername(username) {
      try {
        const url = `https://api.mojang.com/users/profiles/minecraft/${username}`;
        const data = await fetchWithExponentialBackoff(url);
        return data.name;  // Mojang API returns exact username
      } catch (error) {
        console.error(`Error fetching exact username for: ${username}`, error);
        return null;
      }
    }

    try {
      // Fetch the exact username (to ensure it's the correct format)
      const exactUsername = await getExactUsername(username);
      if (!exactUsername) {
        return interaction.reply("Could not find a Minecraft account with that username.");
      }

      // Fetch UUID from Mojang API using exact username
      const uuidResponse = await fetchWithExponentialBackoff(`https://api.mojang.com/users/profiles/minecraft/${exactUsername}`);
      if (!uuidResponse || !uuidResponse.id) {
        return interaction.reply("Could not find a Minecraft account with that username.");
      }
      const uuid = uuidResponse.id;

      // Fetch Bedwars stats from Hypixel API
      const response = await fetchWithExponentialBackoff(
        `https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&uuid=${uuid}`
      );
      const playerData = response.player;
      const achievements = playerData?.achievements;

      if (!achievements) {
        return interaction.reply("Could not find Bedwars stats for this player.");
      }

      const challengesCompleted = achievements.bedwars_bedwars_challenger || 0;
      const user = escapeUsername(exactUsername);  // Use exact username to ensure it's in the right format
      const avatarUrl = `https://mc-heads.net/avatar/${exactUsername}/64`;

      // Embed to show challenge completion
      const embed = new EmbedBuilder()
        .setColor("#A8D8FF")
        .setTitle(`⚔︎ ${user}'s Bedwars Challenges ⚔︎`)
        .setThumbnail(avatarUrl)
        .addFields({
          name: "Challenges Conquered",
          value: `**${challengesCompleted}/30** Completed`,
          inline: false,
        })
        .setFooter({ text: "Data provided by the Hypixel API" })
        .setImage("https://cdn.discordapp.com/attachments/1303549001827745852/1305285524033900635/CHALELGNSEGNESCMD.png?ex=6732795f&is=673127df&hm=aac10ae62220811100f66549f9758057b5ec5d891a71c5e28f70b6e72bb189b3&")
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching Bedwars challenges:", error);
      await interaction.reply("An error occurred while fetching the Bedwars challenges. Please try again.");
    }
  },
};
