import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

// Import views (we will create these files in the next step)
import Login from '../views/Login.vue';
import UserDashboard from '../views/UserDashboard.vue';
import AdminDashboard from '../views/AdminDashboard.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'Login', component: Login },
    { 
      path: '/dashboard', 
      name: 'UserDashboard', 
      component: UserDashboard, 
      meta: { requiresAuth: true, role: 'user' } // Only 'user' role allowed
    },
    { 
      path: '/admin-dashboard', 
      name: 'AdminDashboard', 
      component: AdminDashboard, 
      meta: { requiresAuth: true, role: 'admin' } // Only 'admin' role allowed
    }
  ]
});

// GLOBAL GUARD: Protects routes before every navigation
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // 1. Wait for session check on first load
  if (authStore.loading) {
    await authStore.checkSession();
  }

  // 2. If route requires auth and user is NOT logged in -> Login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login');
  }

  // 3. Role Check: If user tries to access Admin but is just a User
  if (to.meta.role && authStore.user?.role !== to.meta.role) {
    // Redirect them to their correct home based on their actual role
    if (authStore.user?.role === 'admin') return next('/admin-dashboard');
    return next('/dashboard');
  }

  next(); // Proceed
});

export default router;