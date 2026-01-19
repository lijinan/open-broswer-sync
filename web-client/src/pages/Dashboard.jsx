import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Typography, Button, Space } from 'antd'
import { BookOutlined, KeyOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const { Title } = Typography

const Dashboard = () => {
  const [stats, setStats] = useState({
    bookmarks: 0,
    passwords: 0
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [bookmarksRes, passwordsRes] = await Promise.all([
        api.get('/bookmarks'),
        api.get('/passwords')
      ])
      
      setStats({
        bookmarks: bookmarksRes.data.bookmarks?.length || 0,
        passwords: passwordsRes.data.passwords?.length || 0
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Title level={2}>仪表板</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="书签总数"
              value={stats.bookmarks}
              prefix={<BookOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="密码总数"
              value={stats.passwords}
              prefix={<KeyOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="总项目"
              value={stats.bookmarks + stats.passwords}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title="书签管理"
            extra={<BookOutlined />}
            actions={[
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/bookmarks')}
              >
                管理书签
              </Button>
            ]}
          >
            <p>管理您的浏览器书签，支持分类和标签功能。</p>
            <Space>
              <span>当前书签数量: {stats.bookmarks}</span>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title="密码管理"
            extra={<KeyOutlined />}
            actions={[
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/passwords')}
              >
                管理密码
              </Button>
            ]}
          >
            <p>安全存储和管理您的网站密码，支持加密同步。</p>
            <Space>
              <span>当前密码数量: {stats.passwords}</span>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} title="快速操作">
        <Space wrap>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/bookmarks')}
          >
            添加书签
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/passwords')}
          >
            添加密码
          </Button>
          <Button 
            icon={<SearchOutlined />}
            onClick={() => navigate('/bookmarks')}
          >
            搜索书签
          </Button>
          <Button 
            icon={<SearchOutlined />}
            onClick={() => navigate('/passwords')}
          >
            搜索密码
          </Button>
        </Space>
      </Card>
    </div>
  )
}

export default Dashboard