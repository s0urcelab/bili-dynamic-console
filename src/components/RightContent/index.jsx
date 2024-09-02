import { message, Space, Button } from 'antd';
import { history, useLocation } from 'umi';
import { useRequest } from 'ahooks';
import API from '@/api'

const GlobalHeaderRight = () => {
    const location = useLocation()

    const {
        run: logoutToManage,
    } = useRequest(() => API(`/admin.logout`, {
        method: 'POST',
    }), {
        manual: true,
        onSuccess: ({ code, data }) => {
            const msg = code === 0 ? message.success : message.error
            msg(data)
            window.localStorage.removeItem('MANAGE_LAYOUT')
            history.push('/')
        },
        onError: () => {
            message.error('退出登录失败！')
        }
    })

  return location.pathname === '/manage' ? (
    <Space>
      <Button type="primary" onClick={() => logoutToManage()}>退出登录</Button>
    </Space>
  ) : null;
};

export default GlobalHeaderRight;
