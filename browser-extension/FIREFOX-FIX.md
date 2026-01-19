# 🦊 Firefox安装错误修复

## ❌ 错误信息
```
background.service_worker is currently disabled. Add background.scripts.
```

## 🔍 问题原因
Firefox检测到了Chrome的Manifest V3格式（service_worker），但Firefox需要Manifest V2格式（scripts）。

## ✅ 解决方案

### 方法1：使用正确的manifest文件
现在 `manifest.json` 已经被设置为Firefox版本，可以直接安装：

1. 打开Firefox
2. 地址栏输入：`about:debugging`
3. 点击"此Firefox"
4. 点击"临时载入附加组件"
5. 选择 `browser-extension` 文件夹中的 `manifest.json`
6. 点击"打开"

### 方法2：使用专用文件
如果上面的方法不行，直接选择Firefox专用文件：

1. 在文件选择对话框中
2. 选择 `manifest-firefox.json` 文件
3. 点击"打开"

## 📁 文件说明

- `manifest.json` - 当前设置为Firefox版本
- `manifest-firefox.json` - Firefox专用版本
- `manifest-chrome.json` - Chrome专用版本

## 🔄 切换浏览器

### 切换到Chrome
如果要在Chrome中安装，需要恢复Chrome版本：
```bash
copy manifest-chrome.json manifest.json
```

### 切换到Firefox  
如果要在Firefox中安装，使用Firefox版本：
```bash
copy manifest-firefox.json manifest.json
```

## 🧪 验证安装

安装成功后应该看到：
- ✅ 扩展出现在临时扩展列表中
- ✅ 浏览器工具栏显示扩展图标
- ✅ 点击图标显示扩展弹窗
- ✅ 没有错误信息

## 🚀 现在就试试！

当前配置已经是Firefox版本，直接按照上面的步骤安装即可！