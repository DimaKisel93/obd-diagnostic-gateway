<template>
  <div class="app-container">
    <header>
      <h1>OBD-II Diagnostic Gateway</h1>
      <nav>
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/history">History</RouterLink>
        <RouterLink to="/sessions">Sessions</RouterLink>
        <RouterLink to="/settings">Settings</RouterLink>
      </nav>
    </header>
    
    <main>
      <RouterView />
    </main>
    
    <footer>
      <p>Connection Status: {{ connectionStatus }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useOBDStore } from './stores/obd'

const connectionStatus = ref('disconnected')
const obdStore = useOBDStore()

onMounted(() => {
  // Initial status check
  connectionStatus.value = obdStore.connectionState
  
  // Watch for connection state changes
  watch(() => obdStore.connectionState, (newState) => {
    connectionStatus.value = newState
  })
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

header h1 {
  margin: 0;
  font-size: 1.5rem;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  color: #ecf0f1;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s;
}

nav a:hover {
  background-color: #34495e;
}

nav a.router-link-active {
  background-color: #3498db;
}

main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

footer {
  background-color: #2c3e50;
  color: white;
  padding: 0.5rem 2rem;
  text-align: center;
  font-size: 0.9rem;
}
</style>