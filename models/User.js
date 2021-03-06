const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

mongoose.connect("mongodb://localhost:27017/userDB",{
    useNewUrlParser:true,
    useUnifiedTopology:true,
})

const userSchema = mongoose.Schema({
    username:{
        type:String,
        unique:true,
        required: true
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    education:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    question1:{
        type:String,
        require:true
    },
    question2:{
        type:String,
        require:true
    },
    question3:{
        type:String,
        require:true
    },
})

userSchema.pre("save", function(next) {
    if(!this.isModified("password")) {
        return next();
    }
    this.password = bcrypt.hashSync(this.password, 10);
    next();
});

userSchema.methods.comparePassword = function(plaintext, callback) {
    return callback(null, bcrypt.compareSync(plaintext, this.password));
};

const userModel = mongoose.model('user',userSchema)

module.exports = userModel