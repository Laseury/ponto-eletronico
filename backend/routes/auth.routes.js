const { Router } = require("express");
const AuthController = require("../controllers/auth.controller");
const { authMiddleware, authorizeRoles, Role } = require("../middlewares/auth.middleware");
const router = Router();

router.post("/login", AuthController.login);
router.get("/init", AuthController.initAdmin);
router.post("/register", authMiddleware, authorizeRoles(Role.ADMIN), AuthController.register);

module.exports = router;
