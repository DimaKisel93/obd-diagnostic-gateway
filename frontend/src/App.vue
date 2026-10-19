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
  background-color: var(--color-light);
}

header {
  background-color: var(--color-dark);
  color: var(--color-white);
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-md);
}

header h1 {
  margin: 0;
  font-size: 1.5rem;
}

nav {
  display: flex;
  gap: var(--spacing-md);
}

nav a {
  color: var(--color-light);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all 0.3s;
}

nav a:hover {
  background-color: #34495e;
}

nav a.router-link-active {
  background-color: var(--color-primary);
}

main {
  flex: 1;
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

footer {
  background-color: var(--color-dark);
  color: var(--color-white);
  padding: var(--spacing-sm) var(--spacing-lg);
  text-align: center;
  font-size: 0.9rem;
}
</style>