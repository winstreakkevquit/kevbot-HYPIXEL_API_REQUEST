const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

// Escape underscores in usernames
function escapeUsername(username) {
  return username.replace(/_/g, '\\_');
}

// Cache object to store stats with timestamps
const cache = {};

// Set cache duration (3 minutes)
const CACHE_DURATION = 180000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bedwars")
    .setDescription("Displays your Bedwars Statistics!")
    .setContexts([0, 1, 2]) // Re-adding contexts
    .setIntegrationTypes([0, 1]) // Re-adding integration types
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("Minecraft username to fetch stats")
        .setRequired(true)
    ),

  async execute(interaction) {
    let username = interaction.options.getString('username')?.toLowerCase();

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

    // Check the cache first
    if (cache[username] && (Date.now() - cache[username].timestamp < CACHE_DURATION)) {
      console.log('Serving from cache');
      return interaction.reply({ embeds: [cache[username].embed] });
    }

    const user = escapeUsername(await getUsernameExact(username));

    function formatNumber(number) {
      return new Intl.NumberFormat().format(number);
    }

    try {
      // Fetch UUID using Mojang API
      const uuidResponse = await axios.get(
        `https://api.mojang.com/users/profiles/minecraft/${username}`
      );
      const uuid = uuidResponse.data.id;

      // Fetch Bedwars stats from Hypixel API
      const response = await axios.get(
        `https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&uuid=${uuid}`
      );
      const stats = response.data.player;
      const BWstats = response.data.player?.stats?.Bedwars;

      if (!stats) {
        return interaction.reply(
          "Could not find Bedwars stats for this player."
        );
      }

      // Calculate Bedwars level and star symbol
      const level = stats?.achievements.bedwars_level || 1;
      let starSymbol = "✫";
      if (level >= 1100 && level < 2100) starSymbol = "✪";
      else if (level >= 2100 && level < 3100) starSymbol = "⚝";
      else if (level >= 3100) starSymbol = "✥";

      const winstreak = BWstats.winstreak || "N/A";
      const finalKills = BWstats.final_kills_bedwars || 0;
      const finalDeaths = BWstats.final_deaths_bedwars || 0;
      const bedsBroken = BWstats.beds_broken_bedwars || 0;
      const bedsLost = BWstats.beds_lost_bedwars || 0;
      const wins = BWstats.wins_bedwars || 0;
      const losses = BWstats.losses_bedwars || 0;

      const fkdr = finalDeaths > 0 ? (finalKills / finalDeaths).toFixed(2) : "N/A";
      const bedBrokenRatio = bedsLost > 0 ? (bedsBroken / bedsLost).toFixed(2) : "N/A";
      const winLossRatio = losses > 0 ? (wins / losses).toFixed(2) : "N/A";

      const index = (level * Math.pow(parseFloat(fkdr), 2)).toFixed(2);

      const avatarUrl = `https://mc-heads.net/avatar/${username}/64`;

      const embed = new EmbedBuilder()
        .setColor("#A8D8FF")
        .setTitle(`★ ${user}'s Bedwars Statistics ★`)
        .setThumbnail(avatarUrl)
        .addFields(
          { name: "Overall Bedwars Level", value: `↪ **${level} ${starSymbol}**`, inline: false },
          { name: "Final Kills", value: `${formatNumber(finalKills)}`, inline: true },
          { name: "Beds Broken", value: `${formatNumber(bedsBroken)}`, inline: true },
          { name: "Wins", value: `${formatNumber(wins)}`, inline: true },
          { name: "Final Deaths", value: `${formatNumber(finalDeaths)}`, inline: true },
          { name: "Beds Lost", value: `${formatNumber(bedsLost)}`, inline: true },
          { name: "Losses", value: `${formatNumber(losses)}`, inline: true },
          { name: "FKDR", value: `${formatNumber(fkdr)}`, inline: true },
          { name: "BBLR", value: `${formatNumber(bedBrokenRatio)}`, inline: true },
          { name: "WLR", value: `${formatNumber(winLossRatio)}`, inline: true }
        )
        .setFooter({ text: `Data provided by the Hypixel API` })
        .setImage("https://cdn.discordapp.com/attachments/1304152897000308777/1304936488403992667/bedwars_cmd.png?ex=6731344f&is=672fe2cf&hm=1756ba89d588c70c079eaa87ef48a79a46c8a193c1bdc76db6e0eb465850045f&")
        .setTimestamp();

      // Store in cache
      cache[username] = {
        timestamp: Date.now(),
        embed: embed,
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching Bedwars stats:", error);
      await interaction.reply("Rate limit reached; retry momentarily.");
    }
  },
};
