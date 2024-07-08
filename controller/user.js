const { Router } = require("express");
const axios = require("axios");
const router = Router();

router.get('/login', (req, res) => {
    console.log(req.body);
    
})

module.exports = router;