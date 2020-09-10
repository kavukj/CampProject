//This file will have a campground ,comment creation and campground removal functionality
var mon = require("mongoose");
var CampModel	= require("./Models/CampGround");
var CommentModel= require("./Models/Comment");

//This is an array to add data to campground.
var Data=[
	{
		name:"Cloud's Rest",
		img:"https://www.photosforclass.com/download/px_1061640",
		desc:"Welcome to our camp, Enjoy!!"
	},
	{
		name:"Desert Mesa",
		img:"https://www.photosforclass.com/download/px_1230302",
		desc:"Welcome to our camp, Enjoy!!"
	},
	{
		name:"Canyon FLoor",
		img:"https://www.photosforclass.com/download/px_6757",
		desc:"Welcome to our camp, Enjoy!!"
	},
	{
		name:"The RiverFront",
		img:"https://www.photosforclass.com/download/pb_1851092",
		desc:"Welcome to our camp, Enjoy!!"
	},
	
];

function seedDB(){
	//Remove all campground
	CampModel.remove({},function(err){
		if(err){
			console.log("Removal Failed");
		}else{
			console.log("Campground Removed");
			//Add new campground once all removed
			//Traverse over the array and add values to campground
			Data.forEach(function(camps){
				CampModel.create(camps,function(err,val){
					if(err){
						console.log("Addition Failed");
					}else{
						console.log("Added succesfully "+val.name);
						//After addition of each Campground, we want to add one comment with addition
						CommentModel.create({
											author:"Homie's",
											text:"This was a nice place but missed internet!"
											},function(err,result){
												if(err){
													console.log(err);
												}else{
													val.comments.push(result);
													val.save();
													console.log("Comment added");
												}
											});
						
						}
					});
				});
			}
		});
}
module.exports=seedDB;