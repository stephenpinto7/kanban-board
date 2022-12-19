import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/LoginLayout.vue'),
    children: [{ path: '', component: () => import('pages/LoginPage.vue') }],
  },
  {
    path: '/register',
    component: () => import('layouts/LoginLayout.vue'),
    children: [{ path: '', component: () => import('pages/RegisterPage.vue') }],
  },
  {
    path: '/board',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: ':boardId',
        component: () => import('pages/BoardPage.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/boards',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/BoardsPage.vue') }],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
