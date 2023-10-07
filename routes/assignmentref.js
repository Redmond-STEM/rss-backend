const express = require('express')
const router = express.Router()
const db = require('../api.js')

router.get('/getassignmentrefs', async (req, res) => {
    const { token, id } = req.query;
    const teacherAccount = await db.get_user_token(token);
    const course = await db.get_course(parseInt(id));
    if (course == null || teacherAccount == null){
        res.status(404).send("Course or teacher not found");
    }
    if (course.teacher == teacherAccount.id) {
        const assignments = await db.get_course_assignments(id);
        return res.status(201).json(assignments);
    }
})

router.get('/getassignmentref', async (req, res) => {
    const { token, id } = req.query;
    const assignment = await db.get_course_assignment(parseInt(id));
    const account = await db.get_user_token(token);
    const course = await db.get_course(assignment.course);
    if (assignment == null || account == null){
        return res.status(404).send("Assignment or teacher not found");
    }
    if (course.teacher != account.id) {
        return res.status(404).send("Course not found");
    }
    return res.status(201).json(assignment);
})

router.post('/createassignment', async (req, res) => {
    try {
        const { token, assignment } = req.body;
        const teacherAccount = await db.get_user_token(token);
        const course = await db.get_course(assignment.course);
        if (course.teacher == teacherAccount.id) {
            const insertId = await db.create_assignment(assignment);
            res.status(201).json({ message: 'Assignment added successfully', assignmentId: insertId });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/deleteassignment', async (req, res) => {
    // for create/delete, we need to remove them from the assignments table too
    const { token, id } = req.body;
    const teacherAccount = await db.get_user_token(token);
    const assignment = await db.get_course_assignment(id);
    const course = await db.get_course(assignment.course);
    if (course == null || teacherAccount == null){
        return res.status(404).send("Course or teacher not found");
    }
    if (course.teacher == teacherAccount.id) {
        try {
            await db.delete_course_assignment(id);
            return res.status(201).send("Assignment deleted successfully");
        } catch (error) {
            return res.status(500).send("Internal Server Error");
        }
    }
})

module.exports = router;