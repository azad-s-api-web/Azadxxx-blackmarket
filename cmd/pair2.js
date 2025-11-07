const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
config: {
name: "pair2",
author: "Azad 💥 (editor by Fahad Islam)",
category: "TOOLS",
},

onStart: async function ({ api, event, usersData }) {
try {
const threadData = await api.getThreadInfo(event.threadID);
const users = threadData.userInfo;

const mentions = event.mentions || {};  
  const mentionIDs = Object.keys(mentions);  
  const repliedUserID = event.type === "message_reply" ? event.messageReply.senderID : null;  
  const senderID = event.senderID;  

  let user1ID = null;  
  let user2ID = null;  

  // Determine pairing  
  if (mentionIDs.length >= 2) {  
    const filtered = mentionIDs.filter(id => id !== senderID);  
    if (filtered.length < 2)  
      return api.sendMessage("⚠️ Please mention two different users (not yourself).", event.threadID, event.messageID);  
    user1ID = filtered[0];  
    user2ID = filtered[1];  
  } else if (mentionIDs.length === 1 && mentionIDs[0] !== senderID) {  
    user1ID = senderID;  
    user2ID = mentionIDs[0];  
  } else if (repliedUserID && repliedUserID !== senderID) {  
    user1ID = senderID;  
    user2ID = repliedUserID;  
  }  

  let selectedMatch, matchName, baseUserID;  

  if (user1ID && user2ID) {  
    const user1 = users.find(u => u.id === user1ID);  
    const user2 = users.find(u => u.id === user2ID);  

    if (!user1 || !user2)  
      return api.sendMessage("❌ Could not find one or both users in the group.", event.threadID, event.messageID);  

    if (!user1.gender || !user2.gender)  
      return api.sendMessage("⚠️ Couldn't determine gender for one or both users.", event.threadID, event.messageID);  

    if (user1.gender === user2.gender)  
      return api.sendMessage("⚠️ Same gender pairing is not allowed.", event.threadID, event.messageID);  

    baseUserID = user1ID;  
    selectedMatch = user2;  
    matchName = user2.name;  
  } else {  
    const senderData = users.find(u => u.id === senderID);  
    if (!senderData || !senderData.gender)  
      return api.sendMessage("⚠️ Could not determine your gender.", event.threadID, event.messageID);  

    const myGender = senderData.gender;  
    const matchCandidates = myGender === "MALE"  
      ? users.filter(u => u.gender === "FEMALE" && u.id !== senderID)  
      : users.filter(u => u.gender === "MALE" && u.id !== senderID);  

    if (!matchCandidates.length)  
      return api.sendMessage("❌ No suitable match found in the group.", event.threadID, event.messageID);  

    selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];  
    matchName = selectedMatch.name;  
    baseUserID = senderID;  
  }  

  const baseUserData = await usersData.get(baseUserID);  
  const senderName = baseUserData?.name || "User";  

  // Load images with avatarUrl from usersData  
  const defaultAvatar = "https://files.catbox.moe/4l3pgh.jpg"; // fallback avatar  
  let sIdImage, pairPersonImage, background;  

  try {  
    background = await loadImage("https://i.imgur.com/Z56ISV5.png"); // fixed background  

    const avatarUrl1 = await usersData.getAvatarUrl(baseUserID).catch(() => null);  
    sIdImage = await loadImage(avatarUrl1 || defaultAvatar);  

    const avatarUrl2 = await usersData.getAvatarUrl(selectedMatch.id).catch(() => null);  
    pairPersonImage = await loadImage(avatarUrl2 || defaultAvatar);  

  } catch (err) {  
    console.error("Image loading error:", err);  
    return api.sendMessage("❌ Failed to load images.", event.threadID, event.messageID);  
  }  

  // Draw canvas with bigger pair card and caption  
  try {  
    const width = 1200;  
    const height = 600;  
    const canvas = createCanvas(width, height);  
    const ctx = canvas.getContext("2d");  

    // Draw background  
    ctx.drawImage(background, 0, 0, width, height);  

    // Caption text  
    const caption = "💖 Two hearts, one destiny – a perfect match! 💖";  
    ctx.font = "50px Arial";  
    ctx.fillStyle = "white";  
    ctx.textAlign = "center";  
    ctx.fillText(caption, width / 2, 70); // top caption  

    // Positions and sizes of existing circles in background (MADE BIGGER)  
    const leftCircle = { x: 200, y: 265, size: 230 };  // left avatar bigger  
    const rightCircle = { x: 495, y: 265, size: 230 }; // right avatar bigger  

    // Left avatar with glow  
    ctx.save();  
    ctx.beginPath();  
    ctx.arc(leftCircle.x, leftCircle.y, leftCircle.size / 2, 0, Math.PI * 2);  
    ctx.closePath();  
    ctx.shadowColor = "rgba(255,255,255,0.9)";  
    ctx.shadowBlur = 20;  
    ctx.fill();  
    ctx.clip();  
    ctx.drawImage(sIdImage, leftCircle.x - leftCircle.size / 2, leftCircle.y - leftCircle.size / 2, leftCircle.size, leftCircle.size);  
    ctx.restore();  

    // Right avatar with glow  
    ctx.save();  
    ctx.beginPath();  
    ctx.arc(rightCircle.x, rightCircle.y, rightCircle.size / 2, 0, Math.PI * 2);  
    ctx.closePath();  
    ctx.shadowColor = "rgba(255,255,255,0.9)";  
    ctx.shadowBlur = 20;  
    ctx.fill();  
    ctx.clip();  
    ctx.drawImage(pairPersonImage, rightCircle.x - rightCircle.size / 2, rightCircle.y - rightCircle.size / 2, rightCircle.size, rightCircle.size);  
    ctx.restore();  

    // Heart overlay (unchanged)  
    ctx.font = "120px Arial";  
    ctx.fillStyle = "red";  
    ctx.fillText("", width / 2 - 60, height / 2 + 40);  

    // Save canvas  
    const outputPath = path.join(__dirname, "pair2_output.png");  
    const out = fs.createWriteStream(outputPath);  
    const stream = canvas.createPNGStream();  
    stream.pipe(out);  

    out.on("finish", () => {  
      const lovePercent = Math.floor(Math.random() * 31) + 70;  
      api.sendMessage(  
        {  
          body: `🥵 𝗣𝗮𝗶𝗿 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹!\n🙆‍♂️ ${senderName}\n🙆‍♀️ ${matchName}\n💋 𝗟𝗼𝘃𝗲 𝗣𝗲𝗿𝗰𝗲𝗻𝘁𝗮𝗴𝗲: ${lovePercent}% 💙\n💌 Wish you two endless happiness!`,  
          attachment: fs.createReadStream(outputPath)  
        },  
        event.threadID  
      );  
    });  

  } catch (err) {  
    console.error("Canvas drawing error:", err);  
    return api.sendMessage("❌ Failed to draw the image.", event.threadID, event.messageID);  
  }  

} catch (error) {  
  console.error("Pair2 error:", error);  
  api.sendMessage("❌ An unexpected error occurred while creating the pair.", event.threadID, event.messageID);  
}

}
};
