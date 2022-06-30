const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const Schema = mongoose.Schema;
require('dotenv').config();
const mongoUri = process.env['MONGO_URI'];

app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const exerciseSchema = new Schema({
  description: {type: String , required: true},
  duration: {type: Number , required: true},
  date: {type: String, required: true}
},{
  timestamps: true
});

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  log: [exerciseSchema],
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users')
  .get(
    function(req, res){
      User.find()
      .then(users => res.json(users))
      .catch(err => res.status(400).json('Error: ' 
      + err));
    })
  .post(function(req, res) {
  // Handle the data in the request
    const username = req.body.username;
    
    const newUser = new User({username});

    newUser.save()
    .then(() => res.json({"username": 
    username,"_id": newUser.id}))
    .catch(err => res.status(400).json('Error: ' + 
    err));
});

app.route('/api/users/:_id/exercises')
  .post(function(req, res) {
  // Handle the data in the request
    const id = req.params._id;
    
    const description = req.body.description;
    const duration = Number(req.body.duration);
   let dateEx = req.body.date === "" || req.body.date === undefined ? new Date() : new Date(req.body.date);
        
    const newExercise = new Exercise({
      description,
      duration,
      date: dateEx,
    });

     User.findByIdAndUpdate(
    id,
    { $push: { log: newExercise } },
    { new: true },
    (err, data) => {
      if (err) {
        res.send(err);
      }
      let resObj = {};
      resObj["_id"] = data.id;
      resObj["username"] = data.username;
      resObj["date"] = new Date(newExercise.date).toDateString();
      resObj["duration"] = newExercise.duration;
      resObj["description"] = newExercise.description;
      res.send(resObj);
    }
  );
});

app.get("/api/users/:_id/logs", function (req, res) {
  const id = req.params._id;

  User.findById(id, function (err, data) {
    const { from, to, limit } = req.query;

    if (err) {
      res.status(400).send("something went wrong");
    }
    let log = data.log.map((m) => {
      return {
        description: m.description,
        duration: m.duration,
        date: new Date(m.date).toDateString(),
      };
    });

    if (from) {
      const fromDate = new Date(from);
      log = log.filter((i) => new Date(i.date) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      log = log.filter((i) => new Date(i.date) <= toDate);
    }
    if (limit) {
      log = log.slice(0, limit);
    }
    res.send({
      username: data.id,
      count: data.log.length,
      _id: data.id,
      log: log,
    });
  });
}); 


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
