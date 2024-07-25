const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/user');
const dbConfig = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/users', userRoutes);

// Connect to the database
dbConfig.poolPromise.then(pool => {
    console.log('Database connected successfully');
}).catch(err => {
    console.log('Database connection error: ', err);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
