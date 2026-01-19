// 测试导入导出功能的示例数据

// 示例书签JSON文件内容
const sampleBookmarks = {
  "version": "1.0",
  "export_date": "2026-01-17T04:15:00.000Z",
  "bookmarks": [
    {
      "title": "GitHub",
      "url": "https://github.com",
      "folder": "开发工具",
      "tags": ["代码", "开发", "Git"],
      "description": "全球最大的代码托管平台"
    },
    {
      "title": "Stack Overflow",
      "url": "https://stackoverflow.com",
      "folder": "开发工具",
      "tags": ["问答", "编程", "技术"],
      "description": "程序员问答社区"
    },
    {
      "title": "MDN Web Docs",
      "url": "https://developer.mozilla.org",
      "folder": "文档",
      "tags": ["文档", "Web", "JavaScript"],
      "description": "Web开发文档"
    }
  ]
};

// 示例密码CSV文件内容
const samplePasswordsCSV = `网站名称,网站URL,用户名,密码,分类,备注
GitHub,https://github.com,myusername,mypassword123,开发工具,我的GitHub账号
Gmail,https://gmail.com,user@gmail.com,emailpass456,邮箱,个人邮箱
Netflix,https://netflix.com,netflixuser,moviepass789,娱乐,流媒体账号`;

// 示例Chrome书签HTML文件内容
const sampleChromeBookmarks = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks Menu</H1>

<DL><p>
    <DT><H3 ADD_DATE="1642406400" LAST_MODIFIED="1642406400" PERSONAL_TOOLBAR_FOLDER="true">书签栏</H3>
    <DL><p>
        <DT><A HREF="https://www.google.com" ADD_DATE="1642406400" ICON="data:image/png;base64,...">Google</A>
        <DT><A HREF="https://www.baidu.com" ADD_DATE="1642406400">百度</A>
        <DT><A HREF="https://github.com" ADD_DATE="1642406400">GitHub</A>
    </DL><p>
    <DT><H3 ADD_DATE="1642406400" LAST_MODIFIED="1642406400">开发工具</H3>
    <DL><p>
        <DT><A HREF="https://stackoverflow.com" ADD_DATE="1642406400">Stack Overflow</A>
        <DT><A HREF="https://developer.mozilla.org" ADD_DATE="1642406400">MDN Web Docs</A>
    </DL><p>
</DL><p>`;

console.log('📋 测试数据已准备');
console.log('\n📚 书签JSON示例:');
console.log(JSON.stringify(sampleBookmarks, null, 2));

console.log('\n🔐 密码CSV示例:');
console.log(samplePasswordsCSV);

console.log('\n🌐 Chrome书签HTML示例:');
console.log(sampleChromeBookmarks.substring(0, 300) + '...');

console.log('\n💡 使用方法:');
console.log('1. 将上述内容保存为对应格式的文件');
console.log('2. 在Web界面的"导入导出"页面上传测试');
console.log('3. 访问 http://localhost:3002/import-export');

// 创建测试文件
const fs = require('fs');

// 创建测试书签文件
fs.writeFileSync('test-bookmarks.json', JSON.stringify(sampleBookmarks, null, 2));
console.log('\n✅ 已创建测试文件: test-bookmarks.json');

// 创建测试密码文件
fs.writeFileSync('test-passwords.csv', samplePasswordsCSV);
console.log('✅ 已创建测试文件: test-passwords.csv');

// 创建测试Chrome书签文件
fs.writeFileSync('test-chrome-bookmarks.html', sampleChromeBookmarks);
console.log('✅ 已创建测试文件: test-chrome-bookmarks.html');

console.log('\n🎯 现在可以使用这些文件测试导入功能！');