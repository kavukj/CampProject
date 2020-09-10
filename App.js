var express 		= require("express"),
	parser			= require("body-parser"),
	mon 			= require("mongoose"),
	methodOverride  = require("method-override"),
	bodyParser  	= require("body-parser"),
	flash           = require("connect-flash"),
	passport 		= require("passport"),
	passLocal		= require("passport-local"),
	passLocalMon	= require("passport-local-mongoose"),
	SeedDB			= require("./Seed"),
	CampModel		= require("./Models/CampGround"),
	UserModel		= require("./Models/User"),
	CommentModel    = require("./Models/Comment");

var app				= express();
mon.connect("mongodb://localhost/Campground");

app.set("view engine","ejs");
app.use(express.static("Styles"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(parser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(flash());
app.use(express.static(__dirname + "/public"));

//Passport Configuration
app.use(require("express-session")({
    secret: "Rusty is the best and cutest dog in the world",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new passLocal(UserModel.authenticate()));
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

//we need a middleware to call to pass current user in evry route else if else in header will show error for the routes which do not have current user passed.
//Using this middleware can pass user to every template
app.use(function(req,res,next){
	res.locals.CurrentUser=req.user; // this will pass current user to every template
	res.locals.error=req.flash("Error");
	res.locals.success=req.flash("Success");
	//And then move to next part of our code
	next();
})

//SeedDB();

app.get("/",function(req,res){
	res.render("Landing");
});

app.get("/campgrounds",function(req,res){
	console.log(req.user);
	CampModel.find({},function(err,camps){
		if(err){
			console.log("Unable to show the camps from database");
		}
		else{
			res.render("Campground",{campground:camps,CurrentUser:req.user}); 
		}
	})
})

//Make a post request to take new values from form and add in campgrounds array.
//One important thing is we can have same url for get and post.
app.post("/campgrounds",isLoggedIn,function(req,res){
	var name=req.body.name;
	var img=req.body.img;
	var desc=req.body.desc;
	var price=req.body.price;
	var author={
		id:req.user._id,
		username:req.user.username
	};
	//we are making the values as an object to add it in array having objects
	CampModel.create({name:name,img:img,desc:desc,author:author,price:price},function(err,camps){
	if(err){
		console.log("Unable to add a new camp");
	}else{
		console.log("Sucessfully added new camp");
	}
});
	res.redirect("/campgrounds");
})

//To add new Campground
app.get("/campgrounds/new",isLoggedIn,function(req,res){
	res.render("new");
});

//To show detail page
app.get("/campgrounds/:id", function(req, res){
    //find the campground with provided ID
    CampModel.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            //console.log(foundCampground)
            //render show template with that campground
            res.render("ShowCampgroundDetail", {campground: foundCampground});
        }
    });
});

//Edit Route
app.get("/campgrounds/:id/edit",function(req,res){
	//We want to make authentication to edit only if logged in and only owner can edit
	//For this we are not using middleware because
	//Check if loggedin
	if(req.isAuthenticated()){
		CampModel.findById(req.params.id,function(err,result){
			if(err){
				res.redirect("/campgrounds/:id");
			}
			else{
				//If logged in then check for owner 
				//if(req.user._id === result.author.id).. This will show error as req.user is string and result.id is mongoose object
				if(result.author.id.equals(req.user._id)){
					res.render("Edit",{campground:result});
				}else{
					req.flash("Error","You are not allowed to edit this !!")
					res.redirect("/campgrounds/"+req.params.id);
				}
			}
		});
		
	}else{
		res.render("login");
	}
});
//Update Route
app.put("/campgrounds/:id",function(req,res){
	CampModel.findByIdAndUpdate(req.params.id,req.body.campground,function(err,result){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		}else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	})
})
//Delete campgrounds
app.delete("/campgrounds/:id",isOwner,function(req,res){
	CampModel.findByIdAndRemove(req.params.id,function(err,result){
		if(err){
			console.log(err);
			req.flash("Error","Could not delete the Campground");
			res.redirect("/campgrounds");
		}else{
			req.flash("Success","Successfully deleted the campground");
			res.redirect("/campgrounds");
		}
	})
})

//Comments Routes
app.get("/comments/new",function(req,res){
		res.render("commentNew");
})

app.get("/campgrounds/:id/comments/new",isLoggedIn, function(req, res){
    // find campground by id
    CampModel.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
             res.render("commentNew", {campground: campground});
        }
    })
});


app.post("/campgrounds/:id/comments/new",isLoggedIn,function(req,res){
	CampModel.findById(req.params.id,function(err,campground){
		if(err){
           console.log(err);
           res.redirect("/campgrounds");
       }  else {
        CommentModel.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
			   //Add Username and id from database
			   comment.author.id=req.user._id;
			   comment.author.username=req.user.username;
			   //Save username to comment
			   comment.save();
               campground.comments.push(comment);
               campground.save();
               res.redirect('/campgrounds/' + campground._id);
           }
        });
       }
	})
})

//Authentication Routes
app.get("/register",function(err,res){
	res.render("register");
})
//Take signup details and add it to database
app.post("/register",function(req,res){
	UserModel.register(new UserModel({username:req.body.username}),req.body.password,function(err,user){
		if(err){
			//console.log(err);
			req.flash("Error",err.message);
			res.render("register");
		}else{
			//Now if user is created with no error then we want to go to secret page
			passport.authenticate("local")(req,res,function(){
				req.flash("Success","Successfully Registered, Welcome "+user.username);
;				res.redirect("/campgrounds");
			})
		}
	});
});

//Login Routes
app.get("/login",function(req,res){
	res.render("login");	
})
app.post("/login",passport.authenticate("local",{
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}),function(req,res){
	//We do not require anything here as we have already redirected in middleware
});

//Logout Routes
app.get("/logout",function(req,res){
	req.logout();
	req.flash("Success","You logged out !!")
	res.redirect("/campgrounds");
})

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
	//Here we want to add a flash message when user is not loggedin
	req.flash("Error","Please login !!")
    res.redirect("/login");
}

function isOwner(req,res,next){
	if(req.isAuthenticated()){
		CampModel.findById(req.params.id,function(err,result){
			if(err){
				req.flash("Error","Cannot find the Campground");
				res.redirect("back");
			}
			else{
				//If logged in then check for owner 
				//if(req.user._id === result.author.id).. This will show error as req.user is string and result.id is mongoose object
				if(result.author.id.equals(req.user._id)){
					next();
				}else{
					req.flash("Error","No Permission, You are not owner of this Campground");
					res.redirect("back");
				}
			}
		});
		
	}else{
		req.flash("Error","You need to be logged in");
		res.render("login");
	}
}

app.listen(process.env.PORT,process.env.IP,function(req,res){
	console.log("server started");
});
