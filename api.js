const connection = require('./mysql.js')

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

module.exports = {
    get_account,
    get_account_email,
    get_user_token,
    get_user_id_token,
    create_account,
    create_student,
    create_assignment,
    get_course_assignment,
    create_token,
    delete_token,
    delete_course_assignment,
    get_course,
    get_course_assignments,
    get_student,
    get_students_parent,
    get_students_course,
    delete_student,
    get_courses,
    get_score,
    get_score_exist,
    set_score
};