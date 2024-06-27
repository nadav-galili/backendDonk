
const  { Expo } =require('expo-server-sdk')
const UserLeagueModel = require("../models/UserLeague");
const UserModel = require("../models/User");
const LeagueModel = require("../models/League");

exports.sendLeagueNotification = async (leagueId, message) => {
    const leaguePlayers = await UserLeagueModel.findAll({
      where: { league_id: leagueId },
      include: [
        {
          model: UserModel,
          attributes: ["id", "expoPushToken"],
          as: "User",
        },
      ],
    });
    const league = await LeagueModel.findByPk(leagueId);
  
  
    const pushTokens = leaguePlayers
        .filter((player) => player.User.expoPushToken)
        .map((player) => player.User.expoPushToken);
 
  
    const messageObject = {
      to: pushTokens,
      sound: "default",
      title: "League Notification",
      body: message,
      data: { id: leagueId, league: league } ,
    };
 
    setTimeout(() => {
      sendPushNotification(messageObject);
  }, 10000);
  }

const sendPushNotification = async (messageObject) => {
    let expo = new Expo();
    let messages = [];
    let somePushTokens = messageObject.to;
    for (let pushToken of somePushTokens) {
        // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
      
        // Check that all your push tokens appear to be valid Expo push tokens
        if (!Expo.isExpoPushToken(pushToken)) {
          console.error(`Push token ${pushToken} is not a valid Expo push token`);
          continue;
        }
      
        messages.push({
          to: pushToken,
          sound: 'default',
          body:messageObject.body,
          data: messageObject.data,
        })
      }
// The Expo push notification service accepts batches of notifications so
// that you don't need to send 1000 requests to send 1000 notifications. We
// recommend you batch your notifications to reduce the number of requests
// and to compress them (notifications with similar content will get
// compressed).
let chunks = expo.chunkPushNotifications(messages);
let tickets = [];
(async () => {
  // Send the chunks to the Expo push notification service. There are
  // different strategies you could use. A simple one is to send one chunk at a
  // time, which nicely spreads the load out over time:
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('ticketChunks',ticketChunk);
      tickets.push(...ticketChunk);
      // NOTE: If a ticket contains an error code in ticket.details.error, you
      // must handle it appropriately. The error codes are listed in the Expo
      // documentation:
      // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
    } catch (error) {
      console.error(error);
    }
  }
})();

let receiptIds = [];
for (let ticket of tickets) {
  // NOTE: Not all tickets have IDs; for example, tickets for notifications
  // that could not be enqueued will have error information and no receipt ID.
   if (ticket.status === 'ok') {
    receiptIds.push(ticket.id);
  }
}

let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
(async () => {
  // Like sending notifications, there are different strategies you could use
  // to retrieve batches of receipts from the Expo service.
  for (let chunk of receiptIdChunks) {
    try {
      let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      console.log(receipts);

      // The receipts specify whether Apple or Google successfully received the
      // notification and information about an error, if one occurred.
      for (let receiptId in receipts) {
        let { status, message, details } = receipts[receiptId];
        if (status === 'ok') {
          continue;
        } else if (status === 'error') {
          console.error(
            `There was an error sending a notification: ${message}`
          );
          if (details && details.error) {
            // The error codes are listed in the Expo documentation:
            // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
            // You must handle the errors appropriately.
            console.error(`The error code is ${details.error}`);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
})();
}




