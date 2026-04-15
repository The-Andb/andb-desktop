<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-4">
      <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
        {{ $t('backup.appData') }}
      </p>
    </div>

    <!-- Export & Import Actions (Flat Style) -->
    <div class="space-y-4">
      <!-- Export Action -->
      <button 
        @click="showExportModal = true"
        class="group relative flex items-center gap-6 p-6 rounded-2xl hover:bg-gray-100/30 dark:hover:bg-white/5 transition-all duration-300 text-left border-b border-gray-100 dark:border-gray-800/40"
      >
        <div class="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0 group-hover:scale-110 transition-transform">
          <Download class="w-6 h-6" />
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1 group-hover:text-primary-600 transition-colors">{{ $t('backup.export.title') }}</h3>
          <p class="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed font-medium">Choose connections, environments, or settings to backup into a secure JSON file.</p>
        </div>
        <ArrowRight class="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
      </button>

      <!-- Import Action -->
      <label class="group relative flex items-center gap-6 p-6 rounded-2xl hover:bg-gray-100/30 dark:hover:bg-white/5 transition-all duration-300 text-left cursor-pointer border-b border-gray-100 dark:border-gray-800/40">
        <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
          <Upload class="w-6 h-6" />
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1 group-hover:text-blue-600 transition-colors">{{ $t('backup.import.title') }}</h3>
          <p class="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed font-medium">Analyze a backup file and smartly merge its contents with your current workspace.</p>
        </div>
        <ArrowRight class="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        <input type="file" @change="onFileImportSelected" class="hidden" accept=".json" />
      </label>
    </div>

    <!-- DDL Auto-Snapshots Section -->
    <div class="pt-8 mt-4 border-t border-gray-100 dark:border-gray-800/50">
      <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-4">
        {{ $t('backup.ddlSnapshots') }}
      </p>
      
      <div class="space-y-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <HistoryIcon class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('backup.history.title') }}</h3>
              <p class="text-[11px] text-gray-400 mt-0.5 font-medium">{{ $t('backup.history.desc') }}</p>
            </div>
          </div>
          <router-link to="/history" class="px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-primary-500 dark:hover:bg-primary-400 text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2">
            {{ $t('backup.history.view') }}
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <!-- Physical Path Explorer Row (Flat Style) -->
        <div class="flex items-center justify-between gap-6 p-4 rounded-xl hover:bg-gray-100/30 dark:hover:bg-white/5 transition-colors group">
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <div class="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-purple-500 transition-colors">
              <Folder class="w-4 h-4 ml-0.5" />
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-[9px] block font-black text-gray-400 uppercase tracking-widest mb-1">{{ $t('backup.physicalPath') }}</span>
              <div class="flex items-center gap-2">
                <span v-if="physicalBackupPath" class="text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate">
                  {{ physicalBackupPath }}
                </span>
                <span v-else class="text-[11px] text-gray-300 italic">Detecting path...</span>
              </div>
            </div>
          </div>
          <button 
            @click="handleOpenFolder"
            class="shrink-0 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            {{ $t('backup.exploreFiles') }}
          </button>
        </div>
      </div>
    </div>

    <ExportBackupModal 
      :isOpen="showExportModal" 
      @close="showExportModal = false" 
      @success="onExportSuccess" 
    />

    <ImportBackupModal 
      :isOpen="showImportModal" 
      :fileToRead="importFile"
      @close="showImportModal = false" 
      @success="onImportSuccess" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, Upload, History as HistoryIcon, Folder, ArrowRight } from 'lucide-vue-next'
import ExportBackupModal from './ExportBackupModal.vue'
import ImportBackupModal from './ImportBackupModal.vue'
import Andb from '@/utils/andb'
import { useNotificationStore } from '@/stores/notification'

const { t } = useI18n()
const notificationStore = useNotificationStore()

const showExportModal = ref(false)
const showImportModal = ref(false)
const importFile = ref<File | null>(null)
const physicalBackupPath = ref<string>('')

onMounted(async () => {
  try {
    physicalBackupPath.value = await (window as any).electronAPI.getBackupPath()
  } catch (error) {
    console.error('Failed to fetch backup path:', error)
  }
})

const onFileImportSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    importFile.value = file
    showImportModal.value = true
  }
  // Reset input so the same file can be selected again if needed
  target.value = ''
}

const onExportSuccess = () => {
  showExportModal.value = false
  notificationStore.add({
    type: 'success',
    title: t('backup.export.successTitle'),
    message: t('backup.export.successMsg')
  })
}

const onImportSuccess = () => {
  showImportModal.value = false
  importFile.value = null
  notificationStore.add({
    type: 'success',
    title: 'Import Successful',
    message: 'Selected configurations were smartly merged into your workspace.'
  })
  // Let the user see the success message briefly before reload
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

const handleOpenFolder = async () => {
  const success = await Andb.openBackupFolder()
  if (!success) {
    notificationStore.add({
      type: 'error',
      title: t('common.error'),
      message: t('backup.openFolderFailed')
    })
  }
}
</script>
