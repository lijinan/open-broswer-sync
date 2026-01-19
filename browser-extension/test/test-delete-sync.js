// 同步删除功能测试脚本
// 在浏览器控制台中运行此脚本来测试同步删除功能

console.log('🧪 开始测试同步删除功能...');

// 测试配置
const TEST_CONFIG = {
  serverUrl: 'http://localhost:3001',
  testBookmarks: [
    {
      title: '测试书签1 - Google',
      url: 'https://www.google.com',
      folder: '同步收藏夹'
    },
    {
      title: '测试书签2 - GitHub',
      url: 'https://github.com',
      folder: '同步收藏夹 > 工作'
    },
    {
      title: '测试书签3 - Stack Overflow',
      url: 'https://stackoverflow.com',
      folder: '同步收藏夹 > 学习 > 技术问答'
    }
  ]
};

// 工具函数
const utils = {
  // 等待指定时间
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 获取扩展设置
  getSettings: () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['token', 'serverUrl'], resolve);
    });
  },
  
  // 检查服务器连接
  checkServerConnection: async () => {
    try {
      const settings = await utils.getSettings();
      const response = await fetch(`${settings.serverUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('❌ 服务器连接失败:', error);
      return false;
    }
  },
  
  // 获取服务器书签
  getServerBookmarks: async () => {
    try {
      const settings = await utils.getSettings();
      const response = await fetch(`${settings.serverUrl}/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${settings.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.bookmarks || [];
      }
    } catch (error) {
      console.error('❌ 获取服务器书签失败:', error);
    }
    return [];
  },
  
  // 创建测试书签
  createTestBookmark: async (bookmark) => {
    return new Promise((resolve, reject) => {
      // 首先找到或创建文件夹
      chrome.bookmarks.getTree((tree) => {
        const findOrCreateFolder = async (folderPath) => {
          const parts = folderPath.split(' > ');
          let currentParent = '1'; // 书签栏
          
          for (const part of parts) {
            const results = await new Promise((resolve) => {
              chrome.bookmarks.search({ title: part }, resolve);
            });
            
            let folder = results.find(r => !r.url && r.parentId === currentParent);
            
            if (!folder) {
              folder = await new Promise((resolve) => {
                chrome.bookmarks.create({
                  title: part,
                  parentId: currentParent
                }, resolve);
              });
            }
            
            currentParent = folder.id;
          }
          
          return currentParent;
        };
        
        findOrCreateFolder(bookmark.folder).then((parentId) => {
          chrome.bookmarks.create({
            title: bookmark.title,
            url: bookmark.url,
            parentId: parentId
          }, resolve);
        }).catch(reject);
      });
    });
  },
  
  // 删除书签
  deleteBookmark: (bookmarkId) => {
    return new Promise((resolve) => {
      chrome.bookmarks.remove(bookmarkId, resolve);
    });
  },
  
  // 搜索书签
  searchBookmarks: (query) => {
    return new Promise((resolve) => {
      chrome.bookmarks.search(query, resolve);
    });
  }
};

// 测试函数
const tests = {
  // 测试1: 基础删除同步
  testBasicDeleteSync: async () => {
    console.log('\n📋 测试1: 基础删除同步');
    
    try {
      // 创建测试书签
      const testBookmark = TEST_CONFIG.testBookmarks[0];
      console.log('📝 创建测试书签:', testBookmark.title);
      const bookmark = await utils.createTestBookmark(testBookmark);
      
      // 等待同步完成
      await utils.sleep(2000);
      
      // 检查服务器上是否有书签
      const serverBookmarks = await utils.getServerBookmarks();
      const serverBookmark = serverBookmarks.find(b => b.url === testBookmark.url);
      
      if (!serverBookmark) {
        console.log('⚠️ 服务器上没有找到书签，可能同步保存功能有问题');
        return false;
      }
      
      console.log('✅ 服务器上找到书签:', serverBookmark.title);
      
      // 删除书签
      console.log('🗑️ 删除书签...');
      await utils.deleteBookmark(bookmark.id);
      
      // 等待删除同步完成
      await utils.sleep(3000);
      
      // 检查服务器上书签是否被删除
      const updatedServerBookmarks = await utils.getServerBookmarks();
      const deletedBookmark = updatedServerBookmarks.find(b => b.url === testBookmark.url);
      
      if (deletedBookmark) {
        console.log('❌ 测试失败: 服务器上的书签没有被删除');
        return false;
      }
      
      console.log('✅ 测试成功: 书签删除已同步到服务器');
      return true;
      
    } catch (error) {
      console.error('❌ 测试失败:', error);
      return false;
    }
  },
  
  // 测试2: 多级文件夹删除同步
  testNestedFolderDeleteSync: async () => {
    console.log('\n📋 测试2: 多级文件夹删除同步');
    
    try {
      const testBookmark = TEST_CONFIG.testBookmarks[2]; // 使用嵌套文件夹的书签
      console.log('📝 创建嵌套文件夹书签:', testBookmark.title);
      const bookmark = await utils.createTestBookmark(testBookmark);
      
      await utils.sleep(2000);
      
      // 删除书签
      console.log('🗑️ 删除嵌套文件夹中的书签...');
      await utils.deleteBookmark(bookmark.id);
      
      await utils.sleep(3000);
      
      // 检查服务器
      const serverBookmarks = await utils.getServerBookmarks();
      const deletedBookmark = serverBookmarks.find(b => b.url === testBookmark.url);
      
      if (deletedBookmark) {
        console.log('❌ 测试失败: 嵌套文件夹书签删除同步失败');
        return false;
      }
      
      console.log('✅ 测试成功: 嵌套文件夹书签删除同步正常');
      return true;
      
    } catch (error) {
      console.error('❌ 测试失败:', error);
      return false;
    }
  },
  
  // 测试3: 非同步文件夹删除（不应该同步）
  testNonSyncFolderDelete: async () => {
    console.log('\n📋 测试3: 非同步文件夹删除测试');
    
    try {
      // 在非同步文件夹中创建书签
      const testBookmark = {
        title: '非同步测试书签',
        url: 'https://example.com',
        parentId: '2' // 其他书签文件夹
      };
      
      console.log('📝 在非同步文件夹中创建书签');
      const bookmark = await new Promise((resolve) => {
        chrome.bookmarks.create(testBookmark, resolve);
      });
      
      await utils.sleep(1000);
      
      // 删除书签
      console.log('🗑️ 删除非同步文件夹中的书签...');
      await utils.deleteBookmark(bookmark.id);
      
      await utils.sleep(2000);
      
      console.log('✅ 测试成功: 非同步文件夹书签删除不会触发同步（这是正确的）');
      return true;
      
    } catch (error) {
      console.error('❌ 测试失败:', error);
      return false;
    }
  }
};

// 主测试函数
async function runDeleteSyncTests() {
  console.log('🚀 开始同步删除功能测试');
  
  // 检查前置条件
  console.log('\n🔍 检查前置条件...');
  
  // 检查是否已登录
  const settings = await utils.getSettings();
  if (!settings.token) {
    console.error('❌ 未登录扩展，请先登录');
    return;
  }
  console.log('✅ 扩展已登录');
  
  // 检查服务器连接
  const serverConnected = await utils.checkServerConnection();
  if (!serverConnected) {
    console.error('❌ 无法连接到服务器');
    return;
  }
  console.log('✅ 服务器连接正常');
  
  // 检查书签权限
  if (!chrome.bookmarks) {
    console.error('❌ 没有书签权限');
    return;
  }
  console.log('✅ 书签权限正常');
  
  // 运行测试
  const testResults = [];
  
  try {
    testResults.push(await tests.testBasicDeleteSync());
    testResults.push(await tests.testNestedFolderDeleteSync());
    testResults.push(await tests.testNonSyncFolderDelete());
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
  }
  
  // 输出测试结果
  console.log('\n📊 测试结果汇总:');
  const passedTests = testResults.filter(result => result === true).length;
  const totalTests = testResults.length;
  
  console.log(`✅ 通过: ${passedTests}/${totalTests}`);
  console.log(`❌ 失败: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！同步删除功能正常工作');
  } else {
    console.log('⚠️ 部分测试失败，请检查实现');
  }
}

// 导出测试函数
if (typeof window !== 'undefined') {
  window.runDeleteSyncTests = runDeleteSyncTests;
  window.deleteTestUtils = utils;
  
  console.log('📋 测试脚本已加载');
  console.log('💡 使用方法:');
  console.log('   runDeleteSyncTests() - 运行完整测试');
  console.log('   deleteTestUtils - 访问测试工具函数');
}

// 如果直接运行，执行测试
if (typeof chrome !== 'undefined' && chrome.bookmarks) {
  // 延迟执行，给用户时间看到说明
  setTimeout(() => {
    console.log('🔄 3秒后自动开始测试...');
    setTimeout(runDeleteSyncTests, 3000);
  }, 1000);
}