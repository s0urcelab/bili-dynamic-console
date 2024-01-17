import { useEffect, useRef, useState } from 'react';
import { history, useLocation } from 'umi';
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/zh-cn'
import Player from 'xgplayer';
import 'xgplayer/dist/index.min.css';
import Icon, { CheckCircleFilled, SyncOutlined, WarningFilled, UndoOutlined } from '@ant-design/icons';
import { Tag, message, Image, Input, Space, Button, Col, Card, Radio, Row, Modal } from 'antd';
import { GridContent } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import { useRequest } from 'ahooks';
import API from '@/api'

import './index.less';

dayjs.extend(duration)
dayjs.locale('zh-cn')

function Manage() {
    const ref = useRef()
    const playerRef = useRef()
    const [inputKey, setKey] = useState(0)
    const [searchParams, setSearch] = useState({})
    const location = useLocation()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const closeModal = () => {
        setIsModalOpen(false)
        playerRef.current.pause()
    }
    const updateSearch = (key, val) => {
        setSearch(p => ({ ...p, [key]: val }))
    }

    useEffect(() => {
        const player = new Player({
            width: 600,
            lang: 'zh',
            id: 'xgplayer',
            volume: 1,
            fluid: true,
            videoInit: true,
            autoplay: true,
        })
        playerRef.current = player

        return () => player.destroy()
    }, [])

    const fetchList = async (params, sort) => {
        const { code, data, total } = await API('/dyn.list', {
            method: 'GET',
            params: {
                page: params.current,
                size: params.pageSize,
                ...params.dtype && { dtype: params.dtype },
                ...params.uid && { uid: params.uid },
            },
        })

        return {
            data,
            // success 请返回 true，
            // 不然 table 会停止解析数据，即使有数据
            success: code === 0,
            // 不传会使用 data 的长度，如果是分页一定要传
            total: total,
        }
    }

    const {
        loading: uploading,
        run: uploadYTB,
    } = useRequest(params => API(`/upload.ytb`, {
        method: 'POST',
        data: params,
    }), {
        manual: true,
        onSuccess: ({ code, data }) => {
            const msg = code === 0 ? message.success : message.error
            msg(data)
            code === 0 && ref.current.reload()
        },
        onError: () => {
            message.error('上传失败！')
        },
    })

    const {
        run: resetBGM,
    } = useRequest(params => API(`/reset.bgm`, {
        method: 'POST',
        data: params,
    }), {
        manual: true,
        onSuccess: ({ code, data }) => {
            const msg = code === 0 ? message.success : message.error
            msg(data)
            code === 0 && ref.current.reload()
            code === 0 && ref.current.clearSelected()
        },
        onError: () => {
            message.error('重置状态失败！')
        },
    })

    const {
        run: resetUpload,
    } = useRequest(params => API(`/reset.upload`, {
        method: 'POST',
        data: params,
    }), {
        manual: true,
        onSuccess: ({ code, data }) => {
            const msg = code === 0 ? message.success : message.error
            msg(data)
            code === 0 && ref.current.reload()
            code === 0 && ref.current.clearSelected()
        },
        onError: () => {
            message.error('重置上传失败！')
        },
    })

    const handleClear = (selectedRows) => {
        if (selectedRows.length > 1) {
            const sortList = selectedRows.sort((a, b) => a.pdate - b.pdate)
            const lr = sortList[0]
            const fr = sortList[sortList.length - 1]
            if (fr.pdate > lr.pdate) {
                return API(`/delete.from/${lr.pdate}/to/${fr.pdate}`, {
                    method: 'GET',
                })
            }
        }
    }

    const {
        data: { data: info } = { data: {} },
    } = useRequest(() => API(`/folder.size`, {
        method: 'GET',
    }))

    const {
        loading: clearing,
        run: clear,
    } = useRequest(handleClear, {
        manual: true,
        onSuccess: ({ code, data }) => {
            const msg = code === 0 ? message.success : message.error
            msg(data)
            code === 0 && ref.current.reload()
            code === 0 && ref.current.clearSelected()
        },
        onError: () => {
            message.error('清理失败！')
        }
    })

    const {
        run: retry,
    } = useRequest(params => API(`/retry`, {
        method: 'POST',
        data: params,
    }), {
        manual: true,
        onSuccess: ({ code, data }) => {
            const msg = code === 0 ? message.success : message.error
            msg(data)
            code === 0 && ref.current.reload()
            code === 0 && ref.current.clearSelected()
        },
        onError: () => {
            message.error('重试失败！')
        }
    })

    const {
        run: editTitle,
    } = useRequest((...params) => API(`/edit.title`, {
        method: 'POST',
        data: {
            vid: params[0],
            shazam_id: params[1],
            etitle: params[2]
        },
    }), {
        manual: true,
        onSuccess: ({ code, data }) => {
            const msg = code === 0 ? message.success : message.error
            msg(data)
            code === 0 && ref.current.reload()
        },
        onError: () => {
            message.error('更新自定义标题失败！')
        }
    })

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
            code === 0 && ref.current.reload()
            code === 0 && ref.current.clearSelected()
        },
        onError: () => {
            message.error('删除失败！')
        }
    })

    const {
        run: addVid,
    } = useRequest(params => API(`/add.vid`, {
        method: 'POST',
        data: params,
    }), {
        manual: true,
        onSuccess: ({ code, data }) => {
            const msg = code === 0 ? message.success : message.error
            msg(data)
            code === 0 && ref.current.reload()
            code === 0 && setKey(Math.random())
        },
        onError: () => {
            message.error('导入失败！')
        }
    })

    const {
        run: findLocal,
    } = useRequest(params => API(`/find.local`, {
        method: 'POST',
        data: params,
    }), {
        manual: true,
        onSuccess: ({ data: filesrc }) => {
            setIsModalOpen(true)
            playerRef.current.src = filesrc
        },
        onError: () => {
            message.error('找不到文件！')
        }
    })

    const columns = [
        {
            title: '封面',
            dataIndex: 'cover',
            width: '17%',
            render: (cover, record) => {
                return (
                    <div className="wrapper">
                        <Image src={cover} className="img" alt="" referrerPolicy="no-referrer" />
                        <span className='duration'>{dayjs.duration(record.duration, 's').format('mm:ss')}</span>
                    </div>
                )
            },
        },
        {
            title: '标题',
            dataIndex: 'title',
            width: '25%',
            render: (title, record) => {
                const { pure_vid = record.vid, source, p, max_quality, is_portrait } = record
                let link = `https://www.bilibili.com/video/${pure_vid}${p > 1 ? `?p=${p}` : ''}`
                if (source === 3) {
                    link = `https://www.acfun.cn/v/${pure_vid}${p > 1 ? `_${p}` : ''}`
                }
                return (
                    <>
                        {
                            source === 3 && <span className='s-tag'>Acfun</span>
                        }
                        {
                            p > 1 && <span className='p-tag'>P{p}</span>
                        }
                        <a target="_blank" href={link}>{title}</a>
                        {
                            max_quality && <span className='q-tag'>{max_quality}</span>
                        }
                        {
                            !!is_portrait && <span className='v-tag'>竖屏</span>
                        }
                    </>
                )
            },
        },
        {
            title: '猜测BGM',
            dataIndex: 'etitle',
            width: '16%',
            render: (etitle, record) => (
                <Space>
                    {typeof record.shazam_id === 'string' && <CheckCircleFilled style={{ color: '#52c41a' }} />}
                    {record.shazam_id < 0 && <WarningFilled style={{ color: '#faad14' }} />}
                    <Input
                        defaultValue={etitle || ''}
                        placeholder="填写自定义标题"
                        onBlur={(e) => e.target.value && (e.target.value !== etitle) && editTitle(record.vid, record.shazam_id, e.target.value)}
                    />
                </Space>
            )
        },
        {
            title: () => (
                <Space>
                    UP主
                    {
                        !!searchParams.uid && <Tag color="green" closable onClose={() => updateSearch('uid', undefined)}>{searchParams.uid}</Tag>
                    }
                </Space>
            ),
            dataIndex: 'uname',
            render: (uname, record) => {
                // if (record.source === 3) {
                //     return <a target="_blank" href={`https://www.acfun.cn/u/${record.uid}`}>{uname}</a>
                // }
                // return <a target="_blank" href={`https://space.bilibili.com/${record.uid}/video`}>{uname}</a>
                return <a onClick={() => updateSearch('uid', record.uid)}>{uname}</a>
            }
        },
        {
            title: '投稿时间',
            dataIndex: 'pdstr',
        },
        {
            title: '下载状态',
            dataIndex: 'dstatus',
            render: (status, record) => {
                switch (status) {
                    case 200:
                        return (
                            <Space
                                onClick={() => findLocal(record)}
                                style={{ color: '#52c41a', cursor: 'pointer' }}
                            >
                                <CheckCircleFilled />已下载
                            </Space>
                        )
                    case 100:
                        return <Space style={{ color: '#faad14' }}><SyncOutlined spin />下载中</Space>
                    case 0:
                        return <Space style={{ color: 'gray' }}>未下载</Space>
                    case -1:
                        return (
                            <Space style={{ color: '#ff4d4f' }}>
                                <WarningFilled /><span>下载出错({record.dl_retry})</span>
                                <Button type="primary" size="small" danger onClick={() => retry([record.vid])}>重试</Button>
                            </Space>
                        )
                    case -2:
                        return (
                            <Space style={{ color: '#ff4d4f' }}>
                                <WarningFilled /><span>文件不存在({record.dl_retry})</span>
                                <Button type="primary" size="small" danger onClick={() => retry([record.vid])}>重试</Button>
                            </Space>
                        )
                    case -3:
                        return (
                            <Space style={{ color: '#ff4d4f' }}>
                                <WarningFilled /><span>清晰度异常({record.dl_retry})</span>
                                <Button type="primary" size="small" danger onClick={() => retry([record.vid])}>重试</Button>
                            </Space>
                        )
                    case -9:
                        return (
                            <Space style={{ color: '#ff4d4f' }}>
                                <WarningFilled /><span>拉取基础信息失败</span>
                            </Space>
                        )
                    default:
                        return (
                            <Space style={{ color: '#ff4d4f' }}>
                                <WarningFilled /><span>未知错误（{status}）</span>
                            </Space>
                        )
                }
            },
        },
        {
            title: '油管投稿状态',
            dataIndex: 'ustatus',
            render: (status, record) => {
                switch (status) {
                    case 100:
                        return <Space style={{ color: '#00c4ff' }}>准备投稿</Space>
                    case 150:
                        return <Space style={{ color: '#faad14' }}>上传中</Space>
                    case 200:
                        return <Space
                            style={{ color: '#52c41a', cursor: 'pointer' }}
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${record.ytb_id}`, '_blank')}
                        >
                            投稿成功
                        </Space>
                    case -1:
                        return <div style={{ color: '#ff4d4f' }}>上传失败({record.up_retry})</div>
                    case 0:
                        return <Space style={{ color: 'gray' }}>未处理</Space>
                    default:
                        return <Space style={{ color: '#ff4d4f' }}>{status}</Space>
                }
            },
        },
    ]

    const parseLink = (url) => {
        const bv = url.match(/(BV[A-Za-z0-9]{10})(?:.*[?&]p=(\d+))?/)
        const ac = url.match(/(ac(?:\d)+)(?:_(\d))?/)
        if (bv !== null) {
            return addVid({ type: 'bilibili', vid: bv[1], p: bv[2] || 1 })
        }
        if (ac !== null) {
            return addVid({ type: 'acfun', vid: ac[1], p: ac[2] || 1 })
        }
        message.error('链接有误！')
    }

    return (
        <GridContent>
            <ProTable
                tableExtraRender={() => (
                    <Card>
                        <Row justify="space-between">
                            <Col span={18}>
                                <Space>
                                    <span>空间占用：{info.size}</span>
                                    <span>待上传：{info.waiting}</span>
                                    <span>已上传：{info.uploaded}</span>
                                    <Radio.Group
                                        value={searchParams.dtype || ''}
                                        buttonStyle="solid"
                                        onChange={e => updateSearch('dtype', e.target.value)}
                                    >
                                        <Radio.Button value="" >ALL</Radio.Button>
                                        <Radio.Button value="1" >下载失败</Radio.Button>
                                        <Radio.Button value="2" >上传失败</Radio.Button>
                                    </Radio.Group>
                                </Space>
                            </Col>
                            <Col span={6}>
                                <Input.Search
                                    key={inputKey}
                                    placeholder="输入视频链接或BV/AC号..."
                                    enterButton="导入"
                                    onSearch={parseLink}
                                />
                            </Col>
                        </Row>
                    </Card>
                )}
                style={{ minWidth: '800px' }}
                columnEmptyText={false}
                rowSelection={true}
                tableAlertOptionRender={({ selectedRowKeys, selectedRows }) => (
                    <Space>
                        <Button onClick={() => resetUpload(selectedRowKeys)}>
                            重置上传
                        </Button>
                        <Button onClick={() => resetBGM(selectedRowKeys)}>
                            重置BGM识别
                        </Button>
                        <Button disabled={!!uploading} type="primary" onClick={() => uploadYTB(selectedRowKeys)}>
                            投稿Youtube
                        </Button>
                        {
                            selectedRowKeys.length > 1 && (
                                <Button danger disabled={!!clearing} onClick={() => clear(selectedRows)}>
                                    清理投稿
                                </Button>
                            )
                        }
                        <Button onClick={() => retry(selectedRowKeys)}>
                            重试下载
                        </Button>
                        <Button onClick={() => deleteVideo(selectedRows)}>
                            彻底删除
                        </Button>
                    </Space>
                )}
                actionRef={ref}
                tableStyle={{ margin: '0 16px' }}
                rowKey="vid"
                params={searchParams}
                toolBarRender={false}
                search={false}
                request={fetchList}
                columns={columns}
                pagination={{
                    defaultCurrent: parseInt(location.query.page) || 1,
                    defaultPageSize: 50,
                    pageSizeOptions: [50, 100],
                    onChange: page => history.push({ query: { page } }),
                }}
                sticky
            />
            <Modal
                bodyStyle={{ padding: 0, margin: -300 }}
                centered={true}
                forceRender={true}
                footer={null}
                open={isModalOpen}
                onCancel={closeModal}
            >
                <div id="xgplayer" />
            </Modal>
        </GridContent>
    );
};

export default Manage;
