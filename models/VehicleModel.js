const { sql, poolPromise } = require('../config/database');

class VehicleModel {
    static async getAllVehicleOptionsById(vehicleId) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('vehicleId', sql.Int, vehicleId)
                .query(`
                    SELECT 
                        vot.OptionTypeID,
                        vot.Description AS OptionTypeDescription,
                        vo.OptionID,
                        vo.Description AS OptionDescription,
                        vo.Description2,
                        vo.ChromeID,
                        CASE 
                            WHEN vio.VehicleID IS NOT NULL THEN 1 
                            ELSE 0 
                        END AS Status
                    FROM VehicleOptionType vot
                    JOIN VehicleOption vo ON vot.OptionTypeID = vo.OptionTypeID
                    LEFT JOIN VehicleInstalledOption vio ON vo.OptionID = vio.OptionID
                        AND vio.VehicleID = @vehicleId
                    ORDER BY vot.OptionTypeID, vo.SeqNo
                `);
            return result.recordset;
        } catch (error) {
            console.error('Database Error:', error);
            throw new Error('Failed to fetch vehicle options');
        }
    }
    static async updateVehicleOption(optionData) {
        try {
            const pool = await poolPromise;
            const { optionId, vehicleId, status } = optionData;

            // First check if the optionId exists in VehicleOption table
            const checkOptionResult = await pool.request()
                .input('optionId', sql.Int, optionId)
                .query(`
                    SELECT COUNT(*) as count 
                    FROM VehicleOption 
                    WHERE OptionID = @optionId
                `);

            if (checkOptionResult.recordset[0].count === 0) {
                throw new Error(`OptionID ${optionId} does not exist in VehicleOption table`);
            }

            if (status) {
                // Check if record already exists
                const checkResult = await pool.request()
                    .input('optionId', sql.Int, optionId)
                    .input('vehicleId', sql.Int, vehicleId)
                    .query(`
                        SELECT COUNT(*) as count 
                        FROM VehicleInstalledOption 
                        WHERE OptionID = @optionId AND VehicleID = @vehicleId
                    `);

                if (checkResult.recordset[0].count === 0) {
                    // Insert new record if it doesn't exist
                    await pool.request()
                        .input('optionId', sql.Int, optionId)
                        .input('vehicleId', sql.Int, vehicleId)
                        .query(`
                            INSERT INTO VehicleInstalledOption (OptionID, VehicleID)
                            VALUES (@optionId, @vehicleId)
                        `);
                    return { 
                        message: "Option installed successfully",
                        status: true,
                        created: true
                    };
                }
                return { 
                    message: "Option already installed",
                    status: true,
                    created: false
                };
            } else {
                // Check if record exists before trying to delete
                const checkExistsResult = await pool.request()
                    .input('optionId', sql.Int, optionId)
                    .input('vehicleId', sql.Int, vehicleId)
                    .query(`
                        SELECT COUNT(*) as count 
                        FROM VehicleInstalledOption 
                        WHERE OptionID = @optionId AND VehicleID = @vehicleId
                    `);

                if (checkExistsResult.recordset[0].count === 0) {
                    return { 
                        message: "Option was not installed",
                        status: false,
                        deleted: false
                    };
                }

                // Delete the record if status is false
                await pool.request()
                    .input('optionId', sql.Int, optionId)
                    .input('vehicleId', sql.Int, vehicleId)
                    .query(`
                        DELETE FROM VehicleInstalledOption 
                        WHERE OptionID = @optionId AND VehicleID = @vehicleId
                    `);
                
                return { 
                    message: "Option removed successfully",
                    status: false,
                    deleted: true
                };
            }
        } catch (error) {
            if (error.message.includes('does not exist')) {
                throw error; // Rethrow validation errors
            }
            console.error('Database Error:', error);
            throw new Error('Failed to update vehicle option');
        }
    }
}

module.exports = VehicleModel;