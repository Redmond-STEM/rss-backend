const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000; // Set the port for your server

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'rsswebsite',
    database: 'rss'
});

const cors = require('cors');

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL!');
});

app.use(cors())
app.use(bodyParser.json());

app.get('/api/getaccount', async (req, res) => {
    try {
        const { id, email, token } = req.query;
        let account = null;
        if (id != null) {
            account = await get_account(id);
        } else if (email != null) {
            account = await get_account_email(email);
        } else if (token != null) {
            account = await get_user_token(token);
        }
        if (account != null) {
            res.json(account);
        } else {
            res.status(404).json({ message: 'Account not found' });
        }
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/getaccounttoken', async (req, res) => {
    try {
        const { token } = req.query;
        const id = await get_user_id_token(token);
        if (id != null) {
            res.json(id);
        } else {
            res.status(404).json({ message: 'Account not found' });
        }
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Define your API route to create an account
app.post('/api/loginaccount', async (req, res) => {
    try {
        const { email, name, type, token } = req.body;
        const account = await get_account_email(email);
        if (account == null && authType == 'google')  {
            const insertId = await create_account({ email, name, type });
            await create_token(token, insertId);
            return res.status(201).json({ message: 'Account created successfully' });
        } else if (account == null && authType == 'teacher') {
            return res.status(500);
        } else if (account != null) {
            const id = account.id;
            await create_token(token, id);
            res.status(201).json({ message: 'Token created successfully' });
        }
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/createstudent', async (req, res) => {
    try {
        const { firstname, lastname, token } = req.body;
        const parentAccount = await get_user_token(token);
        const parent = parentAccount.id
        const insertId = await create_student({ firstname, lastname, parent });
        res.status(201).json({ message: 'Student added successfully', accountId: insertId });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

app.post('/api/logoutaccount', async (req, res) => {
    try {
        const { token } = req.body;
        await delete_token(token);
        res.status(201).json({ message: 'Token deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/createassignment', async (req, res) => {
    try {
        const { token, assignment } = req.body;
        const teacherAccount = await get_user_token(token);
        const course = await get_course(assignment.course);
        if (course.teacher == teacherAccount.id) {
            const insertId = await create_assignment(assignment);
            res.status(201).json({ message: 'Assignment added successfully', assignmentId: insertId });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/insertassignment', async (req, res) => {
    const { token, assignment } = req.body;
    const teacherAccount = await get_user_token(token);
    const ref = await get_assignment_ref(assignment.ref_id);
    const course = await get_course(ref.course);
    if (course.teacher == teacherAccount.id) {
        const insertId = await insert_assignment(assignment);
        res.status(201).json({ message: 'Assignment added successfully', assignmentId: insertId });
    }
})

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

async function get_account(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM users WHERE id = ?',
            [id],
            (err, results) => {
                if (err) {
                    reject(err);
                } else if (results.length === 0) {
                    resolve(null);
                } else {
                    resolve(results[0]);
                }
            }
        );
    });
}

async function get_account_email(email) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email],
            (err, results) => {
                if (err) {
                    reject(err);
                } else if (results.length === 0) {
                    resolve(null);
                } else {
                    resolve(results[0]);
                }
            }
        );
    });
}

async function get_user_token(token) {
    let id = await get_user_id_token(token);
    let account = await get_account(id);
    return account;
}

async function get_user_id_token(token) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT id FROM tokens WHERE token = ?',
            [token],
            (err, results) => {
                if (err) {
                    reject(err);
                    console.log(err);
                } else if (results.length === 0) {
                    resolve(null); // Token not found
                } else {
                    resolve(results[0].id);
                }
            }
        );
    });
}

// Your create_account function remains the same
async function create_account(account) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO users (email, username, auth_type) VALUES (?, ?, ?)',
            [account.email, account.name, account.type],
            (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res.insertId);
                }
            }
        );
    });
}

async function create_student(student) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO students (firstname, lastname, parent) VALUES (?, ?, ?)',
            [student.firstname, student.lastname, student.parent],
            (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            }
        );
    });
}

async function create_assignment(assignment) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO assignmentref (course, weight, name) VALUES (?, ?, ?)',
            [assignment.course, assignment.weight, assignment.name],
            (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            }
        );
    });
}

async function get_assignment_ref(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM assignmentref WHERE id = ?',
            [id],
            (err, results) => {
                if (err) {
                    reject(err);
                } else if (results.length === 0) {
                    resolve(null);
                } else {
                    resolve(results[0]);
                }
            }
        );
    });
}

async function insert_assignment(assignment) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO assignments (ref_id, student, score) VALUES (?, ?, ?)',
            [assignment.ref_id, assignment.student, assignment.score],
            (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            }
        );
    });
}

async function create_token(token, accountId) {
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO tokens (token, id) VALUES (?, ?)',
            [token, accountId],
            (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            }
        );
    });
}

async function delete_token(token) {
    return new Promise((resolve, reject) => {
        connection.query(
            'DELETE FROM tokens WHERE token = ?',
            [token],
            (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            }
        );
    });
}

async function get_course(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM courses WHERE id = ?',
            [id],
            (err, results) => {
                if (err) {
                    reject(err);
                } else if (results.length === 0) {
                    resolve(null);
                } else {
                    resolve(results[0]);
                }
            }
        );
    });
}
