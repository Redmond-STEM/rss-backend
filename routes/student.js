const express = require('express')
const router = express.Router()
const db = require('../api.js')

router.post('/createstudent', async (req, res) => {
    try {
        const { firstname, lastname, token } = req.body;
        const parentAccount = await db.get_user_token(token);
        const parent = parentAccount.id
        const insertId = await db.create_student({ firstname, lastname, parent });
        res.status(201).json({ message: 'Student added successfully', accountId: insertId });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get('/getstudent', async (req, res) => {
    const { token, id } = req.query;
    const account = await db.get_user_token(token);
    const student = await db.get_student(id);
    if (student == null || account == null){
        return res.status(404).send("Account or student not found");
    }
    if (account.id == student.parent) {
        return res.status(201).json(student);
    }
})

router.get('/getstudents', async (req, res) => {
    const { token, course } = req.query;
    const account = await db.get_user_token(token);
    if (account == null){
        return res.status(404).send("Account not found");
    }
    if (course != null) {
        const courseObj = await db.get_course(parseInt(course));
        if (courseObj.teacher == account.id) {
            const studentIds = await db.get_students_course(courseObj.id);
            let content = []
            for (id of studentIds) {
                const student = await db.get_student(id.student);
                content.push(student);
            }
            return res.status(201).json(content);
        } else {
            return res.status(404).send("Course not found");
        }
    } else {
        const students = await db.get_students_parent(account.id);
        return res.status(201).json(students);
    }
})

router.post('/deletestudent', async (req, res) => {
    // for create/delete, we need to remove them from the assignments table too
    const { token, id } = req.body;
    const account = await db.get_user_token(token);
    const student = await db.get_student(id);
    if (student == null || account == null){
        return res.status(404).send("Account or student not found");
    }
    if (account.id == student.parent) {
        try {
            await db.delete_student(id);
            return res.status(201).send("Assignment deleted successfully");
        } catch (error) {
            return res.status(500).send("Internal Server Error");
        }
    }
})

module.exports = router;