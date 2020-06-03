'use strict'
const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');
const fsp = require('fs').promises;

const reply = require('./database/message.json');
const cardInfo = require('./database/card.json');
const checkinGetPoints = 200;
const slotGetPoints = -100;

client.once('ready', () => {
    console.log('Ready!');
});

client.login(auth.token);

let _, commandContent, cmd;

setInterval(()=>{
    resetCheckin();
}, 1000)

var newUser = {
    "name":"",
    "id":"",
    "points":0,
    "level":0,
    "checkin":false,
    "card":[false,false,false,false,false,false,false,false,false,false]
}

client.on('message', async message => {
    var slotMessage = "";
    var cardMessage = "";
    var pointsRankArray = [];
    var rankMessage = "";
    var userLength = 2;

    //create new user
    await fsp.readFile('./database/user.json').then(data =>{
        let usersArray = JSON.parse(data);

        if(!message.author.bot){
            for(var i=0; i< usersArray.length; i++){
                if(usersArray[i].id  == message.author.id){
                    break;
                }else if(usersArray[i].id  != message.author.id && i == usersArray.length-1){
                    newUser.name = message.author.username;
                    newUser.id = message.author.id;
    
                    usersArray.push(newUser)
                    console.log("create new user")
                    break;
                }
            }
            fsp.writeFile('./database/user.json', JSON.stringify(usersArray))
        }
    })

    _, commandContent = message.content.split(' ', 2);
    cmd = (commandContent[0]).toLowerCase();
        
        switch(cmd) {
            case '$help':
                //message.channel.send( reply.help+ reply.info + reply.checkin + reply.slot + reply.card + reply.rank)
                const helpEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Command List')
                    .addFields(
                        {name: reply.helpTitle, value: reply.helpContext},
                        {name: reply.infoTitle, value: reply.infoContext},
                        {name: reply.checkinTitle, value: reply.checkinContext},
                        {name: reply.slotTitle, value: reply.slotContext},
                        {name: reply.cardTitle, value: reply.cardContext},
                        {name: reply.rankTitle, value: reply.rankContext}
                    )
                    .setTimestamp();
                message.channel.send(helpEmbed)
            break;
            
            case '$info':
                await fsp.readFile('./database/user.json').then(data =>{
                    let usersArray = JSON.parse(data);
            
                    usersArray.map(item => {
                        if(item.id == message.author.id){

                            const infoEmbed = new Discord.MessageEmbed()
                                .setColor('#0099ff')
                                .setTitle(message.author.username + '\'s Info')
                                .addFields(
                                    {name: "Username", value: item.name},
                                    {name: "Level", value: item.level, inline:true},
                                    {name: "Points", value: item.points, inline:true},
                                )
                                .setTimestamp();
                            message.channel.send(infoEmbed)

                        }
                    })
                })
            break;

            case '$checkin':
                await fsp.readFile('./database/user.json').then(data =>{
                    let usersArray = JSON.parse(data);
            
                    usersArray.map(item => {
                        if(item.id == message.author.id && !item.checkin){
                            item.points += checkinGetPoints;
                            item.checkin = true;
                            fsp.writeFile('./database/user.json', JSON.stringify(usersArray))
                            
                            const checkinEmbed = new Discord.MessageEmbed()
                                .setColor('#0099ff')
                                .setDescription(reply.successCheckin)
                                .setTimestamp();
                            message.channel.send(checkinEmbed)

                        }else if(item.id == message.author.id && item.checkin){
                            const checkinEmbed = new Discord.MessageEmbed()
                                .setColor('#0099ff')
                                .setDescription(reply.failCheckin)
                                .setTimestamp();
                            message.channel.send(checkinEmbed)
                        }
                    })

                })
            break;

            case '$slot':
                await fsp.readFile('./database/user.json').then(data =>{
                    let usersArray = JSON.parse(data);
                
                    usersArray.map(item => {
                        if(item.id == message.author.id && item.points >= -slotGetPoints){
                            item.points += slotGetPoints;
                            slotMessage = slot();
                            var resultArray = slotMessage.split(' ');


                            if(resultArray[0] == "Points"){
                                item.points += parseInt(resultArray[1]);

                                const slotEmbed = new Discord.MessageEmbed()
                                    .setColor('#0099ff')
                                    .setDescription(reply.successSlot + '\n' + reply.slotGetPoints + resultArray[1] + " points")
                                    .setTimestamp();
                                message.channel.send(slotEmbed)

                            }else if(resultArray[0] == "Cards"){
                                item.card[resultArray[1]] = true;
                                var cardNumber = parseInt(resultArray[1]) + 1

                                const slotEmbed = new Discord.MessageEmbed()
                                    .setColor('#0099ff')
                                    .setDescription(reply.successSlot + '\n' + reply.slotGetCard + cardNumber)
                                    .setTimestamp();
                                message.channel.send(slotEmbed)
                            }

                            fsp.writeFile('./database/user.json', JSON.stringify(usersArray))

                            }else if(item.id == message.author.id && item.points < -slotGetPoints){

                                const slotEmbed = new Discord.MessageEmbed()
                                    .setColor('#0099ff')
                                    .setDescription(reply.failSlot)
                                    .setTimestamp();
                                message.channel.send(slotEmbed)

                        }
                    })
                })
            break;

            case '$card':
                await fsp.readFile('./database/user.json').then(data =>{
                    let usersArray = JSON.parse(data);
                
                    usersArray.map(item => {
                    if(item.id == message.author.id){
                            for(var i=0; i<10; i++){
                                if(item.card[i]==true){
                                    cardMessage += " - "+ cardInfo[i].name + "\n";
                                }
                            }

                            const slotEmbed = new Discord.MessageEmbed()
                                .setColor('#0099ff')
                                .setTitle(message.author.username + '\'s Cards')
                                .setDescription('You have following cards: \n' + cardMessage)
                                .setTimestamp();
                            message.channel.send(slotEmbed)
                        }
                    })
                })
            break;

            case '$rank':
                await fsp.readFile('./database/user.json').then(data =>{
                    let usersArray = JSON.parse(data);

                    usersArray.map(item => {
                        pointsRankArray.push(item.points);
                        bubbleSort(pointsRankArray);
                    })

                    for(var i=0; i< userLength; i++){
                        usersArray.map(item => {
                            if(pointsRankArray[i] == item.points){
                                rankMessage += "No"+ (i+1) +" "+ item.name;
                                rankMessage += " Total: " + pointsRankArray[i] + " Points\n"
                            }
                        })
                    }

                    const slotEmbed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('Points Leader Board')
                        .setDescription(rankMessage)
                        .setTimestamp();
                    message.channel.send(slotEmbed)

                })
            break;
        }
    }
);


function slot(){
    let slotGetPoints = getRandomNum(1, 200);
    let slotCardIndex = getRandomNum(0, 9);
    let random = getRandomNum(0, 1);

    if(random == 0){
        return "Points " + slotGetPoints;
    }else if(random == 1){
        return "Cards " + slotCardIndex;
    }
}

function getRandomNum(Min, Max) {
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

async function resetCheckin(){

    var hours = new Date().getHours();
    var minutes = new Date().getMinutes();
    var seconds = new Date().getSeconds();

    if(hours==0 && minutes==0 && seconds == 0){
        await fsp.readFile('./database/user.json').then(data =>{
            let usersArray = JSON.parse(data);
    
            usersArray.map(item => {
                item.checkin = false;
            })
            fsp.writeFile('./database/user.json', JSON.stringify(usersArray))
        })
    }
}

