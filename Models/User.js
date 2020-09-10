var mon = require("mongoose");
var PassLocalMon = require("passport-local-mongoose");

var UserSchema = new mon.Schema({
	username:String,
	password:String
});

UserSchema.plugin(PassLocalMon);

module.exports = mon.model("CampgroundUser",UserSchema);
