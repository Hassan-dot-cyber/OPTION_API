const express = require('express');
const router = express.Router();
const { getVehicleOptions,updateVehicleInstalledOption } = require('../controllers/VehicleOptionsController');

router.get('/vehicle/:vehicleId/options', getVehicleOptions);
router.put('/vehicle/options', updateVehicleInstalledOption);

module.exports = router;