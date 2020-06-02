'use strict'

const Discord = require('discord.io');
const logger = require('winston');
const auth = require('./auth.json');
const fsp = require('fs').promises;

const reply = require('./database/message.json');
const cardInfo = require('./database/card.json');
const checkinGetPoints = 200;
const slotGetPoints = -100;

//設定登入者資料
logger.remove(logger.transports.Console)
logger.add(new logger.transports.Console, {
		colorize: true
});
logger.level = 'debug';

//初始化 Discord Bot
var bot = new Discord.Client({
		token: auth.token,
		autorun: true
});


bot.on('ready', function (evt) {
		logger.info('connected');
		logger.info('Logged in as: ');
        logger.info(bot.username + '-(' + bot.id + '-');
});

bot.on('message', async function(user, userID, channelID, message, evt){
        var infoMessage = "";
        var slotMessage = "";
        var cardMessage = "";
        var pointsRankArray = [];
        var rankNameArray = [];
        var rankMessage = "Points Board\n";
        var userLength = 2;

		//bot 需要知到是否要執行命令
		if (message.substring(0, 1) == '$'){
				var args = message.substring(1).split(' ');
                var cmd = args[0];
                args = args.splice(1);
            
            switch(cmd) {
                case 'help':
                    bot.sendMessage({
                        to: channelID,
                        message: reply.help+ reply.info + reply.checkin + reply.slot + reply.card + reply.rank
                    });
                break;

                case 'info':
                    await fsp.readFile('./database/user.json').then(data =>{
                        let usersArray = JSON.parse(data);
                
                        usersArray.map(item => {
                            if(item.id == userID){
                            
                                infoMessage += "Username: " + item.name + "\n";
                                infoMessage += "UserID: " +  item.id + "\n";
                                infoMessage += "Points: " + item.points + "\n";
                                infoMessage += "Level: " + item.level + "\n";

                                bot.sendMessage({
                                    to: channelID,
                                    message: infoMessage
                                });
                            }
                        })
                    })
                break;

                case 'checkin':
                    await fsp.readFile('./database/user.json').then(data =>{
                        let usersArray = JSON.parse(data);
                
                        usersArray.map(item => {
                            if(item.id == userID && !item.checkin){
                                item.points += checkinGetPoints;
                                item.checkin = true;
                                fsp.writeFile('./database/user.json', JSON.stringify(usersArray))
                                bot.sendMessage({
                                    to: channelID,
                                    message: reply.successCheckin
                                });
                            }else if(item.id == userID && item.checkin){
                                bot.sendMessage({
                                    to: channelID,
                                    message: reply.failCheckin
                                });
                            }
                        })

                    })
                break;

                case 'slot':
                    await fsp.readFile('./database/user.json').then(data =>{
                        let usersArray = JSON.parse(data);
                
                        usersArray.map(item => {
                            if(item.id == userID && item.points > -slotGetPoints){
                                item.points += slotGetPoints;
                                slotMessage = slot();
                                var resultArray = slotMessage.split(' ');

                                bot.sendMessage({
                                    to: channelID,
                                    message: reply.successSlot
                                });

                                if(resultArray[0] == "Points"){
                                    item.points += parseInt(resultArray[1]);
                                    bot.sendMessage({
                                        to: channelID,
                                        message: reply.slotGetPoints + resultArray[1] + " points"
                                    });
                                }else if(resultArray[0] == "Cards"){
                                    item.card[resultArray[1]] = true;

                                    bot.sendMessage({
                                        to: channelID,
                                        message: reply.slotGetCard + (parseInt(resultArray[1])+1)
                                    });
                                }

                                fsp.writeFile('./database/user.json', JSON.stringify(usersArray))

                            }else if(item.id == userID && item.points < -slotGetPoints){
                                bot.sendMessage({
                                    to: channelID,
                                    message: reply.failSlot
                                });
                            }
                        })
                    })
                break;

                case 'card':
                    await fsp.readFile('./database/user.json').then(data =>{
                        let usersArray = JSON.parse(data);
                
                        usersArray.map(item => {
                            if(item.id == userID){
                                for(var i=0; i<10; i++){
                                    if(item.card[i]==true){
                                        cardMessage += " - "+ cardInfo[i].name + "\n";
                                    }
                                }
                                bot.sendMessage({
                                    to: channelID,
                                    message: 'You have following cards: \n' + cardMessage
                                });

                            }
                        })
                    })
                break;

                case 'rank':
                    await fsp.readFile('./database/user.json').then(data =>{
                        let usersArray = JSON.parse(data);

                        usersArray.map(item => {
                            pointsRankArray.push(item.points);
                            bubbleSort(pointsRankArray);
                        })
                        console.log(pointsRankArray);

                        for(var i=0; i< userLength; i++){
                            usersArray.map(item => {
                                if(pointsRankArray[i] == item.points){
                                    rankMessage += "No"+ (i+1) +" "+ item.name;
                                    rankMessage += " Total: " + pointsRankArray[i] + " Points\n"
                                }
                            })
                        }
                        bot.sendMessage({
                            to: channelID,
                            message: rankMessage
                        });
                    })
                break;
            }
        }
});


function slot(){
    let slotGetPoints = GetRandomNum(1, 200);
    let slotCardIndex = GetRandomNum(0, 9);
    let random = GetRandomNum(0, 1);

    if(random == 0){
        return "Points " + slotGetPoints;
    }else if(random == 1){
        return "Cards " + slotCardIndex;
    }
}

function GetRandomNum(Min, Max) {
    let Range = Max - Min;
    let Rand = Math.random();
    return (Min + Math.round(Rand * Range));
}

function bubbleSort(array) {

    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length - (i + 1); j++) {
            if (array[j] < array[j + 1]) {
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
            }
        }
    }
    return array;
}