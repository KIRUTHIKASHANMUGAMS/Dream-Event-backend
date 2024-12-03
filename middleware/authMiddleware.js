const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const authHeader = req.header('Authorization'); 

    if (!authHeader) {
        return res.status(401).json({ error: 'Access denied, no token provided' });
    }

    const [bearer, token] = authHeader.split(' '); 

    if (bearer !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Token missing or malformed' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.users = decoded;
        
        next();  // Continue to the next middleware (which is roleMiddleware)
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ error: error.message });
    }
}

module.exports = authenticate;
