import { message } from 'antd';
import { request, history } from 'umi';

const prefix = REACT_APP_ENV === 'dev' ? '/api' : API_PREFIX

export default (path, opt) => {
    // const { headers: h, ...rest } = opt
    // const headers = {
    //   ...h,
    //   // 'x-csrf-token': Cookies.get('csrfToken') || '',
    // }
    return request(`${prefix}${path}`, {
        ...opt,
        errorHandler: function (error) {
            if (error.response.status === 401) {
                message.error('请先登录！')
                history.push('/login')
            }
        }
    })
}

export const api = path => `${prefix}${path}`
