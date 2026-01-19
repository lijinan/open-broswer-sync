const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 模拟旧版本JWT token (只有userId)
function createOldJWT() {
  return jwt.sign(
    { userId: 1 }, // 旧版本只有userId
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// 模拟新版本JWT token (包含完整用户信息)
function createNewJWT() {
  return jwt.sign(
    { 
      id: 1,
      userId: 1,
      name: 'Leon Test User',
      email: 'leon@example.com'
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function testWebSocketConnection(tokenType) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 测试${tokenType}JWT token的WebSocket连接...`);
    
    const token = tokenType === '新版本' ? createNewJWT() : createOldJWT();
    const wsUrl = `ws://localhost:3001/ws?token=${token}`;
    
    console.log(`🔗 连接地址: ${wsUrl.substring(0, 50)}...`);
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log('✅ WebSocket连接成功');
      
      // 发送测试消息
      ws.send(JSON.stringify({
        type: 'ping',
        message: `${tokenType}JWT测试`
      }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log(`📨 收到消息: ${message.type}`);
      
      if (message.type === 'connection') {
        console.log(`🔗 连接状态: ${message.status}`);
        if (message.user) {
          console.log(`👤 用户信息: ID=${message.user.id}, 名称=${message.user.name}, 邮箱=${message.user.email}`);
        }
      } else if (message.type === 'pong') {
        console.log('💓 心跳响应正常');
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket连接关闭: ${code} - ${reason}`);
      resolve({ success: code === 1000, code, reason });
    });
    
    ws.on('error', (error) => {
      console.log(`❌ WebSocket错误: ${error.message}`);
      reject(error);
    });
    
    // 5秒后关闭连接
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, '测试完成');
      }
    }, 5000);
  });
}

async function runTests() {
  try {
    console.log('🚀 开始WebSocket用户信息测试...');
    
    // 测试旧版本JWT token
    await testWebSocketConnection('旧版本');
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试新版本JWT token
    await testWebSocketConnection('新版本');
    
    console.log('\n🎉 所有测试完成！');
    console.log('💡 请检查后台日志，确认用户信息显示正确');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    process.exit(0);
  }
}

runTests();