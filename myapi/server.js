const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/user');
const dbConfig = require('./config/database');

const app1 = express();
const app2 = express();

const port1 = process.env.PORT || 3000;
const port2 = process.env.PORT2 || 3001;

// Middleware
app1.use(bodyParser.json());
app2.use(bodyParser.json());

const setDatabase = (poolPromise) => (req, res, next) => {
  req.poolPromise = poolPromise; // Attach the pool to the request object
  next();
};

// Apply static database connections to each server
const dbPool1 = dbConfig.poolPromise;
const dbPool2 = dbConfig.poolPromise2;

app1.use(setDatabase(dbPool1));
app2.use(setDatabase(dbPool2));

// Routes
app1.use('/api/users', userRoutes);
app2.use('/api/users', userRoutes);

// Connect to the database
dbConfig.poolPromise
  .then(pool => {
    console.log('Database connected successfully');
  })
  .catch(err => {
    console.log('Database connection error: ', err);
  });

    // Connect to the database
  dbConfig.poolPromise2
  .then(pool => {
    console.log('Database connected successfully');
  })
  .catch(err => {
    console.log('Database connection error: ', err);
  });
  

// Start servers
app1.listen(port1, () => {
  console.log(`Server 1 is running on port ${port1}`);
});

app2.listen(port2, () => {
  console.log(`Server 2 is running on port ${port2}`);
});
