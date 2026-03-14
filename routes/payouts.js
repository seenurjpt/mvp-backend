const express = require('express');
const mongoose = require('mongoose');
const Payout = require('../models/Payout');
const Vendor = require('../models/Vendor');
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All payout routes require authentication
router.use(authenticate);

// GET /api/payouts — list all payouts (both OPS and FINANCE)
router.get('/', authorize('OPS', 'FINANCE'), async (req, res) => {
	try {
		const filter = {};

		if (typeof req.query.status === 'string') {
			filter.status = req.query.status;
		}
		if (typeof req.query.vendor_id === 'string') {
			filter.vendor_id = req.query.vendor_id;
		}

		const payouts = await Payout.find(filter)
			.populate('vendor_id', 'name')
			.populate('created_by', 'email')
			.sort({ createdAt: -1 });

		res.json(payouts);
	} catch (err) {
		res.status(500).json({ message: 'Failed to fetch payouts' });
	}
});

// POST /api/payouts — create a new payout (OPS only, status = Draft)
router.post('/', authorize('OPS'), async (req, res) => {
	try {
		const { vendor_id, amount, mode, note } = req.body;

		if (!vendor_id || !mongoose.isValidObjectId(vendor_id)) {
			return res.status(400).json({ message: 'Valid vendor is required' });
		}
		if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
			return res.status(400).json({ message: 'Amount must be a positive number' });
		}
		if (!['UPI', 'IMPS', 'NEFT'].includes(mode)) {
			return res.status(400).json({ message: 'Mode must be UPI, IMPS, or NEFT' });
		}

		const vendor = await Vendor.findById(vendor_id);
		if (!vendor) {
			return res.status(404).json({ message: 'Vendor not found' });
		}

		const payout = await Payout.create({
			vendor_id,
			amount,
			mode,
			note: note?.trim() || '',
			status: 'Draft',
			created_by: req.user.id,
		});

		await AuditLog.create({
			payout_id: payout._id,
			action: 'CREATED',
			performed_by: req.user.id,
		});

		const populated = await Payout.findById(payout._id)
			.populate('vendor_id', 'name')
			.populate('created_by', 'email');

		res.status(201).json(populated);
	} catch (err) {
		res.status(500).json({ message: 'Failed to create payout' });
	}
});

// GET /api/payouts/:id — get single payout detail
router.get('/:id', authorize('OPS', 'FINANCE'), async (req, res) => {
	try {
		if (!mongoose.isValidObjectId(req.params.id)) {
			return res.status(400).json({ message: 'Invalid payout ID' });
		}

		const payout = await Payout.findById(req.params.id)
			.populate('vendor_id', 'name upi_id bank_account ifsc')
			.populate('created_by', 'email');

		if (!payout) {
			return res.status(404).json({ message: 'Payout not found' });
		}

		res.json(payout);
	} catch (err) {
		res.status(500).json({ message: 'Failed to fetch payout' });
	}
});

// GET /api/payouts/:id/audit — get audit trail for a payout
router.get('/:id/audit', authorize('OPS', 'FINANCE'), async (req, res) => {
	try {
		if (!mongoose.isValidObjectId(req.params.id)) {
			return res.status(400).json({ message: 'Invalid payout ID' });
		}

		const logs = await AuditLog.find({ payout_id: req.params.id })
			.populate('performed_by', 'email role')
			.sort({ createdAt: 1 });

		res.json(logs);
	} catch (err) {
		res.status(500).json({ message: 'Failed to fetch audit logs' });
	}
});

// POST /api/payouts/:id/submit — submit a draft payout (OPS only)
router.post('/:id/submit', authorize('OPS'), async (req, res) => {
	try {
		if (!mongoose.isValidObjectId(req.params.id)) {
			return res.status(400).json({ message: 'Invalid payout ID' });
		}

		const payout = await Payout.findOneAndUpdate(
			{ _id: req.params.id, status: 'Draft' },
			{ status: 'Submitted' },
			{ new: true }
		);

		if (!payout) {
			const exists = await Payout.findById(req.params.id);
			if (!exists) return res.status(404).json({ message: 'Payout not found' });
			return res.status(400).json({ message: 'Only Draft payouts can be submitted' });
		}

		await AuditLog.create({
			payout_id: payout._id,
			action: 'SUBMITTED',
			performed_by: req.user.id,
		});

		const populated = await Payout.findById(payout._id)
			.populate('vendor_id', 'name upi_id bank_account ifsc')
			.populate('created_by', 'email');

		res.json(populated);
	} catch (err) {
		res.status(500).json({ message: 'Failed to submit payout' });
	}
});

// POST /api/payouts/:id/approve — approve a submitted payout (FINANCE only)
router.post('/:id/approve', authorize('FINANCE'), async (req, res) => {
	try {
		if (!mongoose.isValidObjectId(req.params.id)) {
			return res.status(400).json({ message: 'Invalid payout ID' });
		}

		const payout = await Payout.findOneAndUpdate(
			{ _id: req.params.id, status: 'Submitted' },
			{ status: 'Approved' },
			{ new: true }
		);

		if (!payout) {
			const exists = await Payout.findById(req.params.id);
			if (!exists) return res.status(404).json({ message: 'Payout not found' });
			return res.status(400).json({ message: 'Only Submitted payouts can be approved' });
		}

		await AuditLog.create({
			payout_id: payout._id,
			action: 'APPROVED',
			performed_by: req.user.id,
		});

		const populated = await Payout.findById(payout._id)
			.populate('vendor_id', 'name upi_id bank_account ifsc')
			.populate('created_by', 'email');

		res.json(populated);
	} catch (err) {
		res.status(500).json({ message: 'Failed to approve payout' });
	}
});

// POST /api/payouts/:id/reject — reject a submitted payout (FINANCE only)
router.post('/:id/reject', authorize('FINANCE'), async (req, res) => {
	try {
		const { decision_reason } = req.body;
		if (!decision_reason || !decision_reason.trim()) {
			return res.status(400).json({ message: 'Rejection reason is required' });
		}

		if (!mongoose.isValidObjectId(req.params.id)) {
			return res.status(400).json({ message: 'Invalid payout ID' });
		}

		const payout = await Payout.findOneAndUpdate(
			{ _id: req.params.id, status: 'Submitted' },
			{ status: 'Rejected', decision_reason: decision_reason.trim() },
			{ new: true }
		);

		if (!payout) {
			const exists = await Payout.findById(req.params.id);
			if (!exists) return res.status(404).json({ message: 'Payout not found' });
			return res.status(400).json({ message: 'Only Submitted payouts can be rejected' });
		}

		await AuditLog.create({
			payout_id: payout._id,
			action: 'REJECTED',
			performed_by: req.user.id,
		});

		const populated = await Payout.findById(payout._id)
			.populate('vendor_id', 'name upi_id bank_account ifsc')
			.populate('created_by', 'email');

		res.json(populated);
	} catch (err) {
		res.status(500).json({ message: 'Failed to reject payout' });
	}
});

module.exports = router;
