const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 支持新旧JWT格式
    const userId = decoded.id || decoded.userId;
    
    // 如果JWT中已包含用户信息，直接使用
    if (decoded.name && decoded.email) {
      req.user = { 
        id: userId, 
        name: decoded.name, 
        email: decoded.email 
      };
      next();
      return;
    }
    
    // 否则从数据库获取用户信息（向后兼容）
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = { id: user.id, name: user.name, email: user.email };
    next();
  } catch (error) {
    return res.status(403).json({ error: '无效的访问令牌' });
  }
};

module.exports = { authenticateToken };