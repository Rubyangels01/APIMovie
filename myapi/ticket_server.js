const express = require('express');
const bodyParser = require('body-parser');
const ticketRoute = require('./routes/ticket');
const dbConfig = require('./config/database');
const path = require('path');

const app1 = express(); // Server 1
const app2 = express(); // Server 2

const port1 = process.env.PORT || 3004; // Port for Server 1
const port2 = process.env.PORT2 || 3005; // Port for Server 2

// Middleware
app1.use(bodyParser.json());
app2.use(bodyParser.json());

// Middleware to attach the appropriate database pool
const setDatabase = (poolPromise) => (req, res, next) => {
  req.poolPromise = poolPromise; // Attach the pool to the request object
  next();
};

// Apply static database connections to each server
app1.use(setDatabase(dbConfig.poolPromise));
app2.use(setDatabase(dbConfig.poolPromise2));

// Serve static files
app1.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app2.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app1.use('/tickets', ticketRoute);
app2.use('/tickets', ticketRoute);

// Connect to the database
dbConfig.poolPromise
  .then(pool => {
    console.log('Database connected successfully with config1');
  })
  .catch(err => {
    console.log('Database connection error with config1: ', err);
  });

dbConfig.poolPromise2
  .then(pool => {
    console.log('Database connected successfully with config2');
  })
  .catch(err => {
    console.log('Database connection error with config2: ', err);
  });

// Start both servers
const startServer = (app, port, name) => {
  app.listen(port, () => {
    console.log(`${name} is running on port ${port}`);
  });
};

startServer(app1, port1, 'Server 1');
startServer(app2, port2, 'Server 2');
