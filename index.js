require("dotenv").config();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const PORT = process.env.PORT;
const HYPIXEL_API_KEY = process.env.HYPIXEL_API_KEY;
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Partials,
  Collection,
} = require("discord.js");
const express = require("express");
const commandHandler = require("./handlers/commandHandler");

// Initialize express server
const app = express();
app.get("/", (req, res) => res.send("Bot is running."));
const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Web server running on port ${port}`));

// Keep the bot alive function if needed
function keepAlive() {
  const { spawn } = require("child_process");
  spawn("node", [process.argv[1]], { detached: true, stdio: "ignore" }).unref();
}
keepAlive();

// Initialize the Discord bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.AutoModerationExecution,
  ],

  partials: [
    Partials.GuildMember,
    Partials.Channel,
    Partials.GuildScheduledEvent,
    Partials.Message,
    Partials.Reaction,
    Partials.ThreadMember,
    Partials.User,
  ],
});

// Load commands
commandHandler(client);

// Register slash commands
const commands = Array.from(client.commands.values()).map((cmd) =>
  cmd.data.toJSON(),
);
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("Successfully reloaded application (/) commands globally.");
  } catch (error) {
    console.error(error);
  }
})();

// Handle interactionCreate for commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}`, error);
    await interaction.reply({
      content: "There was an error executing this command.",
      ephemeral: true,
    });
  }
});

// Log the bot in
client.login(process.env.DISCORD_TOKEN);
