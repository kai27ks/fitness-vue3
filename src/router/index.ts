import { createRouter, createWebHistory } from 'vue-router'
import { getToken, getRole } from '../api'

const routes = [
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  { path: '/', component: () => import('../views/HomeView.vue') },
  { path: '/booking', component: () => import('../views/BookingView.vue') },
  { path: '/bookings', component: () => import('../views/MyBookingsView.vue') },
  { path: '/packages', component: () => import('../views/PackagesView.vue') },
  { path: '/coach/:id', component: () => import('../views/CoachDetailView.vue') },
  { path: '/mine', component: () => import('../views/MineView.vue') },
  // ===== 会员风采（二级页，底部导航不变） =====
  { path: '/moments', component: () => import('../views/moments/SquareView.vue') },
  { path: '/moments/publish', component: () => import('../views/moments/PublishView.vue') },
  { path: '/moments/mine', component: () => import('../views/moments/MineView.vue') },
  { path: '/moments/:id', component: () => import('../views/moments/DetailView.vue') },
  // ===== 管理端 / 教练端 =====
  { path: '/admin/workbench', component: () => import('../views/admin/WorkbenchView.vue') },
  { path: '/admin/schedule', component: () => import('../views/admin/ScheduleView.vue') },
  { path: '/admin/members', component: () => import('../views/admin/MembersView.vue') },
  { path: '/admin/members/add', component: () => import('../views/admin/MemberAddView.vue') },
  { path: '/admin/members/:id', component: () => import('../views/admin/MemberDetailView.vue') },
  { path: '/admin/packages', component: () => import('../views/admin/PackagesAdminView.vue') },
  { path: '/admin/courses', component: () => import('../views/admin/CoursesView.vue') },
  { path: '/admin/courses/add', component: () => import('../views/admin/CourseFormView.vue') },
  { path: '/admin/courses/:id', component: () => import('../views/admin/CourseFormView.vue') },
  { path: '/admin/coaches', component: () => import('../views/admin/CoachesView.vue') },
  { path: '/admin/coaches/:id', component: () => import('../views/admin/CoachDetailView.vue') },
  { path: '/admin/leave', component: () => import('../views/admin/LeaveView.vue') },
  { path: '/admin/mine', component: () => import('../views/admin/MineView.vue') },
  { path: '/admin/reports', component: () => import('../views/admin/ReportsView.vue') },
  { path: '/admin/moments/review', component: () => import('../views/admin/MomentReviewView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  if (!to.meta.public && !getToken()) return '/login'
  if (to.path === '/login' && getToken()) {
    return getRole() === 'MEMBER' ? '/' : '/admin/workbench'
  }
  if (to.path === '/' && getToken() && getRole() !== 'MEMBER') return '/admin/workbench'
  // 管理端路由仅对 ADMIN/COACH 开放
  if (to.path.startsWith('/admin/') && getRole() === 'MEMBER') return '/'
  return true
})

export default router
