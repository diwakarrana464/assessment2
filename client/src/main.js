import { createApp } from 'vue';
import { createPinia } from 'pinia'; // Import Pinia
import './style.css';
import App from './App.vue';
import router from './router'; // Import Router

const app = createApp(App);

app.use(createPinia()); // Enable Store
app.use(router);        // Enable Router

app.mount('#app');