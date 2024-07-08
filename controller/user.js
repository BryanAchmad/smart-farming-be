import { Router } from "express";
import axios from "axios";
const router = Router();

router.get('/login', (req, res) => {
    console.log(req.body);
    
})

export default router;