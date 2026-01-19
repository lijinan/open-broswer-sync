const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const CryptoJS = require('crypto-js');

const router = express.Router();

// 配置文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = ['application/json', 'text/html', 'text/csv', 'text/plain'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.html')) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 所有路由都需要认证
router.use(authenticateToken);

// 加密数据
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), process.env.ENCRYPTION_KEY).toString();
};

// 解密数据
const decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// 导出书签为JSON
router.get('/bookmarks/export', async (req, res, next) => {
  try {
    const bookmarks = await db('bookmarks')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    // 解密书签数据
    const decryptedBookmarks = bookmarks.map(bookmark => ({
      ...decryptData(bookmark.encrypted_data),
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at
    }));

    const exportData = {
      version: '1.0',
      export_date: new Date().toISOString(),
      user_email: req.user.email,
      bookmarks: decryptedBookmarks,
      total_count: decryptedBookmarks.length
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="bookmarks_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

// 导出书签为HTML（浏览器导入格式）
router.get('/bookmarks/export/html', async (req, res, next) => {
  try {
    const bookmarks = await db('bookmarks')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    // 解密书签数据
    const decryptedBookmarks = bookmarks.map(bookmark => ({
      ...decryptData(bookmark.encrypted_data)
    }));

    // 按文件夹分组
    const folderMap = new Map();
    folderMap.set('', []); // 根文件夹

    decryptedBookmarks.forEach(bookmark => {
      const folder = bookmark.folder || '';
      if (!folderMap.has(folder)) {
        folderMap.set(folder, []);
      }
      folderMap.get(folder).push(bookmark);
    });

    // 生成Netscape Bookmark File格式的HTML
    // Firefox/Chrome标准格式
    const now = Math.floor(Date.now() / 1000);

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    // Firefox需要一个根文件夹才能正确识别为主书签菜单
    // 使用"Bookmarks Menu"作为根文件夹名称
    html += `    <DT><H3 ADD_DATE="${now}">Bookmarks Menu</H3>\n`;
    html += `    <DL><p>\n`;

    // 添加根目录书签（不放在子文件夹里的）
    if (folderMap.has('') && folderMap.get('').length > 0) {
      folderMap.get('').forEach(bookmark => {
        const timestamp = bookmark.created_at ?
          Math.floor(new Date(bookmark.created_at).getTime() / 1000) :
          now;
        const encodedUrl = bookmark.url.replace(/"/g, '%22');
        const encodedTitle = bookmark.title
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const icon = `ICON_URI="${encodedUrl}/favicon.ico"`;

        html += `        <DT><A HREF="${encodedUrl}" ADD_DATE="${timestamp}" ${icon} ICON="">${encodedTitle}</A>\n`;
      });
    }

    // 生成文件夹及其书签
    for (const [folderName, bookmarks] of folderMap) {
      if (folderName !== '' && bookmarks.length > 0) {
        // 文件夹标题
        const encodedFolderName = folderName
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        html += `        <DT><H3 ADD_DATE="${now}">${encodedFolderName}</H3>\n`;
        html += `        <DL><p>\n`;

        // 文件夹内的书签
        bookmarks.forEach(bookmark => {
          const timestamp = bookmark.created_at ?
            Math.floor(new Date(bookmark.created_at).getTime() / 1000) :
            now;
          const encodedUrl = bookmark.url.replace(/"/g, '%22');
          const encodedTitle = bookmark.title
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          const icon = `ICON_URI="${encodedUrl}/favicon.ico"`;

          html += `            <DT><A HREF="${encodedUrl}" ADD_DATE="${timestamp}" ${icon} ICON="">${encodedTitle}</A>\n`;
        });

        html += `        </DL><p>\n`;
      }
    }

    html += `    </DL><p>\n`;
    html += `</DL><p>\n`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bookmarks_${new Date().toISOString().split('T')[0]}.html"`);
    res.send(html);
  } catch (error) {
    next(error);
  }
});

// 导出密码为JSON（加密）
router.get('/passwords/export', async (req, res, next) => {
  try {
    const passwords = await db('passwords')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    // 解密密码数据
    const decryptedPasswords = passwords.map(password => ({
      ...decryptData(password.encrypted_data),
      created_at: password.created_at,
      updated_at: password.updated_at
    }));

    const exportData = {
      version: '1.0',
      export_date: new Date().toISOString(),
      user_email: req.user.email,
      passwords: decryptedPasswords,
      total_count: decryptedPasswords.length,
      note: '此文件包含敏感信息，请妥善保管'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="passwords_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

// 导入书签
router.post('/bookmarks/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要导入的文件' });
    }

    const fileContent = req.file.buffer.toString('utf8');
    let bookmarks = [];

    // 根据文件类型解析
    if (req.file.mimetype === 'application/json') {
      // JSON格式导入
      const data = JSON.parse(fileContent);
      bookmarks = data.bookmarks || data;
    } else if (req.file.originalname.endsWith('.html')) {
      // Chrome/Firefox书签HTML格式
      bookmarks = parseBookmarksHTML(fileContent);
    } else {
      return res.status(400).json({ error: '不支持的文件格式' });
    }

    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      return res.status(400).json({ error: '文件中没有找到有效的书签数据' });
    }

    // 批量插入书签
    let successCount = 0;
    let errorCount = 0;

    for (const bookmark of bookmarks) {
      try {
        // 验证必需字段
        if (!bookmark.title || !bookmark.url) {
          errorCount++;
          continue;
        }

        // 检查是否已存在相同URL的书签
        const existing = await db('bookmarks')
          .where({ user_id: req.user.id })
          .whereRaw("encrypted_data LIKE ?", [`%${bookmark.url}%`]);

        if (existing.length > 0) {
          errorCount++;
          continue;
        }

        // 准备书签数据
        const bookmarkData = {
          title: bookmark.title,
          url: bookmark.url,
          folder: bookmark.folder || '',
          tags: bookmark.tags || [],
          description: bookmark.description || ''
        };

        // 加密并插入
        const encryptedData = encryptData(bookmarkData);
        await db('bookmarks').insert({
          user_id: req.user.id,
          encrypted_data: encryptedData,
          created_at: new Date(),
          updated_at: new Date()
        });

        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    res.json({
      message: '书签导入完成',
      success_count: successCount,
      error_count: errorCount,
      total_processed: bookmarks.length
    });
  } catch (error) {
    next(error);
  }
});

// 导入密码
router.post('/passwords/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要导入的文件' });
    }

    const fileContent = req.file.buffer.toString('utf8');
    let passwords = [];

    // 根据文件类型解析
    if (req.file.mimetype === 'application/json') {
      // JSON格式导入
      const data = JSON.parse(fileContent);
      passwords = data.passwords || data;
    } else if (req.file.mimetype === 'text/csv') {
      // CSV格式导入
      passwords = parsePasswordsCSV(fileContent);
    } else {
      return res.status(400).json({ error: '不支持的文件格式' });
    }

    if (!Array.isArray(passwords) || passwords.length === 0) {
      return res.status(400).json({ error: '文件中没有找到有效的密码数据' });
    }

    // 批量插入密码
    let successCount = 0;
    let errorCount = 0;

    for (const password of passwords) {
      try {
        // 验证必需字段
        if (!password.site_name || !password.site_url || !password.username || !password.password) {
          errorCount++;
          continue;
        }

        // 检查是否已存在相同的密码记录
        const existing = await db('passwords')
          .where({ user_id: req.user.id })
          .whereRaw("encrypted_data LIKE ?", [`%${password.site_url}%`])
          .whereRaw("encrypted_data LIKE ?", [`%${password.username}%`]);

        if (existing.length > 0) {
          errorCount++;
          continue;
        }

        // 准备密码数据
        const passwordData = {
          site_name: password.site_name,
          site_url: password.site_url,
          username: password.username,
          password: password.password,
          category: password.category || '',
          notes: password.notes || ''
        };

        // 加密并插入
        const encryptedData = encryptData(passwordData);
        await db('passwords').insert({
          user_id: req.user.id,
          encrypted_data: encryptedData,
          created_at: new Date(),
          updated_at: new Date()
        });

        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    res.json({
      message: '密码导入完成',
      success_count: successCount,
      error_count: errorCount,
      total_processed: passwords.length
    });
  } catch (error) {
    next(error);
  }
});

// 解析Chrome/Firefox书签HTML
function parseBookmarksHTML(html) {
  const bookmarks = [];
  
  // 简单的HTML解析，提取<A>标签
  const linkRegex = /<A[^>]+HREF="([^"]+)"[^>]*>([^<]+)<\/A>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const title = match[2];
    
    if (url && title) {
      bookmarks.push({
        title: title.trim(),
        url: url.trim(),
        folder: '',
        tags: [],
        description: ''
      });
    }
  }
  
  return bookmarks;
}

// 解析密码CSV
function parsePasswordsCSV(csv) {
  const lines = csv.split('\n');
  const passwords = [];
  
  // 跳过标题行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 简单CSV解析（假设格式：site_name,site_url,username,password,category,notes）
    const fields = line.split(',').map(field => field.replace(/^"|"$/g, '').trim());
    
    if (fields.length >= 4) {
      passwords.push({
        site_name: fields[0] || '',
        site_url: fields[1] || '',
        username: fields[2] || '',
        password: fields[3] || '',
        category: fields[4] || '',
        notes: fields[5] || ''
      });
    }
  }
  
  return passwords;
}

module.exports = router;