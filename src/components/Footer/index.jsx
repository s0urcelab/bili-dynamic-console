import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-layout';
export default () => {
  const currentYear = new Date().getFullYear();
  return (
    <DefaultFooter
      style={{ marginTop: '-30px' }}
      copyright={`${currentYear} Powered by s0urce`}
      links={[
        {
          key: 'github',
          title: <GithubOutlined />,
          href: 'https://github.com/s0urcelab',
          blankTarget: true,
        },
      ]}
    />
  );
};
