const express = require('express')
const router = express.Router()
const db = require('../api.js')

router.get('/getcourse', async (req, res) => { 
    const { token, id } = req.query;
    if (id == null) return res.status(404).send;
    const teacherAccount = await db.get_user_token(token);
    const course = await db.get_course(parseInt(id));
    if (course == null || teacherAccount == null){
        res.status(404).send("Course or teacher not found");
    }
    if (course.teacher == teacherAccount.id) {
        res.status(201).json(course);
    }
})

router.get('/getstudentcourses', async (req, res) => {
    const { token, studentid } = req.query;
    const account = await db.get_user_token(token);
    const student = await db.get_student(studentid);
    if (student == null || account == null){
        return res.status(404).send("Account or student not found");
    }
    if (account.id != student.parent) {
        return res.status(404).send("Account not foundded");
    }
    const courses = await db.get_courses(studentid);
    let content = []
    for (id of courses) {
        const course = await db.get_course(id.course);
        content.push(course);
    }
    return res.status(201).json(content);
})

module.exports = router;