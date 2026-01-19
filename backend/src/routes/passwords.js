const express = require('express');
const Joi = require('joi');
const CryptoJS = require('crypto-js');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 密码验证schema
const passwordSchema = Joi.object({
  site_name: Joi.string().required(),
  site_url: Joi.string().uri().required(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  notes: Joi.string().allow('').optional(),
  category: Joi.string().allow('').optional()
});

// 加密数据
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), process.env.ENCRYPTION_KEY).toString();
};

// 解密数据
const decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// 获取所有密码
router.get('/', async (req, res, next) => {
  try {
    const passwords = await db('passwords')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    // 解密密码数据（不返回实际密码，只返回其他信息）
    const decryptedPasswords = passwords.map(password => {
      const decrypted = decryptData(password.encrypted_data);
      return {
        id: password.id,
        site_name: decrypted.site_name,
        site_url: decrypted.site_url,
        username: decrypted.username,
        notes: decrypted.notes,
        category: decrypted.category,
        created_at: password.created_at,
        updated_at: password.updated_at
      };
    });

    res.json({ passwords: decryptedPasswords });
  } catch (error) {
    next(error);
  }
});

// 获取特定密码（包含实际密码）
router.get('/:id', async (req, res, next) => {
  try {
    const passwordId = req.params.id;

    const passwordRecord = await db('passwords')
      .where({ id: passwordId, user_id: req.user.id })
      .first();

    if (!passwordRecord) {
      return res.status(404).json({ error: '密码记录不存在' });
    }

    // 解密完整数据
    const decryptedData = decryptData(passwordRecord.encrypted_data);

    res.json({
      password: {
        id: passwordRecord.id,
        ...decryptedData,
        created_at: passwordRecord.created_at,
        updated_at: passwordRecord.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// 创建密码
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = passwordSchema.validate(req.body);
    if (error) throw error;

    // 加密密码数据
    const encryptedData = encryptData(value);

    const [password] = await db('passwords').insert({
      user_id: req.user.id,
      encrypted_data: encryptedData,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    // 发送WebSocket通知
    const websocketService = require('../services/websocket');
    websocketService.notifyPasswordChange(req.user.id, 'created', {
      id: password.id,
      site_name: value.site_name,
      site_url: value.site_url,
      username: value.username,
      category: value.category,
      created_at: password.created_at
    });

    res.status(201).json({
      message: '密码创建成功',
      password: {
        id: password.id,
        site_name: value.site_name,
        site_url: value.site_url,
        username: value.username,
        notes: value.notes,
        category: value.category,
        created_at: password.created_at,
        updated_at: password.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// 更新密码
router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = passwordSchema.validate(req.body);
    if (error) throw error;

    const passwordId = req.params.id;

    // 检查密码记录是否存在且属于当前用户
    const existingPassword = await db('passwords')
      .where({ id: passwordId, user_id: req.user.id })
      .first();

    if (!existingPassword) {
      return res.status(404).json({ error: '密码记录不存在' });
    }

    // 加密更新的数据
    const encryptedData = encryptData(value);

    await db('passwords')
      .where({ id: passwordId })
      .update({
        encrypted_data: encryptedData,
        updated_at: new Date()
      });

    // 发送WebSocket通知
    const websocketService = require('../services/websocket');
    websocketService.notifyPasswordChange(req.user.id, 'updated', {
      id: passwordId,
      site_name: value.site_name,
      site_url: value.site_url,
      username: value.username,
      category: value.category,
      updated_at: new Date()
    });

    res.json({
      message: '密码更新成功',
      password: {
        id: passwordId,
        site_name: value.site_name,
        site_url: value.site_url,
        username: value.username,
        notes: value.notes,
        category: value.category,
        updated_at: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
});

// 删除密码
router.delete('/:id', async (req, res, next) => {
  try {
    const passwordId = req.params.id;

    // 获取密码信息用于通知
    const passwordRecord = await db('passwords')
      .where({ id: passwordId, user_id: req.user.id })
      .first();

    if (!passwordRecord) {
      return res.status(404).json({ error: '密码记录不存在' });
    }

    // 解密数据获取网站信息
    const decryptedData = decryptData(passwordRecord.encrypted_data);

    const deletedCount = await db('passwords')
      .where({ id: passwordId, user_id: req.user.id })
      .del();

    if (deletedCount === 0) {
      return res.status(404).json({ error: '密码记录不存在' });
    }

    // 发送WebSocket通知
    const websocketService = require('../services/websocket');
    websocketService.notifyPasswordChange(req.user.id, 'deleted', {
      id: passwordId,
      site_name: decryptedData.site_name,
      site_url: decryptedData.site_url,
      username: decryptedData.username,
      category: decryptedData.category
    });

    res.json({ message: '密码删除成功' });
  } catch (error) {
    next(error);
  }
});

// 搜索密码
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }

    const passwords = await db('passwords')
      .where({ user_id: req.user.id });

    // 解密并搜索
    const searchResults = passwords
      .map(password => {
        const decrypted = decryptData(password.encrypted_data);
        return {
          id: password.id,
          site_name: decrypted.site_name,
          site_url: decrypted.site_url,
          username: decrypted.username,
          notes: decrypted.notes,
          category: decrypted.category,
          created_at: password.created_at,
          updated_at: password.updated_at
        };
      })
      .filter(password => 
        password.site_name.toLowerCase().includes(q.toLowerCase()) ||
        password.site_url.toLowerCase().includes(q.toLowerCase()) ||
        password.username.toLowerCase().includes(q.toLowerCase())
      );

    res.json({ passwords: searchResults });
  } catch (error) {
    next(error);
  }
});

// 清空用户所有密码
router.delete('/clear', async (req, res, next) => {
  try {
    const deletedCount = await db('passwords')
      .where({ user_id: req.user.id })
      .del();

    console.log(`用户 ${req.user.id} 清空了 ${deletedCount} 个密码`);
    
    res.json({ 
      success: true, 
      message: `已清空 ${deletedCount} 个密码`,
      deletedCount 
    });
  } catch (error) {
    console.error('清空密码失败:', error);
    next(error);
  }
});

module.exports = router;