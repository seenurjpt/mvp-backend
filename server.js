require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const payoutRoutes = require('./routes/payouts');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: '*' }));
const PORT = process.env.PORT || 4000;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/payouts', payoutRoutes);

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => console.log('Connected to MongoDB'))
	.catch((err) => console.log(err));

if (process.env.NODE_ENV !== 'production') {
	app.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}`);
	});
}

module.exports = app;

app.get('/', (req, res) => {
	res.send('<h1>Hello from your Express server!</h1>');
});

// Global error handler
app.use((err, req, res, next) => {
	console.error(err.stack || err);
	res.status(500).json({ message: 'Internal server error' });
});
