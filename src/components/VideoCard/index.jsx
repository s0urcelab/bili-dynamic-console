import React, { useState } from 'react';
import { Popconfirm, message, Image, Input, Space, Button, Col, Card, List, Radio, Row, Avatar } from 'antd';
import { useRequest } from 'ahooks';
import API from '@/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/zh-cn'

import './index.less';

dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const defaultAction = (e) => {
    e.stopPropagation()
}

function VideoCard({ onCardClick = defaultAction, onUserClick = defaultAction, item = {} }) {
    const [isDel, setDel] = useState(false)
    const {
        run: deleteVideo,
    } = useRequest(params => API(`/delete.video`, {
        method: 'POST',
        data: params,
    }), {
        manual: true,
        onSuccess: ({ code, data }) => {
            const msg = code === 0 ? message.success : message.error
            msg(data)
            setDel(true)
        },
        onError: () => {
            message.error('删除失败！')
        }
    })

    const confirm = (e) => {
        deleteVideo([item])
        e.stopPropagation()
    }
    const cancel = (e) => {
        e.stopPropagation()
    }

    return (
        <div style={{ filter: isDel ? 'grayscale(100%)' : 'none' }}>
            <Card
                onClick={onCardClick}
                hoverable
                cover={
                    <div className="wrapper">
                        <Image src={item.cover} preview={false} referrerPolicy="no-referrer" />
                        <span className='duration'>{dayjs.duration(item.duration, 's').format('mm:ss')}</span>
                    </div>
                }
            >
                <Card.Meta
                    avatar={<Avatar src={<Image src={item.avatar} preview={false} referrerPolicy="no-referrer" />} />}
                    title={(
                        <>
                            {item.etitle || item.title}
                            <span className='tag-group'>
                                {
                                    item.source === 3 && <span className='s-tag'>Acfun</span>
                                }
                                {
                                    item.p > 1 && <span className='p-tag'>P{item.p}</span>
                                }
                                <span className='q-tag'>{item.max_quality}</span>
                                {
                                    !!item.is_portrait && <span className='v-tag'>竖屏</span>
                                }
                            </span>
                        </>
                    )}
                    description={(
                        <div className='card-desc'>
                            <div>
                                <a className="user-link" onClick={onUserClick}>{item.uname}</a>
                                <span className="user-date">{dayjs.unix(item.pdate).fromNow()}</span>
                            </div>
                            {
                                !!window.localStorage['MANAGE_LAYOUT'] && (
                                    <Popconfirm
                                        title="确认删除？"
                                        onConfirm={confirm}
                                        onCancel={cancel}
                                        okText="确认"
                                        cancelText="取消"
                                    >
                                        <Button size="small" danger onClick={e => e.stopPropagation()}>删除稿件</Button>
                                    </Popconfirm>
                                )
                            }
                        </div>
                    )}
                />
            </Card>
        </div>
    )
}

export default VideoCard;
