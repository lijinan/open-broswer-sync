// 扩展内测试页面的JavaScript代码
let debugLog = [];

function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    debugLog.push(logMessage);
    
    // 更新页面显示
    const debugInfo = document.getElementById('debugInfo');
    if (debugInfo) {
        debugInfo.innerHTML = debugLog.slice(-20).join('<br>');
    }
    
    // 同时输出到控制台
    console.log(logMessage);
}

function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
    }
}

function clearLog() {
    debugLog = [];
    const debugInfo = document.getElementById('debugInfo');
    if (debugInfo) {
        debugInfo.innerHTML = '日志已清空';
    }
}

function exportLog() {
    const logText = debugLog.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `password-test-log-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function fillTestData() {
    const usernameEl = document.getElementById('username');
    const passwordEl = document.getElementById('password');
    
    if (usernameEl && passwordEl) {
        usernameEl.value = 'extension-test@example.com';
        passwordEl.value = 'extensionpass123';
        log('✅ 测试数据已填充');
        updateStatus('测试数据已填充', 'success');
    }
}

function handleSubmit(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    log('📝 扩展内表单提交:');
    log(`  用户名: ${username}`);
    log(`  密码长度: ${password.length}`);
    log('  环境: 扩展内页面');
    log('  URL: ' + window.location.href);
    
    updateStatus('表单已提交，等待扩展处理...', 'info');
    
    // 模拟延迟，让扩展有时间处理
    setTimeout(() => {
        log('⏰ 表单提交处理完成');
        updateStatus('表单提交完成，请查看控制台日志', 'success');
    }, 2000);
}

async function testExtensionAPI() {
    log('🔍 测试扩展API...');
    
    try {
        // 检查扩展API
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            log('✅ Chrome扩展API可用');
            log('📋 扩展ID: ' + chrome.runtime.id);
            log('📋 扩展URL: ' + chrome.runtime.getURL(''));
            
            // 测试与background script的通信
            chrome.runtime.sendMessage({type: 'GET_SETTINGS'}, (response) => {
                if (chrome.runtime.lastError) {
                    log('❌ 与background script通信失败: ' + chrome.runtime.lastError.message);
                    updateStatus('扩展通信失败', 'error');
                } else {
                    log('✅ 与background script通信成功');
                    log('📋 扩展设置: ' + JSON.stringify(response, null, 2));
                    
                    if (response && response.token) {
                        log('✅ 扩展已登录');
                        updateStatus('扩展状态正常，已登录', 'success');
                    } else {
                        log('⚠️ 扩展未登录');
                        updateStatus('扩展未登录，请先登录扩展', 'warning');
                    }
                }
            });
        } else if (typeof browser !== 'undefined' && browser.runtime) {
            log('✅ Firefox扩展API可用');
            updateStatus('Firefox扩展连接正常', 'success');
        } else {
            log('❌ 扩展API不可用');
            updateStatus('扩展API不可用', 'error');
        }
    } catch (error) {
        log('❌ 测试扩展API失败: ' + error.message);
        updateStatus('测试失败', 'error');
    }
}

async function testPasswordSave() {
    log('🔐 手动测试密码保存...');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        log('❌ 请先填写用户名和密码');
        updateStatus('请先填写表单数据', 'warning');
        return;
    }
    
    try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            log('📤 发送密码保存请求到background script...');
            
            chrome.runtime.sendMessage({
                type: 'SAVE_PASSWORD_TO_SERVER',
                data: {
                    site_name: '扩展内测试',
                    site_url: window.location.origin,
                    username: username,
                    password: password,
                    category: '扩展测试',
                    notes: `扩展内测试 - ${new Date().toLocaleString()}`
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    log('❌ 密码保存通信失败: ' + chrome.runtime.lastError.message);
                    updateStatus('密码保存失败', 'error');
                } else {
                    log('📥 收到密码保存响应: ' + JSON.stringify(response));
                    
                    if (response && response.success) {
                        log('✅ 密码保存成功！');
                        updateStatus('密码保存成功！', 'success');
                    } else {
                        log('❌ 密码保存失败: ' + (response?.error || '未知错误'));
                        updateStatus('密码保存失败: ' + (response?.error || '未知错误'), 'error');
                    }
                }
            });
        } else {
            log('❌ 扩展API不可用');
            updateStatus('扩展API不可用', 'error');
        }
    } catch (error) {
        log('❌ 手动密码保存失败: ' + error.message);
        updateStatus('测试失败', 'error');
    }
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    log('📄 扩展内页面加载完成');
    log('🌐 当前URL: ' + window.location.href);
    
    // 检查是否在扩展环境中
    if (window.location.protocol === 'chrome-extension:' || window.location.protocol === 'moz-extension:') {
        log('✅ 确认在扩展环境中');
        updateStatus('扩展环境已确认', 'success');
    } else {
        log('⚠️ 可能不在扩展环境中');
        updateStatus('环境检查异常', 'warning');
    }
    
    // 绑定事件处理器
    const testForm = document.getElementById('testForm');
    if (testForm) {
        testForm.addEventListener('submit', handleSubmit);
    }
    
    const fillDataBtn = document.querySelector('button[data-action="fillTestData"]');
    if (fillDataBtn) {
        fillDataBtn.addEventListener('click', fillTestData);
    }
    
    const testAPIBtn = document.querySelector('button[data-action="testExtensionAPI"]');
    if (testAPIBtn) {
        testAPIBtn.addEventListener('click', testExtensionAPI);
    }
    
    const testPasswordBtn = document.querySelector('button[data-action="testPasswordSave"]');
    if (testPasswordBtn) {
        testPasswordBtn.addEventListener('click', testPasswordSave);
    }
    
    const clearLogBtn = document.querySelector('button[data-action="clearLog"]');
    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', clearLog);
    }
    
    const exportLogBtn = document.querySelector('button[data-action="exportLog"]');
    if (exportLogBtn) {
        exportLogBtn.addEventListener('click', exportLog);
    }
    
    // 监听密码输入
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function(event) {
            if (event.target.value.length > 0) {
                log(`🔑 检测到密码输入，长度: ${event.target.value.length}`);
            }
        });
    }
    
    // 监听来自content script的消息
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'PASSWORD_MANAGER_LOG') {
            log('Content Script: ' + event.data.message);
        }
    });
    
    // 自动检查扩展状态
    setTimeout(() => {
        testExtensionAPI();
    }, 500);
});