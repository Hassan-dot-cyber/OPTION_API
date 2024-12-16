const express = require('express');
const app = express();
const vehicleOptionsRoutes = require('./routes/vehicleOptions');

// Middleware
app.use(express.json());

// Routes
app.use('/api', vehicleOptionsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});