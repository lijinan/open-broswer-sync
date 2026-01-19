const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPI() {
  console.log('🚀 开始API测试...');
  
  try {
    // 1. 测试健康检查
    console.log('\n1️⃣ 测试健康检查...');
    const health = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    });
    
    if (health.statusCode === 200) {
      console.log('✅ 健康检查通过:', health.data);
    } else {
      console.log('❌ 健康检查失败:', health.statusCode);
      return;
    }
    
    // 2. 测试用户注册
    console.log('\n2️⃣ 测试用户注册...');
    const testUser = {
      name: 'API测试用户',
      email: `apitest-${Date.now()}@example.com`,
      password: 'password123'
    };
    
    const register = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testUser);
    
    if (register.statusCode === 201) {
      console.log('✅ 用户注册成功:', register.data.user.name);
      const token = register.data.token;
      
      // 3. 测试创建书签
      console.log('\n3️⃣ 测试创建书签...');
      const bookmarkData = {
        title: 'API测试书签',
        url: 'https://api-test.example.com',
        folder: 'API测试',
        tags: ['测试', 'API'],
        description: '这是一个API测试书签'
      };
      
      const createBookmark = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/bookmarks',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }, bookmarkData);
      
      if (createBookmark.statusCode === 201) {
        console.log('✅ 书签创建成功:', createBookmark.data.bookmark.title);
      } else {
        console.log('❌ 书签创建失败:', createBookmark.statusCode, createBookmark.data);
      }
      
      // 4. 测试获取书签列表
      console.log('\n4️⃣ 测试获取书签列表...');
      const getBookmarks = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/bookmarks',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (getBookmarks.statusCode === 200) {
        console.log('✅ 获取书签列表成功，数量:', getBookmarks.data.bookmarks.length);
      } else {
        console.log('❌ 获取书签列表失败:', getBookmarks.statusCode);
      }
      
      // 5. 测试创建密码
      console.log('\n5️⃣ 测试创建密码...');
      const passwordData = {
        site_name: 'API测试网站',
        site_url: 'https://api-test-site.com',
        username: 'apitest',
        password: 'testPassword123!',
        category: 'API测试',
        notes: 'API测试密码'
      };
      
      const createPassword = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/passwords',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }, passwordData);
      
      if (createPassword.statusCode === 201) {
        console.log('✅ 密码创建成功:', createPassword.data.password.site_name);
      } else {
        console.log('❌ 密码创建失败:', createPassword.statusCode, createPassword.data);
      }
      
      // 6. 测试获取密码列表
      console.log('\n6️⃣ 测试获取密码列表...');
      const getPasswords = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/passwords',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (getPasswords.statusCode === 200) {
        console.log('✅ 获取密码列表成功，数量:', getPasswords.data.passwords.length);
      } else {
        console.log('❌ 获取密码列表失败:', getPasswords.statusCode);
      }
      
      console.log('\n🎉 所有API测试完成！');
      
    } else {
      console.log('❌ 用户注册失败:', register.statusCode, register.data);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
  }
}

testAPI();