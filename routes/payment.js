const express = require('express')
const router = express.Router()
const db = require('../api.js')
const dotenv = require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const randomtoken = require('random-web-token')

const payments = []

router.post("/createpayment", async (req, res) => {
    const { studentid, courseid, token } = req.body;

    const account = await db.get_user_token(token);
    const course = await db.get_course(courseid);
    const student = await db.get_student(studentid);

    if (student.parent != account.id) {
        return res.status(404).send("Student not found");
    }

    const paymentToken = randomtoken.genSync("extra", 50)

    payments.push({
        token: paymentToken,
        course: courseid,
        student: studentid
    })

    // Construct the Stripe payment URL
    const url = process.env.STRIPE_URL + "?client_reference_id=" + paymentToken;
    res.status(200).json({ payment_url: url });
});

router.post("/verifypayment", async (req, res) => {
    const event = req.body;
    if (event.type === "checkout.session.completed") {
        const paymentToken = event.data.object.client_reference_id;
        const payment = payments.find((payment) => payment.token === paymentToken);
        if (payment != null) {
            const student = payment.student;
            const course = payment.course;
            await db.add_student_course(student, course);
            payments.splice(payments.indexOf(payment), 1);
            res.status(200).json({ message: "Payment successful" });
        } else {
            res.status(404).json({ message: "Payment not found" });
        }
    }
})

module.exports = router;