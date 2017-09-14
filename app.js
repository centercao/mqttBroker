const TOKEN_TIME = 60 * 60 * 24 * 30; // second ->30 day
var Mqtt = require("mqtt-helper");
var config = require('./config');
var log4js = require("logger-helper");
var logger = (new log4js({appenders:{dateLog:{filename: "logs/net"}}},'dateLog')).logger;
var server = new Mqtt({port:6088,ports:6188,SECURE_KEY:"./ssl/tls-key.pem",SECURE_CERT:"./ssl/tls-cert.pem"});
var Redis = require('ioredis-helper');
var redis = new Redis({password:"root@2017@2018"});
var Mongo = require('mongodb-helper');
var mongo = (new Mongo({user:"data",pass:"root2017",db:"smartHome"})).get();
var Tran  = require("tui-helper");
var tran = new Tran({
	appId: 'eECHDNfs5Z680lzQMEHCt6',
	appKey: 'CcArSfD8IrA7l8diZDxw46',
	masterSecret: 'VDLFyCWoyd9onOrmCP4m78',
	title: "智能家居信息"
});
/*tran.sendMessage("报警",{id:123456,alarm:2},'5c4e5cf583713aaa09543d5052f11f3e',function (err,value) {
	console.log(value);
});*/
// 认证
async function authenticate (client, username, password, callback) {
	if(username){ // app
		var account = await redis.get("token:" + username);
		if(client.id != account){
			return;
		}
		client.type = "app";
		client.cId = password.toString();
		var member = await redis.keys("geTui:*");
		for(var i = 0;i<member.length;i++){
			await redis.srem(member[i],client.cId);
		}
	}else{ // gateway
		if(!(await redis.exists("device:" + client.id))) {
			return;
		}
		client.type = "device";
	}
	callback(null, true);
}
server.authenticate =authenticate;
server.on('ready', function(){
	console.log('mqtt is running...');
});
server.on('clientConnected', async function(client){
	console.log('client connected', client.id);
	
});
server.on('clientDisconnected', async function(client){
	console.log('client disConnected: ' + client.id);
	if(client.type == "app"){
		console.log('client connected:', client.id);
		var members = await redis.smembers("userGate:" + client.id);
		for(let i =0;i<members.length;i++){
			await redis.sadd("geTui:" + members[i],client.cId);
			await redis.expire("geTui:" + members[i],TOKEN_TIME);
		}
		members = await redis.smembers("userTrust:" + client.id);
		for(let i =0;i<members.length;i++){
			await redis.sadd("geTui:" + members[i],client.cId);
			await redis.expire("geTui:" + members[i],TOKEN_TIME);
		}
	}
	
});
server.on('subscribed', function(topic, client){
	console.log('subscribed: clientId: '+client.id +",topic" + topic);
});

server.on('unSubscribed', function(topic, client){
	console.log('unSubscribed: clientId: '+client.id +",topic" + topic);
});
server.on('published',async function(packet, client) {
	if(client) {
		console.log('Published topic:', packet.topic);
		var topic = packet.topic.split("/");
		switch (topic[0]){
			case "a":{ // 重要信息
				var cmd = packet.payload.readUInt8(0);
				var info = {};
				switch (cmd){
					case 1: { // 心跳
						await redis.hset("device:" + client.id,"state",1);
					}
						break;
					case 2: { // 报警
						let devId = packet.payload.slice(1,17).ToString();
						await redis.hset("device:" + devId,"state",2);
						info["报警状态"] = 1;
						await mongo.collection('devInfo').insertOne({devId:devId,startDate:new Date(), val:info});
						
					}
						break;
					case 3: { // 设备上线
						let devId = packet.payload.slice(1,17).ToString();
						var state = await redis.hget("device:" + devId,"state");
						await redis.hset("device:" + devId,"state",Number(state)>=2?2:1); // 在线
						info["设备状态"] = "上线";
						console.log("info:" + JSON.stringify(info));
						await mongo.collection('devInfo').insertOne({devId:devId,startDate:new Date(), val:info});
					}
						break;
					case 4: { // 设备离线
						let devId = packet.payload.slice(1,17).ToString();
						var state = await redis.hget("device:" + devId,"state");
						await redis.hset("device:" + devId,"state",Number(state)>=2?3:0);
						info["设备状态"] = "离线";
						await mongo.collection('devInfo').insertOne({devId:devId,startDate:new Date(), val:info});
					}
						break;
					case 5: { // 传感器状态
						let devId = packet.payload.slice(1,17).ToString();
						let state =packet.payload.readUInt8(pos++);
						info["传感器状态"] = state;
						await mongo.collection('devInfo').insertOne({devId:devId,startDate:new Date(), val:info});
					}
						break;
				}
				var member = await redis.smembers("geTui:" + client.id);
				for(var i =0;i,member.length;i++){
					tran.sendMessage("信息",{},member[i],function (err,value) {
						console.log(value);
					});
				}
			}
				break;
			case "i":{ // 一般信息
				var cmd = packet.payload.readUInt8(0);
				var info = {};
				switch (cmd){
					case 20:{ // 电池电量百分比
					}
						break;
				}
			}
				break;
			case "server":{ // 服务器订阅信息
				var buffer = new Buffer("abcdefg");
				var pack = {topic:"abcdr",payload:buffer,qos:0,retain:false};
				server.publish(pack,client,function (err,pac) {
					console.log(err);
				});
			}
				break;
			default:
				break;
		}
	}
});