const express = require('express');
const bodyParser = require('body-parser');
const movieRoutes = require('./routes/movie');
const path = require('path');
const dbConfig = require('./config/database');

const app1 = express(); // Server 1
const app2 = express(); // Server 2

const port1 = process.env.PORT || 3002; // Port for Server 1
const port2 = process.env.PORT2 || 3003; // Port for Server 2

// Middleware for parsing JSON and serving static files
app1.use(bodyParser.json());
app2.use(bodyParser.json());

app1.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app2.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware for assigning static database connection
const setDatabase = (poolPromise) => (req, res, next) => {
  req.poolPromise = poolPromise; // Attach the pool to the request object
  next();
};

// Apply static database connections to each server
const dbPool1 = dbConfig.poolPromise;
const dbPool2 = dbConfig.poolPromise2;

app1.use(setDatabase(dbPool1));
app2.use(setDatabase(dbPool2));

// Define routes
app1.use('/movies', movieRoutes);
app2.use('/movies', movieRoutes);

// Start both servers
const startServer = (app, port, name) => {
  app.listen(port, () => {
    console.log(`${name} is running on port ${port}`);
  });
};

// Connect to databases and start servers
Promise.all([dbPool1, dbPool2])
  .then(() => {
    console.log('All databases connected successfully');
    startServer(app1, port1, 'Server 1');
    startServer(app2, port2, 'Server 2');
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
