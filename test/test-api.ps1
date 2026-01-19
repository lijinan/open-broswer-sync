# API测试脚本
Write-Host "🧪 开始API测试..." -ForegroundColor Green

# 测试健康检查
Write-Host "`n1. 测试健康检查..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
    $healthData = $health.Content | ConvertFrom-Json
    Write-Host "✅ 健康检查通过: $($healthData.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ 健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试用户注册
Write-Host "`n2. 测试用户注册..." -ForegroundColor Yellow
$registerData = @{
    name = "测试用户"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $register = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/register" -Method POST -Body $registerData -ContentType "application/json" -UseBasicParsing
    $registerResult = $register.Content | ConvertFrom-Json
    $token = $registerResult.token
    Write-Host "✅ 用户注册成功: $($registerResult.user.name)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "ℹ️ 用户已存在，尝试登录..." -ForegroundColor Blue
        
        # 尝试登录
        $loginData = @{
            email = "test@example.com"
            password = "password123"
        } | ConvertTo-Json
        
        try {
            $login = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
            $loginResult = $login.Content | ConvertFrom-Json
            $token = $loginResult.token
            Write-Host "✅ 用户登录成功: $($loginResult.user.name)" -ForegroundColor Green
        } catch {
            Write-Host "❌ 登录失败: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ 注册失败: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 测试创建书签
Write-Host "`n3. 测试创建书签..." -ForegroundColor Yellow
$bookmarkData = @{
    title = "Google"
    url = "https://www.google.com"
    folder = "搜索引擎"
    tags = @("搜索", "工具")
    description = "谷歌搜索引擎"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $bookmark = Invoke-WebRequest -Uri "http://localhost:3001/api/bookmarks" -Method POST -Body $bookmarkData -Headers $headers -UseBasicParsing
    $bookmarkResult = $bookmark.Content | ConvertFrom-Json
    Write-Host "✅ 书签创建成功: $($bookmarkResult.bookmark.title)" -ForegroundColor Green
} catch {
    Write-Host "❌ 书签创建失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试获取书签列表
Write-Host "`n4. 测试获取书签列表..." -ForegroundColor Yellow
try {
    $bookmarks = Invoke-WebRequest -Uri "http://localhost:3001/api/bookmarks" -Headers $headers -UseBasicParsing
    $bookmarksResult = $bookmarks.Content | ConvertFrom-Json
    Write-Host "✅ 获取书签列表成功，共 $($bookmarksResult.bookmarks.Count) 个书签" -ForegroundColor Green
} catch {
    Write-Host "❌ 获取书签列表失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试创建密码
Write-Host "`n5. 测试创建密码..." -ForegroundColor Yellow
$passwordData = @{
    site_name = "GitHub"
    site_url = "https://github.com"
    username = "testuser"
    password = "mypassword123"
    notes = "开发账号"
    category = "开发工具"
} | ConvertTo-Json

try {
    $password = Invoke-WebRequest -Uri "http://localhost:3001/api/passwords" -Method POST -Body $passwordData -Headers $headers -UseBasicParsing
    $passwordResult = $password.Content | ConvertFrom-Json
    Write-Host "✅ 密码创建成功: $($passwordResult.password.site_name)" -ForegroundColor Green
} catch {
    Write-Host "❌ 密码创建失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试获取密码列表
Write-Host "`n6. 测试获取密码列表..." -ForegroundColor Yellow
try {
    $passwords = Invoke-WebRequest -Uri "http://localhost:3001/api/passwords" -Headers $headers -UseBasicParsing
    $passwordsResult = $passwords.Content | ConvertFrom-Json
    Write-Host "✅ 获取密码列表成功，共 $($passwordsResult.passwords.Count) 个密码" -ForegroundColor Green
} catch {
    Write-Host "❌ 获取密码列表失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 API测试完成！" -ForegroundColor Green
Write-Host "`n📱 现在可以访问前端应用: http://localhost:3002" -ForegroundColor Cyan
Write-Host "📧 测试账号: test@example.com" -ForegroundColor Cyan
Write-Host "🔑 测试密码: password123" -ForegroundColor Cyan