<template>
  <MainLayout>
    <DeleteProjectConfirmModal
      :is-open="isDeleteModalOpen"
      :project-name="projectToDelete?.name || ''"
      @close="isDeleteModalOpen = false"
      @confirm="confirmDeleteProject"
    />
    
    <template #toolbar>
      <div class="flex items-center justify-between w-full h-full px-2 text-gray-400">
        <div class="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black">
           {{ $t('common.switch') }}
        </div>
      </div>
    </template>

    <template #breadcrumbs>
      <div class="flex items-center gap-2">
         <LayoutGrid class="w-3.5 h-3.5 text-gray-400" />
         <span class="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">{{ $t('projects.management') }}</span>
      </div>
    </template>

    <div class="flex-1 flex w-full h-full overflow-hidden">
      <!-- Projects Content -->
      <div class="flex-1 overflow-hidden">
        <ProjectsListView 
          @open="openProject"
          @create="createNewProject"
          @delete="handleDeleteProject"
          @rename="handleRenameProject"
          @duplicate="handleDuplicateProject"
          @toggle-protect="handleToggleProtectProject"
        />
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import MainLayout from '@/layouts/MainLayout.vue'
import ProjectsListView from '@/components/projects/ProjectsListView.vue'
import DeleteProjectConfirmModal from '@/components/projects/DeleteProjectConfirmModal.vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Folder, LayoutGrid } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const projectsStore = useProjectsStore()

const openProject = (id: string) => {
  projectsStore.selectProject(id)
  router.push({ name: 'Dashboard' })
}

onMounted(() => {
   projectsStore.viewMode = 'list'
})

const createNewProject = () => {
  let nextNumber = 1
  let newName = 'Untitled Project'
  
  const existingNames = projectsStore.projects.map(p => p.name)
  while (existingNames.includes(newName + (nextNumber > 1 ? ` ${nextNumber}` : ''))) {
    nextNumber++
  }
  
  if (nextNumber > 1) {
    newName = `${newName} ${nextNumber}`
  }

  const newProject = projectsStore.addProject({
    name: newName,
    description: '',
    connectionIds: [],
    pairIds: [],
    enabledEnvironmentIds: ['DEV', 'STAGE', 'PROD']
  })
  
  projectsStore.selectProject(newProject.id)
}

const isDeleteModalOpen = ref(false)
const projectToDelete = ref<{id: string, name: string} | null>(null)

const handleDeleteProject = (id: string) => {
  const project = projectsStore.projects.find(p => p.id === id)
  if (!project) return
  
  projectToDelete.value = { id: project.id, name: project.name }
  isDeleteModalOpen.value = true
}

const confirmDeleteProject = () => {
  if (projectToDelete.value) {
    projectsStore.removeProject(projectToDelete.value.id)
    isDeleteModalOpen.value = false
    projectToDelete.value = null
  }
}

const handleRenameProject = (id: string, newName: string) => {
  projectsStore.updateProject(id, { name: newName })
}

const handleDuplicateProject = (id: string) => {
  projectsStore.duplicateProject(id)
}

const handleToggleProtectProject = (id: string) => {
  const project = projectsStore.projects.find((p: any) => p.id === id)
  if (project) {
    projectsStore.updateProject(id, { isProtected: !project.isProtected })
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 9999px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f2937;
}
</style>


<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 9999px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f2937;
}
</style>
