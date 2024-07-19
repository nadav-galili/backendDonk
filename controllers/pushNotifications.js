// const  { Expo } =require('expo-server-sdk')
const {sendLeagueNotification} = require('../utils/pushNotification')



exports.leaguePush = async (req, res) => {
 
    const {leagueId} = req.params
    const {message} = req.body;
   await sendLeagueNotification(leagueId, message)
}

 