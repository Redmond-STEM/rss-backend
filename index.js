const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000; // Set the port for your server

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password:  process.env.DB_PASS || 'rsswebsite',
    database: process.env.DB_NAME || 'rss'
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
        if (account == null && type == 'google')  {
            const insertId = await create_account({ email, name, type });
            await create_token(token, insertId);
            return res.status(201).json({ message: 'Account created successfully' });
        } else if (account == null && type == 'teacher') {
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
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.post('/api/insertassignment', async (req, res) => {
    const { token, assignment } = req.body;
    const teacherAccount = await get_user_token(token);
    const ref = await get_course_assignment(assignment.ref_id);
    const course = await get_course(ref.course);
    if (course.teacher == teacherAccount.id) {
        const insertId = await insert_assignment(assignment);
        res.status(201).json({ message: 'Assignment added successfully', assignmentId: insertId });
    }
})

app.get('/api/getcourse', async (req, res) => { 
    const { token, id } = req.query;
    if (id == null) return res.status(404).send;
    const teacherAccount = await get_user_token(token);
    const course = await get_course(parseInt(id));
    if (course == null || teacherAccount == null){
        res.status(404).send("Course or teacher not found");
    }
    if (course.teacher == teacherAccount.id) {
        res.status(201).json(course);
    }
})

app.get('/api/getassignmentrefs', async (req, res) => {
    const { token, id } = req.query;
    const teacherAccount = await get_user_token(token);
    const course = await get_course(parseInt(id));
    if (course == null || teacherAccount == null){
        res.status(404).send("Course or teacher not found");
    }
    if (course.teacher == teacherAccount.id) {
        const assignments = await get_course_assignments(id);
        return res.status(201).json(assignments);
    }
})

app.get('/api/getstudent', async (req, res) => {
    const { token, id } = req.query;
    const account = await get_user_token(token);
    const student = await get_student(id);
    if (student == null || account == null){
        return res.status(404).send("Account or student not found");
    }
    if (account.id == student.parent) {
        return res.status(201).json(student);
    }
})

app.get('/api/getassignmentref', async (req, res) => {
    const { token, id } = req.query;
    const assignment = await get_course_assignment(parseInt(id));
    const account = await get_user_token(token);
    const course = await get_course(assignment.course);
    if (assignment == null || account == null){
        return res.status(404).send("Assignment or teacher not found");
    }
    if (course.teacher != account.id) {
        return res.status(404).send("Course not found");
    }
    return res.status(201).json(assignment);
})

app.get('/api/getassignment', async (req, res) => {
    const { token, ref_id, studentid } = req.query;
    const account = await get_user_token(token);
    const student = await get_student(studentid);
    const assignment = await get_score(ref_id, studentid);
    const ref = await get_course_assignment(ref_id);
    const course = await get_course(ref.course);
    if (course.teacher != account.id && student.parent != account.id) {
        return res.status(404).send("Student not found");
    } else if (assignment == null) {
        return res.status(404).send("Assignment not found");
    } else {
        return res.status(201).json(assignment);
    }
})

app.post('/api/setassignment', async (req, res) => {
    const { token, refid, studentid, score } = req.body;
    ref_id = parseInt(refid);
    const account = await get_user_token(token);
    const assignment = await get_score(ref_id, studentid);
    const ref = await get_course_assignment(ref_id);
    const course = await get_course(ref.course);
    if (course.teacher != account.id) {
        return res.status(404).send("Student not found");
    } else if (ref == null) {
        return res.status(404).send("Assignment not found");
    } else {
        const response = await set_score(ref_id, studentid, parseInt(score));
        return res.status(201).json(response);
    }
})

app.get('/api/getstudents', async (req, res) => {
    const { token, course } = req.query;
    const account = await get_user_token(token);
    if (account == null){
        return res.status(404).send("Account not found");
    }
    if (course != null) {
        const courseObj = await get_course(parseInt(course));
        if (courseObj.teacher == account.id) {
            const studentIds = await get_students_course(courseObj.id);
            let content = []
            for (id of studentIds) {
                const student = await get_student(id.student);
                content.push(student);
            }
            return res.status(201).json(content);
        } else {
            return res.status(404).send("Course not found");
        }
    } else {
        const students = await get_students_parent(account.id);
        return res.status(201).json(students);
    }
})

app.post('/api/deleteassignment', async (req, res) => {
    // for create/delete, we need to remove them from the assignments table too
    const { token, id } = req.body;
    const teacherAccount = await get_user_token(token);
    const assignment = await get_course_assignment(id);
    const course = await get_course(assignment.course);
    if (course == null || teacherAccount == null){
        return res.status(404).send("Course or teacher not found");
    }
    if (course.teacher == teacherAccount.id) {
        try {
            await delete_course_assignment(id);
            return res.status(201).send("Assignment deleted successfully");
        } catch (error) {
            return res.status(500).send("Internal Server Error");
        }
    }
})

app.post('/api/deletestudent', async (req, res) => {
    // for create/delete, we need to remove them from the assignments table too
    const { token, id } = req.body;
    const account = await get_user_token(token);
    const student = await get_student(id);
    if (student == null || account == null){
        return res.status(404).send("Account or student not found");
    }
    if (account.id == student.parent) {
        try {
            await delete_student(id);
            return res.status(201).send("Assignment deleted successfully");
        } catch (error) {
            return res.status(500).send("Internal Server Error");
        }
    }
})

app.get('/api/getstudentcourses', async (req, res) => {
    const { token, studentid } = req.query;
    const account = await get_user_token(token);
    const student = await get_student(studentid);
    if (student == null || account == null){
        return res.status(404).send("Account or student not found");
    }
    if (account.id != student.parent) {
        return res.status(404).send("Account not foundded");
    }
    const courses = await get_courses(studentid);
    let content = []
    for (id of courses) {
        const course = await get_course(id.course);
        content.push(course);
    }
    return res.status(201).json(content);
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

async function get_course_assignment(id) {
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

async function delete_course_assignment(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'DELETE FROM assignmentref WHERE id = ?',
            [id],
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

async function get_course_assignments(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM assignmentref WHERE course = ?',
            [id],
            (err, results) => {
                if (err) {
                    reject(err);
                } else if (results.length === 0) {
                    resolve(null);
                } else {
                    resolve(results);
                }
            }
        );
    });
}

async function get_student(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM students WHERE id = ?',
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

async function get_students_parent(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM students WHERE parent = ?',
            [id],
            (err, results) => {
                if (err) {
                    reject(err);
                } else if (results.length === 0) {
                    resolve(null);
                } else {
                    resolve(results);
                }
            }
        );
    });
}

async function get_students_course(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM student_course WHERE course = ?',
            [id],
            (err, results) => {
                if (err) {
                    reject(err);
                } else if (results.length === 0) {
                    resolve(null);
                } else {
                    resolve(results);
                }
            }
        );
    });
}

async function delete_student(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'DELETE FROM students WHERE id = ?',
            [id],
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

async function get_courses(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM student_course WHERE student = ?',
            [id],
            (err, results) => {
                if (err) {
                    reject(err);
                } else if (results.length === 0) {
                    resolve(null);
                } else {
                    resolve(results);
                }
            }
        );
    });
}

async function get_score(ref_id, student) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM assignments WHERE ref_id = ? AND student = ?',
            [ref_id, student],
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

async function get_score_exist(ref_id, student) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT COUNT(*) FROM assignments WHERE ref_id = ? AND student = ?',
            [ref_id, student],
            (err, results) => {
                if (err) {
                    reject(err);
                } else if (results.length === null) {
                    resolve(null);
                } else {
                    resolve(results[0]);
                }
            }
        );
    });
}

async function set_score(ref_id, student, score) {
    const count = await get_score_exist(ref_id, student);
    if (count["COUNT(*)"] > 0) {
        return new Promise((resolve, reject) => {
            connection.query(
                'UPDATE assignments SET score = ? WHERE ref_id = ? AND student = ?',
                [score, ref_id, student],
                (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                }
            );
        });
    } else {
        return new Promise((resolve, reject) => {
            connection.query(
                'INSERT INTO assignments (ref_id, student, score) VALUES (?, ?, ?)',
                [ref_id, student, score],
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
}