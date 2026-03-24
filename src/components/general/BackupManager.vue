<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-4">
      <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
        {{ $t('backup.appData') }}
      </p>
    </div>

    <!-- Export & Import Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Export Card -->
      <button 
        @click="showExportModal = true"
        class="group relative flex flex-col p-6 overflow-hidden rounded-3xl bg-white dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-800/60 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 text-left backdrop-blur-xl"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div class="relative z-10 flex items-start justify-between mb-4">
          <div class="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-500 shadow-sm">
            <Download class="w-6 h-6" />
          </div>
          <div class="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
            <ArrowRight class="w-4 h-4 group-hover:-rotate-45 transition-transform duration-300" />
          </div>
        </div>
        
        <div class="relative z-10">
          <h3 class="text-base font-black text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{{ $t('backup.export.title') }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[90%]">Choose exactly which connections, environments, or settings to backup into a secure JSON file.</p>
        </div>
      </button>

      <!-- Import Card -->
      <label class="group relative cursor-pointer flex flex-col p-6 overflow-hidden rounded-3xl bg-white dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-800/60 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 text-left backdrop-blur-xl">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div class="relative z-10 flex items-start justify-between mb-4">
          <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-500 shadow-sm">
            <Upload class="w-6 h-6" />
          </div>
          <div class="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
            <ArrowRight class="w-4 h-4 group-hover:-rotate-45 transition-transform duration-300" />
          </div>
        </div>
        
        <div class="relative z-10">
          <h3 class="text-base font-black text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{{ $t('backup.import.title') }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[90%]">Analyze a backup file and smartly merge its contents with your current workspace.</p>
        </div>
        <input type="file" @change="onFileImportSelected" class="hidden" accept=".json" />
      </label>
    </div>

    <!-- DDL Auto-Snapshots Section -->
    <div class="pt-8 mt-4 border-t border-gray-100 dark:border-gray-800/50">
      <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-4">
        {{ $t('backup.ddlSnapshots') }}
      </p>
      
      <div class="p-6 bg-white dark:bg-gray-900/40 rounded-3xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm backdrop-blur-xl">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shadow-sm">
              <HistoryIcon class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-base font-black text-gray-900 dark:text-white">{{ $t('backup.history.title') }}</h3>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{{ $t('backup.history.desc') }}</p>
            </div>
          </div>
          <router-link to="/history" class="px-5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-xs font-bold text-purple-600 dark:text-purple-400 transition-colors flex items-center gap-2">
            {{ $t('backup.history.view') }}
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <!-- Physical Path Explorer Box -->
        <div class="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-800/50 rounded-2xl p-4 flex items-center justify-between hover:border-gray-200 dark:hover:border-gray-700 transition-colors group">
          <div class="flex items-center gap-4 min-w-0">
            <div class="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 shadow-sm group-hover:text-purple-500 group-hover:border-purple-200 dark:group-hover:border-purple-800 transition-colors">
              <Folder class="w-4 h-4 ml-0.5" />
            </div>
            <div class="min-w-0 pr-4">
              <span class="text-[10px] block font-bold text-gray-400 uppercase tracking-widest mb-1">{{ $t('backup.physicalPath') }}</span>
              <div class="flex items-center gap-2">
                <span v-if="physicalBackupPath" class="text-xs text-gray-600 dark:text-gray-400 font-mono bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-2.5 py-1 rounded-lg truncate shadow-sm">
                  {{ physicalBackupPath }}
                </span>
                <span v-else class="text-xs text-gray-400 italic">Detecting path...</span>
              </div>
            </div>
          </div>
          <button 
            @click="handleOpenFolder"
            class="shrink-0 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-sm hover:shadow-md transition-all active:scale-95"
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
