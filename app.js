var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var morgan = require("morgan");
var User = require("./models/User");
const bcrypt = require('bcrypt');
const { connect } = require("mongoose");
var User2 = 1;
var currentEmail;
var currentUsername;
var app = express();
var checker=false;
//var usableCommands=["set alarm", "current weather", "upcoming forcast", "set alarm", "calculator", "set timer", "search something", "ask about bot", "make me laugh"];
//var arrayLength = usableCommands.length;
//var commandIndex;
//for (var i = 0; i < arrayLength; i++) {
  //  if(req.body.command==usableCommands[i])
    // {
    //   commandIndex=var;
    //  break;
    //  }
  // 
//}
//
// testing changes
//meow
app.set("port", 3000);

app.use(morgan("dev"));

// initialize body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser());

// initialize session with 3 days of cookie
app.use(
  session({
    key: "user_sid",
    secret: "somerandonstuffs",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 300000,
    },
  })
);

//unexpected login situation handler which will remove saved cookie if the user doesn't achieve success page,e.g to remove cookie if user stops express during login page
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie("user_sid");
  }
  next();
});

// if user logged in and cookie is not expired yet
var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect("/success");
  } else {
    next();
  }
};

// login redirect
app.get("/", sessionChecker, (req, res) => {
  res.redirect("/login");
});



// signup route
app
  .route("/signup")
  .get(sessionChecker, (req, res) => {
    res.sendFile(__dirname + "/frontend/signup.html");
  })
  .post((req, res) => {
    var user = new User({
      username: req.body.username,
      email: req.body.email,
      country:req.body.country,
      education:req.body.education,
      password: req.body.password,
      question1:req.body.Question1,
      question2:req.body.Question2,
      question3:req.body.Question3,
    });
    user.save((err, docs) => {
      if (err) {
        res.redirect("/signup");
      } else {
        console.log(docs);
        req.session.user = docs;
        currentUsername=req.body.username;
        res.redirect("/success");
      }
    });
  });

// login route
app
  .route("/login")
  .get(sessionChecker, (req, res) => {
    res.sendFile(__dirname + "/frontend/login.html");
  })
  .post(async (req, res) => {
    var username = req.body.username,
      password = req.body.password;
        console.log(req.body.username);
    try {
      var user = await User.findOne({ username: username }).exec();
      if (!user) {
        res.redirect("/login");
      }
      user.comparePassword(password, (error, match) => {
        if (!match) {
          res.redirect("/login");
        }
      });
      req.session.user = user;
      currentUsername=req.body.username;
      res.redirect("/success");
      console.log(username);
    } catch (error) {
      console.log(error);
    }
  });

  // forgot

app.get("/forgot",sessionChecker, (req, res) => {
  
   console.log("I am in forgot");
    res.sendFile(__dirname + "/frontend/forgot.html");
  
});

// // app.get("/pagination", async (req, res, next) => {
  
// //   try {
// //       let { page, size, sort } = req.query;

// //       // If the page is not applied in query.
// //       if (!page) {

// //           // Make the Default value one.
// //           page = 1;
// //       }

// //       if (!size) {
// //           size = 10;
// //       }

// //       //  We have to make it integer because
// //       // query parameter passed is string
// //       const limit = parseInt(size);

// //       // We pass 1 for sorting data in 
// //       // ascending order using ids
// //       const user = await User.find().sort(
// //           { votes: 1, _id: 1 }).limit(limit)
// //       res.send({
// //           page,
// //           size,
// //           Info: user,
// //       });
// //   }
// //   catch (error) {
// //       res.sendStatus(500);
// //   }
// // });


app.post("/update",sessionChecker,(req, res) => {
  var email = req.body.email;
  counter=0;
  User.findOne({email:email}, function(err, result) {
   
     if(result)
     {  
          console.log(result.email);
          var temp=email;
          currentEmail=temp;
          var question1=req.body.Question1;
          var question2=req.body.Question2;  
          var question3=req.body.Question3;               
          res.sendFile(__dirname + "/frontend/askQuestion.html");
          //res.redirect("/reset");        
          User.findOne({$and: [{email:temp},{question1:question1},{question2:question2},{question3:question3}] }, function(err, result2) {
            if(result)
            {
              counter=1;
              
            }
            else
            {
              counter=2;
              console.log("Wrong Security Answers entered");
            }
          });
      }
      else
      {  
        counter=2;  
        console.log("Not Found")
      }

      if(counter==1)
      {
        res.sendFile(__dirname + "/frontend/reset.html");
      }

    });

  
})


app
  .route("/reset")
  .get(sessionChecker, (req, res) => {  
  console.log("I am in reset");
  res.sendFile(__dirname + "/frontend/reset.html");
  })
  .post((req, res) => {
            //reset portion
        var password=req.body.password;
        password = bcrypt.hashSync(password, 10);
        User.updateOne({email:currentEmail},{ $set: { password:password} }, function(err, result2) {
          if(result2) //true(password reset)
          {
             
          res.redirect("/login");
          }
          else
          {
           console.log("Error"); 
          }
         

        });
 
});

// success route
app.get("/success", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/frontend/dashboard.html");
  } else {
    res.redirect("/login");
  }
});

//profileShow
app.get("/profileShow", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/frontend/profile.html");
  } 
});


//profileStyle
app.get("/profileStyle", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/frontend/profileStyle.css");
  } 
});

//img in profile
app.get("/img_20", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/frontend/img_20.jpg");
  } 
});

//texteditor style1
app.get("/texteditorStyle1", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Text Editor/css/bootstrap.min.css");
  } 
});
//texteditor style2
app.get("/texteditorStyle2", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Text Editor/css/style.css");
  } 
});
app.get("/texteditorStyle2", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Text Editor/css/style.css");
  } 
});

//js/app.js
app.get("/texteditorapp", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Text Editor/js/app.js");
  } 
});

//list img
app.get("/texteditorimg", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Text Editor/images/water-blue.jpg");
  } 
});

//styles.css
app.get("/calculatorStyle", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Calculator/styles.css");
  } 
});

///stopwatchStyle

app.get("/stopwatchStyle", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Stopwatch/style.css");
  } 
});

//stopwatchscript
app.get("/stopwatchScript", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Stopwatch/script.js");
  } 
});

//weatherimg

app.get("/currentweather", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Current Weather/sky.jpg");
  } 
});

// forecast styling
app.get("/forecastStyle", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/forecast/style.css");
  } 
});

///index.js
app.get("/forecastScript", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/forecast/index.js");
  } 
});

///img/sky.jpg
app.get("/forecastimg", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/forecast/img/sky.jpg");
  } 
});

//alarm styling

app.get("/alarmStyle", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/alarm/alarm.css");
  } 
});

///alarm.js

app.get("/alarmScript", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/alarm/alarm.js");
  } 
});

//alarm.jpg
app.get("/alarmimg", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/alarm/alarm.jpg");
  } 
});

///tune.mp3
app.get("/alarmtune", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/alarm/tune.mp3");
  } 
});

app.get("/opencalculator", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Calculator/index.html");
  } 
});



//stopwatch opener
app.get("/openstopwatch", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Stopwatch/index.html");
  } 
});

//
app.get("/openlist", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Text Editor/index.html");
  } 
});

app.get("/opencurrentweather", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Current Weather/index.html");
  } 
});

app.get("/openforecast", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/forecast/index.html");
  } 
});

app.get("/openalarm", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/alarm/index.html");
  } 
});

app.get("/driver", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/Frontend/success.html");
  } 
});

app.post("/driver", (req, res) => {
     
    var command=req.body.usableCommand;
   console.log(command);
    console.log("I am in driver");
     console.log(command);
    if(command=="create list")
    {
      res.redirect("/openlist");
    } else if(command=="calculator")
    {
      res.redirect("/opencalculator");
    } else if(command=="stopwatch")
    {
      res.redirect("/openstopwatch");
    }  else if(command=="current weather")
    {
      res.redirect("/opencurrentweather");
    } else if(command=="weather forecast")
    {
      res.redirect("/openforecast");
    } else if(command=="alarm")
    {
      res.redirect("/openalarm");
    }
      else
    {
      res.sendFile(__dirname + "/frontend/dashboard.html");
    }
  
  
});

//dashboard style
app.get("/dashStyle", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + "/frontend/dash.css");
  } 
});

//profile show
app.post("/profileShow", (req, res) => {
  console.log(req.body.email);
  console.log(req.body.country);
  console.log(req.body.education);
  User.updateOne({username:currentUsername},{ $set: { email:req.body.email, country:req.body.country , education:req.body.education} }, function(err, result2) {
    if(result2) 
    {     
    res.redirect("/success");
    }
    else
    {
     res.redirect("/success");
     console.log("Error"); 
    }
   

  });

});

// Logout route
app.get("/logout", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie("user_sid");
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

// 404 request handler, E.G if user directly presses success page
app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!");
});

app.listen(app.get("port"), () =>
  console.log(`App started on port ${app.get("port")}`)
);
