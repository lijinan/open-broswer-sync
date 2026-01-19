import React, { useState } from 'react'
import { 
  Card, 
  Button, 
  Upload, 
  message, 
  Space, 
  Typography, 
  Divider,
  Alert,
  Progress,
  Modal
} from 'antd'
import { 
  DownloadOutlined, 
  UploadOutlined, 
  FileTextOutlined,
  SafetyOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import api from '../services/api'

const { Title, Paragraph, Text } = Typography
const { Dragger } = Upload

const ImportExport = () => {
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // 导出书签
  const handleExportBookmarks = async () => {
    try {
      setLoading(true)
      const response = await api.get('/import-export/bookmarks/export', {
        responseType: 'blob'
      })
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `bookmarks_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      message.success('书签导出成功')
    } catch (error) {
      message.error('导出失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 导出密码
  const handleExportPasswords = () => {
    Modal.confirm({
      title: '导出密码确认',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>您即将导出所有密码数据，这些数据包含敏感信息。</p>
          <p><strong>请确保：</strong></p>
          <ul>
            <li>导出文件将保存在安全的位置</li>
            <li>不会通过不安全的方式传输文件</li>
            <li>使用完毕后及时删除导出文件</li>
          </ul>
        </div>
      ),
      okText: '确认导出',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true)
          const response = await api.get('/import-export/passwords/export', {
            responseType: 'blob'
          })
          
          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `passwords_${new Date().toISOString().split('T')[0]}.json`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(url)
          
          message.success('密码导出成功')
        } catch (error) {
          message.error('导出失败: ' + (error.response?.data?.error || error.message))
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // 导入书签
  const handleImportBookmarks = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      setLoading(true)
      setUploadProgress(0)
      
      const response = await api.post('/import-export/bookmarks/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        }
      })
      
      message.success(
        `书签导入完成！成功: ${response.data.success_count}, 失败: ${response.data.error_count}`
      )
    } catch (error) {
      message.error('导入失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
    
    return false // 阻止默认上传行为
  }

  // 导入密码
  const handleImportPasswords = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      setLoading(true)
      setUploadProgress(0)
      
      const response = await api.post('/import-export/passwords/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        }
      })
      
      message.success(
        `密码导入完成！成功: ${response.data.success_count}, 失败: ${response.data.error_count}`
      )
    } catch (error) {
      message.error('导入失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
    
    return false // 阻止默认上传行为
  }

  return (
    <div>
      <Title level={2}>数据导入导出</Title>
      
      <Alert
        message="数据安全提醒"
        description="导出的数据包含您的个人信息，请妥善保管。建议在安全的环境中进行导入导出操作。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 书签导入导出 */}
      <Card title="📚 书签管理" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Title level={4}>导出书签</Title>
            <Paragraph>
              将您的所有书签导出为JSON格式文件，可用于备份或迁移到其他设备。
            </Paragraph>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={handleExportBookmarks}
              loading={loading}
            >
              导出书签
            </Button>
          </div>
          
          <Divider />
          
          <div>
            <Title level={4}>导入书签</Title>
            <Paragraph>
              支持导入JSON格式的书签文件，以及Chrome、Firefox等浏览器导出的HTML书签文件。
            </Paragraph>
            
            <Dragger
              accept=".json,.html"
              beforeUpload={handleImportBookmarks}
              showUploadList={false}
              disabled={loading}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 .json 和 .html 格式的书签文件
              </p>
            </Dragger>
            
            {loading && uploadProgress > 0 && (
              <Progress percent={uploadProgress} style={{ marginTop: 16 }} />
            )}
          </div>
        </Space>
      </Card>

      {/* 密码导入导出 */}
      <Card title="🔐 密码管理" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="安全警告"
            description="密码数据极其敏感，请确保在安全的环境中操作，并及时删除导出的文件。"
            type="warning"
            showIcon
          />
          
          <div>
            <Title level={4}>导出密码</Title>
            <Paragraph>
              <SafetyOutlined style={{ color: '#faad14' }} /> 将您的所有密码导出为加密的JSON文件。
              <br />
              <Text type="danger">注意：导出文件包含明文密码，请妥善保管！</Text>
            </Paragraph>
            <Button 
              type="primary" 
              danger
              icon={<DownloadOutlined />}
              onClick={handleExportPasswords}
              loading={loading}
            >
              导出密码
            </Button>
          </div>
          
          <Divider />
          
          <div>
            <Title level={4}>导入密码</Title>
            <Paragraph>
              支持导入JSON格式的密码文件，以及CSV格式的密码数据。
              <br />
              <Text type="secondary">
                CSV格式要求：网站名称,网站URL,用户名,密码,分类,备注
              </Text>
            </Paragraph>
            
            <Dragger
              accept=".json,.csv"
              beforeUpload={handleImportPasswords}
              showUploadList={false}
              disabled={loading}
            >
              <p className="ant-upload-drag-icon">
                <FileTextOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽密码文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 .json 和 .csv 格式的密码文件
              </p>
            </Dragger>
            
            {loading && uploadProgress > 0 && (
              <Progress percent={uploadProgress} style={{ marginTop: 16 }} />
            )}
          </div>
        </Space>
      </Card>

      {/* 使用说明 */}
      <Card title="📖 使用说明">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Title level={4}>支持的格式</Title>
            <ul>
              <li><strong>书签导入</strong>: JSON格式、Chrome/Firefox HTML书签文件</li>
              <li><strong>密码导入</strong>: JSON格式、CSV格式 (网站名称,URL,用户名,密码,分类,备注)</li>
            </ul>
          </div>
          
          <div>
            <Title level={4}>安全建议</Title>
            <ul>
              <li>导出文件包含敏感信息，请存储在安全的位置</li>
              <li>不要通过邮件或不安全的方式传输导出文件</li>
              <li>使用完毕后及时删除导出文件</li>
              <li>定期备份数据以防意外丢失</li>
            </ul>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default ImportExport