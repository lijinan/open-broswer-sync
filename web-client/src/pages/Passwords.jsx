import { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Space, 
  message,
  Popconfirm,
  Typography,
  Tag,
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  EyeInvisibleOutlined,
  CopyOutlined,
  SearchOutlined 
} from '@ant-design/icons'
import api from '../services/api'
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts'

const { Title } = Typography

const Passwords = () => {
  const [passwords, setPasswords] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPassword, setEditingPassword] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [verifyModalVisible, setVerifyModalVisible] = useState(false)
  const [pendingPasswordId, setPendingPasswordId] = useState(null)
  const [verifyPassword, setVerifyPassword] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [form] = Form.useForm()
  const [verifyForm] = Form.useForm()

  useEffect(() => {
    fetchPasswords()
  }, [])

  const fetchPasswords = async () => {
    setLoading(true)
    try {
      const response = await api.get('/passwords')
      setPasswords(response.data.passwords || [])
    } catch (error) {
      message.error('获取密码失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchPasswordDetail = async (id) => {
    try {
      const response = await api.get(`/passwords/${id}`)
      return response.data.password
    } catch (error) {
      message.error('获取密码详情失败')
      return null
    }
  }

  const handleAdd = () => {
    setEditingPassword(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = async (password) => {
    const detail = await fetchPasswordDetail(password.id)
    if (detail) {
      setEditingPassword(detail)
      form.setFieldsValue(detail)
      setModalVisible(true)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/passwords/${id}`)
      message.success('删除成功')
      fetchPasswords()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingPassword) {
        await api.put(`/passwords/${editingPassword.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/passwords', values)
        message.success('添加成功')
      }
      setModalVisible(false)
      fetchPasswords()
    } catch (error) {
      message.error(editingPassword ? '更新失败' : '添加失败')
    }
  }

  const handleSearch = async () => {
    if (!searchText.trim()) {
      fetchPasswords()
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/passwords/search?q=${encodeURIComponent(searchText)}`)
      setPasswords(response.data.passwords || [])
    } catch (error) {
      message.error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = async (id) => {
    if (visiblePasswords[id]) {
      // 隐藏密码
      setVisiblePasswords(prev => ({ ...prev, [id]: null }))
    } else {
      // 显示密码前需要验证
      setPendingPasswordId(id)
      setVerifyModalVisible(true)
      verifyForm.resetFields()
    }
  }

  const handleVerifyPassword = async () => {
    const passwordValue = verifyForm.getFieldValue('password')
    if (!passwordValue) {
      message.error('请输入密码')
      return
    }

    setVerifyLoading(true)
    try {
      await api.post('/auth/verify-password', { password: passwordValue })
      // 验证成功，显示密码
      const detail = await fetchPasswordDetail(pendingPasswordId)
      if (detail) {
        setVisiblePasswords(prev => ({ ...prev, [pendingPasswordId]: detail.password }))
      }
      setVerifyModalVisible(false)
      verifyForm.resetFields()
      message.success('验证成功')
    } catch (error) {
      message.error(error.response?.data?.error || '密码验证失败')
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleVerifyCancel = () => {
    setVerifyModalVisible(false)
    setPendingPasswordId(null)
    verifyForm.resetFields()
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success('已复制到剪贴板')
    } catch (error) {
      message.error('复制失败')
    }
  }

  // 快捷键回调 - 现在所有函数都已定义
  const keyboardCallbacks = {
    onNewPassword: handleAdd,
    onSearch: () => document.getElementById('password-search')?.focus(),
    onSave: () => form.submit(),
    onCancel: () => setModalVisible(false),
  }

  useKeyboardShortcuts(keyboardCallbacks)

  const columns = [
    {
      title: '网站名称',
      dataIndex: 'site_name',
      key: 'site_name',
    },
    {
      title: '网站URL',
      dataIndex: 'site_url',
      key: 'site_url',
      ellipsis: true,
      render: (url) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username) => (
        <Space>
          <span>{username}</span>
          <Tooltip title="复制用户名">
            <Button 
              type="text" 
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(username)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '密码',
      key: 'password',
      render: (_, record) => (
        <Space>
          <span>
            {visiblePasswords[record.id] || '••••••••'}
          </span>
          <Tooltip title={visiblePasswords[record.id] ? "隐藏密码" : "显示密码"}>
            <Button 
              type="text" 
              size="small"
              icon={visiblePasswords[record.id] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => togglePasswordVisibility(record.id)}
            />
          </Tooltip>
          {visiblePasswords[record.id] && (
            <Tooltip title="复制密码">
              <Button 
                type="text" 
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(visiblePasswords[record.id])}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category ? <Tag color="green">{category}</Tag> : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个密码吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={2}>密码管理</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            id="password-search"
            placeholder="搜索密码... (Ctrl+F)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 300 }}
            enterButton={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加密码 (Ctrl+N)
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={passwords}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingPassword ? '编辑密码' : '添加密码'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="site_name"
            label="网站名称"
            rules={[{ required: true, message: '请输入网站名称' }]}
          >
            <Input placeholder="请输入网站名称" />
          </Form.Item>

          <Form.Item
            name="site_url"
            label="网站URL"
            rules={[
              { required: true, message: '请输入网站URL' },
              { type: 'url', message: '请输入有效的URL' }
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
          >
            <Input placeholder="请输入分类（可选）" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="请输入备注（可选）" 
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="密码验证"
        open={verifyModalVisible}
        onCancel={handleVerifyCancel}
        onOk={handleVerifyPassword}
        okText="确认"
        cancelText="取消"
        confirmLoading={verifyLoading}
        destroyOnClose
      >
        <Form form={verifyForm} layout="vertical">
          <Form.Item
            name="password"
            label="请输入您的登录密码以查看密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              placeholder="请输入登录密码"
              onPressEnter={handleVerifyPassword}
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Passwords