<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ResolveLayout from '@/components/compare/ResolveLayout.vue'
import ResolveHeader from '@/components/compare/ResolveHeader.vue'
import ResolveFooter from '@/components/compare/ResolveFooter.vue'
import ConflictList, { type ConflictItem } from '@/components/compare/ConflictList.vue'
import ThreeWayDiff from '@/components/compare/ThreeWayDiff.vue'

const router = useRouter()

// Mock state conforming to "SCHEMA_CONFLICT_RULES.md"
const sourceName = ref('prod_db_cluster_01')
const targetName = ref('staging_db_v4')

const items = ref<ConflictItem[]>([
  { 
    id: 'users', 
    name: 'users', 
    type: 'table', 
    status: 'conflict', 
    conflictLineCount: 4 
  },
  { 
    id: 'audit_log', 
    name: 'audit_log', 
    type: 'table', 
    status: 'conflict', // New Object (Safe Addition) - masquerading as conflict for UI test
    conflictLineCount: 0 
  },
  { 
    id: 'update_ts', 
    name: 'update_timestamp_trigger', 
    type: 'trigger', 
    status: 'resolved', 
    conflictLineCount: 0 
  }
])

const selectedId = ref('users')

// Mock Content for "users" table
const sourceContent = `CREATE TABLE "users" (
  "id" UUID PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE,
  "mfa_token" VARCHAR(64) NULL,
  "mfa_enabled" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP
);`

const targetContent = `CREATE TABLE "users" (
  "id" UUID PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE,
  "totp_secret" VARCHAR(128),
  "is_mfa_active" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP
);`

const resolvedCount = computed(() => items.value.filter(i => i.status === 'resolved').length)
const conflictCount = computed(() => items.value.filter(i => i.status === 'conflict').length)

const handleCancel = () => {
  router.push('/compare')
}

const handleFinalize = () => {
  console.log('Finalize clicked')
}

const handleSelect = (id: string) => {
  selectedId.value = id
}

</script>

<template>
  <ResolveLayout>
    <template #header>
      <ResolveHeader 
        :sourceName="sourceName"
        :targetName="targetName"
        :conflictCount="conflictCount"
        @cancel="handleCancel"
        @finalize="handleFinalize"
      />
    </template>

    <template #sidebar>
      <ConflictList 
        :items="items"
        :selectedId="selectedId"
        @select="handleSelect"
      />
    </template>

    <!-- Main Content -->
    <ThreeWayDiff 
      v-if="selectedId === 'users'"
      :sourceContent="sourceContent"
      :targetContent="targetContent"
    />
    <div v-else class="flex-1 flex items-center justify-center text-slate-500 text-sm">
      Select an object to view differences
    </div>

    <template #footer>
      <ResolveFooter 
         :totalConflicts="items.length"
         :resolvedCount="resolvedCount"
         :cursorPosition="{ line: 1, col: 1 }"
      />
    </template>
  </ResolveLayout>
</template>
