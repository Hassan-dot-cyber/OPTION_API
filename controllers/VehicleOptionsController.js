const VehicleModel = require('../models/VehicleModel');

const getVehicleOptions = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        
        if (!vehicleId) {
            return res.status(400).json({ error: 'Vehicle ID is required' });
        }

        const installedOptions = await VehicleModel.getAllVehicleOptionsById(vehicleId);

        // Group options by OptionType
        const groupedOptions = installedOptions.reduce((acc, option) => {
            if (!acc[option.OptionTypeDescription]) {
                acc[option.OptionTypeDescription] = [];
            }
            acc[option.OptionTypeDescription].push({
                optionId: option.OptionID,
                description: option.OptionDescription,
                status: option.Status === 1  // Convert to boolean
            });
            return acc;
        }, {});

        res.json({
            vehicleId,
            options: groupedOptions
        });

    } catch (error) {
        console.error('Error fetching vehicle options:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const updateVehicleInstalledOption = async (req, res) => {
    try {
        let updates = [];
        
        // Check if input is array or single object
        if (Array.isArray(req.body)) {
            updates = req.body.map(item => ({
                optionId: parseInt(item.optionId),
                vehicleId: parseInt(item.vehicleId),
                status: item.status
            }));
        } else {
            updates = [{
                optionId: parseInt(req.body.optionId),
                vehicleId: parseInt(req.body.vehicleId),
                status: req.body.status
            }];
        }

        console.log('Updates to process:', updates);

        // Validate all updates
        for (const update of updates) {
            if (!update.optionId || !update.vehicleId || typeof update.status !== 'boolean') {
                return res.status(400).json({ 
                    error: 'Invalid input. Required for each update: optionId (number), vehicleId (number), status (boolean)',
                    invalidUpdate: update
                });
            }
        }

        // Process updates
        const results = [];
        for (const update of updates) {
            try {
                const result = await VehicleModel.updateVehicleOption(update);
                results.push({
                    ...update,
                    ...result
                });
            } catch (error) {
                if (error.message.includes('does not exist')) {
                    results.push({
                        ...update,
                        error: error.message,
                        success: false
                    });
                } else {
                    throw error; // Rethrow other errors
                }
            }
        }

        // Return appropriate response based on number of updates
        if (results.length === 1) {
            if (results[0].error) {
                return res.status(400).json(results[0]);
            }
            res.json(results[0]);
        } else {
            res.json({
                message: "Multiple updates completed",
                results: results
            });
        }

    } catch (error) {
        console.error('Error updating vehicle option(s):', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = {
    getVehicleOptions,
    updateVehicleInstalledOption
};