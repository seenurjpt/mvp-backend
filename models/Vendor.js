const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		upi_id: { type: String, default: '', trim: true },
		bank_account: { type: String, default: '', trim: true },
		ifsc: { type: String, default: '', trim: true },
		is_active: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Vendor', vendorSchema);
