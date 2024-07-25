const express = require('express');
const bodyParser = require('body-parser');
const movieRoutes = require('./routes/movie');
const path = require('path');
const dbConfig = require('./config/database');

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Routes
app.use('/movies', movieRoutes);

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
