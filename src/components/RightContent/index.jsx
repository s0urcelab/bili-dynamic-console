import { Space, Badge } from 'antd';
import { Link } from 'umi';

const NOW_VERSION = 4

const GlobalHeaderRight = () => {
  const isRead = JSON.parse(window.localStorage['WOT_CHANGELOG_VER'] || 0) === NOW_VERSION
  const readIt = () => {
    window.localStorage['WOT_CHANGELOG_VER'] = NOW_VERSION
  }


  return (
    <Space>
      {/* <Link to="/message">留言板</Link>
      <a href="https://src.moe/donate" target="_blank">捐助我们</a>
      <Badge
        dot
        count={+!isRead}
        onClick={readIt}
      >
        <Link to="/changelogs">更新日志</Link>
      </Badge> */}
    </Space>
  );
};

export default GlobalHeaderRight;
