const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 注册验证schema
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required()
});

// 登录验证schema
const loginSchema = Joi.object({
  email: Joi.string().optional(), // 兼容前端的email参数
  username: Joi.string().optional(), // 支持扩展的username参数
  password: Joi.string().required()
}).or('email', 'username'); // 至少需要email或username其中一个

// 注册
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) throw error;

    const { email, password, name } = value;

    // 检查用户是否已存在
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ error: '用户已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const [user] = await db('users').insert({
      email,
      password: hashedPassword,
      name,
      created_at: new Date(),
      updated_at: new Date()
    }).returning(['id', 'email', 'name']);

    // 生成JWT
    const token = jwt.sign(
      { 
        id: user.id,
        userId: user.id, // 保持向后兼容
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    next(error);
  }
});

// 登录
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw error;

    const { email, username, password } = value;
    const loginIdentifier = email || username; // 使用email或username

    // 查找用户 (支持邮箱或用户名登录)
    const user = await db('users')
      .where({ email: loginIdentifier })
      .orWhere({ name: loginIdentifier })
      .first();
      
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成JWT
    const token = jwt.sign(
      { 
        id: user.id,
        userId: user.id, // 保持向后兼容
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    next(error);
  }
});

// 获取用户信息
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await db('users')
      .select('id', 'email', 'name', 'created_at')
      .where({ id: req.user.id })
      .first();

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// 验证登录状态 (用于浏览器扩展)
router.get('/verify', authenticateToken, async (req, res, next) => {
  try {
    const user = await db('users')
      .select('id', 'email', 'name')
      .where({ id: req.user.id })
      .first();

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    res.json({
      valid: true,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    next(error);
  }
});

// 验证用户密码 (用于二次验证)
router.post('/verify-password', authenticateToken, async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: '请提供密码' });
    }

    const user = await db('users')
      .select('password')
      .where({ id: req.user.id })
      .first();

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '密码错误' });
    }

    res.json({ valid: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;