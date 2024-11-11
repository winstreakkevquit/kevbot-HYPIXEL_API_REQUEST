
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const fetch = require("node-fetch");

let leaderboardCache = null; // Cache for leaderboard data
let playerCache = {}; // Cache for player data
const CACHE_EXPIRATION_TIME = 3 * 60 * 60 * 1000; // 3 hours cache expiration time

// Format numbers with commas
function formatNumber(number) {
  if (isNaN(number)) return number;
  return number.toLocaleString();
}

// Escape underscores in usernames
function escapeUsername(username) {
  return username.replace(/_/g, '\\_');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Displays the BedWars Star leaderboard.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      // Fetch leaderboard data from cache or Hypixel API
      let data;
      const currentTime = Date.now();

      if (leaderboardCache && currentTime - leaderboardCache.timestamp < CACHE_EXPIRATION_TIME) {
        data = leaderboardCache.data; // Use cached data if still valid
      } else {
        const response = await fetch(`https://api.hypixel.net/leaderboards?key=${process.env.HYPIXEL_API_KEY}`);
        data = await response.json();

        if (!data.success) {
          await interaction.editReply("Failed to fetch leaderboard data.");
          return;
        }

        leaderboardCache = { data, timestamp: currentTime };
      }

      const bedwarsLeaderboard = data.leaderboards?.BEDWARS;
      if (!bedwarsLeaderboard || !Array.isArray(bedwarsLeaderboard)) {
        await interaction.editReply("Unable to find BedWars leaderboard data.");
        return;
      }

      const playerUUIDs = bedwarsLeaderboard[0].leaders.slice(0, 50);

      const getLeaderboardPage = async (page) => {
        const startIndex = (page - 1) * 10;
        const endIndex = startIndex + 10;
        const pagePlayers = playerUUIDs.slice(startIndex, endIndex);

        const embed = new EmbedBuilder()
          .setTitle("★ Hypixel BedWars Star Leaderboard ★")
          .setColor("#A8D8FF")
          .setImage("https://cdn.discordapp.com/attachments/1304152897000308777/1304938258974773399/leaderboard_cmdd.png?ex=673135f5&is=672fe475&hm=ddbd3fbec45b00cafcb2f00775aac2fda98f09297e0967171ea2f0673afa8fad&");

        const playerFields = await Promise.all(
          pagePlayers.map(async (uuid, index) => {
            if (playerCache[uuid] && currentTime - playerCache[uuid].timestamp < CACHE_EXPIRATION_TIME) {
              return playerCache[uuid].data;
            }

            if (uuid.length === 32) {
              uuid = uuid.replace(/([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})/, '$1-$2-$3-$4-$5');
            }

            try {
              const playerResponse = await fetch(`https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&uuid=${uuid}`);
              const playerData = await playerResponse.json();

              let fieldData;
              if (playerData.success && playerData.player) {
                const username = escapeUsername(playerData.player.displayname);
                const bedwarsLevel = playerData.player.achievements?.bedwars_level || 'Unknown';

                fieldData = {
                  name: `${startIndex + index + 1}. ${username}`,
                  value: `${formatNumber(bedwarsLevel)}★ BedWars Level`,
                  inline: false
                };
              } else {
                fieldData = {
                  name: `${startIndex + index + 1}. Unknown Player`,
                  value: `Unable to retrieve player data.`,
                  inline: false
                };
              }

              playerCache[uuid] = { data: fieldData, timestamp: currentTime };
              return fieldData;
            } catch (error) {
              console.error(`Error fetching data for UUID: ${uuid}`, error);
              return {
                name: `${startIndex + index + 1}. Error`,
                value: `An error occurred.`,
                inline: false
              };
            }
          })
        );

        playerFields.forEach(field => embed.addFields(field));

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(page === 1),
          new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(page === Math.ceil(playerUUIDs.length / 10))
        );

        return { embed, actionRow };
      };

      let currentPage = 1;
      const { embed, actionRow } = await getLeaderboardPage(currentPage);

      await interaction.editReply({ embeds: [embed], components: [actionRow] });

      const filter = (buttonInteraction) => buttonInteraction.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 300000 });

      collector.on('collect', async (buttonInteraction) => {
        if (!buttonInteraction.deferred && !buttonInteraction.replied) {
          await buttonInteraction.deferUpdate();
        }

        if (buttonInteraction.customId === 'next' && currentPage < Math.ceil(playerUUIDs.length / 10)) {
          currentPage++;
        } else if (buttonInteraction.customId === 'previous' && currentPage > 1) {
          currentPage--;
        }

        const { embed, actionRow } = await getLeaderboardPage(currentPage);
        await buttonInteraction.editReply({ embeds: [embed], components: [actionRow] });
      });

      collector.on('end', async () => {
        if (interaction.replied) {
          await interaction.editReply({ components: [] });
        }
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      if (!interaction.replied) {
        await interaction.editReply("An error occurred while fetching the leaderboard.");
      }
    }
  },
};
