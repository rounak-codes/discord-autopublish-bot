# 📢 Discord AutoPublish Bot

A lightweight Discord bot that automatically crossposts messages in Announcement channels.

Built with:
- Node.js
- discord.js v14
- MongoDB (Mongoose)

---

## ✨ Features

- 🔄 Automatically publishes new messages in announcement channels
- 🎛 Enable/disable auto-publish per server
- 📋 Channel whitelist support
- 📊 View current whitelisted channels
- 🧠 MongoDB-backed persistent configuration
- ⚡ Optimized for low-resource hosting (256MB environments supported)

---

## 🚀 Commands

### Enable / Disable
```

/autopublish toggle state:true
/autopublish toggle state:false

```

### Add or Remove Whitelisted Channel
```

/autopublish channel target:#announcements action:add
/autopublish channel target:#announcements action:remove

```

### View Whitelisted Channels
```

/autopublish list

````

---

## 🧠 How It Works

- If whitelist is **empty** → bot publishes in all announcement channels.
- If whitelist contains channels → bot publishes only in those channels.
- Discord rate limit: **10 publishes per hour per channel** (handled automatically).

---

## 📦 Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/discord-autopublish-bot.git
cd discord-autopublish-bot
````

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Create `.env`

```
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
MONGO_URI=your_mongodb_connection_string
```

### 4️⃣ Register Slash Commands

```bash
node deploy-commands.js
```

### 5️⃣ Start Bot

```bash
npm start
```

---

## 🏗 Deployment

Designed to run as a background Node process.

Recommended:

* 256MB RAM minimum
* Persistent WebSocket support
* No HTTP server required

Works on:

* VPS
* Docker
* Container-based hosts
* Lightweight free-tier platforms

---

## 🔐 Required Bot Permissions

For announcement channels:

* View Channel
* Send Messages
* Manage Messages

Channel must be of type:

```
Announcement Channel
```

---

## 📁 Project Structure

```
src/
  commands/
  events/
  models/
  index.js
deploy-commands.js
```

---

## ⚠️ Notes

* Skipped messages (due to rate limit or downtime) are not retroactively published.
* Discord enforces publish limits.
* Slash command changes require re-running `deploy-commands.js`.

---