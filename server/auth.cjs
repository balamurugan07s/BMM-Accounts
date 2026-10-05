const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('./db.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'bmm_super_secret_key_2026';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains employee_id, role, branch_id
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

const loginRoute = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const query = `
    SELECT e.*, r.name as role_name 
    FROM employees e 
    JOIN roles r ON e.role_id = r.id 
    WHERE e.username = ? AND e.status = 'ACTIVE'
  `;
  db.get(query, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { employee_id: user.employee_id, role: user.role_name, branch_id: user.branch_id, name: user.name },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, user: { employee_id: user.employee_id, name: user.name, role: user.role_name, branch_id: user.branch_id } });
  });
};

module.exports = { authenticate, authorize, loginRoute };
