<template>
  <MainLayout>
    <template #toolbar>
      <div class="flex items-center justify-between w-full h-full gap-4">
        <!-- Left Side: Title -->
        <div class="flex items-center gap-2">
           <GitCompare class="w-4 h-4 text-primary-500" />
           <span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{{ $t('compare.title') }}</span>
        </div>

        <!-- Right Side: Actions & Controls -->
        <div class="flex items-center gap-4 flex-1 justify-end">
          <!-- View Mode Switch -->
          <div v-if="appStore.layoutSettings.toolbar && appStore.compareMode === 'auto'" class="flex items-center space-x-2 shrink-0 p-1.5">
            <div class="flex items-center p-1  border border-gray-100 dark:border-gray-700 rounded-xl"
              :class="appStore.buttonStyle === 'minimal' ? 'scale-90' : ''">
              <button @click="viewMode = 'list'"
                class="flex items-center gap-2 rounded-lg font-bold uppercase transition-all duration-200" :class="[
                  viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
                  appStore.buttonStyle === 'full' ? 'px-3 py-1.5 text-[10px]' : 'px-2 py-1 text-[10px]'
                ]" :title="$t('compare.listViewTooltip')">
                <List class="w-3.5 h-3.5" />
                <span v-if="appStore.buttonStyle !== 'icons' && appStore.buttonStyle === 'full'">{{
                  $t('compare.listView') }}</span>
              </button>
              <button @click="viewMode = 'tree'"
                class="flex items-center gap-2 rounded-lg font-bold uppercase transition-all duration-200" :class="[
                  viewMode === 'tree' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
                  appStore.buttonStyle === 'full' ? 'px-3 py-1.5 text-[10px]' : 'px-2 py-1 text-[10px]'
                ]" :title="$t('compare.treeViewTooltip')">
                <GitMerge class="w-3.5 h-3.5 rotate-90" />
                <span v-if="appStore.buttonStyle !== 'icons' && appStore.buttonStyle === 'full'">{{
                  $t('compare.treeViewLabel') }}</span>
              </button>
            </div>

            <div v-if="appStore.buttonStyle === 'full'" class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <!-- Safe Mode Toggle -->
            <div
              class="relative flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 select-none">
              <ShieldCheck class="w-4 h-4" :class="appStore.safeMode ? 'text-green-500' : 'text-gray-400'" />

              <div class="flex items-center gap-1">
                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-help"
                  :title="$t('common.tooltips.safeMode', 'Safe Mode prevents potentially destructive actions during comparisons and migrations.')">{{
                    $t('schema.safeMode', 'Safe Mode') }}</span>
                <button @click="showSafeModeInfo = !showSafeModeInfo"
                  class="text-gray-400 hover:text-primary-500 transition-colors p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                  <Info class="w-3 h-3" />
                </button>
              </div>

              <button @click="appStore.safeMode = !appStore.safeMode"
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ml-1"
                :class="appStore.safeMode ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'">
                <span
                  class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="appStore.safeMode ? 'translate-x-4' : 'translate-x-0'"></span>
              </button>

              <!-- Info Popover -->
              <div v-if="showSafeModeInfo"
                class="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
                <div class="flex items-start justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <h3
                    class="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-widest">
                    <ShieldCheck class="w-4 h-4 text-green-500" /> {{ $t('schema.safeMode', 'Safe Mode') }} Info
                  </h3>
                  <button @click="showSafeModeInfo = false"
                    class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
                <div class="text-gray-600 dark:text-gray-300 space-y-3 text-xs leading-relaxed">
                  <p>
                    <span class="font-bold text-green-500 flex items-center gap-1 mb-0.5"><span
                        class="w-1.5 h-1.5 rounded-full bg-green-500"></span> ON (Dry Run)</span>
                    Simulates changes without affecting your database. Generates SQL for preview only. <span
                      class="text-gray-400 italic">Recommended.</span>
                  </p>
                  <p>
                    <span class="font-bold text-red-500 flex items-center gap-1 mb-0.5"><span
                        class="w-1.5 h-1.5 rounded-full bg-red-500"></span> OFF (Execute)</span>
                    Executes actual CREATE, ALTER, and DROP statements directly on the database. <span
                      class="text-red-400 font-bold">Use with extreme caution!</span>
                  </p>
                </div>
              </div>
            </div>

            <div v-if="appStore.buttonStyle === 'full'" class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <button v-if="appStore.compareMode === 'auto'" @click="runComparison()" :disabled="loading || !activePair"
              class="flex items-center justify-center font-bold uppercase transition-all duration-300 disabled:opacity-50 disabled:grayscale shrink-0"
              :class="[
                appStore.buttonStyle === 'full' ? 'px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs tracking-wide shadow-md active:scale-95 gap-2' : '',
                appStore.buttonStyle === 'minimal' ? 'px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-[10px] tracking-wider active:scale-95 shadow-sm gap-2' : '',
                appStore.buttonStyle === 'icons' ? 'w-10 h-10 bg-primary-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-95' : ''
              ]" :title="$t('compare.runCompareTooltip')">
              <GitCompare v-if="!(loading && loadingAction === 'compare')" class="w-4 h-4" />
              <RefreshCw v-else class="w-4 h-4 animate-spin" />
              <span v-if="appStore.buttonStyle !== 'icons'">{{ (loading && loadingAction === 'compare') ?
                $t('compare.comparing') : (appStore.buttonStyle === 'full' ? $t('compare.compare') :
                  $t('compare.compare')) }}</span>
            </button>

          </div>

        </div>
      </div>
    </template>

    <template #breadcrumbs>
      <div v-if="activePair" class="flex items-center gap-2">
        <!-- Source Context -->
        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
          <div class="flex items-center text-gray-500 dark:text-gray-400">
            <Server class="w-3.5 h-3.5 mr-1.5" />
            <span class="text-[9px] font-black uppercase tracking-widest opacity-60">{{ activePair.source.environment }}</span>
          </div>
          <ChevronRight class="w-3 h-3 text-gray-300 dark:text-gray-600" />
          <div class="flex items-center text-primary-600 dark:text-primary-400">
            <Database class="w-3.5 h-3.5 mr-1.5" />
            <span class="text-[10px] font-black uppercase tracking-[0.1em]">{{ activePair.source.database || activePair.source.name }}</span>
          </div>
        </div>

        <div class="flex items-center px-1">
          <ArrowRightLeft class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
        </div>

        <!-- Target Context -->
        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
          <div class="flex items-center text-gray-500 dark:text-gray-400">
            <Server class="w-3.5 h-3.5 mr-1.5" />
            <span class="text-[9px] font-black uppercase tracking-widest opacity-60">{{ activePair.target.environment }}</span>
          </div>
          <ChevronRight class="w-3 h-3 text-gray-300 dark:text-gray-600" />
          <div class="flex items-center text-primary-600 dark:text-primary-400">
            <Database class="w-3.5 h-3.5 mr-1.5" />
            <span class="text-[10px] font-black uppercase tracking-[0.1em]">{{ activePair.target.database || activePair.target.name }}</span>
          </div>
        </div>
        
        <button @click="runComparison()" :disabled="loading || !activePair"
          class="ml-3 p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl text-gray-400 hover:text-primary-500 transition-all active:scale-95 disabled:opacity-30 border border-transparent hover:border-primary-100 dark:hover:border-primary-800">
          <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': (loading && loadingAction === 'compare') }" />
        </button>
      </div>
      <span v-else class="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-30">{{ $t('compare.noPair') }}</span>
    </template>

    <!-- Comparison & Console Split -->
    <div class="flex-1 flex flex-col overflow-hidden relative min-w-0 bg-white dark:bg-gray-950">
      <!-- Comparison Area (Top) -->
      <div class="flex-1 flex overflow-hidden relative min-w-0" :class="{ 'flex-row-reverse': appStore.layoutSettings.sidebarPosition === 'right' }">
        <main class="flex-1 flex flex-col overflow-hidden relative min-w-0">

          <!-- MIGRATION INLINE PANEL -->
          <div v-if="migrationTerminal.isOpen"
            class="absolute inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col animate-in slide-in-from-right-8 duration-300">
            <MigrationConfirm :is-open="true" :inline="true" :loading="isMigrating"
              :item="migrationTerminal.type === 'batch' ? { isBatch: true, items: migrationTerminal.items } : migrationTerminal.items[0]"
              :source-name="sourceName" :target-name="targetName" :sql-script="migrationTerminal.sqlScript"
              :sql-map="migrationTerminal.sqlMap" :fetching-sql="migrationTerminal.fetching"
              :target-is-static="isTargetDump" @close="closeMigrationTerminal" @confirm="executeConfirmedMigration"
              @select="fetchBatchItemSql" />
          </div>

          <!-- Removed Manual Compare Dropdowns per user request -->

          <!-- Vertical Split: Object List vs DDL View -->
          <div v-if="viewMode === 'list'" class="flex-1 flex overflow-hidden relative min-w-0" :class="{ 'flex-row-reverse': appStore.layoutSettings.sidebarPosition === 'right' }">
            <!-- Left: Comparison Results List (Sub-sidebar style) -->
            <div v-if="appStore.layoutSettings.sidebar" :style="{ width: resultsWidth + 'px' }"
              class="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 flex flex-col shrink-0 relative transition-all duration-300"
              :class="appStore.layoutSettings.sidebarPosition === 'right' ? 'border-l' : 'border-r'">
              <!-- Results Header: Standardized Style -->
              <div class="px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Database class="w-3.5 h-3.5 text-gray-400 opacity-50" />
                  <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Database Overview</span>
                </div>
                <div v-if="selectedFilterType !== 'all'" @click="selectedFilterType = 'all'" 
                  class="cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-primary-500">
                  <ChevronLeft class="w-3.5 h-3.5" />
                </div>
              </div>

              <!-- Search Bar (Professional Redesign) -->
              <div v-if="hasResults" class="px-3 pt-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 shadow-sm">
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                    <Search class="w-4 h-4 text-gray-400 group-focus-within:text-primary-500" />
                  </span>
                  <input ref="searchInput" v-model="searchQuery" type="text"
                    :placeholder="$t('history.searchPlaceholder')"
                    class="w-full pl-9 pr-36 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900 dark:text-white transition-all shadow-inner" />

                  <!-- Unified Search Icons (VS Code Style) -->
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 space-x-0.5">
                    <button @click="searchFlags.caseSensitive = !searchFlags.caseSensitive"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.caseSensitive ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Match Case">
                      <CaseSensitive class="w-3.5 h-3.5" />
                    </button>
                    <button @click="searchFlags.wholeWord = !searchFlags.wholeWord"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.wholeWord ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Match Whole Word">
                      <WholeWord class="w-3.5 h-3.5" />
                    </button>
                    <button @click="searchFlags.regex = !searchFlags.regex"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.regex ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Use Regex">
                      <Regex class="w-3.5 h-3.5" />
                    </button>

                    <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

                    <button
                      @click="searchFlags.columns = !searchFlags.columns"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.columns ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Content Search (Snippets)">
                      <Binary class="w-3.5 h-3.5" />
                    </button>

                    <button v-if="searchQuery" @click="searchQuery = ''"
                      class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all">
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Search Progress/Summary & Tree Controls (Synchronized) -->
                <div class="flex items-center justify-between mt-2.5 px-0.5">
                   <div class="flex items-center gap-2">
                     <div class="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                       {{ filteredResults.length }} Objects Found
                     </div>
                     <div class="flex gap-0.5 ml-1">
                        <button class="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-gray-600">
                          <CaseSensitive class="w-3 h-3" />
                        </button>
                     </div>
                   </div>

                   <div class="flex items-center gap-0.5 shrink-0">
                      <!-- Sort Options -->
                      <button @click="sortBy = sortBy === 'date' ? 'status' : 'date'"
                        class="p-1 rounded-md transition-colors"
                        :class="sortBy === 'date' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
                        title="Sort by Date (Last Updated)">
                        <CalendarClock class="w-3.5 h-3.5" />
                      </button>
                      <button @click="sortBy = sortBy === 'name' ? 'status' : 'name'"
                        class="p-1 rounded-md transition-colors"
                        :class="sortBy === 'name' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
                        title="Sort Alphabetically (A-Z)">
                        <ArrowDownAZ class="w-3.5 h-3.5" />
                      </button>
                      
                      <div class="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                      <button
                        @click="treeExpandCmd = { action: 'expand', ts: Date.now() }; collapsedCategories.clear()"
                        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Expand All"
                      >
                        <Plus class="w-3.5 h-3.5" />
                      </button>
                      <button
                        @click="treeExpandCmd = { action: 'collapse', ts: Date.now() };['tables', 'views', 'procedures', 'functions', 'triggers'].forEach(c => collapsedCategories.add(c))"
                        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title="Collapse All"
                      >
                        <Minus class="w-3.5 h-3.5" />
                      </button>
                   </div>
                </div>
              </div>

                <!-- Status Filters (Premium Pills) -->
                <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-1 mt-1 border-t border-gray-100 dark:border-gray-800/50">
                  <span class="text-[9px] font-black uppercase tracking-tighter text-gray-400 mr-1">Filter:</span>
                  <button v-for="filter in statusFilters" :key="filter.value"
                    @click="selectedStatusFilter = filter.value"
                    class="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shrink-0"
                    :class="selectedStatusFilter === filter.value
                      ? 'bg-primary-500 border-primary-500 text-white shadow-sm shadow-primary-500/20'
                      : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'">
                    {{ filter.label }}
                  </button>
                </div>

              <div class="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden p-2">
                <div v-if="!hasResults" class="p-8 text-center text-gray-400 h-full flex flex-col justify-center">
                  <ScanSearch class="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p class="text-xs uppercase tracking-widest font-bold">{{ $t('history.noHistory') }}</p>
                </div>

                <div v-else class="space-y-1 pb-4">
                  <div v-for="cat in resultsByCategory" :key="cat.type" 
                    class="flex flex-col group/cat relative">
                    <!-- Category Header (Synchronized Row Style) -->
                    <div 
                      @click="collapsedCategories.has(cat.type) ? collapsedCategories.delete(cat.type) : collapsedCategories.add(cat.type)"
                      class="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm group-hover/cat:bg-gray-50/50 dark:group-hover/cat:bg-gray-800/30 mb-px overflow-hidden select-none"
                    >
                      <ChevronRight 
                        class="w-3 h-3 mr-1.5 transition-transform text-gray-400 shrink-0"
                        :class="{ 'rotate-90 text-primary-500': !collapsedCategories.has(cat.type) }"
                      />
                      <component :is="getIconForType(cat.type)" class="w-3.5 h-3.5 mr-2 shrink-0" :class="getCategoryColor(cat.type)" />
                      <span class="font-extrabold text-[10px] uppercase tracking-widest text-gray-600 dark:text-gray-300 truncate">{{ cat.type }}</span>
                      
                      <div class="ml-auto flex items-center gap-1">
                        <span v-if="cat.changes > 0" 
                          class="px-1.5 py-0.5 bg-orange-500 text-white text-[8px] rounded-full font-mono font-black shadow-sm shrink-0">
                          {{ cat.changes }}
                        </span>
                        <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 text-[8px] rounded-full font-mono shrink-0">
                          {{ cat.total }}
                        </span>
                      </div>
                    </div>

                    <!-- Items List (Expanded) -->
                    <div v-if="!collapsedCategories.has(cat.type)"
                      class="pl-4 border-l border-gray-100 dark:border-gray-800 ml-3.5 mt-0.5 space-y-0.5 pb-2">
                      <div v-for="item in cat.items" :key="item.name" @click="selectItem(item)"
                        @contextmenu.prevent="handleItemContextMenu($event, item)"
                        class="cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center group px-2 py-1.5 relative border border-transparent overflow-hidden"
                        :class="[{ 'bg-primary-50 dark:bg-primary-900/20 border-primary-200/50 dark:border-primary-800/50 shadow-sm transition-all': selectedItem?.name === item.name }]">
                        
                        <div class="flex-1 min-w-0 pr-2">
                          <div class="font-mono truncate text-[11px] text-gray-700 dark:text-gray-300"
                            :class="{ 'font-bold text-primary-600 dark:text-primary-400': selectedItem?.name === item.name }" :title="item.name">
                            {{ item.name }}
                          </div>
                          <div class="text-[9px] text-gray-400 uppercase tracking-tighter flex items-center opacity-70 group-hover:opacity-100">
                             <component :is="getIconForType(item.type)" class="mr-1 w-2.5 h-2.5" />
                             <span>{{ item.type }}</span>
                          </div>
                        </div>

                        <div class="flex items-center gap-1.5 shrink-0 ml-auto pr-1">
                           <!-- Migration Trigger -->
                           <div class="flex items-center justify-center w-6 h-6 rounded-full transition-all group/migrate bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-orange-500/30">
                              <component 
                                :is="getStatusIcon(item.status)" 
                                class="w-3.5 h-3.5 transition-all"
                                :class="[getStatusClass(item.status), { 'group-hover/migrate:hidden': item.status?.toLowerCase() !== 'equal' && item.status?.toLowerCase() !== 'same' }]" 
                              />
                              <template v-if="item.status?.toLowerCase() !== 'equal' && item.status?.toLowerCase() !== 'same' && !isTargetDump">
                                <Zap v-if="isMigratingItemId !== item.name"
                                  @click.stop="migrateSingleItem(item)"
                                  class="w-3.5 h-3.5 text-orange-500 hidden group-hover/migrate:block cursor-pointer hover:scale-110 active:scale-95 fill-current" 
                                  title="Migrate" />
                                <RefreshCw v-else
                                  class="w-3 h-3 text-orange-500 animate-spin" />
                              </template>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Resize Handle -->
              <div @mousedown="startResultsResize"
                class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-400/50 transition-colors z-20">
              </div>
            </div>

            <!-- Right: Split DDL Detail -->
            <div class="flex-1 flex flex-col bg-white dark:bg-gray-950 relative min-w-0">
              <!-- Tab Bar -->
              <TabBar v-if="tabs.length > 0" :tabs="tabs" :active-tab-id="activeTabId" @select="handleSelectTab"
                @close="handleCloseTab" @duplicate="handleDuplicateTab" @close-others="handleCloseOthers"
                @close-right="handleCloseRight" />
              <!-- Migration Overlay (Moved to global scope) -->

              <div v-if="selectedItem" class="h-full flex flex-col">
                <div
                  class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between h-12 shrink-0">
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
                      <span class="font-bold text-gray-900 dark:text-white truncate text-sm">{{ selectedItem.name
                        }}</span>
                    </div>
                    <span :class="getStatusClass(selectedItem.status)"
                      class="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-opacity-10 font-black border uppercase tracking-tighter"
                      :style="{ borderColor: 'currentColor' }">
                      {{ getStatusText(selectedItem.status) }}
                    </span>
                  </div>
                  <div class="flex space-x-2 items-center">
                    <button v-if="selectedItem.status !== 'equal' && selectedItem.status !== 'same'"
                      @click="migrateSingleItem(selectedItem)"
                      class="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-orange-500/10 active:scale-95 group/migrate border border-orange-100 dark:border-orange-800/30"
                      :disabled="isMigrating || isTargetDump"
                      :title="isTargetDump ? 'Target is read-only (Static Dump)' : $t('compare.migrateTo', { name: targetName })">
                      <Loader2 v-if="isMigratingItemId === selectedItem.name" class="w-4 h-4 animate-spin" />
                      <Zap v-else
                        class="w-4 h-4 fill-orange-500/20 group-hover/migrate:fill-white/20 group-hover/migrate:animate-pulse transition-transform duration-300 group-hover/migrate:scale-125" />
                      <span class="font-bold">{{ isMigratingItemId === selectedItem.name ? $t('common.processing') : 'Sync Now' }}</span>
                    </button>
                  </div>
                </div>
                <div class="flex-1 flex flex-col min-h-0 min-w-0">
                  <MirrorDiffView :source-ddl="selectedItem.diff?.source || null"
                    :target-ddl="selectedItem.diff?.target || null" :source-label="sourceName"
                    :target-label="targetName" :status="selectedItem.status || 'equal'" :diff-options="diffOptions"
                    :navigatable-names="navigatableNames" @navigate-to-definition="handleNavigateToDefinition" />
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
          <div v-else class="flex-1 relative min-h-0 flex flex-col">
            <CompareTreeMode :results="allResults" :source-name="sourceName" :target-name="targetName"
              :target-is-static="isTargetDump" :migrating-item-id="isMigratingItemId" :tree-expand-cmd="treeExpandCmd"
              v-model:active-type="selectedFilterType" @migrate="migrateSingleItem" @select="selectItem"
              @send-to-instant="(item, slot) => sendToInstant(item, slot)"
              @contextmenu="handleItemContextMenu" />
          </div>

        </main>
      </div>
    </div>
  </MainLayout>

  <!-- Error Details Modal -->
  <div v-if="showErrorModal && error"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div
      class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/30 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
      <div class="p-6 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <AlertCircle class="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 class="text-lg font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">{{
              $t('common.error') }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">An unexpected issue occurred during the
              operation</p>
          </div>
        </div>

        <div
          class="bg-gray-50 dark:bg-gray-950 rounded-xl p-4 border border-gray-100 dark:border-gray-800/50 font-mono text-xs text-red-600 dark:text-red-400 break-words max-h-[300px] overflow-y-auto custom-scrollbar leading-relaxed">
          {{ error }}
        </div>

        <div class="flex items-center gap-3 mt-2">
          <button @click="showErrorModal = false"
            class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all">
            {{ $t('common.close') }}
          </button>
          <button @click="runComparison(); showErrorModal = false"
            class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95">
            Retry
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Item Context Menu Container -->
  <div style="display: contents">
    <Teleport to="body">
      <div v-if="itemContextMenu.visible"
        class="fixed z-[1000] min-w-[180px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-1.5 animate-in fade-in zoom-in-95 duration-150"
        :style="{ top: itemContextMenu.y + 'px', left: itemContextMenu.x + 'px' }">
        <button @click="handleIgnoreItem(itemContextMenu.item)"
          class="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group">
          <Ban class="w-4 h-4 text-red-400 group-hover:text-red-500" />
          {{ t('compare.ignoreObject') }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import MirrorDiffView from '@/components/compare/MirrorDiffView.vue'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useConsoleStore } from '@/stores/console'
import Andb from '@/utils/andb'
import { useI18n } from 'vue-i18n'
import {
  Sigma,
  AlertCircle,
  ScanSearch,
  Zap,
  RefreshCw,
  MousePointer2,
  Database,
  Server,
  Table,
  Layers,
  Workflow,
  List,
  GitMerge,
  CaseSensitive,
  WholeWord,
  Regex,
  Binary,
  ShieldCheck,
  Info,
  GitCompare,
  ArrowRight,
  Search,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  XCircle,
  ArrowDownAZ,
  CalendarClock,
  Plus,
  Minus,
  Loader2,
  Ban,
  ArrowRightLeft,
  RotateCcw
} from 'lucide-vue-next'
import { useOperationsStore } from '@/stores/operations'
import { useNotificationStore } from '@/stores/notification'
import { useSidebarStore } from '@/stores/sidebar'
import CompareTreeMode from '@/components/compare/CompareTreeMode.vue'
import MigrationConfirm from '@/components/compare/MigrationConfirm.vue'
import TabBar from '@/components/general/TabBar.vue'

const connectionPairsStore = useConnectionPairsStore()
const appStore = useAppStore()
const operationsStore = useOperationsStore()
const consoleStore = useConsoleStore()
const notificationStore = useNotificationStore()
const sidebarStore = useSidebarStore()
const projectsStore = useProjectsStore()
const { t } = useI18n()

const searchInput = ref<HTMLInputElement | null>(null)

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

const sendToInstant = (item: any, slot: 'source' | 'target' = 'source') => {
  if (!item) return

  const ddl = item.sourceDdl || item.diff?.source || item.targetDdl || item.diff?.target || ''

  // Type Validation
  const oppositeSlot = slot === 'source' ? 'target' : 'source'
  const oppositeItem = appStore.compareStack[oppositeSlot]

  if (oppositeItem && oppositeItem.type && item.type && oppositeItem.type !== item.type) {
    notificationStore.add({
      type: 'error',
      title: 'Type Mismatch',
      message: `Cannot compare a ${item.type.replace(/s$/, '')} with a ${oppositeItem.type.replace(/s$/, '')}.`
    })
    return
  }

  appStore.compareStack[slot] = { name: item.name, ddl, type: item.type }

  appStore.isCompareStackVisible = true
}

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
  tabs.value = []
  activeTabId.value = null
})

// Deep Link Handling
onMounted(async () => {
  // Check for pairId in query
  if (connectionPairsStore.connectionPairs.length === 0) {
    await connectionPairsStore.reloadData()
  }

  if (route.query.pairId) {
    connectionPairsStore.selectPair(route.query.pairId as string)
  } else if (connectionPairsStore.availablePairs.length > 0 && !connectionPairsStore.activePair) {
    // Auto-select first pair if none selected
    const firstPairId = connectionPairsStore.availablePairs[0].id
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
  switch (type?.toLowerCase()) {
    case 'tables': case 'table': return Table
    case 'views': case 'view': return Layers
    case 'procedures': case 'procedure': return Workflow
    case 'functions': case 'function': return Sigma
    case 'triggers': case 'trigger': return Zap
    default: return Database
  }
}

const getCategoryColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'tables': case 'table': return 'text-blue-500'
    case 'views': case 'view': return 'text-indigo-500'
    case 'procedures': case 'procedure': case 'functions': case 'function': return 'text-purple-500'
    case 'triggers': case 'trigger': return 'text-amber-500'
    default: return 'text-gray-500'
  }
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
const selectedFilterType = ref<string>('all')
const searchQuery = ref('')
const searchFlags = ref({
  caseSensitive: false,
  wholeWord: false,
  regex: false,
  columns: false
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
const treeExpandCmd = ref<{ action: 'expand' | 'collapse' | '', ts: number }>({ action: '', ts: 0 })
const collapsedCategories = ref(new Set<string>())
const sortBy = ref<'status' | 'name' | 'date'>('status')

// Tabs State
const tabs = ref<any[]>([])
const activeTabId = ref<string | null>(null)

// Item Context Menu State
const itemContextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  item: null as any
})

const handleItemContextMenu = (e: MouseEvent, item: any) => {
  itemContextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    item
  }
}

const closeItemContextMenu = () => {
  itemContextMenu.value.visible = false
}

const handleIgnoreItem = (item: any) => {
  if (!item || !projectsStore.currentProject) return
  
  const settings = { ...(projectsStore.currentProject.settings || {}) }
  const excludeTags = [...(settings.excludeTags || [])]
  
  if (!excludeTags.includes(item.name)) {
    excludeTags.push(item.name)
    settings.excludeTags = excludeTags
    projectsStore.updateProject(projectsStore.currentProject.id, { settings })
    
    // Remove from local state immediately for snappy UX
    const type = item.type?.toLowerCase() || 'tables'
    if (type === 'tables') tableResults.value = tableResults.value.filter(i => i.name !== item.name)
    else if (type === 'procedures') procedureResults.value = procedureResults.value.filter(i => i.name !== item.name)
    else if (type === 'functions') functionResults.value = functionResults.value.filter(i => i.name !== item.name)
    else if (type === 'views') viewResults.value = viewResults.value.filter(i => i.name !== item.name)
    else if (type === 'triggers') triggerResults.value = triggerResults.value.filter(i => i.name !== item.name)

    // Close any open tabs for this object
    const tabId = `${item.type || 'unknown'}-${item.name}`
    handleCloseTab(tabId)

    notificationStore.add({
      type: 'success',
      title: 'Object Ignored',
      message: t('compare.ignoredNotification', { name: item.name })
    })
  }
  
  closeItemContextMenu()
}

const handleSelectTab = (id: string) => {
  const tab = tabs.value.find(t => t.id === id)
  if (tab) {
    activeTabId.value = id
    selectedItem.value = tab.data
  }
}

const handleCloseTab = (id: string) => {
  const index = tabs.value.findIndex(t => t.id === id)
  if (index === -1) return

  tabs.value.splice(index, 1)

  if (activeTabId.value === id) {
    if (tabs.value.length > 0) {
      const nextTab = tabs.value[Math.min(index, tabs.value.length - 1)]
      handleSelectTab(nextTab.id)
    } else {
      activeTabId.value = null
      selectedItem.value = null
    }
  }
}

const handleDuplicateTab = (id: string) => {
  const tab = tabs.value.find(t => t.id === id)
  if (!tab) return
  
  const newTab = JSON.parse(JSON.stringify(tab))
  newTab.id = `${tab.id}-copy-${Date.now()}`
  newTab.name = `${tab.name} (${t('common.copy')})`
  
  const index = tabs.value.findIndex(t => t.id === id)
  tabs.value.splice(index + 1, 0, newTab)
  handleSelectTab(newTab.id)
}

const handleCloseOthers = (id: string) => {
  tabs.value = tabs.value.filter(t => t.id === id)
  handleSelectTab(id)
}

const handleCloseRight = (id: string) => {
  const index = tabs.value.findIndex(t => t.id === id)
  if (index !== -1) {
    tabs.value = tabs.value.slice(0, index + 1)
    handleSelectTab(id)
  }
}



const statusFilters = computed(() => [
  { label: t('common.all'), value: 'all' },
  { label: t('compare.filters.modified'), value: 'modified' },
  { label: t('compare.filters.new'), value: 'new' },
  { label: t('compare.filters.deprecated'), value: 'deprecated' },
  { label: t('compare.filters.identical'), value: 'equal' }
])

// Migration State
const isMigrating = ref(false)
const isMigratingBatch = ref<string | null>(null)
const isMigratingItemId = ref<string | null>(null)


const hasChanges = (type: string) => {
  return allResults.value.some(i => (type === 'all' || i.type.toLowerCase() === type.toLowerCase()) && i.status.toLowerCase() !== 'equal' && i.status.toLowerCase() !== 'same')
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
    if (sortBy.value === 'date') {
      // Sort by last updated (newest first)
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0
      if (timeA !== timeB) return timeB - timeA // Descending
    } else if (sortBy.value === 'status') {
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
    }

    // In all modes, if the primary criteria is equal, sort alphabetically
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
  const filter = selectedStatusFilter.value
  filtered = filtered.filter(i => {
    const status = i.status.toLowerCase()
    if (filter === 'modified') return status === 'modified' || status === 'different' || status === 'updated'
    if (filter === 'new') return status === 'new' || status === 'missing_in_target'
    if (filter === 'deprecated') return status === 'deprecated' || status === 'missing_in_source'
    if (filter === 'equal') return status === 'equal' || status === 'same'
    // Default 'all' means all DIFFERENCES. We hide 'equal/same' by default to clear them from the list after migration
    if (filter === 'all') return status !== 'equal' && status !== 'same'
    return true
  })

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

       filtered = filtered.filter(i => {
         const nameMatch = re.test(i.name)
         if (nameMatch) return true
         
         if (searchFlags.value.columns) {
           const sourceMatch = i.diff?.source ? re.test(i.diff.source) : false
           const targetMatch = i.diff?.target ? re.test(i.diff.target) : false
           return sourceMatch || targetMatch
         }
         return false
       })
     } catch (e) {
       // Invalid regex fallback to simple include
       filtered = filtered.filter(i => {
         const lowerQuery = query.toLowerCase()
         const nameMatch = i.name.toLowerCase().includes(lowerQuery)
         if (nameMatch) return true
         
         if (searchFlags.value.columns) {
           const sourceMatch = i.diff?.source ? i.diff.source.toLowerCase().includes(lowerQuery) : false
           const targetMatch = i.diff?.target ? i.diff.target.toLowerCase().includes(lowerQuery) : false
           return sourceMatch || targetMatch
         }
         return false
       })
     }
  }

  return filtered
})

const navigatableNames = computed(() => {
  return allResults.value.map(r => r.name)
})

const handleNavigateToDefinition = (name: string) => {
  // Navigate to Schema view with selected object
  router.push({
    name: 'Schema',
    query: { select: name }
  })
}

const hasResults = computed(() => allResults.value.length > 0)

const resultsByCategory = computed(() => {
  const categories = ['tables', 'views', 'procedures', 'functions', 'triggers']
  return categories.map(cat => {
    // 1. Get raw items (unfiltered by search) to show total DDL count
    const rawItems = allResults.value.filter(i => i.type === cat)

    // 2. respect search and status filters for active display
    const items = filteredResults.value.filter(i => i.type === cat)

    return {
      type: cat,
      items,
      total: rawItems.length,
      changes: items.filter(i => i.status.toLowerCase() !== 'equal' && i.status.toLowerCase() !== 'same').length
    }
  }).filter(c => c.total > 0)
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

      if (compareName) {
        let targetArray: any[] = []
        if (type === 'tables') targetArray = tableResults.value
        else if (type === 'procedures') targetArray = procedureResults.value
        else if (type === 'functions') targetArray = functionResults.value
        else if (type === 'views') targetArray = viewResults.value
        else if (type === 'triggers') targetArray = triggerResults.value

        const newArray = [...targetArray]
        res.forEach(newItem => {
          const existingIdx = newArray.findIndex(item => item.name === newItem.name)
          if (existingIdx >= 0) {
            newArray[existingIdx] = newItem
          } else {
            newArray.push(newItem)
          }
        })

        if (type === 'tables') tableResults.value = newArray
        else if (type === 'procedures') procedureResults.value = newArray
        else if (type === 'functions') functionResults.value = newArray
        else if (type === 'views') viewResults.value = newArray
        else if (type === 'triggers') triggerResults.value = newArray

      } else {
        if (type === 'tables') tableResults.value = res
        else if (type === 'procedures') procedureResults.value = res
        else if (type === 'functions') functionResults.value = res
        else if (type === 'views') viewResults.value = res
        else if (type === 'triggers') triggerResults.value = res
      }
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
    appStore.schemaFetchProgresses = {};

    // 5. Update Sidebar to show new objects
    await sidebarStore.loadSchemas(true)

    loading.value = false
  }
}

// ==========================================
// Expose for debugging if needed
// ==========================================
defineExpose({})


const selectItem = (item: any) => {
  if (!item) return

  const tabId = `${item.type || 'unknown'}-${item.name}`
  const existingTab = tabs.value.find(t => t.id === tabId)

  if (!existingTab) {
    tabs.value.push({
      id: tabId,
      name: item.name,
      type: item.type,
      icon: getIconForType(item.type),
      data: item
    })
  } else {
    existingTab.data = item
  }

  activeTabId.value = tabId
  selectedItem.value = item
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

// Migration Actions

const migrationTerminal = ref<{
  isOpen: boolean
  items: any[]
  sqlScript: string
  sqlMap?: Record<string, string>
  fetching: boolean
  type: 'single' | 'batch'
  batchType?: string
}>({
  isOpen: false,
  items: [],
  sqlScript: '',
  sqlMap: {},
  fetching: false,
  type: 'single'
})

const fetchBatchItemSql = async (item: { type: string, name: string }) => {
  if (!migrationTerminal.value.isOpen || migrationTerminal.value.type !== 'batch') return
  if (!activePair.value) return

  const key = `${item.type}-${item.name}`
  if (migrationTerminal.value.sqlMap && migrationTerminal.value.sqlMap[key]) return // Already fetched

  migrationTerminal.value.fetching = true
  try {
    const { source, target }: any = activePair.value
    const result = await Andb.generate(source, target, {
      type: item.type, // e.g., 'tables', 'procedures'
      name: item.name,
      sourceEnv: source.environment,
      targetEnv: target.environment,
      dryRun: true
    })
    if (!migrationTerminal.value.sqlMap) migrationTerminal.value.sqlMap = {}
    migrationTerminal.value.sqlMap[key] = result.sql || `-- Result: ${result.message}`
  } catch (e: any) {
    if (!migrationTerminal.value.sqlMap) migrationTerminal.value.sqlMap = {}
    migrationTerminal.value.sqlMap[key] = `-- Error generating SQL preview: ${e.message || 'Unknown'}`
  } finally {
    migrationTerminal.value.fetching = false
  }
}

const closeMigrationTerminal = () => {
  migrationTerminal.value.isOpen = false
  migrationTerminal.value.items = []
  migrationTerminal.value.sqlScript = ''
  migrationTerminal.value.sqlMap = {}
}

const executeConfirmedMigration = () => {
  if (!migrationTerminal.value.isOpen) return;
  const dialog = { ...migrationTerminal.value };
  closeMigrationTerminal();

  if (dialog.type === 'single') {
    migrateSingleItem(dialog.items[0], true);
  } else if (dialog.type === 'batch') {
    migrateBatchInline(dialog.batchType!, true);
  }
}

const migrateSingleItem = async (item: any, skipConfirm: boolean = false) => {
  if (!activePair.value || !item || !item.name || isMigratingItemId.value === item.name || isMigrating.value || isTargetDump.value) return

  // Prompt user for confirmation to prevent accidental clicks if not skipped
  if (!skipConfirm) {
    migrationTerminal.value = {
      isOpen: true,
      items: [item],
      sqlScript: '',
      fetching: true,
      type: 'single'
    }

    // fetch SQL
    try {
      const { source, target }: any = activePair.value
      const result = await Andb.generate(source, target, {
        type: item.type,
        name: item.name,
        sourceEnv: source.environment,
        targetEnv: target.environment,
        dryRun: true
      })
      migrationTerminal.value.sqlScript = result.sql || `-- Result: ${result.message}`
    } catch (e: any) {
      migrationTerminal.value.sqlScript = `-- Error generating SQL preview: ${e.message || 'Unknown'}`
    } finally {
      migrationTerminal.value.fetching = false
    }

    return;
  }

  isMigratingItemId.value = item.name
  isMigrating.value = true

  try {
    const { source, target } = activePair.value

    let status: 'NEW' | 'UPDATED' | 'DEPRECATED' = 'NEW'
    if (item.status === 'modified' || item.status === 'different' || item.status === 'updated') status = 'UPDATED'
    if (item.status === 'deprecated' || item.status === 'missing_in_source') {
      notificationStore.add({ type: 'warning', title: 'Migration Skipped', message: `"${item.name}" is deprecated. DROP operations are not allowed by default.` })
      isMigrating.value = false
      isMigratingItemId.value = null
      return
    }

    const opId = operationsStore.addOperation({
      type: 'migrate',
      sourceEnv: source.environment,
      targetEnv: target.environment,
      status: 'pending',
      startTime: new Date()
    })

    try {
      await Andb.migrate(source, target, {
        type: item.type as any,
        sourceEnv: source.environment,
        targetEnv: target.environment,
        name: item.name,
        status: status,
        dryRun: appStore.safeMode
      })

      await applyAtomicVerify(item)

      if (!appStore.safeMode) {
        try {
          await Andb.createSnapshot(target, item.type, item.name)
        } catch (snapshotErr: any) {
          console.warn(`[Compare] Failed to create snapshot for ${item.name}:`, snapshotErr)
        }
      }

      notificationStore.add({
        type: appStore.safeMode ? 'info' : 'success',
        title: appStore.safeMode ? t('compare.dryRunComplete') : 'Migration Successful',
        message: appStore.safeMode
          ? t('compare.dryRunDesc', { name: item.name })
          : `${item.name} (${item.type}) has been migrated and verified.`
      })

      sidebarStore.setComparisonResults(allResults.value)
      sidebarStore.triggerRefresh()

      operationsStore.completeOperation(opId, true)

      try {
        const projectId = projectsStore.selectedProjectId
        if (projectId) {
          const gitConfRes = await window.electronAPI?.storage?.get(`git_config_${projectId}`)
          if (gitConfRes?.success && gitConfRes.data?.remoteUrl) {
            window.electronAPI?.andbExecute({
              sourceConnection: {} as any,
              targetConnection: {} as any,
              operation: 'git-sync' as any,
              options: {
                config: gitConfRes.data,
                env: target.environment,
                db: target.database || target.name,
                message: `chore(schema): auto-sync after migration of ${item.name}`
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
    isMigratingItemId.value = null
  }
}
const migrateBatchInline = async (type: string, skipConfirm: boolean = false) => {
  if (isTargetDump.value) {
    notificationStore.add({
      type: 'warning',
      title: t('compare.dumpReadOnly'),
      message: t('compare.cannotMigrateToDump')
    })
    return
  }

  if (!activePair.value || isMigratingBatch.value) return

  if (!skipConfirm) {
    const batchTypeLower = type.toLowerCase()
    const ddlTypes = batchTypeLower === 'schema'
      ? ['tables', 'views', 'procedures', 'functions', 'triggers']
      : [batchTypeLower]

    let pendingItems: any[] = []
    const resultsMap: Record<string, any> = { tables: tableResults.value, procedures: procedureResults.value, functions: functionResults.value, views: viewResults.value, triggers: triggerResults.value }
    for (const dtype of ddlTypes) {
      pendingItems.push(...(resultsMap[dtype] || []).filter((i: any) => {
        const s = i.status?.toLowerCase()
        return s === 'new' || s === 'updated' || s === 'different' || s === 'modified' || s === 'missing_in_target'
      }))
    }

    if (pendingItems.length === 0) {
      notificationStore.add({ type: 'info', title: 'Nothing to migrate', message: 'There are no pending changes in this category.' })
      return
    }

    if (pendingItems.length === 1) {
      // Smart Fallback: If only 1 item, treat as single item for better UX (shows SQL Preview)
      return migrateSingleItem(pendingItems[0], skipConfirm)
    }

    migrationTerminal.value = {
      isOpen: true,
      items: pendingItems,
      sqlScript: '-- Note: Interactive preview is not available for batch mode migrations.\n-- All selected items will be executed consecutively.',
      sqlMap: {},
      fetching: false,
      type: 'batch',
      batchType: type
    }
    return
  }

  isMigratingBatch.value = type

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
      const batchTypeLower = type.toLowerCase()

      const ddlTypes = batchTypeLower === 'schema'
        ? ['tables', 'views', 'procedures', 'functions', 'triggers']
        : [batchTypeLower]

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
          resultsMap[ddlType].value = results.map((r: any) => ({ ...r, type: ddlType.endsWith('s') ? ddlType : ddlType + 's' }))

          if (selectedItem.value && selectedItem.value.type === ddlType) {
            const found = results.find((r: any) => r.name === selectedItem.value.name)
            if (found) {
              selectedItem.value = { ...found, type: ddlType }
            }
          }
        }
      }

      notificationStore.add({
        type: 'success',
        title: 'Batch Migration Successful',
        message: `${type === 'Schema' ? 'Entire schema' : 'All ' + type} has been migrated and verified.`
      })

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
            window.electronAPI?.andbExecute({
              sourceConnection: {} as any,
              targetConnection: {} as any,
              operation: 'git-sync' as any,
              options: {
                config: gitConfRes.data,
                env: target.environment,
                db: target.database || target.name,
                message: `chore(schema): auto-sync after migration of ${type}`
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
      window.electronAPI.log.send('error', `Migration failed for ${type}`, e.message)
    }
  } finally {
    isMigratingBatch.value = null
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
      let updatedItem = results.find((r: any) => r.name === item.name)

      // If theCLI comparison output excludes items with no differences,
      // it means the item is now fully identical! We must synthesize the status update.
      if (!updatedItem) {
        updatedItem = { ...item, status: 'EQUAL', diff: { source: '', target: '' } }
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

  // Shortcuts
  window.addEventListener('andb-close-active-tab', handleCloseActiveTab)
  window.addEventListener('andb-prev-tab', handlePrevTab)
  window.addEventListener('andb-next-tab', handleNextTab)
  window.addEventListener('andb-refresh-active-view', handleRefreshActiveView)
  window.addEventListener('andb-focus-search', handleFocusSearch)

  window.addEventListener('click', closeItemContextMenu)
})

const handlePrevTab = () => {
  if (tabs.value.length <= 1) return
  const index = tabs.value.findIndex(t => t.id === activeTabId.value)
  const prevIndex = (index - 1 + tabs.value.length) % tabs.value.length
  handleSelectTab(tabs.value[prevIndex].id)
}

const handleNextTab = () => {
  if (tabs.value.length <= 1) return
  const index = tabs.value.findIndex(t => t.id === activeTabId.value)
  const nextIndex = (index + 1) % tabs.value.length
  handleSelectTab(tabs.value[nextIndex].id)
}

const handleCloseActiveTab = () => { if (activeTabId.value) handleCloseTab(activeTabId.value) }
const handleRefreshActiveView = () => runComparison()
const handleFocusSearch = () => searchInput.value?.focus()

onUnmounted(() => {
  window.removeEventListener('category-selected', handleCategorySelected as any)
  window.removeEventListener('object-selected', handleObjectSelected as any)
  window.removeEventListener('database-refresh-requested', handleDatabaseRefreshRequested as any)
  window.removeEventListener('category-refresh-requested', handleCategoryRefreshRequested as any)
  window.removeEventListener('object-refresh-requested', handleObjectRefreshRequested as any)

  window.removeEventListener('andb-close-active-tab', handleCloseActiveTab)
  window.removeEventListener('andb-prev-tab', handlePrevTab)
  window.removeEventListener('andb-next-tab', handleNextTab)
  window.removeEventListener('andb-refresh-active-view', handleRefreshActiveView)
  window.removeEventListener('andb-focus-search', handleFocusSearch)

  window.removeEventListener('click', closeItemContextMenu)
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
