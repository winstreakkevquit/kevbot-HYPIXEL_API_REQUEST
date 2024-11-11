const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");

module.exports = (client) => {
  client.commands = new Collection();

  const commandFiles = fs
    .readdirSync(path.join(__dirname, "../commands"))
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    // Ensure each command has 'data' and 'execute' properties
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(
        `Command at ${file} is missing "data" or "execute" property.`,
      );
    }
  }
};
