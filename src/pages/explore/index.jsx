import { useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { history, useParams, useLocation } from 'umi'
import Icon, { CheckCircleFilled, SyncOutlined, WarningFilled, UndoOutlined } from '@ant-design/icons'
import { Divider, Skeleton, message, Image, Input, Space, Button, Col, Card, List, Typography, Row, Avatar } from 'antd'
import { useRequest } from 'ahooks'
import VideoCard from '@/components/VideoCard'
import API from '@/api'
import './index.less'

function Explore() {
    const [page, setPage] = useState(1)
    const [danceList, setDanceList] = useState([])
    const [total, setTotal] = useState(0)
    const [upList, setUpList] = useState([])
    const location = useLocation()

    const {
        run: fetchList,
    } = useRequest(params => API(`/exp.list`, {
        method: 'GET',
        params,
    }), {
        manual: true,
        onSuccess: ({ data, total }) => {
            setDanceList([...danceList, ...data])
            setTotal(total)
        },
    })

    const {
        run: search,
    } = useRequest(params => API(`/fuzzy.search`, {
        method: 'GET',
        params,
    }), {
        manual: true,
        onSuccess: ({ data }) => {
            setUpList(data?.ups)
            setDanceList(data?.videos)
            setTotal(data?.videos.length)
        },
    })

    useEffect(() => {
        if (page > 1 && !location.query.keyword) {
            fetchList({ page })
        }
    }, [page])

    useEffect(() => {
        if (location.query.keyword) {
            search({ keyword: location.query.keyword })
        } else {
            setDanceList([])
            setUpList([])
            fetchList({ page: 1 })
        }
    }, [location.query.keyword])

    const filterUser = (item, e) => {
        e && e.stopPropagation()
        history.push(`/u/${item.uid}`)
    }

    const onSearch = val => {
        const keyword = val.trim()
        if (keyword) {
            history.push(`?keyword=${keyword}`)
        } else {
            history.push(`?`)
        }
    }

    return (
        <>
            <Row justify="center" gutter={20} style={{ marginBottom: 20 }}>
                <Col flex={1} style={{ maxWidth: 700 }}>
                    <Input.Search
                        placeholder="搜索稿件 / UP主"
                        allowClear
                        enterButton
                        size="large"
                        onSearch={onSearch}
                        defaultValue={location.query.keyword}
                    />
                </Col>
            </Row>
            <div id="scrollableDiv">
                <InfiniteScroll
                    dataLength={danceList.length}
                    next={() => setPage(p => p + 1)}
                    hasMore={danceList.length !== total}
                    loader={
                        <Skeleton
                            paragraph={{
                                rows: 1,
                            }}
                            active
                        />
                    }
                    endMessage={<Divider plain>没有了捏~🤐</Divider>}
                    scrollableTarget="scrollableDiv"
                >
                    {
                        !!upList.length && (
                            <>
                            <Typography.Title level={2}>🥵 UP主</Typography.Title>
                            <List
                                grid={{
                                    gutter: 16,
                                    xs: 4,
                                    sm: 4,
                                    md: 6,
                                    lg: 6,
                                    xl: 8,
                                    xxl: 8,
                                }}
                                rowKey="uid"
                                dataSource={upList}
                                renderItem={(item) => (
                                    <List.Item>
                                        <Card hoverable>
                                            <div className="search-up-card" onClick={() => filterUser(item)}>
                                                <Avatar size={100} src={<Image src={item.avatar} preview={false} referrerPolicy="no-referrer" />} />
                                                <h3>{item.uname}</h3>
                                            </div>
                                        </Card>
                                    </List.Item>
                                )}
                            />
                            </>
                        )
                    }
                    <Typography.Title level={2}>🎬 视频</Typography.Title>
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
                                    onUserClick={e => filterUser(item, e)}
                                />
                            </List.Item>
                        )}
                    />
                </InfiniteScroll>
            </div>
        </>
    );
};

export default Explore;
