const fetch = require('node-fetch');

async function testLogin() {
  const serverUrl = 'http://localhost:3001';
  
  console.log('🧪 测试后端登录功能');
  console.log('服务器地址:', serverUrl);
  
  try {
    // 测试健康检查
    console.log('\n1. 测试健康检查...');
    const healthResponse = await fetch(`${serverUrl}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ 健康检查通过:', healthData);
    } else {
      console.log('❌ 健康检查失败:', healthResponse.status);
      return;
    }
    
    // 测试用户名登录
    console.log('\n2. 测试用户名登录...');
    const loginResponse = await fetch(`${serverUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'leon',
        password: '123456'
      })
    });
    
    console.log('登录响应状态:', loginResponse.status);
    console.log('登录响应头:', Object.fromEntries(loginResponse.headers.entries()));
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ 用户名登录成功:', {
        message: loginData.message,
        user: loginData.user,
        tokenLength: loginData.token ? loginData.token.length : 0
      });
      
      // 测试token验证
      console.log('\n3. 测试token验证...');
      const verifyResponse = await fetch(`${serverUrl}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('✅ Token验证成功:', verifyData);
      } else {
        console.log('❌ Token验证失败:', verifyResponse.status);
      }
      
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ 用户名登录失败:', errorText);
    }
    
    // 测试邮箱登录
    console.log('\n4. 测试邮箱登录...');
    const emailLoginResponse = await fetch(`${serverUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'leon@test.com',
        password: '123456'
      })
    });
    
    if (emailLoginResponse.ok) {
      const emailLoginData = await emailLoginResponse.json();
      console.log('✅ 邮箱登录成功:', {
        message: emailLoginData.message,
        user: emailLoginData.user
      });
    } else {
      const errorText = await emailLoginResponse.text();
      console.log('❌ 邮箱登录失败:', errorText);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
  }
}

testLogin();