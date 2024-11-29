const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, default: () => new Date().toISOString().substring(0, 10) },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

// Models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Endpoints

// DELETE: Clear all users
app.get('/api/users/delete', async (req, res) => {
  try {
    const result = await User.deleteMany({});
    res.json({ message: 'All users have been deleted!', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete all users!' });
  }
});

// DELETE: Clear all exercises
app.get('/api/exercises/delete', async (req, res) => {
  try {
    const result = await Exercise.deleteMany({});
    res.json({ message: 'All exercises have been deleted!', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete all exercises!' });
  }
});

// GET: Home route
app.get('/', async (req, res) => {
  try {
    res.sendFile(__dirname + '/views/index.html');
    await User.syncIndexes();
    await Exercise.syncIndexes();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error loading home page' });
  }
});

// GET: Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    if (users.length === 0) {
      return res.json({ message: 'No users found in the database.' });
    }
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve users!' });
  }
});

// POST: Create a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  
  try {
    const newUser = new User({ username });
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create user!' });
  }
});

// POST: Add a new exercise for a user
app.post('/api/users/:userId/exercises', async (req, res) => {
  const { userId } = req.params;
  const { description, duration, date } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    const newExercise = new Exercise({
      userId: user._id,
      description,
      duration: parseInt(duration, 10),
      date: date || new Date().toISOString().substring(0, 10),
    });

    const savedExercise = await newExercise.save();
    res.json({
      username: user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: new Date(savedExercise.date).toDateString(),
      _id: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add exercise!' });
  }
});

// GET: Get a user's exercise log
app.get('/api/users/:userId/logs', async (req, res) => {
  const { userId } = req.params;
  const { from, to, limit } = req.query;
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    const exercises = await Exercise.find({
      userId: user._id,
      date: { $gte: from || new Date(0).toISOString().substring(0, 10), $lte: to || new Date().toISOString().substring(0, 10) },
    })
    .limit(Number(limit) || 0)
    .exec();

    const exerciseLog = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString(),
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: exerciseLog.length,
      log: exerciseLog,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve exercise log!' });
  }
});

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
