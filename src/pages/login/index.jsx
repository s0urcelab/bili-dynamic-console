import { useEffect, useRef, useLayoutEffect } from 'react';
import { Form, Result, message, Input, Space, Button } from 'antd';
import { useRequest } from 'ahooks';
import { history } from 'umi';
import API from '@/api'

import './index.less';

function Login() {
    const {
        run: loginToManage,
    } = useRequest(params => API(`/admin.login`, {
        method: 'POST',
        data: params,
    }), {
        manual: true,
        onSuccess: ({ code, data }) => {
            const msg = code === 0 ? message.success : message.error
            msg(data)
            window.localStorage['MANAGE_LAYOUT'] = 1
            history.push('/manage')
        },
        onError: () => {
            message.error('登录失败！')
        }
    })

    const onFinish = (values) => {
        loginToManage(values)
    }
    const onFinishFailed = (errorInfo) => {
        message.error(errorInfo)
    }

    const form = (
        <Form
            name="basic"
            layout="inline"
            initialValues={{
                remember: true,
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
        >
            <Form.Item
                name="pw"
                rules={[
                    {
                        required: true,
                        message: '请输入管理密码！',
                    },
                ]}
            >
                <Input.Password placeholder="输入管理密码..." />
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit">登录</Button>
            </Form.Item>
        </Form>
    )

    return (
        <Result
            title="登录管理后台"
            extra={<Space>{form}</Space>}
        />

    )
};

export default Login;
