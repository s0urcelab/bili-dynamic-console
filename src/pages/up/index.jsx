import { useEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { history, useParams, useLocation } from 'umi';
import Icon, { CheckCircleFilled, SyncOutlined, WarningFilled, UndoOutlined } from '@ant-design/icons';
import { Badge, Divider, Skeleton, message, Image, Input, Space, Button, Col, Card, List, Radio, Row, Avatar, Typography } from 'antd';
import { useRequest } from 'ahooks';
import VideoCard from '@/components/VideoCard'
import API from '@/api'

import './index.less'

function Up() {
    const [page, setPage] = useState(1)
    const [danceList, setDanceList] = useState([])
    const pathParams = useParams()

    const {
        run: fetchList,
        data: expData = { total: 0 },
    } = useRequest(params => API(`/exp.list`, {
        method: 'GET',
        params,
    }), {
        manual: true,
        onSuccess: ({ data }) => {
            setDanceList([...danceList, ...data])
        },
    })

    const {
        data: upInfo = { data: {} },
    } = useRequest(() => API(`/up.info/${pathParams.uid}`, {
        method: 'GET',
    }))

    useEffect(() => {
        const query = pathParams.uid ? { page, uid: pathParams.uid } : { page }
        fetchList(query)
    }, [page])

    return (
        <>
            <Row gutter={20} style={{ marginBottom: 20 }}>
                <Col>
                    <Badge count={expData?.total}>
                        <Avatar size="large" src={<Image src={upInfo.data?.avatar} preview={false} referrerPolicy="no-referrer" />} />
                    </Badge>
                </Col>
                <Col>
                    <Typography.Title level={3}>{upInfo.data?.uname}</Typography.Title>
                </Col>
                <Col>
                    <Button type="primary" shape="round" href={`https://space.bilibili.com/${upInfo.data?.uid}/video`} target="_blank">前往个人主页</Button>
                </Col>
            </Row>
            <div id="scrollableDiv" style={{ height: 'calc(100vh - 170px)' }}>
                <InfiniteScroll
                    dataLength={danceList.length}
                    next={() => setPage(p => p + 1)}
                    hasMore={danceList.length !== expData.total}
                    loader={
                        <Skeleton
                            avatar
                            paragraph={{
                                rows: 1,
                            }}
                            active
                        />
                    }
                    endMessage={<Divider plain>没有视频了捏~🤐</Divider>}
                    scrollableTarget="scrollableDiv"
                >
                    <List
                        grid={{
                            gutter: 16,
                            xs: 1,
                            sm: 2,
                            md: 4,
                            lg: 4,
                            xl: 5,
                            xxl: 5,
                        }}
                        rowKey="vid"
                        dataSource={danceList}
                        renderItem={(item) => (
                            <List.Item>
                                <VideoCard
                                    item={item}
                                    onCardClick={() => window.open(`/v/${item.vid}`, '_blank')}
                                />
                            </List.Item>
                        )}
                    />
                </InfiniteScroll>
            </div>
        </>
    );
};

export default Up;
