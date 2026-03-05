<template>
  <MainLayout>
    <template #toolbar>
      <div class="flex items-center justify-between w-full h-full gap-4">
        <!-- Title & Page Status -->
        <div class="flex items-center gap-4">
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
              <GitMerge class="w-5 h-5 mr-2 text-primary-500" />
              {{ $t('common.compare') }}
            </h1>
            <div v-if="activePair && activePair.source && activePair.target" class="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
               <span class="text-blue-500">{{ activePair.source.name }}</span>
               <span v-if="isSourceDump" class="ml-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-[8px] font-black border border-orange-200 dark:border-orange-800/50">STATIC</span>
               <ArrowRightLeft class="w-3 h-3 mx-2 opacity-50 text-gray-400" />
               <span class="text-green-500">{{ activePair.target.name }}</span>
               <span v-if="isTargetDump" class="ml-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-[8px] font-black border border-orange-200 dark:border-orange-800/50">STATIC</span>
               <span v-if="hasResults" class="ml-3 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800/30">
                 {{ countSummary }}
               </span>
            </div>
            <p v-else class="text-[10px] text-gray-400 uppercase tracking-widest font-bold italic">{{ $t('compare.noPair') }}</p>
          </div>
        </div>

     <!-- Right Actions & Controls -->
     <div class="flex items-center gap-4">
        <!-- View Mode Switch -->
        <div 
          v-if="!showMigrateModal"
          class="flex items-center gap-3"
        >
          <!-- Segmented Control for View Mode -->
          <div 
            class="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl"
            :class="appStore.buttonStyle === 'minimal' ? 'scale-90' : ''"
          >
              <button 
                @click="viewMode = 'list'" 
                class="flex items-center gap-2 rounded-lg font-bold uppercase transition-all duration-200"
                :class="[
                  viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
                  appStore.buttonStyle === 'full' ? 'px-3 py-1.5 text-[10px]' : 'px-2 py-1 text-[10px]'
                ]"
                :title="$t('compare.listViewTooltip')"
              >
                <List class="w-3.5 h-3.5" />
                <span v-if="appStore.buttonStyle !== 'icons' && appStore.buttonStyle === 'full'">{{ $t('compare.listView') }}</span>
              </button>
              <button 
                @click="viewMode = 'tree'" 
                class="flex items-center gap-2 rounded-lg font-bold uppercase transition-all duration-200"
                :class="[
                  viewMode === 'tree' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
                  appStore.buttonStyle === 'full' ? 'px-3 py-1.5 text-[10px]' : 'px-2 py-1 text-[10px]'
                ]"
                :title="$t('compare.treeViewTooltip')"
              >
                <GitMerge class="w-3.5 h-3.5 rotate-90" />
                <span v-if="appStore.buttonStyle !== 'icons' && appStore.buttonStyle === 'full'">{{ $t('compare.treeViewLabel') }}</span>
              </button>
          </div>

          <div v-if="appStore.buttonStyle === 'full'" class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <!-- Safe Mode Toggle -->
          <div class="relative flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 select-none">
             <ShieldCheck class="w-4 h-4" :class="appStore.safeMode ? 'text-green-500' : 'text-gray-400'" />
             
             <div class="flex items-center gap-1">
               <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-help" :title="$t('common.tooltips.safeMode', 'Safe Mode prevents potentially destructive actions during comparisons and migrations.')">{{ $t('schema.safeMode', 'Safe Mode') }}</span>
               <button @click="showSafeModeInfo = !showSafeModeInfo" class="text-gray-400 hover:text-primary-500 transition-colors p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                 <Info class="w-3 h-3" />
               </button>
             </div>
             
             <button 
               @click="appStore.safeMode = !appStore.safeMode"
               class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ml-1"
               :class="appStore.safeMode ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'"
             >
               <span 
                 class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                 :class="appStore.safeMode ? 'translate-x-4' : 'translate-x-0'"
               ></span>
             </button>

             <!-- Info Popover -->
             <div v-if="showSafeModeInfo" class="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
               <div class="flex items-start justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                 <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-widest">
                   <ShieldCheck class="w-4 h-4 text-green-500"/> {{ $t('schema.safeMode', 'Safe Mode') }} Info
                 </h3>
                 <button @click="showSafeModeInfo = false" class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X class="w-3.5 h-3.5"/></button>
               </div>
               <div class="text-gray-600 dark:text-gray-300 space-y-3 text-xs leading-relaxed">
                 <p>
                   <span class="font-bold text-green-500 flex items-center gap-1 mb-0.5"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> ON (Dry Run)</span>
                   Simulates changes without affecting your database. Generates SQL for preview only. <span class="text-gray-400 italic">Recommended.</span>
                 </p>
                 <p>
                   <span class="font-bold text-red-500 flex items-center gap-1 mb-0.5"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> OFF (Execute)</span>
                   Executes actual CREATE, ALTER, and DROP statements directly on the database. <span class="text-red-400 font-bold">Use with extreme caution!</span>
                 </p>
               </div>
             </div>
          </div>

          <button 
            @click="runComparison()" 
            :disabled="loading || !activePair"
            class="flex items-center justify-center font-bold uppercase transition-all duration-300 disabled:opacity-50 disabled:grayscale"
            :class="[
              appStore.buttonStyle === 'full' ? 'px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs tracking-wide shadow-md active:scale-95 gap-2' : '',
              appStore.buttonStyle === 'minimal' ? 'px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-[10px] tracking-wider active:scale-95 shadow-sm gap-2' : '',
              appStore.buttonStyle === 'icons' ? 'w-10 h-10 bg-primary-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-95' : ''
            ]"
            :title="$t('compare.runCompareTooltip')"
          >
            <GitCompare v-if="!(loading && loadingAction === 'compare')" class="w-4 h-4" />
            <RefreshCw v-else class="w-4 h-4 animate-spin" />
            <span v-if="appStore.buttonStyle !== 'icons'">{{ (loading && loadingAction === 'compare') ? $t('compare.comparing') : (appStore.buttonStyle === 'full' ? $t('compare.compare') : $t('compare.compare')) }}</span>
          </button>
       </div>
       
       <!-- Console Toggle -->
       <button 
          @click="consoleStore.toggleVisibility()" 
          class="p-2 rounded-xl text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all border border-transparent"
          :title="$t('console.toggle')"
        >
          <PanelBottom class="w-4 h-4" />
        </button>
     </div>
   </div>
    </template>
        
        <!-- Comparison & Console Split -->
        <div class="flex-1 flex flex-col overflow-hidden relative min-w-0 bg-white dark:bg-gray-950">
          <!-- Comparison Area (Top) -->
          <div class="flex-1 flex overflow-hidden relative min-w-0">
            <main class="flex-1 flex overflow-hidden relative min-w-0">
              <!-- Loading Overlay (removed) -->
          <!-- Vertical Split: Object List vs DDL View -->
          <div v-if="viewMode === 'list'" class="flex-1 flex overflow-hidden relative min-w-0">
            <!-- Left: Comparison Results List (Sub-sidebar style) -->
            <div :style="{ width: showMigrateModal ? '60px' : resultsWidth + 'px' }" class="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 flex flex-col shrink-0 relative transition-all duration-300">
              <!-- Results Header with Breadcrumb-like stack navigation -->
              <div class="p-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-10 flex items-center shrink-0 justify-center">
                <button 
                  v-if="selectedFilterType !== 'all'"
                  @click="selectedFilterType = 'all'"
                  class="p-1 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors text-gray-500"
                  :class="showMigrateModal ? '' : 'mr-2'"
                  title="Back to Database Overview"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
                <div class="flex items-center min-w-0" :class="showMigrateModal ? 'justify-center' : 'flex-1'">
                  <span class="text-primary-600 dark:text-primary-400 shrink-0" :class="showMigrateModal ? '' : 'mr-1.5'">
                    <Database v-if="selectedFilterType === 'all'" class="w-3.5 h-3.5" />
                    <component v-else :is="getIconForType(selectedFilterType)" class="w-3.5 h-3.5" />
                  </span>
                  <div v-if="!showMigrateModal" class="flex flex-col min-w-0">
                    <span class="truncate text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300">
                      <span v-if="selectedFilterType === 'all'">{{ selectedPath.db || $t('common.database') }} {{ $t('common.overview') }}</span>
                      <span v-else>{{ selectedFilterType }}</span>
                    </span>
                    <span v-if="hasResults" class="text-[8px] text-gray-400 uppercase tracking-tighter">
                      {{ filteredResults.length }} {{ $t('schema.items') }} • {{ filteredTotalChanges }} {{ $t('compare.totalChanges') }}
                    </span>
                  </div>
                </div>
                <!-- Batch Migrate for single type or entire schema -->
                <button 
                  v-if="hasChanges(selectedFilterType) && !showMigrateModal"
                  @click="openBatchMigrateModal(selectedFilterType === 'all' ? 'Schema' : selectedFilterType)"
                  class="ml-auto p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                  :title="selectedFilterType === 'all' ? 'Migrate Entire Schema' : 'Migrate All in this category'"
                >
                  <Zap class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Filter & Search Bar -->
              <div v-if="hasResults && !showMigrateModal" class="p-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 space-y-2 shrink-0">
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search class="w-3.5 h-3.5 text-gray-400" />
                  </span>
                  <input 
                    v-model="searchQuery"
                    type="text" 
                    :placeholder="$t('history.searchPlaceholder')"
                    class="w-full pl-8 pr-24 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white transition-all"
                  />
                  
                   <!-- Search Flags -->
                  <div class="absolute inset-y-0 right-0 flex items-center pr-1.5 space-x-0.5">
                    <button 
                      @click="searchFlags.caseSensitive = !searchFlags.caseSensitive"
                      class="p-1 rounded transition-colors"
                      :class="searchFlags.caseSensitive ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      :title="$t('common.matchCase')"
                    >
                      <CaseSensitive class="w-3.5 h-3.5" />
                    </button>
                    <button 
                      @click="searchFlags.wholeWord = !searchFlags.wholeWord"
                      class="p-1 rounded transition-colors"
                      :class="searchFlags.wholeWord ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      :title="$t('common.wholeWord')"
                    >
                      <WholeWord class="w-3.5 h-3.5" />
                    </button>
                    <button 
                      @click="searchFlags.regex = !searchFlags.regex"
                      class="p-1 rounded transition-colors"
                      :class="searchFlags.regex ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      :title="$t('common.useRegex')"
                    >
                      <Regex class="w-3.5 h-3.5" />
                    </button>
                    
                    <button 
                      v-if="searchQuery"
                      @click="searchQuery = ''"
                      class="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div class="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                  <button 
                    v-for="filter in statusFilters" :key="filter.value"
                    @click="selectedStatusFilter = filter.value"
                    class="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter transition-all whitespace-nowrap"
                    :class="selectedStatusFilter === filter.value 
                      ? 'bg-primary-600 text-white shadow-sm' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'"
                  >
                    {{ filter.label }}
                  </button>
                </div>
              </div>
              
              <div class="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden p-2">
                <div v-if="!hasResults" class="p-8 text-center text-gray-400 h-full flex flex-col justify-center">
                  <ScanSearch class="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p v-if="!showMigrateModal" class="text-xs uppercase tracking-widest font-bold">{{ $t('history.noHistory') }}</p>
                </div>

                <!-- OVERVIEW MODE: Stack view of categories or when modal is open -->
                <div v-else-if="selectedFilterType === 'all' || showMigrateModal" class="space-y-2">
                  <div 
                    v-for="cat in resultsByCategory" :key="cat.type"
                    @click="selectedFilterType = cat.type; showMigrateModal = false"
                    class="rounded-xl transition-all cursor-pointer group flex flex-col relative"
                    :class="showMigrateModal 
                      ? 'p-2 justify-center hover:bg-gray-100 dark:hover:bg-gray-800' 
                      : 'p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-primary-500/30'"
                    :title="showMigrateModal ? `${cat.type} (${cat.items.length})` : ''"
                  >
                    <div class="flex items-center justify-between w-full">
                      <div class="flex items-center min-w-0" :class="showMigrateModal ? 'justify-center w-full' : ''">
                        <div class="rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-transform group-hover:scale-110 relative" :class="showMigrateModal ? 'p-2' : 'p-2 mr-3'">
                          <component :is="getIconForType(cat.type)" />
                          <!-- Collapsed Badge -->
                          <div v-if="showMigrateModal && cat.changes > 0" class="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-orange-500 text-white text-[9px] font-bold shadow-sm ring-2 ring-white dark:ring-gray-900 z-10">
                            {{ cat.changes }}
                          </div>
                        </div>
                        <div v-if="!showMigrateModal" class="min-w-0">
                          <div class="font-bold text-gray-900 dark:text-white uppercase text-[10px] tracking-widest">{{ cat.type }}</div>
                          <div class="text-[10px] text-gray-400">{{ cat.items.length }} items</div>
                        </div>
                      </div>
                      <div v-if="!showMigrateModal" class="flex items-center gap-3">
                        <button
                          v-if="cat.changes > 0"
                          class="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-600 hover:shadow-md dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50 dark:hover:bg-orange-600 dark:hover:text-white transition-all group/badge shadow-sm disabled:opacity-50 disabled:grayscale"
                          :title="isTargetDump ? 'Cannot migrate to a static file' : 'Click to Migrate All Changes'"
                          :disabled="isTargetDump"
                        >
                          <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-900/50 rounded w-4 h-4 group-hover/badge:bg-white/20 group-hover/badge:text-white transition-colors">
                            <Zap class="w-2.5 h-2.5 fill-current" />
                          </div>
                          <span class="font-bold text-[10px] tracking-wider">{{ cat.changes }}</span>
                        </button>
                        <ChevronRight class="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-all group-hover:translate-x-0.5" />
                      </div>
                    </div>
                    <!-- Micro progress bar -->
                    <div v-if="!showMigrateModal" class="mt-3 h-1.5 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden flex ring-1 ring-inset ring-black/5">
                      <div 
                        class="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                        :style="{ width: (cat.changes / cat.items.length * 100) + '%' }"
                      ></div>
                      <div 
                        class="h-full bg-gray-200 dark:bg-gray-600" 
                        :style="{ width: ((cat.items.length - cat.changes) / cat.items.length * 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- LIST MODE: Flat list of objects in category -->
                <div v-else class="space-y-1">
                  <div v-for="item in filteredResults" :key="item.name" 
                    @click="selectItem(item)"
                    class="cursor-pointer rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all flex items-center group"
                    :class="[
                      showMigrateModal ? 'p-2 justify-center' : 'p-2.5 justify-between',
                      { 'bg-white dark:bg-gray-800 shadow-sm border border-primary-500/20 ring-1 ring-primary-500/10': selectedItem?.name === item.name }
                    ]"
                  >
                    <div class="min-w-0" :class="showMigrateModal ? '' : 'pr-2'">
                      <div v-if="!showMigrateModal" class="font-mono truncate text-gray-900 dark:text-gray-100" :class="{ 'font-bold': selectedItem?.name === item.name }" :title="item.name" :style="{ fontSize: appStore.fontSizes.ddlName + 'px' }">
                        {{ item.name }}
                      </div>
                      <div class="text-[9px] text-gray-400 uppercase tracking-tighter flex items-center">
                        <component :is="getIconForType(item.type)" class="mr-1" :class="showMigrateModal ? 'w-4 h-4' : 'w-2.5 h-2.5'" :title="showMigrateModal ? item.name : ''" />
                        <span v-if="!showMigrateModal">{{ item.type }}</span>
                      </div>
                    </div>
                    <div v-if="!showMigrateModal" class="flex items-center justify-center w-6 h-6 shrink-0 group/status">
                      <!-- Always show status icon if identical -->
                      <component 
                        v-if="item.status === 'equal' || item.status === 'same'"
                        :is="getStatusIcon(item.status)" 
                        class="w-4 h-4 transition-all"
                        :class="getStatusClass(item.status)"
                        :title="getStatusText(item.status)"
                      />
                      <!-- Show status icon by default, swap to Zap on hover if can migrate -->
                      <template v-else>
                        <component 
                          :is="getStatusIcon(item.status)" 
                          class="w-4 h-4 transition-all group-hover/status:hidden"
                          :class="getStatusClass(item.status)"
                        />
                        <Zap 
                          v-if="!isTargetDump"
                          @click.stop="openMigrateModal(item)"
                          class="w-4 h-4 text-primary-500 hidden group-hover/status:block cursor-pointer hover:scale-125 hover:drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] active:scale-95 animate-in fade-in zoom-in-75 duration-200"
                          title="Click to Migrate"
                        />
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Resize Handle -->
              <div 
                @mousedown="startResultsResize"
                class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-400/50 transition-colors z-20"
              ></div>
            </div>

            <!-- Right: Split DDL Detail -->
            <div class="flex-1 flex flex-col bg-white dark:bg-gray-950 relative min-w-0">
               <!-- Migration Overlay -->
               <MigrationConfirm
                  v-if="showMigrateModal"
                  :is-open="showMigrateModal"
                  :loading="isMigrating"
                  :item="migratingItem"
                  :source-name="sourceName"
                  :target-name="targetName"
                  :target-is-static="isTargetDump"
                  :sql-script="migrationSql"
                  :sql-map="migrationSqlMap"
                  :fetching-sql="fetchingMigrationSql"
                  @close="showMigrateModal = false"
                  @confirm="confirmMigration"
                />

              <div v-if="selectedItem" class="h-full flex flex-col">
                <div class="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                  <div class="flex items-center text-xs space-x-2 overflow-hidden">
                    <div class="flex items-center text-gray-500 dark:text-gray-400">
                      <Server class="w-3.5 h-3.5 mr-1" />
                      <span class="truncate">{{ selectedPath.env }}</span>
                    </div>
                    <ChevronRight class="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" />
                    <div class="flex items-center text-gray-500 dark:text-gray-400">
                      <Database class="w-3.5 h-3.5 mr-1" />
                      <span class="truncate">{{ selectedPath.db }}</span>
                    </div>
                    <ChevronRight class="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" />
                    <div class="flex items-center text-gray-600 dark:text-gray-300 font-bold">
                      <component :is="getIconForType(selectedItem.type)" class="w-3.5 h-3.5 mr-1 text-gray-400" />
                      <span class="uppercase">{{ selectedItem.type }}</span>
                    </div>
                    <ChevronRight class="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" />
                    <div class="flex items-center">
                      <span class="font-bold text-gray-900 dark:text-white truncate text-sm">{{ selectedItem.name }}</span>
                    </div>
                    <span :class="getStatusClass(selectedItem.status)" class="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-opacity-10 font-black border uppercase tracking-tighter" :style="{ borderColor: 'currentColor' }">
                      {{ getStatusText(selectedItem.status) }}
                    </span>
                  </div>
                  <div class="flex space-x-2 items-center">
                    <button 
                      v-if="selectedItem.status !== 'equal' && selectedItem.status !== 'same'"
                      @click="openMigrateModal(selectedItem)" 
                      class="btn btn-primary py-1.5 px-4 text-[11px] h-9 flex items-center gap-2 group overflow-hidden relative shadow-lg shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      :disabled="isMigrating || isTargetDump"
                      :title="isTargetDump ? 'Target is read-only (Static Dump)' : $t('compare.migrateTo', { name: targetName })"
                    >
                      <Zap class="w-4 h-4 group-hover:animate-pulse" />
                      <span class="font-bold">{{ $t('compare.migrateTo', { name: targetName }) }}</span>
                      <div class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 linear skew-x-[-20deg]"></div>
                    </button>
                    <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <button @click="openDetailModal(selectedItem)" class="p-2 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm" :title="$t('compare.viewFullDefinition')">
                      <ScanSearch class="w-4.5 h-4.5 font-bold" />
                    </button>
                  </div>
                </div>
                <div class="flex-1 flex flex-col min-h-0 min-w-0">
                  <MirrorDiffView 
                    :source-ddl="selectedItem.diff?.source"
                    :target-ddl="selectedItem.diff?.target"
                    :source-label="sourceName"
                    :target-label="targetName"
                    :status="selectedItem.status"
                    :diff-options="diffOptions"
                  />
                </div>
              </div>
              <div v-else class="flex-1 flex items-center justify-center text-gray-400 italic">
                <div class="text-center">
                  <MousePointer2 class="w-12 h-12 mx-auto mb-2 opacity-10" />
                  <p>{{ $t('schema.selectObject') }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tree Mode View -->
          <div v-else class="flex-1 relative">
             <CompareTreeMode 
               :results="allResults"
               :source-name="sourceName"
               :target-name="targetName"
               :target-is-static="isTargetDump"
               v-model:active-type="selectedFilterType"
               @migrate="openMigrateModal"
             />
          </div>

        </main>
      </div>
    </div>
  </MainLayout>

    <!-- Modals & Notifications -->
    <DDLDetailModal
      :is-open="showDetailModal"
      :item="selectedItem"
      @close="closeDetailModal"
      @apply="handleApplyFromDetail"
    />

    <!-- Error Details Modal -->
    <div v-if="showErrorModal && error" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/30 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div class="p-6 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <AlertCircle class="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 class="text-lg font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('common.error') }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">An unexpected issue occurred during the operation</p>
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-950 rounded-xl p-4 border border-gray-100 dark:border-gray-800/50 font-mono text-xs text-red-600 dark:text-red-400 break-words max-h-[300px] overflow-y-auto custom-scrollbar leading-relaxed">
            {{ error }}
          </div>
          
          <div class="flex items-center gap-3 mt-2">
            <button 
              @click="showErrorModal = false"
              class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
            >
              {{ $t('common.close') }}
            </button>
            <button 
              @click="runComparison(); showErrorModal = false"
              class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>

</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import DDLDetailModal from '@/components/ddl/DDLDetailModal.vue'
import MirrorDiffView from '@/components/compare/MirrorDiffView.vue'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useConsoleStore } from '@/stores/console'
import Andb from '@/utils/andb'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  RefreshCw, 
  ScanSearch, 
  MousePointer2, 
  ChevronRight, 
  Database, 
  Server, 
  Table, 
  Layers, 
  Zap, 
  ChevronLeft, 
  CheckCircle2, 
  PlusCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  List, 
  GitMerge, 
  ArrowRightLeft, 
  GitCompare, 
  CaseSensitive, 
  WholeWord, 
  Regex, 
  X, 
  Workflow, 
  Sigma,
  ShieldCheck,
  Info
} from 'lucide-vue-next'
import MigrationConfirm from '@/components/compare/MigrationConfirm.vue'
import { useOperationsStore } from '@/stores/operations'
import { useNotificationStore } from '@/stores/notification'
import { useSidebarStore } from '@/stores/sidebar'
import CompareTreeMode from '@/components/compare/CompareTreeMode.vue'

const connectionPairsStore = useConnectionPairsStore()
const appStore = useAppStore()
const operationsStore = useOperationsStore()
const consoleStore = useConsoleStore()
const notificationStore = useNotificationStore()
const sidebarStore = useSidebarStore()
const { t } = useI18n()

const activePair = computed(() => connectionPairsStore.activePair)
const sourceName = computed(() => activePair.value?.source?.name || 'Source')
const targetName = computed(() => activePair.value?.target?.name || 'Target')

const route = useRoute()
const router = useRouter() // Ensure router is available

const isSourceDump = computed(() => {
  const conn = activePair.value?.source
  if (!conn) return false
  return conn.type === 'dump' || conn.host?.toLowerCase().endsWith('.sql') || conn.host?.includes('.sql')
})

const isTargetDump = computed(() => {
  const conn = activePair.value?.target
  if (!conn) return false
  return conn.type === 'dump' || conn.host?.toLowerCase().endsWith('.sql') || conn.host?.includes('.sql')
})

const projectsStore = useProjectsStore()

// Watch for project changes to reset state
watch(() => projectsStore.selectedProjectId, () => {
  tableResults.value = []
  procedureResults.value = []
  functionResults.value = []
  viewResults.value = []
  triggerResults.value = []
  selectedItem.value = null
  selectedFilterType.value = 'all'
  error.value = null
})

// Deep Link Handling
onMounted(async () => {
    // Check for pairId in query
    if (connectionPairsStore.connectionPairs.length === 0) {
        await connectionPairsStore.reloadData()
    }
    
    if (route.query.pairId) {
        connectionPairsStore.selectPair(route.query.pairId as string)
    } else if (connectionPairsStore.connectionPairs.length > 0 && !connectionPairsStore.activePair) {
        // Auto-select first pair if none selected
        const firstPairId = connectionPairsStore.connectionPairs[0].id
        if (firstPairId) {
            connectionPairsStore.selectPair(firstPairId)
        }
    }

    // Check for action=new (Auto Run)
    if (route.query.action === 'new') {
        // Wait a bit for stores to sync activePair from the selectPair call above
        await nextTick()
        
        // If we have an active pair, run valid comparison immediately
        if (activePair.value) {
           runComparison()
        } else {
            // Retry once after another tick if store was slow
            await nextTick()
            if (activePair.value) runComparison()
            else {
                notificationStore.add({
                    type: 'info',
                    title: 'New Comparison',
                    message: 'Please select a Connection Pair to start comparison.'
                })
            }
        }
        
        // Clean URL
        router.replace({ query: { ...route.query, action: undefined } })
    }
})

const viewMode = ref<'list' | 'tree'>('list')

// Removed fetchButtonText as there is no manual fetch button anymore



const typeIcons = {
  tables: Table,
  views: Layers,
  procedures: Workflow,
  functions: Sigma,
  triggers: Zap
}

const getIconForType = (type: string) => {
  const key = type?.toLowerCase() as keyof typeof typeIcons
  return typeIcons[key] || Database
}

// State
const loading = ref(false)
const loadingAction = ref<'compare' | null>(null)
const showSafeModeInfo = ref(false)
const statusMessage = ref('')
const resultsWidth = ref(300)
const error = ref<string | null>(null)
const tableResults = ref<any[]>([])
const procedureResults = ref<any[]>([])
const functionResults = ref<any[]>([])
const viewResults = ref<any[]>([])
const triggerResults = ref<any[]>([])
const selectedItem = ref<any>(null)
const showDetailModal = ref(false)
const selectedFilterType = ref<string>('all')
const searchQuery = ref('')
const searchFlags = ref({
  caseSensitive: false,
  wholeWord: false,
  regex: false
})
const diffOptions = ref({
  hideWhitespace: false,
  wrapLines: false,
  mode: 'unified' as 'unified' | 'split',
  showChangesOnly: true // default to true
})
const selectedStatusFilter = ref('all')
const lastCompareTime = ref(0)
const showErrorModal = ref(false)

const statusFilters = computed(() => [
  { label: t('common.all'), value: 'all' },
  { label: t('compare.filters.modified'), value: 'modified' },
  { label: t('compare.filters.new'), value: 'new' },
  { label: t('compare.filters.deprecated'), value: 'deprecated' },
  { label: t('compare.filters.identical'), value: 'equal' }
])

// Migration State
const isMigrating = ref(false)
const showMigrateModal = ref(false)
const migratingItem = ref<any>(null)
const migrationSql = ref('')
const migrationSqlMap = ref<Record<string, string>>({})
const fetchingMigrationSql = ref(false)
const batchType = ref<string | null>(null)

const hasChanges = (type: string) => {
  return allResults.value.some(i => (type === 'all' || i.type.toLowerCase() === type.toLowerCase()) && i.status !== 'equal' && i.status !== 'same')
}

const selectedPath = ref({
  env: '',
  db: '',
  type: ''
})

// View State
const isResizingResults = ref(false)

const startResultsResize = () => {
  isResizingResults.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
}

const handleResize = (e: MouseEvent) => {
  if (isResizingResults.value) {
    resultsWidth.value = Math.max(200, Math.min(800, resultsWidth.value + e.movementX))
  }
}

const stopResize = () => {
  isResizingResults.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
}

const allResults = computed(() => {
  const all = [
    ...tableResults.value.map(i => ({ ...i, type: 'tables' })),
    ...procedureResults.value.map(i => ({ ...i, type: 'procedures' })),
    ...functionResults.value.map(i => ({ ...i, type: 'functions' })),
    ...viewResults.value.map(i => ({ ...i, type: 'views' })),
    ...triggerResults.value.map(i => ({ ...i, type: 'triggers' }))
  ]
  
  return all.sort((a, b) => {
    // Sort by status priority: different/updated > missing/new > equal/same
    const getPriority = (s: string) => {
      s = s?.toLowerCase()
      if (s === 'different' || s === 'updated' || s === 'modified') return 0
      if (s === 'missing_in_target' || s === 'new' || s === 'missing') return 1
      if (s === 'missing_in_source' || s === 'deprecated') return 2
      if (s === 'equal' || s === 'same') return 3
      return 4
    }
    
    const priA = getPriority(a.status)
    const priB = getPriority(b.status)
    
    if (priA !== priB) return priA - priB
    return a.name.localeCompare(b.name)
  })
})

const filteredResults = computed(() => {
  let filtered = allResults.value

  // Filter by category
  if (selectedFilterType.value !== 'all') {
    filtered = filtered.filter(i => i.type === selectedFilterType.value)
  }

  // Filter by status
  if (selectedStatusFilter.value !== 'all') {
    const filter = selectedStatusFilter.value
    filtered = filtered.filter(i => {
      const status = i.status.toLowerCase()
      if (filter === 'modified') return status === 'modified' || status === 'different' || status === 'updated'
      if (filter === 'new') return status === 'new' || status === 'missing_in_target'
      if (filter === 'deprecated') return status === 'deprecated' || status === 'missing_in_source'
      if (filter === 'equal') return status === 'equal' || status === 'same'
      return true
    })
  }

  // Filter by search query
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim()
    const { caseSensitive, wholeWord, regex } = searchFlags.value
    
    try {
      let re: RegExp
      if (regex) {
         re = new RegExp(query, caseSensitive ? '' : 'i')
      } else {
         // Escape regex chars if not regex mode
         const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
         if (wholeWord) {
            re = new RegExp(`\\b${escaped}\\b`, caseSensitive ? '' : 'i')
         } else {
            re = new RegExp(escaped, caseSensitive ? '' : 'i')
         }
      }
      
      filtered = filtered.filter(i => re.test(i.name))
    } catch (e) {
      // Invalid regex fallback to simple include
      filtered = filtered.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    }
  }

  return filtered
})

const hasResults = computed(() => allResults.value.length > 0)
const totalChanges = computed(() => allResults.value.filter(i => i.status !== 'equal' && i.status !== 'same').length)
const filteredTotalChanges = computed(() => filteredResults.value.filter(i => i.status !== 'equal' && i.status !== 'same').length)

const resultsByCategory = computed(() => {
  const categories = ['tables', 'views', 'procedures', 'functions', 'triggers']
  return categories.map(cat => {
    // Use filteredResults to respect search and status filters
    const items = filteredResults.value.filter(i => i.type === cat)
    return {
      type: cat,
      items,
      changes: items.filter(i => i.status !== 'equal' && i.status !== 'same').length
    }
  }).filter(c => c.items.length > 0)
})

const countSummary = computed(() => {
  const total = allResults.value.length
  const changes = totalChanges.value
  return `${changes} changes, ${total - changes} identical`
})

// Actions
const runComparison = async () => {
  if (!activePair.value) return
  // Debounce: prevent rapid re-clicks within 1.5 seconds
  const now = Date.now()
  if (now - lastCompareTime.value < 1500) return
  lastCompareTime.value = now
  
  loading.value = true
  loadingAction.value = 'compare'
  
  statusMessage.value = t('compare.initializing')
  consoleStore.clearLogs()
  error.value = null

  try {
    const { source, target } = activePair.value
    
    let objTypes: ('tables' | 'procedures' | 'functions' | 'triggers' | 'views')[] = ['tables', 'procedures', 'functions', 'triggers', 'views']
    let compareName: string | undefined = undefined

    // Atomic Compare Logic
    if (selectedItem.value) {
      // 1. Compare specific object
      objTypes = [selectedItem.value.type.toLowerCase() as any] // e.g., 'tables'
      compareName = selectedItem.value.name
      consoleStore.addLog(`Comparing single object: ${selectedItem.value.name} (${selectedItem.value.type})`, 'info')
      statusMessage.value = t('compare.analyzingItem', { name: selectedItem.value.name })
    } else if (selectedFilterType.value && selectedFilterType.value !== 'all') {
      // 2. Compare specific category
      objTypes = [selectedFilterType.value.toLowerCase() as any]
      consoleStore.addLog(`Comparing category: ${selectedFilterType.value}`, 'info')
      statusMessage.value = t('compare.analyzingItem', { name: selectedFilterType.value })
    } else {
      consoleStore.addLog(`Starting comparison between ${source.name} (${source.host}) and ${target.name} (${target.host})`, 'info')
      statusMessage.value = t('compare.analyzing')
    }
    
    // Compare (Always run to update comparison results from local cache)
    statusMessage.value = t('compare.comparingObjects')

    
    // Start recording operation
    const opId = operationsStore.addOperation({
      type: 'compare',
      sourceEnv: activePair.value.sourceEnv,
      targetEnv: activePair.value.targetEnv,
      status: 'pending',
      startTime: new Date()
    })

    const results = await Promise.all(objTypes.map(type => 
      Andb.compare(source, target, { 
        type, 
        sourceEnv: activePair.value!.sourceEnv, 
        targetEnv: activePair.value!.targetEnv,
        name: compareName
      })
    ))

    // Map results based on what we fetched
    objTypes.forEach((type, index) => {
      const res = Array.isArray(results[index]) ? results[index] : []
      if (type === 'tables') tableResults.value = res
      if (type === 'procedures') procedureResults.value = res
      if (type === 'functions') functionResults.value = res
      if (type === 'views') viewResults.value = res
      if (type === 'triggers') triggerResults.value = res
    })
    
    const totalCount = tableResults.value.length + procedureResults.value.length + functionResults.value.length + viewResults.value.length + triggerResults.value.length
    
    // Complete operation record
    operationsStore.completeOperation(opId, true, { ddlCount: totalCount })

    // Sync to Sidebar Store
    sidebarStore.setComparisonResults(allResults.value)
    sidebarStore.triggerRefresh()

    // Auto-select first result if we did a bulk comparison
    if (!compareName && filteredResults.value.length > 0) {
       selectItem(filteredResults.value[0])
    }

    consoleStore.addLog('Comparison completed successfully', 'success')
  } catch (e: any) {
    error.value = e.message || 'Comparison failed'
    consoleStore.addLog(`Comparison failed: ${e.message}`, 'error')
    notificationStore.add({
      type: 'error',
      title: 'Comparison Failed',
      message: e.message
    })
  } finally {
    appStore.isSchemaFetching = false; // Release global fetch state
    appStore.schemaFetchProgress = null;
    
    // 5. Update Sidebar to show new objects
    await sidebarStore.loadSchemas(true)
    
    loading.value = false
  }
}

const selectItem = (item: any) => {
  selectedItem.value = item
  showMigrateModal.value = false
}

const handleObjectSelected = (event: any) => {
  const { env, db, name, type } = event.detail
  
  selectedPath.value = { env, db, type }
  
  // Normalize type (ensure plural)
  const normalizedType = type.endsWith('s') ? type : type + 's'
  
  const found = allResults.value.find(i => 
    i.name === name && 
    (i.type === normalizedType || i.type === type)
  )
  
  if (found) {
    selectedItem.value = found
    // Ensure selected type matches the item type
    selectedFilterType.value = 'all' 
  } else {
    // If NOT found, it might be because comparison hasn't run or item is new/missing
    // Let's trigger a LOCAL comparison first to check cache
    consoleStore.addLog(`Object ${name} not in current results. Triggering local comparison...`, 'info')
    runComparison().then(() => {
       const retryFound = allResults.value.find(i => i.name === name)
       if (retryFound) selectedItem.value = retryFound
    })
  }
}

const handleCategorySelected = (event: any) => {
  const { env, db, type } = event.detail
  selectedFilterType.value = type
  selectedPath.value = { env, db, type }
  
  // Clear diff view when category is selected
  selectedItem.value = null
  
  // If we have literally 0 results for this category after selection, 
  // maybe we should auto-trigger a comparison?
  const hasTypeResults = allResults.value.some(i => i.type.toLowerCase() === type.toLowerCase())
  if (type !== 'all' && !hasTypeResults) {
    consoleStore.addLog(`No results for ${type}. Auto-triggering comparison...`, 'info')
    runComparison()
  }
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal':
    case 'same':
      return CheckCircle2
    case 'new':
    case 'missing_in_target':
      return PlusCircle
    case 'deprecated':
    case 'missing_in_source':
      return XCircle
    case 'modified':
    case 'different':
    case 'updated':
      return AlertCircle
    default:
      return AlertCircle
  }
}

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal':
    case 'same':
      return 'text-teal-600 dark:text-teal-400 font-bold' 
    case 'new':
    case 'missing_in_target':
      return 'text-emerald-500 dark:text-emerald-400 drop-shadow-sm font-bold'
    case 'deprecated':
    case 'missing_in_source':
      return 'text-rose-500 dark:text-rose-400 drop-shadow-sm font-bold'
    case 'modified':
    case 'different':
    case 'updated':
      return 'text-amber-500 dark:text-amber-400 drop-shadow-sm font-bold'
    default:
      return 'text-gray-400'
  }
}

const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal':
    case 'same': return t('common.status.identical')
    case 'different':
    case 'updated':
    case 'modified': return t('common.status.modified')
    case 'missing_in_target':
    case 'new': return t('common.status.newSource')
    case 'missing_in_source':
    case 'deprecated': return t('common.status.deprecatedTarget')
    default: return status
  }
}

const openDetailModal = (item: any) => {
  selectedItem.value = item
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
}

// Migration Actions
const openMigrateModal = async (item: any) => {
  console.log('[Compare] openMigrateModal for item:', item.name, item.status)
  consoleStore.addLog(`Preparing migration for ${item.name} (${item.type})...`, 'info')
  
  migratingItem.value = item
  batchType.value = null
  migrationSql.value = ''
  showMigrateModal.value = true
  
  // 1. If item already has generated DDL (from comparison), use it immediately!
  const hasExistingDdl = item.ddl && (Array.isArray(item.ddl) ? item.ddl.length > 0 : !!item.ddl)
  if (hasExistingDdl) {
    console.log('[Compare] Using existing DDL from item:', item.ddl)
    migrationSql.value = Array.isArray(item.ddl) ? item.ddl.join('\n') : item.ddl
    consoleStore.addLog(`Using pre-generated SQL for ${item.name}`, 'success')
    return
  }

  // 2. Otherwise, if it's an individual item, try to fetch/generate SQL
  if (!item.isBatch && activePair.value) {
    fetchingMigrationSql.value = true
    try {
      const { source, target } = activePair.value
      let status: 'NEW' | 'UPDATED' | 'DEPRECATED' = 'NEW'
      if (item.status === 'modified' || item.status === 'different' || item.status === 'updated') status = 'UPDATED'
      if (item.status === 'deprecated' || item.status === 'missing_in_source') status = 'DEPRECATED'
      
      console.log('[Compare] Fetching dry-run SQL for:', item.name, 'with status:', status)
      
      const result = await Andb.migrate(source, target, {
        type: item.type as any,
        sourceEnv: source.environment,
        targetEnv: target.environment,
        name: item.name,
        status: status,
        dryRun: true // DRY RUN to get SQL
      })
      
      console.log('[Compare] Dry run raw result:', result)
      
      let sql = ''
      if (result !== null && result !== undefined && result !== '') {
        // Robust parsing of dry-run result
        if (typeof result === 'string') {
          sql = result
        } else if (typeof result === 'number') {
          // If it's a number (like 0), it's probably NOT the SQL unless the SQL is just '0'
          sql = '' 
        } else if (Array.isArray(result)) {
          sql = result.join('\n')
        } else {
          // Object results
          const rawData = result.data || result
          if (typeof rawData === 'string') {
            sql = rawData
          } else if (rawData.sql) {
            sql = rawData.sql
          } else if (rawData.script) {
            sql = rawData.script
          } else if (Array.isArray(rawData)) {
            sql = rawData.join('\n')
          } else if (rawData.ddl) {
            sql = Array.isArray(rawData.ddl) ? rawData.ddl.join('\n') : rawData.ddl
          }
        }
      }
      
      migrationSql.value = sql
      
      if (migrationSql.value) {
        consoleStore.addLog(`Successfully fetched SQL preview for ${item.name}`, 'success')
      } else {
        console.log('[Compare] Dry run returned no content. Trying fallbacks...')
        consoleStore.addLog(`No direct SQL from dry-run for ${item.name}, checking fallbacks...`, 'info')
      }
      
      // Extended Fallbacks
      if (!migrationSql.value) {
        // PRIORITY 1: Use pre-generated ALTER ddl from item (from comparison result)
        const cachedAlter = item.ddl && (Array.isArray(item.ddl) ? item.ddl.join('\n') : item.ddl)
        if (status === 'UPDATED' && cachedAlter) {
          console.log('[Compare] Fallback: Using cached ALTER statement from comparison')
          migrationSql.value = cachedAlter
        } 
        // PRIORITY 2: New items get Source DDL
        else if (status === 'NEW' && item.diff?.source) {
          console.log('[Compare] Fallback: Using Source DDL for NEW item')
          migrationSql.value = Array.isArray(item.diff.source) ? item.diff.source.join('\n') : item.diff.source
        } 
        // PRIORITY 3: Deprecated items get DROP
        else if (status === 'DEPRECATED') {
          console.log('[Compare] Fallback: Generating DROP for DEPRECATED item')
          const objectType = item.type.toLowerCase().replace(/s$/, '').toUpperCase()
          migrationSql.value = `DROP ${objectType} IF EXISTS \`${item.name}\`;`
        } 
        // PRIORITY 4: Worst case fallback for UPDATED (Show warning and Source DDL)
        else if (status === 'UPDATED' && item.diff?.source) {
          console.log('[Compare] Fallback: No ALTER found, showing Source DDL as warning')
          const sourceCode = Array.isArray(item.diff.source) ? item.diff.source.join('\n') : item.diff.source
          migrationSql.value = `-- Warning: No ALTER script generated. Displaying new full DDL:\n\n${sourceCode}`
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch migration SQL preview:', e)
      consoleStore.addLog(`Error fetching preview: ${e.message}`, 'error')
    } finally {
      fetchingMigrationSql.value = false
    }
  }
}

const openBatchMigrateModal = (type: string) => {
  console.log('[Compare] openBatchMigrateModal called with type:', type)
  
  // DBA Rule: Cannot migrate to a static SQL dump file
  if (isTargetDump.value) {
    notificationStore.add({
      type: 'warning',
      title: t('compare.dumpReadOnly'),
      message: t('compare.cannotMigrateToDump')
    })
    return
  }
  
  consoleStore.addLog(`Opening batch migration for ${type}`, 'info')
  
  batchType.value = type
  
  // Collect all items that will be migrated
  let itemsToMigrate = []
  if (type === 'Schema') {
    itemsToMigrate = allResults.value.filter(i =>
      i.status !== 'equal' && i.status !== 'same' &&
      i.status !== 'deprecated' && i.status !== 'missing_in_source'  // Rule: Never migrate DROP
    )
  } else {
    itemsToMigrate = allResults.value.filter(i =>
      i.type.toLowerCase() === type.toLowerCase() &&
      i.status !== 'equal' &&
      i.status !== 'same' &&
      i.status !== 'deprecated' && i.status !== 'missing_in_source'  // Rule: Never migrate DROP
    )
  }

  console.log('[Compare] Items to migrate:', itemsToMigrate.length)
  consoleStore.addLog(`Found ${itemsToMigrate.length} items to migrate`, 'info')

  migratingItem.value = {
    name: `All ${type}`,
    type: type,
    isBatch: true,
    items: itemsToMigrate
  }
  
  // Populate migration SQL for batch preview (Combined)
  migrationSql.value = itemsToMigrate.map(i => {
    let sql = Array.isArray(i.ddl) ? i.ddl.join('\n') : i.ddl
    
    // Fallback for New items
    const isNew = i.status === 'new' || i.status === 'missing_in_target'
    if (!sql && isNew && i.diff?.source) {
       sql = Array.isArray(i.diff.source) ? i.diff.source.join('\n') : i.diff.source
    }
    
    // Fallback for Deprecated items
    const isDeprecated = i.status === 'deprecated' || i.status === 'missing_in_source'
    if (!sql && isDeprecated) {
       const objectType = i.type.toLowerCase().replace(/s$/, '').toUpperCase()
       sql = `DROP ${objectType} IF EXISTS \`${i.name}\`;`
    }
    
    const finalSql = `-- OBJECT: ${i.name} (${i.type})\n${sql || '-- No SQL script available'}`
    
    // Populate Map for individual selection
    migrationSqlMap.value[`${i.type}-${i.name}`] = finalSql
    
    return finalSql
  }).join('\n\n')

  showMigrateModal.value = true
}

const confirmMigration = async () => {
  if (!activePair.value || !migratingItem.value) return
  
  const item = migratingItem.value
  isMigrating.value = true
  
  try {
    const { source, target } = activePair.value
    
    // Start recording operation
    const opId = operationsStore.addOperation({
      type: 'migrate',
      sourceEnv: source.environment,
      targetEnv: target.environment,
      status: 'pending',
      startTime: new Date()
    })

    try {
      if (batchType.value) {
        // Batch Migration
        const type = batchType.value.toLowerCase()
        
        const ddlTypes = type === 'schema' 
          ? ['tables', 'views', 'procedures', 'functions', 'triggers']
          : [type]
        
        // Rule: Never migrate DROP. Only NEW and UPDATED.
        const statuses: ('NEW' | 'UPDATED')[] = ['NEW', 'UPDATED']
        
        const resultsMap: Record<string, any> = {
          tables: tableResults,
          procedures: procedureResults,
          functions: functionResults,
          views: viewResults,
          triggers: triggerResults
        }

        for (const ddlType of ddlTypes) {
          // 1. Migrate all changes for this type
          for (const status of statuses) {
            await Andb.migrate(source, target, {
              type: ddlType as any,
              sourceEnv: source.environment,
              targetEnv: target.environment,
              status: status,
              dryRun: appStore.safeMode
            })
          }
          
          // 2. Export Target (Atomic for Category)
          await Andb.export(source, target, {
            type: ddlType as any,
            environment: target.environment
          })
          
          // 3. Compare (Atomic for Category)
          const results = await Andb.compare(source, target, {
            type: ddlType as any,
            sourceEnv: source.environment,
            targetEnv: target.environment
          })
          
          // 4. Update UI State immediately
          if (Array.isArray(results) && resultsMap[ddlType]) {
             resultsMap[ddlType].value = results.map(r => ({ ...r, type: ddlType.endsWith('s') ? ddlType : ddlType + 's' }))
             
             // If selected item is in this category, try to refresh it or deselect if gone
             if (selectedItem.value && selectedItem.value.type === ddlType) {
               const found = results.find((r: any) => r.name === selectedItem.value.name)
               if (found) {
                 selectedItem.value = { ...found, type: ddlType }
               } else {
                 // Item might have been deleted/renamed (though rare in migrate), or status changed to equal and filter hides it
                 // We keep it selected but update content
               }
             }
          }
        }

        notificationStore.add({
          type: 'success',
          title: 'Batch Migration Successful',
          message: `${type === 'schema' ? 'Entire schema' : 'All ' + batchType.value} has been migrated and verified.`
        })
      } else {
        // Individual Migration — Rule: Never migrate DROP
        let status: 'NEW' | 'UPDATED' = 'NEW'
        if (item.status === 'modified' || item.status === 'different' || item.status === 'updated') status = 'UPDATED'
        if (item.status === 'deprecated' || item.status === 'missing_in_source') {
          notificationStore.add({ type: 'warning', title: 'Migration Skipped', message: `"${item.name}" is deprecated. DROP operations are not allowed.` })
          isMigrating.value = false
          showMigrateModal.value = false
          return
        }
        
        await Andb.migrate(source, target, {
          type: item.type as any,
          sourceEnv: source.environment,
          targetEnv: target.environment,
          name: item.name,
          status: status,
          dryRun: appStore.safeMode
        })
        
        // Atomic Verification
        await applyAtomicVerify(item)
        
        notificationStore.add({
          type: appStore.safeMode ? 'info' : 'success',
          title: appStore.safeMode ? t('compare.dryRunComplete') : 'Migration Successful',
          message: appStore.safeMode 
            ? t('compare.dryRunDesc', { name: item.name })
            : `${item.name} (${item.type}) has been migrated and verified.`
        })
      }
      
      showMigrateModal.value = false
      
      // Update Sidebar with new results
      sidebarStore.setComparisonResults(allResults.value)
      sidebarStore.triggerRefresh()

      // Complete operation record
      operationsStore.completeOperation(opId, true)

      // Hybrid Model: Auto-sync to Git if configured
      try {
        const projectId = projectsStore.selectedProjectId
        if (projectId) {
          const gitConfRes = await window.electronAPI?.storage?.get(`git_config_${projectId}`)
          if (gitConfRes?.success && gitConfRes.data?.remoteUrl) {
            console.log(`[Compare] Hybrid Model: Triggering auto-sync to Git for project ${projectId}...`)
            window.electronAPI?.andbExecute({
              sourceConnection: {} as any,
              targetConnection: {} as any,
              operation: 'git-sync' as any,
              options: {
                config: gitConfRes.data,
                env: target.environment,
                db: target.database || target.name,
                message: `chore(schema): auto-sync after migration of ${batchType.value || item.name}`
              }
            })
          }
        }
      } catch (gitErr) {
        console.warn('[Compare] Git auto-sync failed (optional):', gitErr)
      }
    } catch (e: any) {
      operationsStore.completeOperation(opId, false, { error: e.message })
      throw e
    }
  } catch (e: any) {
    notificationStore.add({
      type: 'error',
      title: 'Migration Failed',
      message: e.message || 'An unknown error occurred during migration.'
    })
    if (window.electronAPI) {
      window.electronAPI.log.send('error', `Migration failed for ${item.name}`, e.message)
    }
  } finally {
    isMigrating.value = false
  }
}

/**
 * Perform atomic export and comparison for a single item
 * and update the local state without re-running full comparison
 */
const applyAtomicVerify = async (item: any) => {
  if (!activePair.value) return
  
  try {
    const { source, target } = activePair.value
    
    // 1. Export atomic (Target only, since source hasn't changed)
    await Andb.export(source, target, {
      type: item.type as any,
      environment: target.environment,
      name: item.name
    })
    
    // 2. Compare atomic
    const results = await Andb.compare(source, target, {
      type: item.type as any,
      sourceEnv: source.environment,
      targetEnv: target.environment,
      name: item.name
    })
    
    if (Array.isArray(results)) {
      const updatedItem = results.find((r: any) => r.name === item.name)
      
      if (!updatedItem) {
        return
      }
      
      // 3. Patch the specific result list
      const resultsMap: Record<string, any> = {
        tables: tableResults,
        procedures: procedureResults,
        functions: functionResults,
        views: viewResults,
        triggers: triggerResults
      }
      
      const listRef = resultsMap[item.type.toLowerCase()]
      if (listRef) {
        const index = listRef.value.findIndex((i: any) => i.name === item.name)
        if (index !== -1) {
          // Update the item in the list using splice for guaranteed reactivity
          const updatedObject = { ...listRef.value[index], ...updatedItem, type: item.type }
          listRef.value.splice(index, 1, updatedObject)
          
          // Update selected item if focused to refresh diff view
          if (selectedItem.value?.name === item.name) {
            selectedItem.value = { ...updatedObject }
          }
        }
      }
    }
  } catch (e: any) {
    if (window.electronAPI) {
      window.electronAPI.log.send('warn', `Atomic verify failed for ${item.name}, falling back to full comparison`, e.message)
    }
    // Fallback to full comparison if atomic fails
    await runComparison()
  }
}

const handleApplyFromDetail = (item: any) => {
  showDetailModal.value = false
  openMigrateModal(item)
}

const handleDatabaseRefreshRequested = (e: any) => {
  const { env } = e.detail
  if (activePair.value && (activePair.value.sourceEnv === env || activePair.value.targetEnv === env)) {
    runComparison()
  }
}

const handleCategoryRefreshRequested = (e: any) => {
  const { type, env } = e.detail
  if (activePair.value && (activePair.value.sourceEnv === env || activePair.value.targetEnv === env)) {
    selectedFilterType.value = type
    runComparison()
  }
}

const handleObjectRefreshRequested = (e: any) => {
  const { name, type, env } = e.detail
  if (activePair.value && (activePair.value.sourceEnv === env || activePair.value.targetEnv === env)) {
    // Select it first so runComparison(true) knows what to refresh atomically
    const normalizedType = type.endsWith('s') ? type : type + 's'
    const item = allResults.value.find(i => i.name === name && i.type === normalizedType)
    if (item) {
      selectedItem.value = item
    } else {
      // If not in local results, at least set the search/filter so it might appear
      selectedFilterType.value = normalizedType
    }
    runComparison()
  }
}

// Lifecycle
onMounted(async () => {
  window.addEventListener('category-selected', handleCategorySelected as any)
  window.addEventListener('object-selected', handleObjectSelected as any)
  window.addEventListener('database-refresh-requested', handleDatabaseRefreshRequested as any)
  window.addEventListener('category-refresh-requested', handleCategoryRefreshRequested as any)
  window.addEventListener('object-refresh-requested', handleObjectRefreshRequested as any)
  
  // Trigger local comparison on init (fetch from DB is manual)
  if (activePair.value) {
    runComparison()
  }
})

onUnmounted(() => {
  window.removeEventListener('category-selected', handleCategorySelected as any)
  window.removeEventListener('object-selected', handleObjectSelected as any)
  window.removeEventListener('database-refresh-requested', handleDatabaseRefreshRequested as any)
  window.removeEventListener('category-refresh-requested', handleCategoryRefreshRequested as any)
  window.removeEventListener('object-refresh-requested', handleObjectRefreshRequested as any)
})

// Auto-run comparison when sidebar refresh is clicked (Top refresh button)
watch(() => sidebarStore.refreshRequestKey, () => {
  if (route.path === '/compare' && activePair.value) {
    consoleStore.addLog('Sidebar refresh requested: Re-running local comparison...', 'info')
    runComparison()
  }
})

// Auto-load or Auto-compare on pair change
watch(() => connectionPairsStore.selectedPairId, (newId) => {
  if (newId) {
    // Reset state first
    tableResults.value = []
    procedureResults.value = []
    functionResults.value = []
    viewResults.value = []
    triggerResults.value = []
    selectedItem.value = null // Resets detail view
    
    // Trigger local comparison on pair change
    runComparison()
  }
})

</script>
