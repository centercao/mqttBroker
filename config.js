/**
 * Created by center on 17-2-24.
 */

const development_env = {
	netPort:6688,
	env: 'development', //环境名称
	port: 3000,         //服务端口号
	mongodb_url: '127.0.0.1',    //数据库地址
	mongodb_port: 27017,
	mongodb_database:'smartHome',
	mongodb_user:'data',
	mongodb_password:'root2017',
	redis_url: '127.0.0.1',       //redis地址
	redis_port: 6379,      //redis端口号
	redis_pass: "root@2017@2018",
	gPort:8143,
	gsPort:8243,
	gHttpPort:8343,
	gHttpsPort:8443
};
const test_env = {
	netPort:6688,
	env: 'test',        //环境名称
	port: 3002,         //服务端口号
	mongodb_url: '127.0.0.1',    //数据库地址
	mongodb_port: 27017,
	mongodb_database:'smartHome',
	mongodb_user:'data',
	mongodb_pass:'root2017',
	redis_url: '127.0.0.1',       //redis地址
	redis_port: 6379,      //redis端口号
	redis_pass: "root@2017@2018",
	gPort:8143,
	gsPort:8243,
	gHttpPort:8343,
	gHttpsPort:8443
};
module.exports = {
	development: development_env,
	test: test_env
}[process.env.NODE_ENV || 'development']
