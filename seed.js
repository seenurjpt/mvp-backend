require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const users = [
	{ email: 'ops@demo.com', password: 'ops123', role: 'OPS' },
	{ email: 'finance@demo.com', password: 'fin123', role: 'FINANCE' },
];

async function seed() {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('Connected to MongoDB');

		for (const u of users) {
			const exists = await User.findOne({ email: u.email });
			if (exists) {
				console.log(`User ${u.email} already exists — skipping`);
				continue;
			}
			const hashed = await bcrypt.hash(u.password, 10);
			await User.create({ email: u.email, password: hashed, role: u.role });
			console.log(`Created user: ${u.email} (${u.role})`);
		}

		console.log('Seeding complete');
		process.exit(0);
	} catch (err) {
		console.error('Seed error:', err);
		process.exit(1);
	}
}

seed();
