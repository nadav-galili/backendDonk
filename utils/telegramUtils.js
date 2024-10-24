const axios = require("axios"); // Ensure axios is installed

const sendMessageToTelegram = async (message = "test") => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN; // Add your bot token to .env
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const chatId = process.env.ADMIN_CHAT_ID;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
    });
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
};

module.exports = {
  sendMessageToTelegram,
};
