"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const satellite_controller_1 = require("../controllers/satellite.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Used by Proponent wizard to check locations live before submitting
router.get('/analyze', satellite_controller_1.satelliteController.analyzeLive);
// Used by Scrutiny Officers to verify a submitted application
router.post('/analyze/:id', auth_1.authenticate, satellite_controller_1.satelliteController.analyzeApplication);
exports.default = router;
//# sourceMappingURL=satellite.js.map