# Priority Bot 🚀

<!-- ![Total Downloads](https://img.shields.io/github/downloads/i6h/priority-bot/total?logo=github)
![Latest Downloads](https://img.shields.io/github/downloads/i6h/priority-bot/latest/total?logo=github)
![Contributors](https://img.shields.io/github/contributors/i6h/priority-bot?logo=github)
![Latest Release](https://img.shields.io/github/v/release/i6h/priority-bot?logo=github) -->

**Priority Bot** is a powerful Discord bot designed to help server admins manage temporary priority roles with ease. Whether you need to grant temporary access to certain channels or manage special roles that expire after a set time, Priority Bot automates the entire process, making your server management more efficient.

## ✨ Features

- **Assign Priority Roles**: Easily assign temporary roles to users with slash commands.
- **Check Player Status**: Quickly check the current priority status and expiration time for any user.
- **Automatic Role Removal**: Automatically removes roles once the assigned time expires.
- **Logging**: Logs significant actions and updates to a specified webhook.
- **Update Checks**: Automatically checks for bot updates and notifies you via webhook.
- **Command Locking**: Restrict the use of commands to specific roles, enhancing security.

## 🛠️ Technology Stack

- **<a href="https://discord.js.org/" target="_blank">discord.js</a>**: A powerful Node.js module that allows you to interact with the Discord API, enabling rich functionality for managing roles and handling server events.
- **<a href="https://pnpm.io/" target="_blank">pnpm</a>**: Recommended for faster and more efficient dependency management.
- **<a href="https://github.com/Re2team/connectqueue" target="_blank">connectqueue</a>**: For better performance, especially in high-traffic Discord servers, using the `connectqueue` system is recommended to manage and process tasks in a queue efficiently.

## 🚀 Installation

### Prerequisites

- Node.js v16 or higher
- A Discord bot token
- A Discord server with appropriate roles
- `pnpm` installed globally (optional, but recommended)

### Setup

1. **Clone the repository**:

    ```bash
    git clone https://github.com/i6h/priority-bot.git
    cd priority-bot
    ```

2. **Install dependencies**:

    If you prefer to use `pnpm`, install dependencies with:

    ```bash
    pnpm install
    ```

    Alternatively, you can use `npm`:

    ```bash
    npm install
    ```

3. **Configure the bot**:

    Rename the `.env.example` file to `.env` and add your Discord bot credentials and webhook URL:

    ```env
    TOKEN=your_discord_bot_token
    GUILD_ID=your_guild_id
    CLIENT_ID=your_discord_client_id
    WEBHOOK_URL=your_webhook_url
    ```

4. **Customize the bot**:

    Open `config.js` and set up your roles and allowed roles:

    ```javascript
    const config = {
        token: process.env.TOKEN, // dont touch !!!
        guildId: process.env.GUILD_ID, // dont touch !!!
        clientId: process.env.CLIENT_ID, // dont touch !!!
        webhookUrl: process.env.WEBHOOK_URL, //dont touch !!!

        commandsLocked: false,
        allowedRoles: ['your_allowed_role_id', 'your_allowed_role_id2'],
        roles: [
            { name: 'Owner', value: 'role_id' },
            { name: 'Admins', value: 'role_id' },
            { name: 'anything', value: 'role_id' }
        ]
    };
    ```

5. **Optional: Set up the `connectqueue` system**:

    For better compatibility with various Discord setups, integrate the `connectqueue` system. Follow the instructions on the <a href="https://github.com/Re2team/connectqueue" target="_blank">connectqueue GitHub page</a> to set it up.


6. **Run the bot**:

    ```bash
    pnpm start
    ```

    Or, if you’re using `npm`:

    ```bash
    npm start
    ```

## 📋 Usage

Priority Bot offers several slash commands to manage roles effectively:

### 1. `givepriority`

**Assigns a temporary priority role to a user for a specified duration.**

- **Usage**: 
  ```plaintext
  /givepriority user:@Username priority:<Role> time:<Duration>
  ```

- **Example**: 
  ```plaintext
  /givepriority user:@its4lion priority:Gold time:1h
  ```
  This assigns the "Gold" role to `@its4lion` for 1 hour.

### 2. `removepriority`

**Removes an assigned priority role from a user before its expiration time.**

- **Usage**:
  ```plaintext
  /removepriority user:@Username
  ```

- **Example**:
  ```plaintext
  /removepriority user:@its4lion
  ```
  This removes the priority role from `@its4lion`.

### 3. `list`

**Lists all users who currently have an assigned priority role, along with the remaining time for each role.**

- **Usage**:
  ```plaintext
  /list page:<PageNumber>
  ```

- **Example**:
  ```plaintext
  /list page:1
  ```
  This displays the first page of users with assigned priority roles.

### 4. `togglelock`

**Toggles the lock state of the commands. When locked, only users with specific roles can use the bot’s commands.**

- **Usage**:
  ```plaintext
  /togglelock
  ```

  This toggles the command lock state.

### 5. `checkplayer`

**Check the current priority status of a user, including role and remaining time.**

- **Usage**:
  ```plaintext
  /checkplayer user:@Username
  ```

- **Example**:
  ```plaintext
  /checkplayer user:@its4lion
  ```
  This checks the current priority status of `@its4lion`.

## 🛡️ Practical Examples

### Granting Temporary Access

Grant a user temporary access to a special channel by assigning them a "VIP" role for 24 hours:

```plaintext
/givepriority user:@Lion priority:VIP time:24h
```

### Handling Expired Roles

The bot automatically removes roles when they expire, so you don’t need to manually track expiration times.

### Monitoring Active Roles

Use the `/list` command to keep track of who currently has priority roles and when those roles will expire:

```plaintext
/list page:1
```

### Checking Player Status

Quickly check the current status of any user using the `/checkplayer` command:

```plaintext
/checkplayer user:@Username
```

### Command Locking

Toggle the command lock with `/togglelock` to restrict command usage to specific roles (configured in `config.js` under `allowedRoles`). This is useful for ensuring that only trusted users can manage roles.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## 📞 Contact

If you have any questions, suggestions, or feedback, feel free to reach out:

- **Discord User**: [its4lion](https://discord.com/users/320015606071951360).
- **GitHub**: Open an issue or submit a pull request.

When contacting or opening an issue, please provide as much detail as possible to help us assist you better.
