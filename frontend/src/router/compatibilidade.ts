import type { RouteRecordRaw } from 'vue-router';

export const rotasAnteriores: RouteRecordRaw[] = [{
  path: '/pix/:resto(.*)*',
  redirect: (to) => ({
    path: to.path.replace(/^\/pix(?=\/|$)/, '/transferencias'),
    query: to.query,
    hash: to.hash,
  }),
}];
