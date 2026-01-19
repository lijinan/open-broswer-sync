import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Avatar, Dropdown, Switch, Space, Modal } from 'antd'
import {
  BookOutlined,
  KeyOutlined,
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ImportOutlined,
  BulbOutlined,
  MoonOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'

const { Header, Sider, Content } = Layout

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [helpVisible, setHelpVisible] = useState(false)
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  // 快捷键回调
  const keyboardCallbacks = {
    onToggleTheme: toggleTheme,
    onShowHelp: () => setHelpVisible(true),
    onCancel: () => setHelpVisible(false),
  }

  const { shortcuts } = useKeyboardShortcuts(keyboardCallbacks)

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/bookmarks',
      icon: <BookOutlined />,
      label: '书签管理',
    },
    {
      key: '/passwords',
      icon: <KeyOutlined />,
      label: '密码管理',
    },
    {
      key: '/import-export',
      icon: <ImportOutlined />,
      label: '导入导出',
    },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'shortcuts',
      icon: <QuestionCircleOutlined />,
      label: '快捷键帮助',
      onClick: () => setHelpVisible(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'BS' : '书签同步'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: isDarkMode ? '#141414' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isDarkMode ? '#434343' : '#f0f0f0'}`
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <Space>
            {/* 主题切换 */}
            <Space align="center">
              <BulbOutlined style={{ color: isDarkMode ? '#faad14' : '#1890ff' }} />
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<BulbOutlined />}
                style={{ backgroundColor: isDarkMode ? '#1890ff' : undefined }}
              />
            </Space>
            
            {/* 用户菜单 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '0 8px'
              }}>
                <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <span>{user?.name}</span>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ 
          margin: '24px 16px',
          padding: 24,
          background: isDarkMode ? '#141414' : '#fff',
          borderRadius: 6,
          minHeight: 'calc(100vh - 112px)'
        }}>
          <Outlet />
        </Content>
      </Layout>
      
      {/* 快捷键帮助模态框 */}
      <Modal
        title="⌨️ 快捷键帮助"
        open={helpVisible}
        onCancel={() => setHelpVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <h4>🌐 全局快捷键</h4>
            {shortcuts.global.map(item => (
              <div key={item.key} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '4px 0',
                borderBottom: `1px solid ${isDarkMode ? '#434343' : '#f0f0f0'}`
              }}>
                <span style={{ fontFamily: 'monospace', background: isDarkMode ? '#262626' : '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
                  {item.key}
                </span>
                <span>{item.desc}</span>
              </div>
            ))}
          </div>
          
          <div style={{ marginBottom: 24 }}>
            <h4>🧭 页面导航</h4>
            {shortcuts.navigation.map(item => (
              <div key={item.key} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '4px 0',
                borderBottom: `1px solid ${isDarkMode ? '#434343' : '#f0f0f0'}`
              }}>
                <span style={{ fontFamily: 'monospace', background: isDarkMode ? '#262626' : '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
                  {item.key}
                </span>
                <span>{item.desc}</span>
              </div>
            ))}
          </div>
          
          <div>
            <h4>📋 列表操作</h4>
            {shortcuts.list.map(item => (
              <div key={item.key} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '4px 0',
                borderBottom: `1px solid ${isDarkMode ? '#434343' : '#f0f0f0'}`
              }}>
                <span style={{ fontFamily: 'monospace', background: isDarkMode ? '#262626' : '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
                  {item.key}
                </span>
                <span>{item.desc}</span>
              </div>
            ))}
          </div>
          
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            background: isDarkMode ? '#262626' : '#f0f8ff', 
            borderRadius: 6,
            fontSize: '12px',
            color: isDarkMode ? '#8c8c8c' : '#666'
          }}>
            💡 提示: 按 <code>?</code> 键可快速显示此帮助。在输入框中时，大部分快捷键会被禁用。
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

export default AppLayout