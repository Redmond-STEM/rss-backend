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
    } else {
        return res.status(404).send();
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
    const courses = await db.get_courses_student(studentid);
    let content = []
    if (courses == null) {
        return res.status(404).send("Course not found");
    }
    for (id of courses) {
        const course = await db.get_course(id.course);
        content.push(course);
    }
    return res.status(201).json(content);
})

router.get('/getteachercourses', async (req, res) => {
    const { token } = req.query;
    const account = await db.get_user_token(token);
    if (account == null || account.auth_type != "teacher") {
        return res.status(404).send("Account not found");
    }
    const courses = await db.get_courses_teacher(account.id);
    if (courses == null) {
        return res.status(201).json([]);
    } else {
        return res.status(201).json(courses);
    }
})

module.exports = router;