<template>
  <div class="sessions-view">
    <div class="view-header">
      <h2>Diagnostic Sessions</h2>
      <div class="actions">
        <button @click="newSession" class="btn btn-primary">New Session</button>
        <button @click="clearSessions" class="btn btn-secondary">Clear</button>
      </div>
    </div>
    
    <div class="session-list" v-if="sessions.length > 0">
      <div v-for="session in sessions" :key="session.id" class="session-card">
        <div class="session-header">
          <h3>Session {{ session.id }}</h3>
          <span class="status" :class="[{ active: session.active }]">{{ session.status }}</span>
        </div>
        <div class="session-info">
          <p><strong>Vehicle:</strong> {{ session.vehicle }}</p>
          <p><strong>Started:</strong> {{ session.startTime }}</p>
          <p><strong>Duration:</strong> {{ session.duration }}</p>
          <p><strong>Readings:</strong> {{ session.readingsCount }}</p>
        </div>
        <div class="session-actions">
          <button @click="viewDetails(session.id)" class="btn btn-sm">View Details</button>
          <button @click="endSession(session.id)" class="btn btn-sm btn-danger">End</button>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <p>No sessions recorded</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const sessions = ref([
  {
    id: 1,
    vehicle: 'Toyota Corolla (VIN: 1HGCM82633A004352)',
    startTime: '10:30 AM',
    duration: '15m 22s',
    status: 'Active',
    active: true,
    readingsCount: 450,
  },
  {
    id: 2,
    vehicle: 'Honda Civic (VIN: 2HGFC2F59FH500001)',
    startTime: '09:15 AM',
    duration: '42m 10s',
    status: 'Completed',
    active: false,
    readingsCount: 1280,
  }
])

function newSession() {
  alert('Starting new session...')
}

function clearSessions() {
  if (confirm('Clear all session history?')) {
    sessions.value = []
  }
}

function viewDetails(id: number) {
  alert(`Viewing details for session ${id}`)
}

function endSession(id: number) {
  alert(`Ending session ${id}`)
}
</script>

<style scoped>
.sessions-view {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.view-header h2 {
  margin: 0;
  color: #2c3e50;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-card {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 1rem;
  background: #fafafa;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.session-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #2c3e50;
}

.status {
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status.active {
  background: #d5f5e3;
  color: #27ae60;
}

.session-info {
  color: #34495e;
  margin-bottom: 0.5rem;
}

.session-info p {
  margin: 0.25rem 0;
}

.session-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
  font-style: italic;
}
</style>