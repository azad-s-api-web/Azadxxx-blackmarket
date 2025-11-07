const axios = require("axios");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const fs = require("fs-extra");
const path = require("path");
const GIFEncoder = require("gifencoder");

module.exports = {
  config: {
    name: "spy",
    aliases: ["whoishe", "whoisshe", "whoami", "atake"],
    version: "1.4",
    role: 0,
    author: "Azad 💥", //author change korle Tor marechudi 
    description: "Spy Card with live neon text effect",
    category: "information",
    countDown: 5,
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    let tempMsg;
    try {
      tempMsg = await message.reply("⏳ Generating your Spy Card...");

      if (tempMsg?.messageID) {
        setTimeout(() => {
          try {
            message.unsend(tempMsg.messageID);
          } catch (err) {
            console.error("Failed to unsend temp message:", err);
          }
        }, 1000);
      }

      const uid = args[0] ? args[0].replace(/[<>@\s]/g, "") : event.senderID;
      const userInfo = await api.getUserInfo(uid);
      if (!userInfo[uid]) throw new Error("Could not fetch user info.");

      const name = userInfo[uid].name || "Unknown";
      const gender =
        userInfo[uid].gender === 1
          ? "👩‍🦰 Girl"
          : userInfo[uid].gender === 2
          ? "👨 Boy"
          : "❓ Unknown";
      const vanity = userInfo[uid].vanity || "None";
      const isFriend = userInfo[uid].isFriend ? "✅ Yes" : "❌ No";

      const infoLines = [
        `📛 Name: ${name}`,
        `🆔 UID: ${uid}`,
        `🪪 Username: ${vanity}`,
        `🚻 Gender: ${gender}`,
        `🤝 Friend: ${isFriend}`,
      ];

      const avatarUrl = await usersData.getAvatarUrl(uid);
      const avatarResp = await axios.get(avatarUrl, { responseType: "arraybuffer" });
      const avatar = await loadImage(Buffer.from(avatarResp.data));

      const canvasWidth = 800;
      const avatarSize = 220;
      const lineHeight = 50;
      const paddingBottom = 120;
      const canvasHeight = 50 + avatarSize + 50 + infoLines.length * lineHeight + paddingBottom;

      const encoder = new GIFEncoder(canvasWidth, canvasHeight);
      const gifPath = path.join(__dirname, `spycard_${uid}.gif`);
      const stream = fs.createWriteStream(gifPath);
      encoder.createReadStream().pipe(stream);
      encoder.start();
      encoder.setRepeat(0);
      encoder.setDelay(200);
      encoder.setQuality(10);

      const frames = 6;

      for (let f = 0; f < frames; f++) {
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, "#0d0d0d");
        gradient.addColorStop(1, "#1a1a1a");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const avatarX = canvasWidth / 2 - avatarSize / 2;
        const avatarY = 50;
        ctx.save();
        ctx.shadowColor = "rgba(255,105,180,0.9)";
        ctx.shadowBlur = 50;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        ctx.textAlign = "center";
        let textY = avatarY + avatarSize + 60;
        for (let i = 0; i < infoLines.length; i++) {
          const glowIntensity = 0.7 + 0.3 * Math.random();
          ctx.fillStyle = `rgba(255,20,147,${glowIntensity})`;
          ctx.shadowColor = `rgba(255,20,147,${glowIntensity})`;
          ctx.shadowBlur = 20 + Math.random() * 10;
          ctx.font = "bold 34px Sans";
          ctx.fillText(infoLines[i], canvasWidth / 2, textY);
          textY += lineHeight;
        }

        ctx.font = "bold 30px Sans";
        ctx.fillStyle = "#ff69b4";
        ctx.shadowColor = "#ff69b4";
        ctx.shadowBlur = 25 + Math.random() * 10;
        ctx.fillText("⚡ Powered by Azad 💥", canvasWidth / 2, canvasHeight - 40);

        encoder.addFrame(ctx);
      }

      const encoderPromise = new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      encoder.finish();
      await encoderPromise;

      await message.reply({
        body: `💫 Spy Card of ${name}`,
        attachment: fs.createReadStream(gifPath),
      });

      fs.unlinkSync(gifPath);

    } catch (err) {
      console.error("spy command error:", err);
      await message.reply("❌ | Error generating Neon Spy Card.");
    }
  },
};
