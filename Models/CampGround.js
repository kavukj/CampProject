var mon = require("mongoose");

var campgroundschema= new mon.Schema({
	name:String,
	price:String,
	img:String,
	desc:String,
	//Add comment
	comments:[
		{
			type: mon.Schema.Types.ObjectId,
			ref:"Comment"
		}
	],
	author:{
			id:{
			type:mon.Schema.Types.ObjectId,
			ref: "User"
		},
		username:String
	}
});

module.exports = mon.model("CampCollection",campgroundschema);