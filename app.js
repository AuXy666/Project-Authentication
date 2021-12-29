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
var app = express();
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
      res.redirect("/success");
    } catch (error) {
      console.log(error);
    }
  });

  // forgot

app.get("/forgot",sessionChecker, (req, res) => {
  
   console.log("I am in forgot");
    res.sendFile(__dirname + "/frontend/forgot.html");
  
});

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
              console.log(result.username);
              
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
    res.sendFile(__dirname + "/frontend/success.html");
  } else {
    res.redirect("/login");
  }
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
