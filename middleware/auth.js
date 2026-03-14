const jwt = require('jsonwebtoken');

// Verify JWT token
const authenticate = (req, res, next) => {
	const header = req.headers.authorization;
	if (!header || !header.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'No token provided' });
	}

	try {
		const token = header.split(' ')[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
};

// Restrict to specific roles
const authorize = (...roles) => {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.role)) {
			return res.status(403).json({ message: 'Access denied' });
		}
		next();
	};
};

module.exports = { authenticate, authorize };
