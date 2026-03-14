const express = require('express');
const Vendor = require('../models/Vendor');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All vendor routes require authentication + OPS role
router.use(authenticate, authorize('OPS'));

// GET /api/vendors — list all vendors
router.get('/', async (req, res) => {
	try {
		const vendors = await Vendor.find().sort({ createdAt: -1 });
		res.json(vendors);
	} catch (err) {
		res.status(500).json({ message: 'Failed to fetch vendors' });
	}
});

// POST /api/vendors — create a new vendor
router.post('/', async (req, res) => {
	try {
		const { name, upi_id, bank_account, ifsc } = req.body;

		if (!name || !name.trim()) {
			return res.status(400).json({ message: 'Vendor name is required' });
		}

		const vendor = await Vendor.create({
			name: name.trim(),
			upi_id: upi_id?.trim() || '',
			bank_account: bank_account?.trim() || '',
			ifsc: ifsc?.trim() || '',
		});

		res.status(201).json(vendor);
	} catch (err) {
		res.status(500).json({ message: 'Failed to create vendor' });
	}
});

module.exports = router;
