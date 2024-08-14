const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  WebhookClient,
  REST,
  Routes,
} = require("discord.js");
const fs = require("fs");
const cron = require("node-cron");
const { SlashCommandBuilder } = require("@discordjs/builders");
const https = require("https");
const config = require("./config");

const {
  clientId,
  guildId,
  token,
  webhookUrl,
  commandsLocked,
  allowedRoles,
  roles,
} = config;

if (!clientId || !guildId || !token || !webhookUrl) {
  console.error(
    "Error: One or more configuration variables (clientId, guildId, token, webhookUrl) are missing. The bot will not start."
  );
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const dataFilePath = "./data.json";
const webhookClient = new WebhookClient({ url: webhookUrl });

let data = {};
if (fs.existsSync(dataFilePath)) {
  data = JSON.parse(fs.readFileSync(dataFilePath));
}

// Utility functions
function parseDuration(duration) {
  const timeUnits = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    mo: 30 * 24 * 60 * 60 * 1000,
  };

  const regex = /^(\d+)(s|m|h|d|w|mo)$/;
  const match = duration.match(regex);

  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    return value * timeUnits[unit];
  } else {
    throw new Error("Invalid time format.");
  }
}

function formatDuration(ms) {
  const timeUnits = [
    { unit: "month(s)", value: 30 * 24 * 60 * 60 * 1000 },
    { unit: "week(s)", value: 7 * 24 * 60 * 60 * 1000 },
    { unit: "day(s)", value: 24 * 60 * 60 * 1000 },
    { unit: "hour(s)", value: 60 * 60 * 1000 },
    { unit: "minute(s)", value: 60 * 1000 },
    { unit: "second(s)", value: 1000 },
  ];

  for (const { unit, value } of timeUnits) {
    if (ms >= value) {
      const time = Math.floor(ms / value);
      return `${time} ${unit}`;
    }
  }

  return "0 second(s)";
}

// Define commands
const commands = [
  new SlashCommandBuilder()
    .setName("givepriority")
    .setDescription("Give a priority to a user for a specified time")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to assign the priority to")
        .setRequired(true)
    )
    .addStringOption((option) => {
      const roleOption = option
        .setName("priority")
        .setDescription("The priority to assign")
        .setRequired(true);

      config.roles.forEach((role) => {
        roleOption.addChoices({ name: role.name, value: role.value });
      });

      return roleOption;
    })
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription(
          "The time to assign the priority for (e.g., 1d, 1h, 1m)"
        )
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("removepriority")
    .setDescription("Remove a priority from a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove the priority from")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("list")
    .setDescription("List all users with assigned priorities")
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("The page number to display")
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("togglelock")
    .setDescription("Toggle the command lock state"),
  new SlashCommandBuilder()
    .setName("checkplayer")
    .setDescription("Check the current priority status of a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to check the priority status for")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

// Register commands
(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

// Bot ready event
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  checkForUpdates();

  cron.schedule("* * * * *", () => {
    checkRoles();
  });
});

// Interaction handling
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandsLocked) {
    const memberRoles = interaction.member.roles.cache.map((role) => role.id);
    const hasAccess = memberRoles.some((role) => allowedRoles.includes(role));
    if (!hasAccess) {
      return interaction.reply(
        "You do not have permission to use this command."
      );
    }
  }

  if (commandName === "givepriority") {
    const user = interaction.options.getUser("user");
    const roleId = interaction.options.getString("priority");
    const duration = interaction.options.getString("time");
    const executor = interaction.user;

    let milliseconds;
    try {
      milliseconds = parseDuration(duration);
    } catch (error) {
      return interaction.reply(
        "Invalid time format. Use 1s, 1m, 1h, 1d, 1w, or 1mo."
      );
    }

    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      return interaction.reply("Guild not found.");
    }

    // Check if bot has manage roles permission
    if (!guild.members.me.permissions.has('MANAGE_ROLES')) {
      return interaction.reply('I do not have permission to manage roles.');
    }

    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(roleId);

    if (!member || !role) {
      return interaction.reply("Invalid priority or role.");
    }

    // Check if the bot's highest role is higher than the role to assign
    const botHighestRole = guild.members.me.roles.highest;
    if (botHighestRole.position <= role.position) {
      return interaction.reply(`I cannot assign the ${role.name} role because it is higher than or equal to my highest role.`);
    }

    if (data[user.id]) {
      return interaction.reply(`${member.user.tag} already has a priority.`);
    }

    await member.roles.add(role);
    await interaction.reply(
      `Priority ${role.name} has been assigned to ${member.user.tag} for ${duration} by ${executor.tag}.`
    );

    const expireDate = new Date(Date.now() + milliseconds);
    const expireTimestamp = Math.floor(expireDate.getTime() / 1000);

    try {
      await user.send(
        `You have been given the ${role.name} priority for ${duration}. It will be active until <t:${expireTimestamp}:F>.`
      );
    } catch (error) {
      console.error(`Could not send DM to ${user.tag}:`, error);
    }

    logToWebhook(
      "Priority Given",
      `Priority ${role.name} assigned to <@${member.user.id}> (ID: ${member.user.id}) for ${duration} by <@${executor.id}> (ID: ${executor.id}).`,
      "#0000FF"
    );

    data[user.id] = { roleId: roleId, expireDate: expireDate.toISOString() };
    saveData();
  } else if (commandName === "removepriority") {
    const user = interaction.options.getUser("user");
    const executor = interaction.user;

    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      return interaction.reply("Guild not found.");
    }

    // Check if bot has manage roles permission
    if (!guild.members.me.permissions.has('MANAGE_ROLES')) {
      return interaction.reply('I do not have permission to manage roles.');
    }

    const member = await guild.members.fetch(user.id);

    if (!data[user.id]) {
      return interaction.reply(
        `${member.user.tag} does not have an assigned priority.`
      );
    }

    const roleId = data[user.id].roleId;
    const role = guild.roles.cache.get(roleId);

    if (!role) {
      return interaction.reply("Priority not found.");
    }

    // Check if the bot's highest role is higher than the role to remove
    const botHighestRole = guild.members.me.roles.highest;
    if (botHighestRole.position <= role.position) {
      return interaction.reply(`I cannot remove the ${role.name} role because it is higher than or equal to my highest role.`);
    }

    await member.roles.remove(role);
    delete data[user.id];
    saveData();

    await interaction.reply(
      `Priority ${role.name} has been removed from ${member.user.tag} by ${executor.tag}.`
    );
    logToWebhook(
      "Priority Removed",
      `Priority ${role.name} removed from <@${member.user.id}> (ID: ${member.user.id}) by <@${executor.id}> (ID: ${executor.id}).`,
      "#FF0000"
    );
  } else if (commandName === "list") {
    const page = interaction.options.getInteger("page") || 1;
    const pageSize = 10;

    const entries = Object.entries(data);
    const totalEntries = entries.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const paginatedEntries = entries.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    const embed = new EmbedBuilder()
      .setTitle("Priority Assignments")
      .setFooter({
        text: `Page ${page} of ${totalPages} • Total: ${totalEntries} items`,
      });

    for (const [userId, { roleId, expireDate }] of paginatedEntries) {
      const member = await interaction.guild.members.fetch(userId);
      const role = interaction.guild.roles.cache.get(roleId);
      const remainingTime = Math.max(0, new Date(expireDate) - new Date());
      const remainingSeconds = Math.ceil(remainingTime / 1000);
      const expireTimestamp = Math.floor(new Date(expireDate).getTime() / 1000);

      embed.addFields({
        name: ` ${member.user.tag}`,
        value: `<@${member.user.id}>\nPriority: ${
          role.name
        }\nExpires in: ${formatDuration(remainingTime)}\nUser ID: ${
          member.user.id
        }\nExpires at: <t:${expireTimestamp}:F>`,
        inline: true,
      });
    }

    await interaction.reply({ embeds: [embed] });
  } else if (commandName === "togglelock") {
    commandsLocked = !commandsLocked;
    await interaction.reply(
      `Command lock is now ${commandsLocked ? "enabled" : "disabled"}.`
    );
  } else if (commandName === "checkplayer") {
    const user = interaction.options.getUser("user");

    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      return interaction.reply("Guild not found.");
    }

    const member = await guild.members.fetch(user.id);

    if (!member) {
      return interaction.reply("User not found in the guild.");
    }

    if (!data[user.id]) {
      return interaction.reply(
        `${member.user.tag} does not have any assigned priority.`
      );
    }

    const { roleId, expireDate } = data[user.id];
    const role = guild.roles.cache.get(roleId);

    if (!role) {
      return interaction.reply("Priority role not found.");
    }

    const remainingTime = Math.max(0, new Date(expireDate) - new Date());
    const expireTimestamp = Math.floor(new Date(expireDate).getTime() / 1000);

    const embed = new EmbedBuilder()
      .setTitle("Priority Status")
      .setDescription(
        `<@${member.user.id}> (${member.user.tag}) has the ${role.name} priority.`
      )
      .addFields({
        name: "Expires in",
        value: `${formatDuration(
          remainingTime
        )}\nExpires at: <t:${expireTimestamp}:F>`,
      })
      .setColor("#00FF00")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
});

function saveData() {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

async function checkRoles() {
  const now = new Date();
  const guild = client.guilds.cache.get(guildId);

  if (!guild) {
    console.error(`Guild with ID ${guildId} not found.`);
    return;
  }

  for (const userId in data) {
    const { roleId, expireDate } = data[userId];
    if (new Date(expireDate) <= now) {
      try {
        const member = await guild.members.fetch(userId);
        let role = guild.roles.cache.get(roleId);

        if (!role) {
          // Fetch the role if not in cache
          role = await guild.roles.fetch(roleId);
        }

        if (member && role) {
          await member.roles.remove(role);
          console.log(
            `Removed Priority ${role.name} from ${member.user.tag} (ID: ${member.user.id})`
          );
          logToWebhook(
            "Priority Removed",
            `Removed priority ${role.name} from <@${member.user.id}> (ID: ${member.user.id})`,
            "#FF0000"
          );
        } else {
          console.error(`Member or priority not found for user ID ${userId}`);
        }

        delete data[userId];
        saveData();
      } catch (error) {
        console.error(`Error processing user ID ${userId}:`, error);
      }
    }
  }
}

function logToWebhook(title, description, color) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();

  webhookClient
    .send({ embeds: [embed] })
    .then(() => console.log("Log sent to webhook"))
    .catch(console.error);
}

client.login(token);

// Function to check for updates
function checkForUpdates() {
  const currentVersion = JSON.parse(fs.readFileSync("./package.json")).version;
  const options = {
    hostname: "api.github.com",
    path: `/repos/i6h/priority-bot/releases/latest`,
    method: "GET",
    headers: {
      "User-Agent": "Node.js",
    },
  };

  const req = https.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const latestRelease = JSON.parse(data);
        const latestVersion = latestRelease.tag_name;

        if (currentVersion !== latestVersion) {
          logToWebhook(
            "Update Available",
            `A new version of the bot is available!\nCurrent version: ${currentVersion}\nLatest version: ${latestVersion}\nPlease update the bot to the latest version.`,
            "#FFFF00"
          );
        } else {
          console.log(`Bot is up-to-date. Version: ${currentVersion}`);
        }
      } catch (error) {
        console.error("Error parsing update data:", error);
      }
    });
  });

  req.on("error", (error) => {
    console.error("Error checking for updates:", error);
  });

  req.end();
}
