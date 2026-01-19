import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const { Title } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const result = await login(values.username, values.password)
      if (result.success) {
        message.success('登录成功')
      } else {
        message.error(result.error)
      }
    } catch (error) {
      message.error('登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-form">
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          书签密码同步
        </Title>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名或邮箱' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名或邮箱" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            还没有账号？ <Link to="/register">立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Login