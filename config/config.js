// https://umijs.org/config/
import { defineConfig } from 'umi';
import defaultSettings from './defaultSettings';
import proxy from './proxy';

const { REACT_APP_ENV, API_PREFIX } = process.env;

export default defineConfig({
  base: '/', // 打包路径，默认是/
  publicPath: '/static/', // 资源访问路径，默认/
  hash: true,
  antd: {
    // dark: true,
  },
  dva: {
    hmr: true,
  },
  layout: {
    // https://umijs.org/zh-CN/plugins/plugin-layout
    locale: true,
    siderWidth: 208,
    ...defaultSettings,
  },
  // https://umijs.org/zh-CN/plugins/plugin-locale
  locale: {
    // default zh-CN
    default: 'zh-CN',
    antd: true,
  },
  dynamicImport: {
    loading: '@ant-design/pro-layout/es/PageLoading',
  },
  // umi routes: https://umijs.org/docs/routing
  routes: [
    {
      path: '/explore',
      name: 'explore',
      icon: 'profile',
      component: './explore',
    },
    {
      path: '/u/:uid',
      component: './up',
    },
    {
      path: '/v/:vid',
      component: './video',
    },
    {
        path: '/login',
        component: './login',
      },
    {
      path: '/manage',
      name: 'manage',
      icon: 'profile',
      component: './manage',
    },
    {
      path: '/',
      redirect: '/explore'
    },
    {
      component: '404',
    },
  ],
  // Theme for antd: https://ant.design/docs/react/customize-theme-cn
  theme: {
    'primary-color': defaultSettings.primaryColor,
  },
  // esbuild is father build tools
  // https://umijs.org/plugins/plugin-esbuild
  esbuild: {},
  title: false,
  ignoreMomentLocale: true,
  proxy: proxy[REACT_APP_ENV || 'dev'],
  manifest: {
    basePath: '/',
  },
  // Fast Refresh 热更新
  fastRefresh: {},
  nodeModulesTransform: {
    type: 'none',
  },
  mfsu: {},
  webpack5: {},
  exportStatic: {},
  define: {
    API_PREFIX: API_PREFIX || 'https://rcc.src.moe:8000/api',
  },
  // analyze: {
  //   analyzerMode: 'server',
  //   analyzerPort: 8888,
  //   openAnalyzer: true,
  //   // generate stats file while ANALYZE_DUMP exist
  //   generateStatsFile: false,
  //   statsFilename: 'stats.json',
  //   logLevel: 'info',
  //   defaultSizes: 'parsed', // stat  // gzip
  // },
});
