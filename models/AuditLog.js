const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
	{
		payout_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Payout',
			required: true,
			index: true,
		},
		action: {
			type: String,
			enum: ['CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED'],
			required: true,
		},
		performed_by: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema, 'payout_audits');
