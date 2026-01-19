// 调试同步删除功能的脚本
// 在浏览器扩展的后台页面控制台中运行

console.log('🔍 开始调试同步删除功能...');

// 调试工具
const debugTools = {
  // 检查扩展状态
  checkExtensionStatus: async () => {
    console.log('\n📋 检查扩展状态:');
    
    // 检查设置
    const settings = await chrome.storage.sync.get();
    console.log('扩展设置:', settings);
    
    // 检查登录状态
    if (settings.token) {
      console.log('✅ 已登录');
      console.log('服务器地址:', settings.serverUrl);
    } else {
      console.log('❌ 未登录');
    }
    
    // 检查调试模式
    if (settings.debugMode) {
      console.log('✅ 调试模式已开启');
    } else {
      console.log('⚠️ 调试模式未开启');
      console.log('💡 建议开启调试模式: chrome.storage.sync.set({debugMode: true})');
    }
    
    return settings;
  },
  
  // 检查书签API
  checkBookmarksAPI: () => {
    console.log('\n📋 检查书签API:');
    
    if (chrome.bookmarks) {
      console.log('✅ 书签API可用');
      
      // 检查事件监听器
      console.log('检查事件监听器...');
      
      // 临时添加测试监听器
      const testListener = (id, removeInfo) => {
        console.log('🔔 测试监听器触发 - 书签删除:', { id, removeInfo });
      };
      
      chrome.bookmarks.onRemoved.addListener(testListener);
      console.log('✅ 测试监听器已添加');
      
      // 5秒后移除测试监听器
      setTimeout(() => {
        chrome.bookmarks.onRemoved.removeListener(testListener);
        console.log('🗑️ 测试监听器已移除');
      }, 5000);
      
    } else {
      console.log('❌ 书签API不可用');
    }
  },
  
  // 检查同步收藏夹
  checkSyncFolder: async () => {
    console.log('\n📋 检查同步收藏夹:');
    
    try {
      const bookmarks = await new Promise((resolve) => {
        chrome.bookmarks.search({ title: '同步收藏夹' }, resolve);
      });
      
      if (bookmarks.length > 0) {
        console.log('✅ 找到同步收藏夹:', bookmarks.length, '个');
        bookmarks.forEach((bookmark, index) => {
          console.log(`  ${index + 1}. ID: ${bookmark.id}, 父级: ${bookmark.parentId}, 标题: "${bookmark.title}"`);
        });
      } else {
        console.log('❌ 未找到同步收藏夹');
        console.log('💡 请先创建"同步收藏夹"文件夹');
      }
      
      return bookmarks;
    } catch (error) {
      console.error('❌ 检查同步收藏夹失败:', error);
      return [];
    }
  },
  
  // 测试服务器连接
  testServerConnection: async () => {
    console.log('\n📋 测试服务器连接:');
    
    try {
      const settings = await chrome.storage.sync.get(['token', 'serverUrl']);
      
      if (!settings.serverUrl) {
        console.log('❌ 服务器地址未配置');
        return false;
      }
      
      console.log('测试服务器:', settings.serverUrl);
      
      // 测试健康检查
      const healthResponse = await fetch(`${settings.serverUrl}/health`);
      if (healthResponse.ok) {
        console.log('✅ 服务器健康检查通过');
      } else {
        console.log('❌ 服务器健康检查失败');
      }
      
      // 测试认证
      if (settings.token) {
        const authResponse = await fetch(`${settings.serverUrl}/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${settings.token}`
          }
        });
        
        if (authResponse.ok) {
          const userData = await authResponse.json();
          console.log('✅ 用户认证通过:', userData.user.name);
        } else {
          console.log('❌ 用户认证失败');
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ 服务器连接测试失败:', error);
      return false;
    }
  },
  
  // 测试书签搜索API
  testBookmarkSearchAPI: async (testUrl = 'https://www.google.com') => {
    console.log('\n📋 测试书签搜索API:');
    
    try {
      const settings = await chrome.storage.sync.get(['token', 'serverUrl']);
      
      if (!settings.token) {
        console.log('❌ 未登录，无法测试API');
        return null;
      }
      
      console.log('搜索URL:', testUrl);
      
      const response = await fetch(`${settings.serverUrl}/bookmarks/search?url=${encodeURIComponent(testUrl)}`, {
        headers: {
          'Authorization': `Bearer ${settings.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 搜索API正常');
        console.log('搜索结果:', data.bookmarks);
        return data.bookmarks;
      } else {
        console.log('❌ 搜索API失败:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('❌ 搜索API测试失败:', error);
      return null;
    }
  },
  
  // 创建测试书签
  createTestBookmark: async () => {
    console.log('\n📋 创建测试书签:');
    
    try {
      // 先找到同步收藏夹
      const syncFolders = await new Promise((resolve) => {
        chrome.bookmarks.search({ title: '同步收藏夹' }, resolve);
      });
      
      if (syncFolders.length === 0) {
        console.log('❌ 未找到同步收藏夹，请先创建');
        return null;
      }
      
      const syncFolder = syncFolders[0];
      console.log('使用同步收藏夹:', syncFolder.id);
      
      // 创建测试书签
      const testBookmark = await new Promise((resolve) => {
        chrome.bookmarks.create({
          title: '测试书签 - ' + Date.now(),
          url: 'https://example.com/test-' + Date.now(),
          parentId: syncFolder.id
        }, resolve);
      });
      
      console.log('✅ 测试书签已创建:', testBookmark);
      return testBookmark;
      
    } catch (error) {
      console.error('❌ 创建测试书签失败:', error);
      return null;
    }
  },
  
  // 删除测试书签
  deleteTestBookmark: async (bookmarkId) => {
    console.log('\n📋 删除测试书签:');
    
    try {
      await new Promise((resolve) => {
        chrome.bookmarks.remove(bookmarkId, resolve);
      });
      
      console.log('✅ 测试书签已删除:', bookmarkId);
      console.log('⏳ 等待同步删除事件...');
      
    } catch (error) {
      console.error('❌ 删除测试书签失败:', error);
    }
  },
  
  // 完整测试流程
  runFullTest: async () => {
    console.log('🚀 开始完整测试流程...');
    
    // 1. 检查扩展状态
    const settings = await debugTools.checkExtensionStatus();
    
    // 2. 检查书签API
    debugTools.checkBookmarksAPI();
    
    // 3. 检查同步收藏夹
    await debugTools.checkSyncFolder();
    
    // 4. 测试服务器连接
    await debugTools.testServerConnection();
    
    // 5. 测试搜索API
    await debugTools.testBookmarkSearchAPI();
    
    // 6. 如果一切正常，进行实际测试
    if (settings.token) {
      console.log('\n🧪 开始实际删除测试...');
      
      // 创建测试书签
      const testBookmark = await debugTools.createTestBookmark();
      
      if (testBookmark) {
        console.log('⏳ 等待3秒后删除测试书签...');
        setTimeout(async () => {
          await debugTools.deleteTestBookmark(testBookmark.id);
        }, 3000);
      }
    }
  }
};

// 开启调试模式
chrome.storage.sync.set({ debugMode: true }, () => {
  console.log('✅ 调试模式已开启');
});

// 导出调试工具
window.debugDeleteSync = debugTools;

console.log('📋 调试工具已加载');
console.log('💡 使用方法:');
console.log('   debugDeleteSync.runFullTest() - 运行完整测试');
console.log('   debugDeleteSync.checkExtensionStatus() - 检查扩展状态');
console.log('   debugDeleteSync.checkBookmarksAPI() - 检查书签API');
console.log('   debugDeleteSync.testServerConnection() - 测试服务器连接');

// 自动运行完整测试
setTimeout(() => {
  console.log('🔄 3秒后自动开始完整测试...');
  setTimeout(() => {
    debugTools.runFullTest();
  }, 3000);
}, 1000);