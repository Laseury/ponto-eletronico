const express      = require("express");
const router       = express.Router();
const { listarLogs } = require("../controllers/log.controller");

router.get("/", listarLogs);

module.exports = router;