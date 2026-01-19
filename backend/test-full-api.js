const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testFullAPI() {
  console.log('🚀 开始完整API测试...');
  
  try {
    // 1. 测试健康检查
    console.log('\n1️⃣ 测试健康检查...');
    const health = await axios.get('http://localhost:3001/health');
    console.log('✅ 健康检查通过:', health.data);
    
    // 2. 测试用户注册
    console.log('\n2️⃣ 测试用户注册...');
    const testUser = {
      name: '完整测试用户',
      email: `test-${Date.now()}@example.com`,
      password: 'password123'
    };
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
    console.log('✅ 用户注册成功:', registerResponse.data.user);
    
    const token = registerResponse.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    
    // 3. 测试获取用户信息
    console.log('\n3️⃣ 测试获取用户信息...');
    const userInfo = await axios.get(`${API_BASE}/auth/me`, { headers: authHeaders });
    console.log('✅ 获取用户信息成功:', userInfo.data.user);
    
    // 4. 测试创建书签
    console.log('\n4️⃣ 测试创建书签...');
    const bookmarkData = {
      title: 'GitHub',
      url: 'https://github.com',
      folder: '开发工具',
      tags: ['代码', '开发', 'Git'],
      description: '全球最大的代码托管平台'
    };
    
    const createBookmark = await axios.post(`${API_BASE}/bookmarks`, bookmarkData, { headers: authHeaders });
    console.log('✅ 书签创建成功:', createBookmark.data.bookmark);
    
    const bookmarkId = createBookmark.data.bookmark.id;
    
    // 5. 测试获取书签列表
    console.log('\n5️⃣ 测试获取书签列表...');
    const bookmarks = await axios.get(`${API_BASE}/bookmarks`, { headers: authHeaders });
    console.log('✅ 获取书签列表成功，数量:', bookmarks.data.bookmarks.length);
    
    // 6. 测试搜索书签
    console.log('\n6️⃣ 测试搜索书签...');
    const searchBookmarks = await axios.get(`${API_BASE}/bookmarks/search?q=GitHub`, { headers: authHeaders });
    console.log('✅ 搜索书签成功，找到:', searchBookmarksResult.data.bookmarks.length, '个结果');
    
    // 7. 测试创建密码
    console.log('\n7️⃣ 测试创建密码...');
    const passwordData = {
      site_name: 'GitHub',
      site_url: 'https://github.com',
      username: 'testuser123',
      password: 'mySecretPassword123!',
      category: '开发工具',
      notes: '我的GitHub开发账号'
    };
    
    const createPassword = await axios.post(`${API_BASE}/passwords`, passwordData, { headers: authHeaders });
    console.log('✅ 密码创建成功:', createPassword.data.password);
    
    const passwordId = createPassword.data.password.id;
    
    // 8. 测试获取密码列表
    console.log('\n8️⃣ 测试获取密码列表...');
    const passwords = await axios.get(`${API_BASE}/passwords`, { headers: authHeaders });
    console.log('✅ 获取密码列表成功，数量:', passwords.data.passwords.length);
    
    // 9. 测试获取特定密码详情
    console.log('\n9️⃣ 测试获取密码详情...');
    const passwordDetail = await axios.get(`${API_BASE}/passwords/${passwordId}`, { headers: authHeaders });
    console.log('✅ 获取密码详情成功:', passwordDetail.data.password.site_name);
    
    // 10. 测试更新书签
    console.log('\n🔟 测试更新书签...');
    const updatedBookmarkData = {
      ...bookmarkData,
      title: 'GitHub - 更新版',
      description: '全球最大的代码托管平台 - 已更新'
    };
    
    const updateBookmark = await axios.put(`${API_BASE}/bookmarks/${bookmarkId}`, updatedBookmarkData, { headers: authHeaders });
    console.log('✅ 书签更新成功:', updateBookmark.data.bookmark.title);
    
    console.log('\n🎉 所有API测试通过！应用功能完全正常。');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 检查后端服务是否运行
async function checkBackendStatus() {
  try {
    await axios.get('http://localhost:3001/health');
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const isBackendRunning = await checkBackendStatus();
  
  if (!isBackendRunning) {
    console.log('❌ 后端服务未运行，请先启动后端服务');
    console.log('💡 运行命令: npm run dev (在backend目录中)');
    return;
  }
  
  await testFullAPI();
}

main();