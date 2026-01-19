# 📋 项目级测试文件

这个目录包含项目级别的测试文件和测试数据。

## 📁 文件说明

### API测试
- **test-api.ps1** - PowerShell API测试脚本，用于测试后端API接口

### 测试数据文件
- **test-bookmarks.json** - 书签测试数据，包含各种格式的书签用于导入测试
- **test-passwords.csv** - 密码测试数据，CSV格式的密码信息用于导入测试
- **test-chrome-bookmarks.html** - Chrome书签导出格式的测试文件
- **test-import-export.js** - 导入导出功能的测试脚本

## 🧪 使用方法

### API测试
```powershell
# 运行API测试
.\test\test-api.ps1
```

### 导入导出测试
1. 使用测试数据文件进行导入功能测试
2. 验证导出功能是否正确生成文件
3. 检查数据格式兼容性

## 📝 注意事项

- 这些文件仅用于测试目的
- 测试数据不包含真实的敏感信息
- 运行测试前请确保后端服务已启动

## 🔗 相关测试

- **浏览器扩展测试**: 请查看 `browser-extension/test/` 目录
- **后端测试**: 请查看 `backend/test-*.js` 文件