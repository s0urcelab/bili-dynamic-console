import { useEffect, useRef, useLayoutEffect } from 'react';
import { history, useParams, useLocation } from 'umi'
import Player from 'xgplayer';
import 'xgplayer/dist/index.min.css';
import { Spin, Typography, message, Image, Input, Space, Button, Col, Card, List, Radio, Row, Avatar } from 'antd';
import { useRequest } from 'ahooks';
import API from '@/api'

import './index.less';

function SideCard({ item }) {
    return (
        <div className="SideCard" onClick={() => history.push(`/v/${item.vid}`)}>
            <div className="cover">
                <Image width={168} src={item.cover} preview={false} referrerPolicy="no-referrer" />
            </div>
            <div className="detail">
                <h3>{item.etitle || item.title}</h3>
                <p>{item.uname}</p>
                <p>{item.pdstr}</p>
            </div>
        </div>
    )
}

function Video() {
    const ref = useRef()
    const pathParams = useParams()

    const {
        loading,
        run: fetchDetail,
        data: detailInfo = { data: {}, more: [] },
    } = useRequest(vid => API(`/video.detail/${vid}`, {
        method: 'GET',
    }), {
        manual: true,
        onSuccess: ({ data }) => {
            ref.current.src = data.filesrc
        },
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
        },
        onError: () => {
            message.error('删除失败！')
        }
    })

    useEffect(() => {
        const player = new Player({
            lang: 'zh',
            id: 'xgplayer',
            volume: 1,
            fluid: true,
            videoInit: true,
            autoplay: true,
        })
        ref.current = player

        return () => player.destroy()
    }, [])

    useEffect(() => {
        fetchDetail(pathParams.vid)
    }, [pathParams.vid])

    return (
        <div className="video-container">
            <Row gutter={40}>
                <Col flex={60}>
                    <Spin tip="视频加载中..." size="large" spinning={loading} wrapperClassName="video-spin-wrapper">
                        <div id="xgplayer" />
                    </Spin>
                    <a href={`//www.bilibili.com/video/${detailInfo.data?.vid}`} target="_blank">
                        <Typography.Title className="video-title" level={3}>
                            {detailInfo.data?.etitle || detailInfo.data?.title}
                        </Typography.Title>
                    </a>
                    <Card className="user-info-card">
                        <Card.Meta
                            avatar={<Avatar src={<Image src={detailInfo.data?.avatar} preview={false} referrerPolicy="no-referrer" />} />}
                            title={<a href={`/u/${detailInfo.data?.uid}`} target="_blank">{detailInfo.data?.uname}</a>}
                            description={detailInfo.data?.usign}
                        />
                    </Card>
                </Col>
                <Col flex={1} style={{ minWidth: 400 }}>
                    <List
                        itemLayout="horizontal"
                        dataSource={detailInfo.more}
                        renderItem={(item) => (
                            <List.Item>
                                <SideCard item={{ ...item, uname: detailInfo.data.uname }} />
                            </List.Item>
                        )}
                    />
                    {
                        !!detailInfo.more.length && (
                            <Button style={{ width: '100%' }} type="primary" onClick={() => history.push(`/u/${detailInfo.data.uid}`)}>
                                观看她的更多视频
                            </Button>
                        )
                    }
                </Col>
            </Row>
        </div>
    )
};

export default Video;
