var mon = require("mongoose");

var CommentSchema= mon.Schema({
	author:{
		id:{
			type:mon.Schema.Types.ObjectId,
			ref: "User"
		},
		username:String
	},
	text:String
});

module.exports = mon.model("Comment",CommentSchema);