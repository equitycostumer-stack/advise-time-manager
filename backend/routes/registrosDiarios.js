const express = require("express");
const router = express.Router();
const controller = require("../controllers/registrosDiariosController");
const verificarToken = require("../middleware/authMiddleware");

router.use(verificarToken);
router.get("/", controller.listar);
router.put("/", controller.guardar);

module.exports = router;
