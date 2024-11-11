const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
const axios = require("axios");

// Escape underscores in usernames
function escapeUsername(username) {
  return username.replace(/_/g, '\\_');
}

// Cache object to store player status with timestamps
const cache = {};

// Set cache duration (3 minutes)
const CACHE_DURATION = 180000;

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
        throw error;
      }
    }
  }
  throw new Error('Failed to fetch data after multiple retries');
}

async function getUsernameExact(username) {
  try {
    const url = `https://api.minetools.eu/uuid/${username}`;
    const data = await fetchWithExponentialBackoff(url);
    return data.name;
  } catch (error) {
    console.error('Error while getting Exact Username for:', username);
    return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Check if a specific player is online on Hypixel.")
    .setContexts([0, 1, 2]) // Re-adding contexts
    .setIntegrationTypes([0, 1]) // Re-adding integration types
    .addStringOption((option) =>
      option.setName("username").setDescription("The username of the player to check").setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString("username");
    const escapedUsername = escapeUsername(username); // Escape underscores
    await interaction.deferReply(); // Defer reply in case API calls take time

    // Check the cache first
    if (cache[username] && (Date.now() - cache[username].timestamp < CACHE_DURATION)) {
      console.log('Serving from cache');
      return interaction.editReply({ embeds: [cache[username].embed] });
    }

    try {
      // Fetch exact username in case it's case-sensitive
      const exactUsername = await getUsernameExact(username);
      if (!exactUsername) {
        await interaction.editReply("Failed to retrieve the exact username.");
        return;
      }

      // Fetch player data from Hypixel API by username
      const response = await fetch(`https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&name=${exactUsername}`);
      const data = await response.json();

      if (!data.success || !data.player) {
        await interaction.editReply("Failed to fetch data. The player may not exist or an error occurred.");
        return;
      }

      // Check if the player is online by comparing login/logout timestamps
      const { player } = data;
      const lastLogin = player.lastLogin || 0;
      const lastLogout = player.lastLogout || 0;
      const isOnline = lastLogin > lastLogout;

      // Convert timestamps to 'N/A' if they are 0 (representing the epoch date of Dec 31, 1969)
      const formattedLastLogin = lastLogin === 0 ? "N/A" : `<t:${Math.floor(lastLogin / 1000)}:R>`;
      const formattedLastLogout = lastLogout === 0 ? "N/A" : `<t:${Math.floor(lastLogout / 1000)}:R>`;

      // Create an embed to display the player's online status
      const embed = new EmbedBuilder()
        .setColor(isOnline ? "#B3EBF2" : "#B3EBF2")
        .setTitle(`Hypixel Online Status for ${escapedUsername}`)
        .setDescription(isOnline ? `${escapedUsername} is currently online on Hypixel!` : `${escapedUsername} is not online on Hypixel.`)
        .addFields(
          { name: "Last Login", value: formattedLastLogin, inline: true },
          { name: "Last Logout", value: formattedLastLogout, inline: true }
        )
        .setImage("https://cdn.discordapp.com/attachments/1304152897000308777/1304935783764856864/status_cmd.png?ex=673133a7&is=672fe227&hm=81fd3a62dd30eaeb0b6be7cb823c34b4084cb7ccc696e72f93850c76385fa3b8&")
        .setTimestamp();

      // Store in cache
      cache[username] = {
        timestamp: Date.now(),
        embed: embed,
      };

      // Send the embed as a reply
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching Hypixel online status:", error);
      await interaction.editReply("An error occurred while checking the online status.");
    }
  },
};
