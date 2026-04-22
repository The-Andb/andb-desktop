<template>
  <MainLayout>
    <template #toolbar>
      <div class="flex items-center justify-between w-full h-full gap-4 px-2">
        <!-- Left Side: Title -->
        <div class="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black text-gray-400">
           {{ $t('schema.title') }}
        </div>

        <!-- Right Actions Area -->
        <div class="flex items-center gap-4">
          <!-- Fetch Group -->
          <div class="flex items-center gap-3">
            <div v-if="selectedDbLastUpdated && !appStore.isSchemaFetching" class="hidden sm:flex flex-col items-end px-2 border-r border-gray-200 dark:border-gray-700">
              <span class="text-[9px] text-gray-400 uppercase tracking-tighter">{{ $t('schema.lastSynced') }}</span>
              <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">{{ formatTimeAgo(selectedDbLastUpdated) }}</span>
            </div>


            <div class="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1"></div>

            <button @click="appStore.layoutSettings.aiPanel = !appStore.layoutSettings.aiPanel"
              :class="['p-2 rounded-xl border transition-all', appStore.layoutSettings.aiPanel ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 hover:bg-gray-50']"
              title="Toggle AI Panel">
              <LayoutList class="w-4 h-4" />
            </button>

            <button 
              @click="loadSchema(true)" 
              :disabled="appStore.isSchemaFetching || loading || !selectedConnectionId"
              class="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md shadow-primary-500/10 transition-all disabled:opacity-50 text-[11px] font-bold border-none"
              :title="fetchButtonText"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': appStore.isSchemaFetching || loading }" />
              <span class="uppercase tracking-tight">{{ appStore.isSchemaFetching ? $t('schema.fetching') : fetchButtonText }}</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <template #breadcrumbs>
      <div class="flex items-center gap-2">
         <div class="flex items-center gap-1.5 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 rounded-md border border-primary-100 dark:border-primary-800/50">
            <Database class="w-3 h-3 text-primary-500" />
            <span class="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">{{ activeConnectionName }}</span>
            <button 
              @click="loadSchema(false)" 
              class="p-0.5 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors text-primary-400 hover:text-primary-600"
              :title="$t('schema.reloadLocal')"
            >
              <RotateCcw class="w-2.5 h-2.5" />
            </button>
         </div>

         <div class="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>

          <button 
            @click="resetNavigation"
            class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
          >
            {{ $t('schema.overview') }}
          </button>

          <template v-if="selectedEnv">
            <span class="text-gray-300 dark:text-gray-600">/</span>
            <span class="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{{ selectedEnv }}</span>
          </template>

          <template v-if="selectedDbName">
            <span class="text-gray-300 dark:text-gray-600">/</span>
            <span class="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">{{ selectedDbName }}</span>
          </template>

          <template v-if="selectedType">
            <span class="text-gray-300 dark:text-gray-600">/</span>
            <span class="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{{ $t(`navigation.ddl.${selectedType.toLowerCase()}`) }}</span>
          </template>

          <template v-if="selectedObject">
            <span class="text-gray-300 dark:text-gray-600">/</span>
            <span class="text-[10px] font-bold text-gray-900 dark:text-white font-mono">{{ selectedObject.name }}</span>
          </template>
      </div>
    </template>



    <div class="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-950">



    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden relative">
        <main class="flex-1 flex overflow-hidden relative" :class="{ 'flex-row-reverse': appStore.layoutSettings.sidebarPosition === 'right' }" v-if="!loading || hasResults">
          <!-- Left: Object Categories & List -->
          <div v-if="appStore.layoutSettings.sidebar" :style="{ width: resultsWidth + 'px' }" class="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col shrink-0 relative" :class="appStore.layoutSettings.sidebarPosition === 'right' ? 'border-l' : 'border-r'">

              <!-- Search Bar (Professional Redesign) -->
              <div v-if="hasResults" class="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 shadow-sm">
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                    <Search class="w-4 h-4 text-gray-400 group-focus-within:text-primary-500" />
                  </span>
                  <input 
                    ref="searchInput"
                    v-model="searchQuery"
                    type="text" 
                    :placeholder="searchFlags.columns ? 'Search column names...' : searchFlags.content ? 'Search content & names...' : 'Search names...'"
                    class="w-full pl-9 pr-36 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900 dark:text-white transition-all shadow-inner"
                    @keyup.enter="searchFlags.content && performContentSearch()"
                  />
                  
                  <!-- Unified Search Icons (VS Code Style) -->
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 space-x-0.5">
                    <button 
                      @click="searchFlags.caseSensitive = !searchFlags.caseSensitive"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.caseSensitive ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Match Case"
                    >
                      <CaseSensitive class="w-3.5 h-3.5" />
                    </button>
                    <button 
                      @click="searchFlags.wholeWord = !searchFlags.wholeWord"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.wholeWord ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Match Whole Word"
                    >
                      <WholeWord class="w-3.5 h-3.5" />
                    </button>
                    <button 
                      @click="searchFlags.regex = !searchFlags.regex"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.regex ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Use Regex"
                    >
                      <Regex class="w-3.5 h-3.5" />
                    </button>
                    
                    <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

                    <button 
                      @click="toggleContentSearch"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.content ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Content Search (Snippets)"
                    >
                      <Binary class="w-3.5 h-3.5" />
                    </button>

                    <button 
                      @click="toggleColumnSearch"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.columns ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      :title="isIndexingColumns ? 'Column Search (Indexing...)' : 'Column Search'"
                    >
                      <Columns class="w-3.5 h-3.5" :class="{ 'animate-pulse': isIndexingColumns }" />
                    </button>

                    <button 
                      v-if="searchQuery"
                      @click="clearSearch"
                      class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Column Index Progress -->
                <div v-if="isIndexingColumns" class="mt-2 px-1">
                  <div class="flex items-center gap-2 mb-1">
                    <RefreshCw class="w-3 h-3 animate-spin text-primary-500" />
                    <span class="text-[9px] text-gray-400 uppercase font-bold tracking-tight">Indexing columns... {{ columnIndexProgress.current }}/{{ columnIndexProgress.total }}</span>
                  </div>
                  <div class="w-full h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-primary-500 rounded-full transition-all duration-300" :style="{ width: columnIndexProgress.total > 0 ? ((columnIndexProgress.current / columnIndexProgress.total) * 100) + '%' : '0%' }"></div>
                  </div>
                </div>

                <!-- Search Progress/Summary & Tree Controls -->
                <div class="flex items-center justify-between mt-2 px-1">
                   <div v-if="searchQuery" class="flex items-center animate-in fade-in slide-in-from-top-1 duration-200">
                     <div v-if="isSearchingContent" class="flex items-center gap-2">
                      <RefreshCw class="w-3 h-3 animate-spin text-primary-500" />
                      <span class="text-[10px] text-gray-500 uppercase font-bold tracking-tight animate-pulse">Searching codebases...</span>
                     </div>
                     <div v-else class="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                      <span v-if="searchFlags.columns" class="text-primary-600 dark:text-primary-400">
                        {{ columnSearchSummary }}
                      </span>
                      <span v-else-if="searchFlags.content" class="text-primary-600 dark:text-primary-400">
                        {{ contentSearchResults.reduce((acc, curr) => acc + (curr.matches?.length || 0), 0) }} total matches
                      </span>
                      <span v-else>
                        {{ filteredResults.length }} objects found
                      </span>
                      <!-- Filter Tag (if any) -->
                      <div v-if="selectedFilterType !== 'all'" class="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-gray-500">
                        <Filter class="w-2.5 h-2.5" />
                        {{ selectedFilterType }}
                      </div>
                     </div>
                   </div>
                   <div v-else class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                     {{ filteredResults.length }} objects
                   </div>

                   <!-- Expand / Collapse All -->
                   <!-- Sort Toggle (Group) -->
                    <div class="flex items-center gap-0.5 ml-auto shrink-0 mr-1 pr-1 border-r border-gray-200 dark:border-gray-700">
                      <!-- Field Toggle -->
                      <button
                        @click="toggleSortBy"
                        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200 group/sortby"
                        :class="sortBy === 'date' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                        :title="sortBy === 'name' ? 'Sort by Name (Click for Date)' : 'Sort by Date (Click for Name)'"
                      >
                         <CaseSensitive v-if="sortBy === 'name'" class="w-3.5 h-3.5" />
                         <CalendarClock v-else class="w-3.5 h-3.5" />
                      </button>

                      <!-- Order Toggle -->
                      <button
                        @click="toggleSortOrder"
                        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200 group/sortorder"
                        :class="sortOrder === 'desc' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                        :title="sortOrder === 'asc' ? 'Ascending (Click for Desc)' : 'Descending (Click for Asc)'"
                      >
                         <ArrowDownAZ v-if="sortOrder === 'asc'" class="w-3.5 h-3.5 transition-transform group-hover/sortorder:scale-110" />
                         <ArrowUpAZ v-else class="w-3.5 h-3.5 transition-transform group-hover/sortorder:scale-110" />
                      </button>
                    </div>

                   <!-- Expand / Collapse All -->
                   <div class="flex items-center gap-0.5 shrink-0">
                     <button
                       @click="treeExpandCmd = { action: 'expand', ts: Date.now() }"
                       class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                       title="Expand All"
                     >
                       <Plus class="w-3.5 h-3.5" />
                     </button>
                     <button
                       @click="treeExpandCmd = { action: 'collapse', ts: Date.now() }"
                       class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                       title="Collapse All"
                     >
                       <Minus class="w-3.5 h-3.5" />
                     </button>
                   </div>
                </div>

                <!-- Table Size Filter Pills -->
                <div v-if="hasResults && !searchQuery" class="flex items-center gap-1.5 mt-2.5 px-1 py-1 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-800/50 pt-2.5">
                  <span class="text-[9px] font-black uppercase tracking-tighter text-gray-400 mr-1">Size:</span>
                  <button 
                    @click="selectedSizeFilter = selectedSizeFilter === 'small' ? 'all' : 'small'"
                    class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all border shrink-0"
                    :class="selectedSizeFilter === 'small' 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
                  >
                    Small
                  </button>
                  <button 
                    @click="selectedSizeFilter = selectedSizeFilter === 'medium' ? 'all' : 'medium'"
                    class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all border shrink-0"
                    :class="selectedSizeFilter === 'medium' 
                      ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/20' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
                  >
                    Medium
                  </button>
                  <button 
                    @click="selectedSizeFilter = selectedSizeFilter === 'large' ? 'all' : 'large'"
                    class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all border shrink-0"
                    :class="selectedSizeFilter === 'large' 
                      ? 'bg-red-500 border-red-500 text-white shadow-sm shadow-red-500/20' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-transparent hover:border-gray-300 dark:hover:border-gray-600'"
                  >
                    Large
                  </button>
                  <button 
                    v-if="selectedSizeFilter !== 'all'"
                    @click="selectedSizeFilter = 'all'"
                    class="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Clear Size Filter"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div v-if="!hasResults" class="p-8 text-center text-gray-400 h-full flex flex-col justify-center">
                  <ScanSearch class="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p class="text-xs uppercase tracking-widest font-bold">{{ $t('schema.noSchema') }}</p>
                  <p class="text-[10px] opacity-60 mt-1">{{ $t('schema.selectDbFetch') }}</p>
                </div>
                <SchemaTreeMode 
                  v-if="treeMode === 'tree'"
                  :results="filteredResults" 
                  :selected-item-name="selectedItem?.name"
                  :active-search-line="activeSearchLine"
                  :search-term="searchQuery"
                  :focus-type="focusType"
                  :expand-cmd="treeExpandCmd"
                  :navigatable-names="navigatableNames"
                  :stats="tableStatsMap"
                  :column-search-active="searchFlags.columns && !!searchQuery.trim()"
                  @select="selectItem"
                  @navigateTo="handleNavigateTo"
                  @navigate-to-definition="handleNavigateToDefinition"
                  @send-to-instant="(item: any, slot: any) => handleSendToInstantFromTree(item, slot)"
                  @select-column="handleSelectColumn"
                 />

              </div>
              
              <!-- Resize Handle -->
              <div 
                @mousedown="startResultsResize"
                class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-400/50 transition-colors z-10"
              ></div>
            </div>

            <!-- Right: DDL Viewer (Simplified MirrorDiffView) -->
            <div class="flex-1 bg-white dark:bg-gray-950 overflow-hidden flex flex-col relative">
              <!-- Tab Bar -->
              <TabBar 
                v-if="tabs.length > 0"
                :tabs="tabs" 
                :active-tab-id="activeTabId" 
                @select="handleSelectTab" 
                @close="handleCloseTab"
                @duplicate="handleDuplicateTab"
                @close-others="handleCloseOthers"
                @close-right="handleCloseRight"
              />
              <div v-if="selectedItem" class="flex-1 flex flex-col overflow-hidden">
                <div v-if="appStore.layoutSettings.toolbar" class="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0 h-14">
                  <div class="flex items-center overflow-hidden gap-3">
                    <div class="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                      <component :is="getIconForType(selectedItem.type)" class="w-4 h-4" />
                    </div>
                    <div class="min-w-0" v-if="selectedItem.type === 'diagrams'">
                      <h2 class="font-bold text-gray-900 dark:text-white text-title truncate">{{ $t('schema.visualDiagram') }}</h2>
                      <p class="text-[10px] uppercase font-bold text-gray-400 tracking-wider transition-colors duration-200">{{ activeConnectionName }}</p>
                    </div>
                    <div class="min-w-0" v-else>
                      <h2 class="font-bold text-gray-900 dark:text-white text-title truncate">{{ selectedItem.name }}</h2>
                      <div class="flex items-center space-x-2 mt-0.5">
                        <span class="text-[10px] uppercase font-bold text-gray-400 tracking-wider transition-colors duration-200">{{ selectedItem.type }}</span>
                        <div v-if="selectedDbLastUpdated" class="flex items-center text-[10px] text-gray-400 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                          <span class="mr-1 opacity-70">{{ $t('schema.lastSynced') }}:</span>
                          <span class="font-mono text-gray-500 dark:text-gray-300">{{ formatTimeAgo(selectedDbLastUpdated) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2" v-if="selectedItem.type !== 'diagrams'">
                     <!-- Premium Segmented Control for Tree/Code -->
                     <div v-if="selectedItem.type === 'tables' || selectedItem.type === 'table'" class="flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 mx-2 shadow-inner">
                        <button 
                            @click="viewMode = 'visual'"
                            class="flex items-center gap-1.5 px-3 py-1 rounded-md transition-all text-[11px] font-bold uppercase tracking-tight"
                            :class="viewMode === 'visual' 
                              ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' 
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
                            title="Visual Tree View"
                        >
                            <LayoutTemplate class="w-3.5 h-3.5" />
                            <span>{{ $t('compare.treeViewLabel') }}</span>
                        </button>

                        <button 
                            @click="viewMode = 'code'"
                            class="flex items-center gap-1.5 px-3 py-1 rounded-md transition-all text-[11px] font-bold uppercase tracking-tight"
                            :class="viewMode === 'code' 
                              ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400' 
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
                            title="SQL Code View"
                        >
                            <Code2 class="w-3.5 h-3.5" />
                            <span>{{ $t('schema.code') }}</span>
                        </button>
                    </div>

                    <button 
                      @click="takeSnapshot"
                      :disabled="loading"
                      class="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                      :title="$t('schema.takeSnapshot')"
                    >
                      <Camera class="w-4 h-4" />
                    </button>
                    <button 
                      @click="viewHistory"
                      class="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                      :title="$t('schema.viewHistory')"
                    >
                      <History class="w-4 h-4" />
                    </button>

                    <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <!-- Inline segmented control for Instant Compare -->
                    <div class="flex items-center bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-1 py-0.5 shadow-sm transition-all hover:shadow ml-2">
                      <!-- Orange Slot: Always visible -->
                      <button 
                        @click="handlePickStack('source')"
                        class="p-1 rounded-full transition-all group/src"
                        :class="[
                          isCurrentSource ? 'bg-orange-500 text-white dark:bg-orange-600' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20',
                          !appStore.compareStack.source ? 'animate-pulse text-orange-400/60' : ''
                        ]"
                        title="Set as Source (Orange Flame)"
                      >
                        <Flame class="w-3.5 h-3.5 transition-colors" :class="isCurrentSource ? 'text-white' : 'text-orange-400 group-hover/src:text-orange-500'" />
                      </button>

                      <!-- Separator and Blue Slot: Only visible if source is set -->
                      <template v-if="appStore.compareStack.source">
                        <span class="text-[9px] font-black text-gray-400 mx-0.5 select-none opacity-50">vs</span>
                        <button 
                          @click="handlePickStack('target')"
                          class="p-1 rounded-full transition-all group/tgt"
                          :class="[
                            isCurrentTarget ? 'bg-blue-500 text-white dark:bg-blue-600' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                            !appStore.compareStack.target ? 'animate-pulse text-blue-400/60' : ''
                          ]"
                          title="Set as Target (Blue Flame)"
                        >
                          <Flame class="w-3.5 h-3.5 transition-colors" :class="isCurrentTarget ? 'text-white' : 'text-blue-400 group-hover/tgt:text-blue-500'" />
                        </button>
                      </template>
                    </div>
                    <button 
                      @click="downloadDDL"
                      class="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                      :title="$t('common.download')"
                    >
                      <Download class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- 1. Schema Diagram Mode -->
                <div v-if="selectedItem.type === 'diagrams'" class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
                  <SchemaDiagram :tables="schemaData.tables" />
                </div>
                
                <!-- 2. Raw SQL Viewer Mode -->
                <div v-else-if="viewMode === 'code' || (selectedItem.type !== 'tables' && selectedItem.type !== 'table')" class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
                    <DDLViewer 
                        ref="ddlViewerRef"
                        :content="formattedDDL" 
                        :search-term="searchQuery"
                        :font-size="appStore.fontSizes.code" 
                        :font-family="appStore.fontFamilies.code"
                        :navigatable-names="navigatableNames"
                        @navigate-to-definition="handleNavigateToDefinition"
                    />
                </div>
                
                <!-- 3. Detailed Table View Mode (MySQL Workbench style) -->
                <div v-else class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative bg-gray-50/50 dark:bg-gray-900/50">
                    <TableDetailedView 
                        v-if="detailedTableData && selectedItem"
                        :key="'table-detail-' + selectedItem.name"
                        :table-name="selectedItem.name"
                        :columns="detailedTableData.columns"
                        :indexes="detailedTableData.indexes"
                        :foreign-keys="detailedTableData.foreignKeys"
                        :options="detailedTableData.options"
                        :partitions="detailedTableData.partitions"
                        :triggers="schemaData.triggers"
                        :stats="currentTableStats"
                        :highlight-column="highlightColumnName"
                        @refresh-stats="fetchTableStats"
                    ></TableDetailedView>
                    
                    <div v-else class="flex items-center justify-center h-full w-full">
                      <RefreshCw class="w-8 h-8 text-primary-500 animate-spin opacity-20" />
                    </div>
                </div>
              </div>
              
              <div v-else class="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 grayscale opacity-40">
                <div class="relative mb-6">
                  <div class="absolute -inset-4 bg-primary-500/10 rounded-full blur-2xl animate-pulse"></div>
                  <MousePointer2 class="w-16 h-16 text-primary-500/50" />
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-widest">{{ $t('schema.selectObject') }}</h3>
                <p class="text-sm max-w-xs leading-relaxed">{{ $t('schema.selectObjectDesc') }}</p>
               </div>
            </div>
        </main>
      </div>
    </div>

    <!-- No slot needed, AI Panel is now in MainLayout -->
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import { ref, computed, onMounted, onUnmounted, watch, nextTick, shallowRef, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useAppStore } from '@/stores/app'
import { useConsoleStore } from '@/stores/console'
import { useProjectsStore } from '@/stores/projects'
import Andb from '@/utils/andb'
import DDLViewer from '@/components/ddl/DDLViewer.vue'
import SchemaDiagram from '@/components/ddl/SchemaDiagram.vue'
import { 
  History, 
  RefreshCw, 
  Database, 
  Folder,
  RotateCcw,
  Search,
  ChevronRight,
  ShieldCheck,
  X,
  Info,
  Maximize2,
  ChevronLeft,
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarClock,
  Zap,
  Sigma,
  Plus,
  Minus,
  Grid3X3,
  Eye,
  Cpu,
  Binary,
  Filter,
  Flame,
  LayoutDashboard,
  PanelLeft,
  PanelTop,
  Navigation,
  Check,
  Layers,
  Columns,
  LayoutTemplate,
  ScanSearch,
  MousePointer2,
  ArrowRight,
  Download,
  Camera,
  Network,
  PanelBottom,
  Code2,
  Server
} from 'lucide-vue-next'
import { useSidebarStore } from '@/stores/sidebar'
import { useNotificationStore } from '@/stores/notification'
import TableDetailedView from '@/components/ddl/TableDetailedView.vue'
import SchemaTreeMode from '@/components/ddl/SchemaTreeMode.vue'
import TabBar from '@/components/general/TabBar.vue'
import { useSchemaLoader } from '@/composables/useSchemaLoader'
import AIReviewPanel from '@/components/ai/AIReviewPanel.vue'

const appStore = useAppStore()
const projectsStore = useProjectsStore()
const { t, locale } = useI18n()
const consoleStore = useConsoleStore()
const notificationStore = useNotificationStore()
const sidebarStore = useSidebarStore()
const router = useRouter()
const route = useRoute()
const searchInput = ref<HTMLInputElement | null>(null)

const isAIReviewOpen = ref(false)

const sortOrder = ref<'asc' | 'desc'>('asc')
const sortBy = ref<'name' | 'date'>('name')

const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const toggleSortBy = () => {
    sortBy.value = sortBy.value === 'name' ? 'date' : 'name'
    // Default to newest first when switching to date
    if (sortBy.value === 'date') sortOrder.value = 'desc'
    else sortOrder.value = 'asc'
}

const activeConnection = computed(() => appStore.getConnectionById(appStore.selectedConnectionId))
const selectedEnv = computed(() => activeConnection.value?.environment)
const selectedDbName = computed(() => activeConnection.value?.database || activeConnection.value?.name)
const selectedType = computed(() => selectedFilterType.value === 'all' ? undefined : selectedFilterType.value)
const selectedObject = computed(() => selectedItem.value)

// Watch for project changes to reset schema selection
watch(() => projectsStore.selectedProjectId, () => {
  // @ts-ignore - Handle possible null/string mismatch in different setups
  selectedConnectionId.value = ''
  selectedItem.value = null
  selectedFilterType.value = 'all'
  schemaData.value = {
    tables: [],
    procedures: [],
    functions: [],
    views: [],
    triggers: [],
    events: []
  }
})


const typeIcons = {
  tables: Grid3X3,
  views: Eye,
  procedures: Cpu,
  functions: Sigma,
  triggers: Zap,
  events: CalendarClock,
  diagrams: Network
}

const getIconForType = (type: string) => {
  const key = type?.toLowerCase() as keyof typeof typeIcons
  return typeIcons[key] || Database
}
const selectedConnectionId = computed({
  get: () => appStore.selectedConnectionId,
  set: (val) => appStore.selectedConnectionId = val
})

const activeConnectionName = computed(() => {
  const conn = appStore.getConnectionById(appStore.selectedConnectionId)
  return conn ? `${conn.environment}: ${conn.database || conn.name}` : t('schema.noConnection')
})

const resetNavigation = () => {
  selectedFilterType.value = 'all'
  selectedItem.value = null
}

const selectedFilterType = ref('all')
const selectedSizeFilter = ref<'all' | 'small' | 'medium' | 'large'>('all')

// Auto-switch to table filter and expand when size filter is selected
watch(selectedSizeFilter, (newVal) => {
  if (newVal !== 'all') {
    selectedFilterType.value = 'tables'
    treeExpandCmd.value = { action: 'expand', ts: Date.now() }
  } else {
    // Restore all object types when size filter is cleared
    selectedFilterType.value = 'all'
  }
})

const treeMode = ref<'tree' | 'flat'>('tree')
const searchQuery = ref('')
const searchFlags = ref({
  caseSensitive: false,
  wholeWord: false,
  regex: false,
  content: false,
  columns: false
})
const highlightColumnName = ref<string | null>(null)
const contentSearchResults = ref<any[]>([])
const isSearchingContent = ref(false)
const selectedItem = shallowRef<any>(null)
const activeSearchLine = ref<number | null>(null)
const focusType = ref<string | undefined>(undefined)
const treeExpandCmd = ref<{ action: 'expand' | 'collapse', ts: number } | null>(null)
const ddlViewerRef = ref<any>(null)

// Tabs State
const tabs = ref<any[]>([])
const activeTabId = ref<string | null>(null)

const handleSelectTab = (id: string) => {
  const tab = tabs.value.find(t => t.id === id)
  if (tab) {
    activeTabId.value = id
    // Restore state from tab to prevent flickering/loading
    detailedTableData.value = tab.detailedData || null
    selectedItem.value = tab.data
    if (tab.viewMode) viewMode.value = tab.viewMode
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
      detailedTableData.value = null
    }
  }
}

const handleDuplicateTab = (id: string) => {
  const tab = tabs.value.find(t => t.id === id)
  if (!tab) return
  
  const newTab = JSON.parse(JSON.stringify(tab))
  newTab.id = `${tab.id}-copy-${Date.now()}`
  newTab.name = `${tab.name} (Copy)`
  
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

// Initialize schema loader
const {
  loading,
  statusMessage,
  schemaData,
  allResults,
  selectedDbLastUpdated,
  loadSchema,
  columnIndex,
  isIndexingColumns,
  columnIndexProgress
} = useSchemaLoader(
  // Reconstruct ref matching structure required by the composable
  computed(() => appStore.selectedConnectionId),
  selectedItem,
  selectedFilterType
)

// --- Table Inspector (AI DBA Super Mode) ---
const tableStatsMap = ref<Record<string, any>>({})
const isFetchingStats = ref(false)
const lastFetchedConnId = ref<string | null>(null)
let fetchStatsTimeout: any = null

const fetchTableStats = async (force = false) => {
  const currentConnId = appStore.selectedConnectionId
  if (!currentConnId || (lastFetchedConnId.value === currentConnId && !force)) return
  if (isFetchingStats.value) return

  // Debounce to prevent multiple watchers triggering at once
  if (fetchStatsTimeout) clearTimeout(fetchStatsTimeout)
  fetchStatsTimeout = setTimeout(async () => {
    // Re-check state after timeout
    if (isFetchingStats.value) return
    const conn = appStore.getConnectionById(currentConnId)
    if (!conn) return
    
    isFetchingStats.value = true
    try {
      const stats = await Andb.getTableStats(conn as any)
      if (Array.isArray(stats)) {
        const map: Record<string, any> = {}
        for (const s of stats) {
          map[s.tableName] = s
        }
        tableStatsMap.value = map
      }
    } catch (e) {
      console.warn('[GlobalSchemaView] Failed to fetch table stats:', e)
    } finally {
      isFetchingStats.value = false
      // Mark as fetched even on failure to prevent infinite retry loops from other watchers
      lastFetchedConnId.value = currentConnId
    }
  }, 200)
}

// Unified robust watcher for statistics discovery
watch([() => appStore.selectedConnectionId, () => schemaData.value.tables?.length], 
  ([newId, newLen], [oldId, oldLen]) => {
    // 1. If connection changed, it's a primary trigger
    const connectionChanged = newId !== oldId
    // 2. If tables length changed (and wasn't zero), it means schema finished loading
    const schemaJustLoaded = newLen && newLen > 0 && newLen !== oldLen

    if (newId && (connectionChanged || schemaJustLoaded)) {
      fetchTableStats()
    }
  }, { immediate: true }
)

const currentTableStats = computed(() => {
  if (!selectedItem.value) return undefined
  return tableStatsMap.value[selectedItem.value.name] || undefined
})

const navigatableNames = computed(() => {
  return allResults.value
    .filter(i => i.type !== 'all' && i.type !== 'diagrams')
    .map(i => i.name)
})

// Build search regex helper
const buildSearchRegex = (query: string): RegExp | null => {
  if (!query) return null
  const { caseSensitive, wholeWord, regex } = searchFlags.value
  try {
    if (regex) {
      return new RegExp(query, caseSensitive ? '' : 'i')
    }
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (wholeWord) {
      return new RegExp(`\\b${escaped}\\b`, caseSensitive ? '' : 'i')
    }
    return new RegExp(escaped, caseSensitive ? '' : 'i')
  } catch {
    return null
  }
}

const filteredResults = computed(() => {
  if (searchFlags.value.content && !searchFlags.value.columns) {
    return contentSearchResults.value
  }

  let filtered = allResults.value
  
  if (selectedFilterType.value !== 'all') {
    filtered = filtered.filter(i => i.type === selectedFilterType.value)
  }

  const query = searchQuery.value.trim()

  // --- Column Search Mode ---
  if (searchFlags.value.columns && query) {
    const re = buildSearchRegex(query)
    if (!re) return []

    // Only show tables that have matching columns
    const results: any[] = []
    for (const item of filtered) {
      if (item.type !== 'tables' && item.type !== 'table') continue
      const tableData = columnIndex.value[item.name]
      if (!tableData) continue

      const matchedColumns = tableData.columns.filter(col => re.test(col.name))
      // Also search index column names
      const matchedIndexCols = tableData.indexes.filter((idx: any) => {
        const cols = idx.columns || ''
        return re.test(cols)
      })
      // Also search FK column references
      const matchedFKCols = tableData.foreignKeys.filter((fk: any) => {
        return re.test(fk.localColumns || '') || re.test(fk.referencedColumns || '') || re.test(fk.referencedTable || '')
      })

      if (matchedColumns.length > 0 || matchedIndexCols.length > 0 || matchedFKCols.length > 0) {
        results.push({
          ...item,
          matchedColumns,
          matchedIndexes: matchedIndexCols,
          matchedForeignKeys: matchedFKCols
        })
      }
    }

    return [...results].sort((a, b) => {
      // Sort by number of matched columns descending, then name
      const diff = (b.matchedColumns?.length || 0) - (a.matchedColumns?.length || 0)
      return diff !== 0 ? diff : a.name.localeCompare(b.name)
    })
  }

  // --- Default Name Search ---
  if (query) {
    const re = buildSearchRegex(query)
    if (re) {
      filtered = filtered.filter(i => re.test(i.name))
    } else {
      filtered = filtered.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    }
  }

  // Size filtering for tables (Align with TableDetailedView thresholds)
  if (selectedSizeFilter.value !== 'all') {
    // When size filter is active, we only care about tables
    filtered = filtered.filter(i => {
      if (i.type !== 'tables' && i.type !== 'table') return false
      
      const stats = tableStatsMap.value[i.name]
      if (!stats) return false 
      
      const rows = stats.rowCount || 0
      if (selectedSizeFilter.value === 'small') return rows <= 100000
      if (selectedSizeFilter.value === 'medium') return rows > 100000 && rows <= 5000000
      if (selectedSizeFilter.value === 'large') return rows > 5000000
      return true
    })
  }

  // Sorting logic based on user preference
  // Use a shallow copy to avoid mutating the source array
  return [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortBy.value === 'name') {
      cmp = a.name.localeCompare(b.name)
    } else if (sortBy.value === 'date') {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
      cmp = dateA - dateB
    }
    return sortOrder.value === 'asc' ? cmp : -cmp
  })
})

// Column search summary text
const columnSearchSummary = computed(() => {
  if (!searchFlags.value.columns || !searchQuery.value.trim()) return ''
  const results = filteredResults.value
  const totalCols = results.reduce((acc: number, r: any) => acc + (r.matchedColumns?.length || 0), 0)
  const totalIdxs = results.reduce((acc: number, r: any) => acc + (r.matchedIndexes?.length || 0), 0)
  const totalFKs = results.reduce((acc: number, r: any) => acc + (r.matchedForeignKeys?.length || 0), 0)
  const parts = [`${totalCols} columns in ${results.length} tables`]
  if (totalIdxs > 0) parts.push(`${totalIdxs} indexes`)
  if (totalFKs > 0) parts.push(`${totalFKs} FKs`)
  return parts.join(' · ')
})

const performContentSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query) {
    contentSearchResults.value = []
    return
  }

  const conn = appStore.getConnectionById(selectedConnectionId.value)
  if (!conn) return

  isSearchingContent.value = true
  try {
    const results = await Andb.search(conn, query, {
      caseSensitive: searchFlags.value.caseSensitive,
      wholeWord: searchFlags.value.wholeWord,
      regex: searchFlags.value.regex
    })
    
    // Convert results to format expected by the tree
    // results is IDependencyMatch[]: { sourceObject: { name, type }, matches: { line, snippet }[] }
    contentSearchResults.value = (results || []).map((r: any) => {
      const type = pluralizeType(r.sourceObject.type)

      return {
        name: r.sourceObject.name,
        type,
        content: r.sourceObject.content, // Pass DDL content to allow viewer to show it
        matches: r.matches,
        title: `${r.sourceObject.name} (${r.matches.length} matches)`
      }
    })
  } catch (e) {
    console.error('Content search failed:', e)
    notificationStore.add({ type: 'error', title: 'Search Failed', message: (e as any).message })
  } finally {
    isSearchingContent.value = false
  }
}

watch([searchQuery, () => searchFlags.value.caseSensitive, () => searchFlags.value.wholeWord, () => searchFlags.value.regex], () => {
  if (searchFlags.value.content) {
    performContentSearch()
  }
})

const toggleContentSearch = () => {
  searchFlags.value.content = !searchFlags.value.content
  if (searchFlags.value.content) {
    searchFlags.value.columns = false // Mutually exclusive
    performContentSearch()
  } else {
    contentSearchResults.value = []
  }
}

const toggleColumnSearch = () => {
  searchFlags.value.columns = !searchFlags.value.columns
  if (searchFlags.value.columns) {
    searchFlags.value.content = false // Mutually exclusive
    contentSearchResults.value = []
  }
  highlightColumnName.value = null
}

const clearSearch = () => {
  searchQuery.value = ''
  contentSearchResults.value = []
  highlightColumnName.value = null
}

const handleSelectColumn = (payload: { item: any; columnName: string }) => {
  // Navigate to the table and highlight the column in visual view
  highlightColumnName.value = payload.columnName
  selectItem(payload.item)
  // Force visual mode for table detail view
  viewMode.value = 'visual'
}

watch(selectedItem, () => {
    // Reset to code view when finding a new item
    // But default to visual if it's a TABLE and we prefer visual
    if (selectedItem.value?.type === 'tables' || selectedItem.value?.type === 'table') {
        viewMode.value = 'visual' 
    } else {
        viewMode.value = 'code'
    }
})

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return t('schema.never')
  try {
    let utcString = dateString
    if (!dateString.endsWith('Z')) {
      utcString = dateString.replace(' ', 'T') + 'Z'
    }
    
    const date = new Date(utcString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    
    if (diffSec < 0) return t('common.timeAgo.justNow')
    if (diffSec < 60) return t('common.timeAgo.justNow')
    if (diffSec < 3600) return t('common.timeAgo.minAgo', { n: Math.floor(diffSec / 60) })
    if (diffSec < 86400) return t('common.timeAgo.hourAgo', { n: Math.floor(diffSec / 3600), s: Math.floor(diffSec / 3600) > 1 ? 's' : '' })
    return date.toLocaleDateString()
  } catch (e) {
    return t('common.info')
  }
}

const formattedDDL = computed(() => {
  const item = selectedItem.value
  if (!item) return ''
  
  // Handle different property names from Cache vs Live Fetch
  // Cache (SQLite) uses 'content', Live (Andb Core) uses 'ddl'
  const ddl = item.ddl || item.content
  
  if (!ddl) return ''
  if (Array.isArray(ddl)) {
    return ddl.join('\n')
  }
  return ddl
})

const detailedTableData = shallowRef<any>(null)

// Robust centralized watcher for table detailed data
watch(selectedItem, async (newVal, oldVal) => {
  if (!newVal || (newVal.type !== 'tables' && newVal.type !== 'table')) {
    detailedTableData.value = null
    return
  }

  const targetName = newVal.name
  // Only reset if it's a DIFFERENT table
  if (oldVal?.name !== targetName) {
    detailedTableData.value = null
  }

  // Force tick to ensure computed formattedDDL is fresh
  await nextTick()
  const ddl = formattedDDL.value

  const parseAndSet = async (content: string) => {
    try {
      const result = await (window as any).electronAPI.andbParseTable(content)
      // Case-insensitive guard for MySQL stability
      if (selectedItem.value?.name?.toLowerCase() === targetName.toLowerCase()) {
        if (result.success && result.data) {
          detailedTableData.value = result.data
        } else {
          console.warn('[GlobalSchemaView] Parser failed for', targetName, result.error)
          detailedTableData.value = {
            tableName: targetName,
            columns: [],
            indexes: [],
            foreignKeys: [],
            options: {},
            partitions: null
          }
        }
      }
    } catch (e) {
      console.error('[GlobalSchemaView] IPC error parsing table:', targetName, e)
      if (selectedItem.value?.name?.toLowerCase() === targetName.toLowerCase()) {
        detailedTableData.value = { 
          tableName: targetName,
          columns: [], 
          indexes: [], 
          foreignKeys: [], 
          options: {}, 
          partitions: null 
        }
      }
    }
  }

  if (ddl) {
    await parseAndSet(ddl)
  } else {
    // If no DDL yet, set a placeholder so the loader stops
    if (!detailedTableData.value) {
      detailedTableData.value = {
        tableName: targetName,
        columns: [],
        indexes: [],
        foreignKeys: [],
        options: {},
        partitions: null
      }
    }
  }
}, { immediate: true })

// Secondary watch on formattedDDL for late-arriving DDL
watch(formattedDDL, async (newDdl) => {
  if (!newDdl || !selectedItem.value) return
  if (selectedItem.value.type !== 'tables' && selectedItem.value.type !== 'table') return
  
  const targetName = selectedItem.value.name
  // Only re-parse if we currently have no data or just the empty fallback
  const needsParsing = !detailedTableData.value || 
                       (detailedTableData.value.columns?.length === 0 && detailedTableData.value.indexes?.length === 0)

  if (needsParsing) {
    try {
      const result = await (window as any).electronAPI.andbParseTable(newDdl)
      if (selectedItem.value?.name?.toLowerCase() === targetName.toLowerCase() && result.success && result.data) {
        detailedTableData.value = result.data
      }
    } catch { /* silent fallback */ }
  }
})


const hasResults = computed(() => allResults.value.length > 0 || contentSearchResults.value.length > 0)

const pluralizeType = (t: string) => {
  const map: Record<string, string> = {
    'table': 'tables',
    'view': 'views',
    'procedure': 'procedures',
    'function': 'functions',
    'trigger': 'triggers',
    'event': 'events'
  }
  const low = t.trim().toLowerCase()
  if (map[low]) return map[low]
  if (low.endsWith('s')) return low
  return low + 's'
}

// Visual View Logic
const fetchButtonText = computed(() => {
    if (appStore.isSchemaFetching) {
      return t('schema.fetching')
    }
    if (loading.value) return t('schema.fetching')
    
    if (selectedItem.value && selectedItem.value.type !== 'diagrams') {
        const type = selectedItem.value.type.toLowerCase()
        let singularType = type.endsWith('s') ? type.slice(0, -1) : type
        if (type === 'procedures') singularType = 'procedure'
        return t('schema.fetchThis', { type: singularType.toUpperCase() })
    }
    
    // If category filtered
    if (selectedFilterType.value && selectedFilterType.value !== 'all') {
        const type = selectedFilterType.value.toLowerCase()
        return t('schema.fetchAll', { type: type.toUpperCase() })
    }

    if (appStore.buttonStyle === 'full') return t('schema.fetchFromDB')
    return t('schema.fetch')
})

const viewMode = ref<'code' | 'visual'>('code')

// Layout customization state moved to appStore

watch(viewMode, (newVal) => {
  if (activeTabId.value) {
    const tab = tabs.value.find(t => t.id === activeTabId.value)
    if (tab) tab.viewMode = newVal
  }
})

watch(detailedTableData, (newVal) => {
  if (activeTabId.value && newVal) {
    const tab = tabs.value.find(t => t.id === activeTabId.value)
    if (tab) tab.detailedData = newVal
  }
})

watch(selectedItem, () => {
    // Reset to code view when finding a new item
    // But default to visual if it's a TABLE and we prefer visual
    if (selectedItem.value?.type === 'tables' || selectedItem.value?.type === 'table') {
        viewMode.value = 'visual' 
    } else {
        viewMode.value = 'code'
    }
})


// Object fetching is handled by handlePickStack and handleSendToInstantFromTree

const isCurrentSource = computed(() => {
  return selectedItem.value && appStore.compareStack.source?.name === selectedItem.value.name
})

const isCurrentTarget = computed(() => {
  return selectedItem.value && appStore.compareStack.target?.name === selectedItem.value.name
})

const handlePickStack = (slot: 'source' | 'target') => {
  if (!selectedItem.value) return
  
  // 1. Deselection: If clicking the slot that is ALREADY active for the current selected object, clear it.
  if (slot === 'source' && isCurrentSource.value) {
    appStore.compareStack.source = null
    return
  }
  if (slot === 'target' && isCurrentTarget.value) {
    appStore.compareStack.target = null
    return
  }

  // 2. Enforced Source-First: If 1st selection is blank, any click is Source.
  let targetSlot = slot
  if (!appStore.compareStack.source) {
    targetSlot = 'source'
  }
  
  // 3. Prevent swap conflict: If selecting an object already in the OTHER slot, move it here (implicit swap/move)
  const oppositeSlot = targetSlot === 'source' ? 'target' : 'source'
  if (targetSlot === 'source' && isCurrentTarget.value) {
     appStore.compareStack.target = null
  }
  if (targetSlot === 'target' && isCurrentSource.value) {
     appStore.compareStack.source = null
  }

  // Type Validation
  const oppositeItem = appStore.compareStack[oppositeSlot]
  if (oppositeItem && oppositeItem.type && selectedItem.value.type && oppositeItem.type !== selectedItem.value.type) {
    notificationStore.add({
      type: 'error',
      title: 'Type Mismatch',
      message: `Cannot compare a ${selectedItem.value.type.replace(/s$/, '')} with a ${oppositeItem.type.replace(/s$/, '')}.`
    })
    return
  }

  appStore.compareStack[targetSlot] = {
    name: selectedItem.value.name,
    ddl: formattedDDL.value,
    type: selectedItem.value.type
  }
  
  appStore.isCompareStackVisible = true
}

const handleSendToInstantFromTree = (item: any, slot: 'source' | 'target' = 'source') => {
  if (!item) return
  
  // 1. Deselection: If clicking the slot that is ALREADY active for this item, clear it.
  if (slot === 'source' && appStore.compareStack.source?.name === item.name) {
    appStore.compareStack.source = null
    return
  }
  if (slot === 'target' && appStore.compareStack.target?.name === item.name) {
    appStore.compareStack.target = null
    return
  }

  const ddl = item.ddl || item.content || ''
  if (!ddl) {
    notificationStore.add({
      type: 'warning',
      title: 'No DDL available',
      message: 'Please select the object first to load its DDL.'
    })
    return
  }
  
  // 2. Enforced Source-First
  let targetSlot = slot
  if (!appStore.compareStack.source) {
    targetSlot = 'source'
  }

  // 3. Prevent swap conflict
  if (targetSlot === 'source' && appStore.compareStack.target?.name === item.name) {
     appStore.compareStack.target = null
  }
  if (targetSlot === 'target' && appStore.compareStack.source?.name === item.name) {
     appStore.compareStack.source = null
  }

  // Type Validation
  const oppositeSlot = targetSlot === 'source' ? 'target' : 'source'
  const oppositeItem = appStore.compareStack[oppositeSlot]
  
  if (oppositeItem && oppositeItem.type && item.type && oppositeItem.type !== item.type) {
    notificationStore.add({
      type: 'error',
      title: 'Type Mismatch',
      message: `Cannot compare a ${item.type.replace(/s$/, '')} with a ${oppositeItem.type.replace(/s$/, '')}.`
    })
    return
  }

  appStore.compareStack[targetSlot] = {
    name: item.name,
    ddl,
    type: item.type
  }
  
  appStore.isCompareStackVisible = true
}

// Resize Logic
const resultsWidth = ref(256)
const isResizingResults = ref(false)

const startResultsResize = () => {
  isResizingResults.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
}

const handleResize = (e: MouseEvent) => {
  if (isResizingResults.value) {
    resultsWidth.value = Math.max(200, Math.min(600, resultsWidth.value + e.movementX))
  }
}

const stopResize = () => {
  isResizingResults.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = 'default'
}

// Actions

watch(() => appStore.selectedConnectionId, async (newId) => {
  if (newId) {
    await loadSchema(false)
    // Auto fetch if cache is empty AND never synced before
    if (!selectedDbLastUpdated.value && !allResults.value.some(i => i.type !== 'diagrams')) {
      loadSchema(true)
    }
  }
}, { immediate: true })

watch(() => sidebarStore.refreshRequestKey, () => {
  // Only trigger if we are on this page
  // Note: route checks are tricky in sub-component, but assuming this is only mounted when valid
  if (selectedConnectionId.value) {
    loadSchema(true, true)
  }
})

watch(() => sidebarStore.refreshKey, () => {
  if (selectedConnectionId.value) {
    loadSchema(false, true) // Reload from cache (SQLite) as global refresh updated it, keep selection!
  }
})

const selectItem = (item: any) => {
  if (!item) return
  
  const tabId = `${item.type}-${item.name}`
  const existingTab = tabs.value.find(t => t.id === tabId)
  
  if (!existingTab) {
    tabs.value.push({
      id: tabId,
      name: item.name,
      type: item.type,
      icon: getIconForType(item.type),
      data: item,
      viewMode: item.type === 'tables' || item.type === 'table' ? 'visual' : 'code',
      detailedData: null
    })
  } else {
    // Restore state if tab exists
    detailedTableData.value = existingTab.detailedData || null
    existingTab.data = item
  }
  
  activeTabId.value = tabId
  selectedItem.value = item
  
  if (selectedItem.value?.name !== item.name) {
    activeSearchLine.value = null
  }
  
  // Sync viewMode from tab
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab?.viewMode) viewMode.value = tab.viewMode

  // If we are currently strongly filtering by a DIFFERENT type, switch to the item's type so it's visible.
  if (item.type && item.type !== 'diagrams' && selectedFilterType.value !== 'all' && selectedFilterType.value !== item.type) {
    selectedFilterType.value = item.type
  }
}

const takeSnapshot = async () => {
  if (!selectedItem.value || !selectedConnectionId.value) return
  
  const conn = appStore.getConnectionById(selectedConnectionId.value)
  if (!conn) return

  loading.value = true
  statusMessage.value = t('schema.takingSnapshot')
  
  try {
    await Andb.createSnapshot(conn, selectedItem.value.type, selectedItem.value.name)
    notificationStore.add({
      type: 'success',
      title: t('schema.snapshotCreated'),
      message: t('schema.snapshotSuccess', { name: selectedItem.value.name })
    })
  } catch (err: any) {
    notificationStore.add({
      type: 'error',
      title: t('schema.snapshotFailed'),
      message: err.message
    })
  } finally {
    loading.value = false
  }
}

const viewHistory = () => {
  if (!selectedItem.value || !selectedConnectionId.value) return
  
  const conn = appStore.getConnectionById(selectedConnectionId.value)
  if (!conn) return

  router.push({
    path: '/history',
    query: {
      env: conn.environment,
      name: selectedItem.value.name
    }
  })
}

const downloadDDL = () => {
  if (!formattedDDL.value) return
  const blob = new Blob([formattedDDL.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${selectedItem.value.name}.sql`
  a.click()
  URL.revokeObjectURL(url)
}

// Event Handlers for Sidebar
const handleCategorySelected = (e: any) => {
  const { type, env, db } = e.detail
  // SUPPORT DUMP: Flexible matching for database name/connection name
  const conn = appStore.resolvedConnections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (conn) {
    selectedConnectionId.value = conn.id
    selectedFilterType.value = type
    // Auto-expand: pulse focusType to trigger watch in SchemaTreeMode
    focusType.value = undefined
    setTimeout(() => { focusType.value = type }, 50)
    loadSchema(false)
  }
}

const handleObjectSelected = (e: any) => {
  const { name, type, env, db } = e.detail
  // SUPPORT DUMP: Flexible matching
  const conn = appStore.resolvedConnections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (conn) {
    const connIdChanged = selectedConnectionId.value !== conn.id
    selectedConnectionId.value = conn.id
    
    // Clear search to ensure the object is visible
    searchQuery.value = ''
    
    if (selectedFilterType.value !== type && type !== 'all' && selectedFilterType.value !== 'all') {
      selectedFilterType.value = type
    }
    
    // Auto-expand: pulse focusType so SchemaTreeMode expands the correct category
    if (type && type !== 'all') {
      focusType.value = undefined
      setTimeout(() => { focusType.value = type }, 50)
    }
    
    // If connection changed or no results, try load from cache
    if (!hasResults.value || connIdChanged) {
      loadSchema(false).then(() => {
        const item = allResults.value.find(i => i.name === name && (type === 'all' || i.type === type))
        if (item) selectItem(item)
      })
    } else {
      const item = allResults.value.find(i => i.name === name && (type === 'all' || i.type === type))
      if (item) {
        selectItem(item)
      } else {
        // Not found? Try one more reload from CACHE
        loadSchema(false).then(() => {
          const newItem = allResults.value.find(i => i.name === name && (type === 'all' || i.type === type))
          if (newItem) selectItem(newItem)
        })
      }
    }
  }
}

const handleNavigateTo = async (payload: { item: any; line: number }) => {
  activeSearchLine.value = payload.line
  // 1. Select the item first
  if (selectedItem.value?.name !== payload.item.name) {
    selectItem(payload.item)
  }
  
  // 2. Wait for DDLViewer to be rendered or content to be updated
  await nextTick()
  // Ensure we are in code view
  viewMode.value = 'code'
  await nextTick()
  
  // 3. Scroll to the line
  if (ddlViewerRef.value) {
    ddlViewerRef.value.scrollToLine(payload.line)
  }
}

const handleNavigateToDefinition = (name: string) => {
  const item = allResults.value.find(i => i.name === name)
  if (item) {
    // Switch to code view if it's not and we are navigating to it
    if (viewMode.value !== 'code') {
      viewMode.value = 'code'
    }
    selectItem(item)
  }
}

const handleDatabaseRefreshRequested = (e: any) => {
  const { env, db } = e.detail
  const conn = appStore.resolvedConnections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (conn) {
    selectedConnectionId.value = conn.id
    selectedFilterType.value = 'all'
    selectedItem.value = null // Clear selection to ensure FULL refresh of this DB
    loadSchema(true) // Force REFRESH
  }
}

const handleCategoryRefreshRequested = (e: any) => {
  const { env, db, type } = e.detail
  const conn = appStore.resolvedConnections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (conn) {
    selectedConnectionId.value = conn.id
    selectedFilterType.value = type
    selectedItem.value = null // Clear selection to ensure FULL refresh of this category
    loadSchema(true) // Force REFRESH for specific category
  }
}

const handleDatabaseSelected = (e: any) => {
  const { env, db } = e.detail
  const conn = appStore.resolvedConnections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (conn) {
    selectedConnectionId.value = conn.id
    selectedFilterType.value = 'all'
    loadSchema(false)
  }
}

onMounted(() => {
  // If there's an active pair, default to source
  if (appStore.currentPair?.source) {
    selectedConnectionId.value = appStore.currentPair.source.id
  }
  
  window.addEventListener('category-selected', handleCategorySelected)
  window.addEventListener('object-selected', handleObjectSelected)
  window.addEventListener('database-selected', handleDatabaseSelected)
  window.addEventListener('category-refresh-requested', handleCategoryRefreshRequested)
  window.addEventListener('database-refresh-requested', handleDatabaseRefreshRequested)

  // Handle deep link selection from other views (like Compare)
  const processDeepLink = () => {
    if (route.query.select && allResults.value.length > 0) {
      handleNavigateToDefinition(route.query.select as string)
    }
  }

  watch(() => selectedItem.value, (newVal) => {
    (window as any)._andbSelectedObject = newVal
    if (newVal) {
      appStore.aiContext = {
        target: { name: newVal.name, ddl: formattedDDL.value },
        objectName: newVal.name,
        objectType: newVal.type || 'Table'
      }
    }
  }, { immediate: true })

  watch(() => formattedDDL.value, (newVal) => {
    if (selectedItem.value) {
      appStore.aiContext = {
        target: { name: selectedItem.value.name, ddl: newVal },
        objectName: selectedItem.value.name,
        objectType: selectedItem.value.type || 'Table'
      }
    }
  })

  watch(() => route.query.select, processDeepLink)
  watch(() => allResults.value.length, processDeepLink)
  
  processDeepLink()

  // Shortcuts
  window.addEventListener('andb-close-active-tab', handleCloseActiveTab)
  window.addEventListener('andb-prev-tab', handlePrevTab)
  window.addEventListener('andb-next-tab', handleNextTab)
  window.addEventListener('andb-refresh-active-view', handleRefreshActiveView)
  window.addEventListener('andb-focus-search', handleFocusSearch)
})

const handleCloseActiveTab = () => { if (activeTabId.value) handleCloseTab(activeTabId.value) }
const handleRefreshActiveView = () => loadSchema(true)
const handleFocusSearch = () => searchInput.value?.focus()

onUnmounted(() => {
  window.removeEventListener('category-selected', handleCategorySelected)
  window.removeEventListener('object-selected', handleObjectSelected)
  window.removeEventListener('database-selected', handleDatabaseSelected)
  window.removeEventListener('category-refresh-requested', handleCategoryRefreshRequested)
  window.removeEventListener('database-refresh-requested', handleDatabaseRefreshRequested)
  
  window.removeEventListener('andb-close-active-tab', handleCloseActiveTab)
  window.removeEventListener('andb-prev-tab', handlePrevTab)
  window.removeEventListener('andb-next-tab', handleNextTab)
  window.removeEventListener('andb-refresh-active-view', handleRefreshActiveView)
  window.removeEventListener('andb-focus-search', handleFocusSearch)
})

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
