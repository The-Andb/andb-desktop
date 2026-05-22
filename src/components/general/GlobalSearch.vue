<template>
  <div class="relative flex items-center gap-1.5">
    <div 
      class="relative flex items-center h-8 transition-all duration-300"
      :class="isFocused || appStore.globalSearchQuery ? 'w-80' : 'w-48'"
    >
      <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
        <Search class="w-3.5 h-3.5" />
      </div>
      
      <input
        ref="searchInput"
        v-model="appStore.globalSearchQuery"
        type="text"
        :placeholder="placeholderText"
        class="w-full h-full pl-8 bg-gray-100/80 dark:bg-gray-800/80 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 rounded-lg text-xs font-medium transition-all shadow-none focus:shadow-sm placeholder:text-gray-400 placeholder:font-medium"
        :class="(isFocused || appStore.globalSearchQuery) && (isCompareView || isSchemaView) ? 'pr-24' : 'pr-8'"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.esc="searchInput?.blur()"
      />

      <!-- Unified Search Icons (VS Code Style) -->
      <div 
        v-if="(isFocused || appStore.globalSearchQuery) && (isCompareView || isSchemaView)" 
        class="absolute inset-y-0 right-7 flex items-center pr-1.5 space-x-0.5"
      >
        <button
          @click.stop="appStore.globalSearchFlags.caseSensitive = !appStore.globalSearchFlags.caseSensitive"
          class="p-0.5 rounded transition-all duration-200"
          :class="appStore.globalSearchFlags.caseSensitive ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
          title="Match Case (Aa)"
        >
          <CaseSensitive class="w-3.5 h-3.5" />
        </button>
        <button
          @click.stop="appStore.globalSearchFlags.wholeWord = !appStore.globalSearchFlags.wholeWord"
          class="p-0.5 rounded transition-all duration-200"
          :class="appStore.globalSearchFlags.wholeWord ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
          title="Match Whole Word (ab)"
        >
          <WholeWord class="w-3.5 h-3.5" />
        </button>
        <button
          @click.stop="appStore.globalSearchFlags.regex = !appStore.globalSearchFlags.regex"
          class="p-0.5 rounded transition-all duration-200"
          :class="appStore.globalSearchFlags.regex ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
          title="Use Regular Expression (*)"
        >
          <Regex class="w-3.5 h-3.5" />
        </button>

        <!-- Advanced Search Options Dropdown -->
        <div class="relative flex items-center">
          <button
            @click.stop="isAdvancedDropdownOpen = !isAdvancedDropdownOpen"
            class="p-0.5 rounded transition-all duration-200"
            :class="
              isAdvancedDropdownOpen
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                : appStore.globalSearchFlags.content || appStore.globalSearchFlags.columns
                  ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400 font-bold'
                  : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            "
            title="More Search Options (...)"
          >
            <MoreHorizontal class="w-3.5 h-3.5" />
          </button>

          <!-- Dropdown Menu -->
          <div v-if="isAdvancedDropdownOpen" class="fixed inset-0 z-40" @click="isAdvancedDropdownOpen = false"></div>
          <div
            v-if="isAdvancedDropdownOpen"
            class="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div class="px-2 py-1.5 border-b border-gray-100 dark:border-gray-800 mb-1">
              <span class="text-[9px] font-black uppercase tracking-widest text-gray-400">Advanced Search</span>
            </div>
            
            <button
              @click.stop="appStore.globalSearchFlags.content = !appStore.globalSearchFlags.content"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors group/item"
              :class="
                appStore.globalSearchFlags.content
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              "
            >
              <div 
                class="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all"
                :class="
                  appStore.globalSearchFlags.content
                    ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-transparent group-hover/item:border-primary-500/50'
                "
              >
                <Check class="w-3 h-3" />
              </div>
              <div class="flex items-center gap-1.5">
                <FileCode class="w-3.5 h-3.5" />
                <span class="text-[10px] font-bold">{{ $t('navigation.actions.deepSearch') }}</span>
              </div>
            </button>

            <button
              @click.stop="appStore.globalSearchFlags.columns = !appStore.globalSearchFlags.columns"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors group/item"
              :class="
                appStore.globalSearchFlags.columns
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              "
            >
              <div 
                class="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all"
                :class="
                  appStore.globalSearchFlags.columns
                    ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-transparent group-hover/item:border-primary-500/50'
                "
              >
                <Check class="w-3 h-3" />
              </div>
              <div class="flex items-center gap-1.5">
                <Binary class="w-3.5 h-3.5" />
                <span class="text-[10px] font-bold">{{ $t('navigation.actions.columnSearch') }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Shortcut Hint -->
      <div 
        v-if="!appStore.globalSearchQuery && !isFocused" 
        class="absolute inset-y-0 right-2 flex items-center pointer-events-none"
      >
        <span class="text-[9px] font-bold text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1 tracking-widest bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">⌘K</span>
      </div>

      <!-- Clear Button -->
      <button
        v-if="appStore.globalSearchQuery"
        @click="clearSearch"
        class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Filter Dropdown (Compare Only) -->
    <div v-if="isCompareView" class="relative">
      <button
        @click="isFilterDropdownOpen = !isFilterDropdownOpen"
        class="flex items-center justify-center w-8 h-8 rounded-lg transition-all border group"
        :class="
          appStore.globalSearchFilter !== 'all'
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500 border-primary-500/30 shadow-sm shadow-primary-500/10'
            : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
        "
        title="Filter by Status"
      >
        <ListFilter class="w-4 h-4 transition-transform group-hover:scale-110" />
        <div 
          v-if="appStore.globalSearchFilter !== 'all'"
          class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary-500 ring-2 ring-white dark:ring-gray-900"
        ></div>
      </button>

      <!-- Dropdown -->
      <div v-if="isFilterDropdownOpen" class="fixed inset-0 z-40" @click="isFilterDropdownOpen = false"></div>
      <div
        v-if="isFilterDropdownOpen"
        class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div class="px-2 py-1.5 border-b border-gray-100 dark:border-gray-800 mb-1">
          <span class="text-[9px] font-black uppercase tracking-widest text-gray-400">Filter Status</span>
        </div>
        
        <button
          v-for="filter in statusFilters"
          :key="filter.value"
          @click="selectFilter(filter.value)"
          class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors group/item"
          :class="
            appStore.globalSearchFilter === filter.value
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          "
        >
          <div 
            class="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all"
            :class="
              appStore.globalSearchFilter === filter.value
                ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-transparent group-hover/item:border-primary-500/50'
            "
          >
            <Check class="w-3 h-3" />
          </div>
          <span class="uppercase tracking-wide text-[10px]">{{ filter.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, X, ListFilter, Check, CaseSensitive, WholeWord, Regex, FileCode, Binary, MoreHorizontal } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const searchInput = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)
const isFilterDropdownOpen = ref(false)
const isAdvancedDropdownOpen = ref(false)

const isCompareView = computed(() => route.path === '/compare')
const isSchemaView = computed(() => route.path === '/schema')
const isHistoryView = computed(() => route.path === '/history')

const isSearchableRoute = computed(() => {
  return ['/schema', '/compare', '/history'].includes(route.path)
})

const placeholderText = computed(() => {
  if (isCompareView.value) return 'Search in Compare...'
  if (isSchemaView.value) return 'Search in Schema...'
  if (isHistoryView.value) return 'Search in History...'
  return 'Search...'
})

const statusFilters = [
  { label: 'All Results', value: 'all' },
  { label: 'Modified Only', value: 'modified' },
  { label: 'New Only', value: 'new' },
  { label: 'Deprecated Only', value: 'deprecated' },
  { label: 'Equal Only', value: 'equal' }
] as const

const handleFocus = () => {
  isFocused.value = true
  if (!isSearchableRoute.value) {
    router.push('/schema')
  }
}

const handleBlur = () => {
  if (!appStore.globalSearchQuery) {
    isFocused.value = false
  }
}

const clearSearch = () => {
  appStore.globalSearchQuery = ''
  searchInput.value?.focus()
}

const selectFilter = (val: 'all' | 'modified' | 'new' | 'deprecated' | 'equal') => {
  appStore.globalSearchFilter = val
  isFilterDropdownOpen.value = false
}

const focusSearch = () => {
  if (!isSearchableRoute.value) {
    router.push('/schema')
    setTimeout(() => {
      searchInput.value?.focus()
      if (appStore.globalSearchQuery) {
        searchInput.value?.select()
      }
    }, 50)
  } else {
    searchInput.value?.focus()
    if (appStore.globalSearchQuery) {
      searchInput.value?.select()
    }
  }
}

// Global Keyboard Shortcut Listener
const handleKeydown = (e: KeyboardEvent) => {
  // Cmd+F or Cmd+K
  if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'k')) {
    e.preventDefault()
    focusSearch()
  }
}

// Watch query to auto-redirect when typing on other views
watch(() => appStore.globalSearchQuery, (newVal) => {
  if (newVal && !isSearchableRoute.value) {
    router.push('/schema')
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('andb-focus-search', focusSearch)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('andb-focus-search', focusSearch)
})
</script>
