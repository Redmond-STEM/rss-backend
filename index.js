const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000; // Set the port for your server

const accountRouter = require('./routes/account');
const assignmentRouter = require('./routes/assignment');
const assignmentRefRouter = require('./routes/assignmentref');
const courseRouter = require('./routes/course');
const studentRouter = require('./routes/student');

const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());

app.use('/api', accountRouter)
app.use('/api', assignmentRouter)
app.use('/api', assignmentRefRouter)
app.use('/api', courseRouter)
app.use('/api', studentRouter)


// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});