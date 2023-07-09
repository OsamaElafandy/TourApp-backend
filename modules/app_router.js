
const express = require('express');

const router = express.Router();

router.get("/",(req,res,next) => {
    res.send('<h1>Home !</h1>')
})

router.get("/aa",(req,res,next) => {
    res.send('<h1>aa</h1>')
})

module.exports = router;