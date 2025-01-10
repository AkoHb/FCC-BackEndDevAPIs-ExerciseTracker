const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const e = require('cors');
const { Schema } = mongoose;

// connect to database with current data, holded into .env file with key MANGO_URI
mongoose.connect(process.env.MANGO_URI);

// update user
const UserSchema = new Schema({
  username: String
});

const User = mongoose.model("User", UserSchema);

// update excercise
const ExcerciseShema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date
})

const Excercise = mongoose.model("Exercise", ExcerciseShema);




app.use(cors());
app.use(express.urlencoded({ required: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// add user to db
app.post("/api/users", async (req, res) => {
  
  const update_user = new User({username: req.body.username});
  
  try {
    const user = await update_user.save()
    res.json(user);

  } catch (error) {
    console.error(error);
    res.send("I can't insert user into database");
  }
});

// get user info from db
app.get("/api/users", async (req, res) => {

  const users = await User.find({}).select(["_id", "username"]);

  if ( !users ) {
    res.send("There are no users into database");
  } else {
    res.json(users)
  }
});

// update excercises
app.post("/api/users/:_id/exercises", async (req, res) => {

  const user_id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const load_user_data = await User.findById(user_id);

    if (!load_user_data) {
      res.send("Couldn't find user data with current information")
    } else {

      const excObj = new Excercise({
        user_id: load_user_data._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })

      const update_exc = await excObj.save();

      res.json({
        _id: load_user_data._id,
        username: load_user_data.username, 
        description: update_exc.description,
        duration: update_exc.duration,
        date: new Date(update_exc.date).toDateString()
      });
    }

  } catch (error) {
    console.error(error);
    res.send("Something went wrong during update exercise");
  }
});

// GET /api/users/:_id/logs
app.get("/api/users/:_id/logs", async (req, res) => {

  const user_id = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const load_user_data = await User.findById(user_id);

    if (!load_user_data) {

      res.send("Couldn't find user data with current information");
      return;

    } else {

      let logObj = {};

      if ( from )  {
        logObj["$gte"] = new Date(from)
      };
      if ( to )  {
        logObj["$lte"] = new Date(to)
      };

      let filter = { user_id: user_id };

      if ( from || to ) {
        filter.date = logObj;
      }

      const excss = await Excercise.find(filter).limit( +limit ?? 500 );

      const log = excss.map(e => ({
        description:e.description,
        duration: e.duration,
        date: e.date.toDateString()
      }))

      res.json({
        username: load_user_data.username,
        count: excss.length,
        _id: load_user_data._id,
        log
      })
    }

  } catch (error) {
    console.error(error);
    res.send("Something went wrong during loading log data");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
