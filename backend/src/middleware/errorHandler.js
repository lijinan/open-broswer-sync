const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Joi验证错误
  if (err.isJoi) {
    return res.status(400).json({
      error: '请求参数错误',
      details: err.details.map(detail => detail.message)
    });
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: '无效的访问令牌' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: '访问令牌已过期' });
  }

  // 数据库错误
  if (err.code === '23505') { // PostgreSQL唯一约束违反
    return res.status(409).json({ error: '数据已存在' });
  }

  // 默认错误
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误'
  });
};

module.exports = { errorHandler };