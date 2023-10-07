const express = require('express')
const router = express.Router()
const db = require('../api.js')

router.get('/getassignment', async (req, res) => {
    const { token, ref_id, studentid } = req.query;
    const account = await db.get_user_token(token);
    const student = await db.get_student(studentid);
    const assignment = await db.get_score(ref_id, studentid);
    const ref = await db.get_course_assignment(ref_id);
    const course = await db.get_course(ref.course);
    if (course.teacher != account.id && student.parent != account.id) {
        return res.status(404).send("Student not found");
    } else if (assignment == null) {
        return res.status(404).send("Assignment not found");
    } else {
        return res.status(201).json(assignment);
    }
})

router.post('/setassignment', async (req, res) => {
    const { token, refid, studentid, score } = req.body;
    ref_id = parseInt(refid);
    const account = await db.get_user_token(token);
    const ref = await db.get_course_assignment(ref_id);
    const course = await db.get_course(ref.course);
    if (course.teacher != account.id) {
        return res.status(404).send("Student not found");
    } else if (ref == null) {
        return res.status(404).send("Assignment not found");
    } else {
        const response = await db.set_score(ref_id, studentid, parseInt(score));
        return res.status(201).json(response);
    }
})

module.exports = router;