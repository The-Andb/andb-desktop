<template>
  <aside
    :class="[
      'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col h-full transition-all duration-300 ease-in-out select-none text-sm relative group',
      isCollapsed ? 'w-16' : 'w-72',
      shouldBlur ? 'blur-[2px] opacity-40 grayscale-[0.8] cursor-pointer' : ''
    ]"
    @click="shouldBlur && router.push('/')"
  >
    <!-- Click to Close Overlay (Visual Hint) -->
    <div
      v-if="shouldBlur"
      class="absolute inset-0 z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    >
      <div
        class="p-3 rounded-2xl bg-white/90 dark:bg-gray-800/90 shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white flex items-center gap-2 scale-90 group-hover:scale-100 transition-transform"
      >
        <X class="w-4 h-4 text-red-500" />
        <span class="text-[10px] font-black uppercase tracking-widest">{{
          $t('common.close')
        }}</span>
      </div>
    </div>

    <!-- Content Wrapper -->
    <div :class="['flex-1 flex flex-col min-h-0', shouldBlur ? 'pointer-events-none' : '']">
      <!-- Navigation Menu (Side Activity Bar style if collapsed, or just top menu) -->
      <!-- Navigation Menu (Dynamic Style) -->
      <nav
        v-show="!isCollapsed"
        :class="[
          'flex-shrink-0 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700 z-10 relative',
          appStore.navStyle === 'horizontal-tabs' ? 'h-16 flex items-center px-4 py-0' : 'p-2'
        ]"
      >
        <div class="flex items-center justify-between w-full">
          <div
            :class="[
              appStore.navStyle === 'horizontal-tabs'
                ? 'flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 -mb-1.5 px-0.5 select-none flex-1 min-w-0'
                : 'space-y-1 w-full'
            ]"
          >
            <router-link
              v-for="item in visibleNavItems"
              :key="item.path"
              :to="item.path"
              class="flex items-center rounded-lg transition-all duration-200 group relative"
              :class="[
                appStore.navStyle === 'horizontal-tabs' ? 'py-2 px-3 flex-shrink-0' : 'px-3 py-2',
                $route.path === item.path
                  ? appStore.navStyle === 'horizontal-tabs'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'bg-white dark:bg-gray-800 text-primary-600 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              ]"
              :title="item.name"
            >
              <div
                class="rounded-md transition-all duration-300"
                :class="[
                  appStore.navStyle === 'horizontal-tabs' ? 'p-0.5' : 'p-1.5',
                  $route.path === item.path && appStore.navStyle !== 'horizontal-tabs'
                    ? 'bg-primary-50 dark:bg-primary-900/30'
                    : ''
                ]"
              >
                <component
                  :is="item.icon"
                  :class="appStore.navStyle === 'horizontal-tabs' ? 'w-5 h-5' : 'w-4 h-4'"
                />
              </div>
              <span
                v-if="appStore.navStyle !== 'horizontal-tabs'"
                class="ml-3 font-bold tracking-tight"
                >{{ item.name }}</span
              >
              <ChevronRight
                v-if="$route.path === item.path && appStore.navStyle !== 'horizontal-tabs'"
                class="ml-auto w-3.5 h-3.5 opacity-50"
              />

              <!-- Active Indicator for horizontal mode -->
              <div
                v-if="appStore.navStyle === 'horizontal-tabs' && $route.path === item.path"
                class="absolute -bottom-2 left-2 right-2 h-0.5 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"
              ></div>
            </router-link>
          </div>

          <!-- The More Menu Toggle (Horizontal Mode Only) -->
          <div
            v-if="
              appStore.navStyle === 'horizontal-tabs' && appStore.hiddenHorizontalTabs.length > 0
            "
            class="relative flex-shrink-0 ml-1 flex items-center"
          >
            <button
              @click="isMoreMenuOpen = !isMoreMenuOpen"
              class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              :class="{ 'bg-gray-200 dark:bg-gray-700': isMoreMenuOpen }"
              :title="$t('settings.interface.navigation.horizontalDesc')"
            >
              <MoreHorizontal class="w-5 h-5" />
            </button>

            <!-- Popover Overlay for clickaway -->
            <div
              v-if="isMoreMenuOpen"
              class="fixed inset-0 z-40"
              @click="isMoreMenuOpen = false"
            ></div>

            <!-- Popover Menu -->
            <div
              v-if="isMoreMenuOpen"
              class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 z-50 p-1.5 overflow-hidden flex flex-col gap-0.5 select-none"
            >
              <router-link
                v-for="item in navItems.filter(i => appStore.hiddenHorizontalTabs.includes(i.path))"
                :key="item.path"
                :to="item.path"
                class="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg gap-3 transition-colors"
                :class="{
                  'bg-primary-50 dark:bg-primary-900/30 text-primary-600': $route.path === item.path
                }"
                @click="isMoreMenuOpen = false"
              >
                <component
                  :is="item.icon"
                  class="w-4 h-4"
                  :class="
                    $route.path === item.path
                      ? 'text-primary-600'
                      : 'text-gray-500 dark:text-gray-400'
                  "
                />
                <span
                  class="text-xs font-bold"
                  :class="
                    $route.path === item.path
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300'
                  "
                  >{{ item.name }}</span
                >
              </router-link>
            </div>
          </div>
        </div>
      </nav>

      <!-- Explorer Header -->
      <div
        v-if="!isCollapsed"
        class="flex items-center justify-between px-4 h-12 shrink-0 transition-all duration-300 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800"
      >
        <div class="flex items-center gap-2">
          <div
            v-if="route.path === '/compare'"
            class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"
          ></div>
          <span class="uppercase tracking-[0.2em] font-black text-[10px]">{{
            route.path === '/compare'
              ? 'Context Explorer'
              : route.path === '/history'
                ? $t('navigation.explorer.history')
                : $t('navigation.explorer.schema')
          }}</span>
        </div>
        <div class="flex items-center space-x-1">
          <button
            @click="showDdlDetails = !showDdlDetails"
            class="p-1.5 rounded-lg transition-all duration-200 text-gray-400 hover:text-primary-500"
            :class="showDdlDetails ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
            title="Toggle Detailed DDL List"
          >
            <ListTree class="w-3.5 h-3.5" />
          </button>
          <button
            @click="handleSmartRefresh()"
            class="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900"
            :title="$t('navigation.actions.refresh')"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading || appStore.isSchemaFetching }" />
          </button>
          <button
            @click="expandAll"
            class="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-500"
            :title="$t('navigation.actions.expandAll')"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>
          <button
            @click="collapseAll"
            class="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-500"
            :title="$t('navigation.actions.collapseAll')"
          >
            <Minus class="w-3.5 h-3.5" />
          </button>
          <button
            @click="appStore.toggleSidebar()"
            class="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-500"
            :title="$t('common.collapse')"
          >
            <PanelLeftClose class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Tree Content -->
      <div
        v-show="!isCollapsed"
        class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800"
      >
        <!-- Loading State -->
        <div
          v-if="sidebarStore.loading && sidebarStore.environments.length === 0"
          class="p-4 space-y-2 opacity-50"
        >
          <div class="h-4 bg-gray-700/20 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
          <div class="h-4 bg-gray-700/20 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
          <div class="h-4 bg-gray-700/20 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
        </div>

        <template v-else>
          <!-- Sync Pair Navigation (Compare View Only) -->
          <div
            v-if="isCompareView"
          class="p-3 border-b border-gray-100 dark:border-gray-800 space-y-1.5 animate-in fade-in slide-in-from-left-4 duration-500"
        >
          <div v-for="pair in availablePairs" :key="pair.id" class="flex flex-col mb-1.5">
            <div
              @click="connectionPairsStore.selectPair(pair.id)"
              class="group p-3 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex items-center gap-3"
              :class="
                connectionPairsStore.selectedPairId === pair.id
                  ? 'bg-primary-50 dark:bg-primary-900/15 border-primary-500/30 shadow-sm shadow-primary-500/5'
                  : 'bg-transparent border-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'
              "
            >
              <div
                v-if="connectionPairsStore.selectedPairId === pair.id"
                class="absolute left-0 top-3 bottom-3 w-1.5 bg-primary-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              ></div>

              <!-- Icon Container -->
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 border border-gray-200/40 dark:border-gray-800"
                :class="[
                  connectionPairsStore.selectedPairId === pair.id
                    ? 'text-white shadow-lg group-hover:scale-105'
                    : 'bg-white dark:bg-gray-900 group-hover:shadow-md'
                ]"
                 :style="
                   connectionPairsStore.selectedPairId === pair.id
                     ? { backgroundColor: getPairDisplayColor(pair), boxShadow: `0 4px 12px ${getPairDisplayColor(pair)}40` }
                     : { color: getPairDisplayColor(pair) }
                 "
              >
                <component
                  :is="getPairIcon(pair)"
                  class="w-5 h-5 transition-transform duration-300"
                  :class="{ 'group-hover:rotate-6': true }"
                />
              </div>

              <div class="min-w-0 flex-1">
                <div
                  class="text-[12px] font-black truncate tracking-tighter transition-colors"
                  :class="
                    connectionPairsStore.selectedPairId === pair.id
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                  "
                >
                  {{ pair.name }}
                </div>
                <div
                  class="text-[9px] font-bold truncate opacity-60 uppercase tracking-widest mt-0.5 flex items-center gap-1"
                >
                  <span
                    @click.stop="toggleEnvironmentVisibility(pair.sourceEnv)"
                    class="font-extrabold hover:underline cursor-pointer transition-all duration-200"
                    :class="[
                      hiddenEnvironmentsInPair.has(pair.sourceEnv)
                        ? 'text-gray-400 dark:text-gray-500 line-through opacity-40'
                        : 'text-primary-600 dark:text-primary-400'
                    ]"
                    title="Toggle tree visibility"
                  >{{
                    pair.sourceEnv
                  }}</span>
                  <span class="mx-1 opacity-40">→</span>
                  <span
                    @click.stop="toggleEnvironmentVisibility(pair.targetEnv)"
                    class="font-extrabold hover:underline cursor-pointer transition-all duration-200"
                    :class="[
                      hiddenEnvironmentsInPair.has(pair.targetEnv)
                        ? 'text-gray-400 dark:text-gray-500 line-through opacity-40'
                        : 'text-emerald-600 dark:text-emerald-400'
                    ]"
                    title="Toggle tree visibility"
                  >{{
                    pair.targetEnv
                  }}</span>
                </div>
              </div>

              <!-- Active Refresh Button -->
              <button
                v-if="connectionPairsStore.selectedPairId === pair.id"
                @click.stop="refreshPair(pair.id)"
                :disabled="sidebarStore.isComparing"
                class="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-500 hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0 z-10 disabled:opacity-50"
                title="Refresh & Compare"
              >
                <RefreshCw
                  class="w-3.5 h-3.5"
                  :class="{ 'animate-spin': sidebarStore.isComparing }"
                />
              </button>
            </div>
            <div v-if="connectionPairsStore.selectedPairId === pair.id" class="pl-2 pr-2 py-2 animate-in slide-in-from-top-2 duration-300">              <div v-for="env in displayEnvironments.filter(e => !hiddenEnvironmentsInPair.has(e.name))" :key="env.name" class="space-y-0.5">
                <!-- Environment Node (Mirrored from standard view but for selected pair) -->
                <div
                  class="group/env flex items-center h-7 px-2 cursor-pointer text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-transparent transition-colors"
                  :class="{
                    'text-gray-900 dark:text-white': expandedEnvironments.has(env.name),
                    'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10': isSourceEnvironment(
                      env.name
                    )
                  }"
                  @click="toggleEnvironment(env.name)"
                >
                  <ChevronRight
                    class="w-3.5 h-3.5 mr-1.5 transition-transform text-gray-400 group-hover/env:text-gray-900 dark:group-hover/env:text-white"
                    :class="{
                      'rotate-90 text-gray-900 dark:text-white': expandedEnvironments.has(env.name)
                    }"
                  />
                  <input
                    type="checkbox"
                    :checked="!appStore.excludedEnvironments.includes(env.name)"
                    @click.stop="toggleEnvExcluded(env.name)"
                    class="mr-2 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500 cursor-pointer w-3.5 h-3.5 shrink-0"
                  />
                  <component
                    :is="getEnvIcon(env.name)"
                    class="w-3.5 h-3.5 mr-2"
                    :style="{ color: getEnvColor(env.name) }"
                  />
                  <span class="text-[10px] font-black uppercase tracking-wider truncate flex-1">{{
                    env.name
                  }}</span>
                </div>

                <!-- Databases -->
                <div v-if="expandedEnvironments.has(env.name)">
                  <div v-for="db in env.databases" :key="db.name" class="relative">
                    <div
                      class="absolute left-[19px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"
                    ></div>

                    <div
                      class="group/db flex items-center h-8 px-2 pl-[38px] cursor-pointer transition-colors border-l-2 rounded-lg"
                      :class="[
                        isActiveDatabase(db)
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-500 font-bold'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                      ]"
                      @click="selectDatabase(env.name, db.name)"
                    >
                      <ChevronRight
                        class="w-3.5 h-3.5 mr-1.5 transition-transform text-gray-400 group-hover/db:text-gray-900 dark:group-hover/db:text-white shrink-0"
                        :class="{
                          'rotate-90 text-gray-900 dark:text-white': expandedDatabases.has(
                            `${env.name}-${db.name}`
                          )
                        }"
                        @click.stop="toggleDatabase(env.name, db.name)"
                      />
                      <input
                        type="checkbox"
                        :checked="!appStore.excludedDatabases.includes(`${env.name}:${db.name}`)"
                        @click.stop="toggleDbExcluded(env.name, db.name)"
                        class="mr-2 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500 cursor-pointer w-3.5 h-3.5 shrink-0"
                      />
                      <RefreshCw v-if="isDatabaseRefreshing(db)" class="w-3.5 h-3.5 mr-2 text-primary-500 animate-spin" />
                      <Database v-else class="w-3.5 h-3.5 mr-2 text-amber-500" />
                      <span class="text-[12px] font-bold truncate flex-1">{{ getDatabaseDisplayName(db) }}</span>
                    </div>

                    <!-- Categories -->
                    <div v-if="expandedDatabases.has(`${env.name}-${db.name}`)" class="relative">
                      <div
                        class="absolute left-[45px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"
                      ></div>

                      <div v-for="type in ddlTypes" :key="type.key">
                        <div
                          class="group/cat flex items-center h-7 px-2 pl-[58px] cursor-pointer transition-colors border-l-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          :class="[
                            (db[type.key]?.length || 0) === 0
                              ? 'text-gray-400 dark:text-gray-500'
                              : 'text-gray-700 dark:text-gray-300'
                          ]"
                          @click="selectCategory(env.name, db.name, type.key)"
                        >
                          <ChevronRight
                            v-if="(showDdlDetails || isSearchActive) && (db[type.key]?.length || 0) > 0"
                            class="w-3.5 h-3.5 mr-1.5 transition-transform text-gray-400 group-hover/cat:text-gray-900 dark:group-hover/cat:text-white shrink-0"
                            :class="{
                              'rotate-90 text-gray-900 dark:text-white': isCategoryExpanded(env.name, db.name, type.key)
                            }"
                            @click.stop="toggleCategory(env.name, db.name, type.key)"
                          />
                          <div
                            v-else
                            class="w-3.5 h-3.5 mr-1.5 shrink-0"
                          ></div>
                          <input
                            type="checkbox"
                            :checked="!appStore.excludedCategories.includes(`${env.name}:${db.name}:${type.key}`)"
                            @click.stop="toggleCategoryExcluded(env.name, db.name, type.key)"
                            class="mr-2 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500 cursor-pointer w-3.5 h-3.5 shrink-0"
                          />
                          <div
                            class="w-5 h-5 rounded flex items-center justify-center mr-2 border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-gray-800"
                          >
                            <RefreshCw
                              v-if="isCategoryRefreshing(db, type.key)"
                              class="w-3 h-3 text-primary-500 animate-spin"
                            />
                            <component
                              v-else
                              :is="type.icon"
                              class="w-3 h-3"
                              :class="
                                (db[type.key]?.length || 0) === 0
                                  ? 'text-gray-400 grayscale'
                                  : type.colorClass
                              "
                            />
                          </div>
                          <span
                            class="text-[10px] font-black truncate flex-1 uppercase tracking-tighter text-gray-500 dark:text-gray-400 group-hover/cat:text-gray-900 dark:group-hover/cat:text-white transition-colors duration-200"
                            >{{ type.label }}</span
                          >
                          <div class="flex items-center gap-1.5 ml-auto">
                            <span
                              v-if="(db[type.key]?.length || 0) > 0"
                              class="text-[9px] font-black leading-none px-1 py-[1.5px] rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500/80 dark:text-gray-400 shadow-inner border border-black/5 dark:border-white/5 tabular-nums"
                            >
                              {{ db[type.key]?.length }}
                            </span>
                            <div
                              class="w-1.5 h-1.5 rounded-full"
                              :class="getCategoryChangeCount(db, type.key) > 0 ? 'bg-primary-500 shadow-sm shadow-primary-500/50' : 'bg-transparent'"
                            ></div>
                          </div>
                        </div>

                        <!-- Sub-list of DDL items (Compare View) -->
                        <div
                          v-if="(showDdlDetails || isSearchActive) && isCategoryExpanded(env.name, db.name, type.key)"
                          class="relative ml-[106px] mt-0.5 mb-1.5 space-y-0.5"
                        >
                          <div class="absolute left-[9px] top-0 bottom-0 w-px bg-gray-150 dark:bg-gray-800"></div>
                          <div
                            v-for="item in db[type.key]"
                            :key="item.name"
                            @click="selectObject(env.name, db.name, type.key, item.name)"
                            class="group/item flex items-center h-6 pl-3 pr-2 cursor-pointer transition-colors rounded hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                          >
                            <component
                              :is="type.icon"
                              class="w-3 h-3 mr-1.5 shrink-0 opacity-45 group-hover/item:opacity-85 transition-opacity"
                              :class="type.colorClass"
                            />
                            <span
                              class="text-[11px] font-medium truncate text-gray-600 dark:text-gray-400 group-hover/item:text-gray-900 dark:group-hover/item:text-white flex-1"
                            >
                              {{ item.name }}
                            </span>
                            <!-- Changed dot badge if compare view -->
                            <div
                              v-if="isCompareView && comparisonMap[`${type.key}-${item.name}`]"
                              class="w-1.5 h-1.5 rounded-full mr-1 shrink-0"
                              :class="[
                                comparisonMap[`${type.key}-${item.name}`].status === 'added' ? 'bg-green-500' :
                                comparisonMap[`${type.key}-${item.name}`].status === 'removed' ? 'bg-red-500' :
                                comparisonMap[`${type.key}-${item.name}`].status === 'modified' ? 'bg-blue-500 animate-pulse' : 'bg-transparent'
                              ]"
                              :title="comparisonMap[`${type.key}-${item.name}`].status"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="availablePairs.length === 0"
            class="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[9px]"
          >
            No sync pairs configured.
          </div>
        </div>

          <!-- Tree Content (Standard View) -->
          <div v-if="!isCompareView" class="pb-4 border-b border-gray-100 dark:border-gray-800">
          <div v-for="env in displayEnvironments" :key="env.name">
            <!-- Environment Node -->
            <div
              class="group/env flex items-center h-7 px-2 cursor-pointer text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-transparent transition-colors"
              :class="{
                'text-gray-900 dark:text-white': expandedEnvironments.has(env.name),
                'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10': isSourceEnvironment(
                  env.name
                )
              }"
              @click="toggleEnvironment(env.name)"
            >
              <ChevronRight
                class="w-3.5 h-3.5 mr-1.5 transition-transform text-gray-400 group-hover/env:text-gray-900 dark:group-hover/env:text-white"
                :class="{
                  'rotate-90 text-gray-900 dark:text-white': expandedEnvironments.has(env.name)
                }"
              />
              <input
                type="checkbox"
                :checked="!appStore.excludedEnvironments.includes(env.name)"
                @click.stop="toggleEnvExcluded(env.name)"
                class="mr-2 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500 cursor-pointer w-3.5 h-3.5 shrink-0"
              />
              <component
                :is="getEnvIcon(env.name)"
                class="w-3.5 h-3.5 mr-2"
                :style="{ color: getEnvColor(env.name) }"
              />
              <span class="text-[10px] font-black uppercase tracking-wider truncate flex-1">{{
                env.name
              }}</span>
            </div>

            <!-- Databases -->
            <div v-if="expandedEnvironments.has(env.name)">
              <div v-for="db in env.databases" :key="db.name" class="relative">
                <div
                  class="absolute left-[19px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"
                ></div>

                <div
                  class="group/db flex items-center h-8 px-2 pl-[38px] cursor-pointer transition-colors border-l-2"
                  :class="[
                    isActiveDatabase(db)
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-500 font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                  ]"
                  @click="selectDatabase(env.name, db.name)"
                >
                  <ChevronRight
                    class="w-3.5 h-3.5 mr-1.5 transition-transform text-gray-400 group-hover/db:text-gray-900 dark:group-hover/db:text-white shrink-0"
                    :class="{
                      'rotate-90 text-gray-900 dark:text-white': expandedDatabases.has(
                        `${env.name}-${db.name}`
                      )
                    }"
                    @click.stop="toggleDatabase(env.name, db.name)"
                  />
                  <input
                    type="checkbox"
                    :checked="!appStore.excludedDatabases.includes(`${env.name}:${db.name}`)"
                    @click.stop="toggleDbExcluded(env.name, db.name)"
                    class="mr-2 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500 cursor-pointer w-3.5 h-3.5 shrink-0"
                  />
                  <RefreshCw v-if="isDatabaseRefreshing(db)" class="w-3.5 h-3.5 mr-2 text-primary-500 animate-spin" />
                  <Database v-else class="w-3.5 h-3.5 mr-2 text-amber-500" />
                  <span class="text-[12px] font-bold truncate flex-1">{{
                    getDatabaseDisplayName(db)
                  }}</span>
                </div>

                <!-- Categories -->
                <div v-if="expandedDatabases.has(`${env.name}-${db.name}`)" class="relative">
                  <div
                    class="absolute left-[45px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"
                  ></div>

                  <div v-for="type in ddlTypes" :key="type.key">
                    <div
                      class="group/cat flex items-center h-7 px-2 pl-[58px] cursor-pointer transition-colors border-l-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      :class="[
                        (db[type.key]?.length || 0) === 0
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-700 dark:text-gray-300'
                      ]"
                      @click="selectCategory(env.name, db.name, type.key)"
                    >
                      <ChevronRight
                        v-if="(showDdlDetails || isSearchActive) && (db[type.key]?.length || 0) > 0"
                        class="w-3.5 h-3.5 mr-1.5 transition-transform text-gray-400 group-hover/cat:text-gray-900 dark:group-hover/cat:text-white shrink-0"
                        :class="{
                          'rotate-90 text-gray-900 dark:text-white': isCategoryExpanded(env.name, db.name, type.key)
                        }"
                        @click.stop="toggleCategory(env.name, db.name, type.key)"
                      />
                      <div
                        v-else
                        class="w-3.5 h-3.5 mr-1.5 shrink-0"
                      ></div>
                      <input
                        type="checkbox"
                        :checked="!appStore.excludedCategories.includes(`${env.name}:${db.name}:${type.key}`)"
                        @click.stop="toggleCategoryExcluded(env.name, db.name, type.key)"
                        class="mr-2 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500 cursor-pointer w-3.5 h-3.5 shrink-0"
                      />
                      <div
                        class="w-5 h-5 rounded flex items-center justify-center mr-2 border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-gray-800"
                      >
                        <RefreshCw
                          v-if="isCategoryRefreshing(db, type.key)"
                          class="w-3 h-3 text-primary-500 animate-spin"
                        />
                        <component
                          v-else
                          :is="type.icon"
                          class="w-3 h-3"
                          :class="
                            (db[type.key]?.length || 0) === 0
                              ? 'text-gray-400 grayscale'
                              : type.colorClass
                          "
                        />
                      </div>
                      <span
                        class="text-[10px] font-black truncate flex-1 uppercase tracking-tighter text-gray-500 dark:text-gray-400 group-hover/cat:text-gray-900 dark:group-hover/cat:text-white transition-colors duration-200"
                        >{{ type.label }}</span
                      >
                      <div class="flex items-center gap-1.5 ml-auto">
                        <span
                          v-if="(db[type.key]?.length || 0) > 0"
                          class="text-[9px] font-black leading-none px-1 py-[1.5px] rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500/80 dark:text-gray-400 shadow-inner border border-black/5 dark:border-white/5 tabular-nums"
                        >
                          {{ db[type.key]?.length }}
                        </span>
                        <div
                          class="w-1.5 h-1.5 rounded-full"
                          :class="getCategoryChangeCount(db, type.key) > 0 ? 'bg-primary-500 shadow-sm shadow-primary-500/50' : 'bg-transparent'"
                        ></div>
                      </div>
                    </div>

                    <!-- Sub-list of DDL items (Standard View) -->
                    <div
                      v-if="(showDdlDetails || isSearchActive) && isCategoryExpanded(env.name, db.name, type.key)"
                      class="relative ml-[106px] mt-0.5 mb-1.5 space-y-0.5"
                    >
                      <div class="absolute left-[9px] top-0 bottom-0 w-px bg-gray-150 dark:bg-gray-800"></div>
                      <div
                        v-for="item in db[type.key]"
                        :key="item.name"
                        @click="selectObject(env.name, db.name, type.key, item.name)"
                        class="group/item flex items-center h-6 pl-3 pr-2 cursor-pointer transition-colors rounded hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                      >
                        <component
                          :is="type.icon"
                          class="w-3 h-3 mr-1.5 shrink-0 opacity-45 group-hover/item:opacity-85 transition-opacity"
                          :class="type.colorClass"
                        />
                        <span
                          class="text-[11px] font-medium truncate text-gray-600 dark:text-gray-400 group-hover/item:text-gray-900 dark:group-hover/item:text-white flex-1"
                        >
                          {{ item.name }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </template>
      </div>

      <!-- Git Sync Status Chip -->
      <div
        v-if="!isCollapsed && sidebarStore.gitStatus"
        class="px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/50"
      >
        <div
          class="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md"
        >
          <div class="flex items-center gap-2 min-w-0">
            <div class="relative">
              <GitBranch class="w-3.5 h-3.5 text-primary-500" />
              <span
                v-if="sidebarStore.gitStatus.modifiedFiles?.length > 0"
                class="absolute -top-1 -right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"
              ></span>
            </div>
            <div class="flex flex-col min-w-0">
              <span
                class="text-[10px] font-black text-gray-900 dark:text-white leading-none uppercase tracking-tight truncate"
                >{{ sidebarStore.gitStatus.currentBranch }}</span
              >
              <span class="text-[9px] text-gray-400 font-bold truncate">
                {{ sidebarStore.gitStatus.modifiedFiles?.length || 0 }} unsynced changes
              </span>
            </div>
          </div>
          <button
            @click="sidebarStore.checkGitStatus()"
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-primary-500"
          >
            <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': sidebarStore.gitLoading }" />
          </button>
        </div>
      </div>

      <!-- Collapsed Mode Icon Bar -->
      <div v-if="isCollapsed" class="flex flex-col items-center py-4 space-y-4">
        <!-- Expand Button -->
        <button
          @click="appStore.toggleSidebar()"
          class="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors mb-2"
          :title="$t('common.expand')"
        >
          <PanelLeftOpen class="w-5 h-5" />
        </button>

        <router-link
          v-for="item in visibleNavItems"
          :key="item.path"
          :to="item.path"
          class="p-2 text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
          :title="item.name"
        >
          <component :is="item.icon" class="w-5 h-5" />
        </router-link>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useSidebarStore } from '@/stores/sidebar'
import { useProjectsStore } from '@/stores/projects'
import { useFeaturesStore } from '@/stores/features'
import Andb from '@/utils/andb'

import {
  Home,
  Database,
  GitCompare,
  History,
  Workflow,
  RefreshCw,
  ChevronRight,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Box,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Grid3X3,
  Eye,
  Cpu,
  CalendarClock,
  Sigma,
  Settings2,
  Network,
  GitBranch,
  MoreHorizontal,
  ListTree,
  Plus,
  Minus,
  Package,
  Terminal,
  Cloud,
  Shield,
  HardDrive,
  Globe,
  Rocket,
  Server,
  Layers,
  Component as ComponentIcon
} from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const connectionPairsStore = useConnectionPairsStore()
const sidebarStore = useSidebarStore()
const projectsStore = useProjectsStore()
const featuresStore = useFeaturesStore()

const iconMap: Record<string, any> = {
  Database,
  Package,
  Cpu,
  Zap,
  Terminal,
  Cloud,
  Shield,
  Activity,
  HardDrive,
  Globe,
  Rocket,
  Server,
  Layers,
  Component: ComponentIcon,
  ShieldCheck,
  ShieldAlert,
  Box
}

const isCollapsed = computed(() => appStore.sidebarCollapsed || isGlobalLayer.value)

const activePair = computed(() => connectionPairsStore.activePair)

const availablePairs = computed(() => connectionPairsStore.availablePairs || [])

const isGlobalLayer = computed(() => {
  const globalRoutes = ['Settings', 'Projects']
  return globalRoutes.includes(String(route.name))
})

const shouldBlur = computed(() => {
  return isGlobalLayer.value
})

// Navigation Items
const navItems = computed(() => {
  const items = [
    { name: t('common.dashboard'), path: '/', icon: Home, visible: true },
    { name: t('common.schema'), path: '/schema', icon: Database, visible: true },
    { name: t('common.compare'), path: '/compare', icon: GitCompare, visible: true },
    { name: 'Table Pulse', path: '/pulse', icon: Activity, visible: true },
    { name: t('common.history'), path: '/history', icon: History, visible: true },
    { name: 'Instant Compare', path: '/instant-compare', icon: Workflow, visible: true },
    { name: 'Git Sync', path: '/integrations', icon: GitBranch, visible: true },
    {
      name: 'ER Diagram',
      path: '/er-diagram',
      icon: Network,
      visible: featuresStore.isEnabled('erDiagram')
    },
    {
      name: t('settings.project_settings'),
      path: '/project-settings',
      icon: Settings2,
      visible: true
    }
  ]
  return items.filter(i => i.visible)
})

const isMoreMenuOpen = ref(false)

const visibleNavItems = computed(() => {
  return navItems.value.filter(item => !appStore.hiddenHorizontalTabs.includes(item.path))
})

// Schema Tree State
const environments = computed(() => sidebarStore.environments)
const loading = computed(() => sidebarStore.loading)

const expandedEnvironments = computed(() => sidebarStore.expandedEnvironments)
const expandedDatabases = computed(() => sidebarStore.expandedDatabases)
const expandedTypes = computed(() => sidebarStore.expandedTypes)

// Search State
const searchQuery = computed(() => appStore.globalSearchQuery)
const searchFlags = computed(() => appStore.globalSearchFlags)
const isSearchActive = computed(() => searchQuery.value.length > 0)

// Persist sidebar DDL details visibility in localStorage
const showDdlDetails = ref(localStorage.getItem('andb_show_ddl_details') === 'true')
watch(showDdlDetails, (newVal) => {
  localStorage.setItem('andb_show_ddl_details', String(newVal))
})

const isCategoryExpanded = (envName: string, dbName: string, typeKey: string) => {
  const key = `${envName}-${dbName}-${typeKey}`
  return expandedTypes.value.has(key)
}

const toggleCategory = (envName: string, dbName: string, typeKey: string) => {
  const key = `${envName}-${dbName}-${typeKey}`
  if (expandedTypes.value.has(key)) {
    expandedTypes.value.delete(key)
  } else {
    expandedTypes.value.add(key)
  }
}

const isCompareView = computed(() => route.path === '/compare')

const hiddenEnvironmentsInPair = ref<Set<string>>(new Set())

const toggleEnvironmentVisibility = (envName: string) => {
  if (hiddenEnvironmentsInPair.value.has(envName)) {
    hiddenEnvironmentsInPair.value.delete(envName)
  } else {
    hiddenEnvironmentsInPair.value.add(envName)
  }
}

// Comparison Mapping from Store
const comparisonMap = computed(() => {
  const map: Record<string, any> = {}
  if (sidebarStore.comparisonResults) {
    sidebarStore.comparisonResults.forEach(res => {
      map[`${res.type}-${res.name}`] = res
    })
  }
  return map
})

const getCategoryChangeCount = (db: any, typeKey: string) => {
  if (!sidebarStore.comparisonResults) return 0
  return (db[typeKey] || []).filter((item: any) => {
    const res = comparisonMap.value[`${typeKey}-${item.name}`]
    return res && res.status !== 'equal' && res.status !== 'same'
  }).length
}

const filteredEnvironments = computed(() => {
  let envs = environments.value

  if (route.path === '/compare' && activePair.value) {
    const src = activePair.value.sourceEnv?.toUpperCase()
    const tgt = activePair.value.targetEnv?.toUpperCase()
    envs = environments.value.filter(
      env => env.name.toUpperCase() === src || env.name.toUpperCase() === tgt
    )
  }

  // Use the order from connectionPairsStore.environments
  return [...envs].sort((a, b) => {
    const envA = connectionPairsStore.environments.find(
      e => e.name.toUpperCase() === a.name.toUpperCase()
    )
    const envB = connectionPairsStore.environments.find(
      e => e.name.toUpperCase() === b.name.toUpperCase()
    )

    const orderA = envA ? envA.order : 999
    const orderB = envB ? envB.order : 999

    if (orderA !== orderB) return orderA - orderB
    return a.name.localeCompare(b.name)
  })
})

const displayEnvironments = computed(() => {
  const envs = filteredEnvironments.value
  if (!isSearchActive.value) return envs

  const q = searchQuery.value
  const { caseSensitive, wholeWord, regex } = searchFlags.value

  let filterFn: (name: string) => boolean

  if (regex) {
    try {
      const re = new RegExp(q, caseSensitive ? '' : 'i')
      filterFn = (name: string) => re.test(name)
    } catch (e) {
      filterFn = () => false
    }
  } else {
    const searchVal = caseSensitive ? q : q.toLowerCase()
    filterFn = (name: string) => {
      const itemVal = caseSensitive ? name : name.toLowerCase()
      if (wholeWord) {
        return itemVal === searchVal
      }
      return itemVal.includes(searchVal)
    }
  }

  // Deep filter
  const result: any[] = []

  envs.forEach(env => {
    const filteredDatabases: any[] = []

    env.databases.forEach((db: any) => {
      const filteredDb = { ...db }
      let dbHasMatch = false

      // Also check if DB name itself matches (optional, but good for UX)
      // if (filterFn(db.name)) dbHasMatch = true

      ddlTypes.value.forEach(type => {
        const items = db[type.key] || []
        const filteredItems = items.filter((item: any) => {
          if (searchFlags.value.columns) {
            if (type.key !== 'tables') return false
            const ddl = item.ddl || item.content || ''
            const colNames = Andb.parseColumnNamesFromDdl(ddl)
            return colNames.some(cName => filterFn(cName))
          }
          if (searchFlags.value.content) {
            const ddlText = item.ddl || item.content || ''
            return filterFn(ddlText)
          }
          return filterFn(item.name)
        })
        filteredDb[type.key] = filteredItems
        if (filteredItems.length > 0) {
          dbHasMatch = true
          // Auto-expand if search matches
          expandedEnvironments.value.add(env.name)
          expandedDatabases.value.add(`${env.name}-${db.name}`)
          expandedTypes.value.add(`${env.name}-${db.name}-${type.key}`)
        }
      })

      if (dbHasMatch) {
        filteredDatabases.push(filteredDb)
      }
    })

    if (filteredDatabases.length > 0) {
      result.push({ ...env, databases: filteredDatabases })
    }
  })

  return result
})

// DDL Types Mapping
const ddlTypes = computed(() => [
  {
    key: 'tables',
    label: t('navigation.ddl.tables'),
    icon: Grid3X3,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-900/30'
  },
  {
    key: 'views',
    label: t('navigation.ddl.views'),
    icon: Eye,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-900/30'
  },
  {
    key: 'procedures',
    label: t('navigation.ddl.procedures'),
    icon: Cpu,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-900/30'
  },
  {
    key: 'functions',
    label: t('navigation.ddl.functions'),
    icon: Sigma,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-900/30'
  },
  {
    key: 'triggers',
    label: t('navigation.ddl.triggers'),
    icon: Zap,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-900/30'
  },
  {
    key: 'events',
    label: t('navigation.ddl.events'),
    icon: CalendarClock,
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-900/30'
  }
])

// Actions
const isSourceEnvironment = (envName: string) => {
  return activePair.value?.sourceEnv === envName
}

const getEnvIcon = (envName: string) => {
  const iconName = connectionPairsStore.getResolvedEnvIcon(envName)
  return iconMap[iconName] || Box
}

const getEnvColor = (envName: string) => {
  return connectionPairsStore.getResolvedEnvColor(envName)
}

const isActiveDatabase = (db: any) => {
  return db.connectionId === appStore.selectedConnectionId
}

const toggleEnvironment = (envName: string) => {
  if (expandedEnvironments.value.has(envName)) {
    expandedEnvironments.value.delete(envName)
  } else {
    expandedEnvironments.value.add(envName)
  }
}

const toggleDatabase = (envName: string, dbName: string) => {
  const key = `${envName}-${dbName}`
  if (expandedDatabases.value.has(key)) {
    expandedDatabases.value.delete(key)
  } else {
    expandedDatabases.value.add(key)
  }
}

const expandAll = () => {
  displayEnvironments.value.forEach((env: any) => {
    expandedEnvironments.value.add(env.name)
    env.databases.forEach((db: any) => {
      expandedDatabases.value.add(`${env.name}-${db.name}`)
      ddlTypes.value.forEach((type: any) => {
        expandedTypes.value.add(`${env.name}-${db.name}-${type.key}`)
      })
    })
  })
}

const collapseAll = () => {
  expandedEnvironments.value.clear()
  expandedDatabases.value.clear()
  expandedTypes.value.clear()
}

const selectDatabase = async (env: string, db: string) => {
  toggleDatabase(env, db)

  // Update global selected connection
  const envData = displayEnvironments.value.find((e: any) => e.name === env)
  if (envData) {
    const dbData = envData.databases.find((d: any) => d.name === db)
    if (dbData && dbData.connectionId) {
      appStore.selectedConnectionId = dbData.connectionId
    }
  }

  if (route.path === '/compare') {
    window.dispatchEvent(new CustomEvent('category-selected', { detail: { env, db, type: 'all' } }))
  } else {
    const isNavigationNeeded = !['/schema', '/history'].includes(route.path)
    if (isNavigationNeeded) {
      await router.push('/schema')
    }
    // Small delay to ensure component is mounted and listener attached if we navigated
    setTimeout(
      () => {
        window.dispatchEvent(
          new CustomEvent('category-selected', { detail: { env, db, type: 'all' } })
        )
      },
      isNavigationNeeded ? 200 : 0
    )
  }
}

const selectCategory = async (env: string, db: string, type: string) => {
  if (showDdlDetails.value || isSearchActive.value) {
    toggleCategory(env, db, type)
  }

  // Update global selected connection
  const envData = displayEnvironments.value.find((e: any) => e.name === env)
  if (envData) {
    const dbData = envData.databases.find((d: any) => d.name === db)
    if (dbData && dbData.connectionId) {
      appStore.selectedConnectionId = dbData.connectionId
    }
  }

  if (route.path === '/compare') {
    window.dispatchEvent(new CustomEvent('category-selected', { detail: { env, db, type } }))
  } else {
    const isNavigationNeeded = !['/schema', '/history'].includes(route.path)
    if (isNavigationNeeded) {
      await router.push('/schema')
    }
    setTimeout(
      () => {
        window.dispatchEvent(new CustomEvent('category-selected', { detail: { env, db, type } }))
      },
      isNavigationNeeded ? 200 : 0
    )
  }
}

const selectObject = async (env: string, db: string, type: string, name: string) => {
  // Update global selected connection
  const envData = displayEnvironments.value.find((e: any) => e.name === env)
  if (envData) {
    const dbData = envData.databases.find((d: any) => d.name === db)
    if (dbData && dbData.connectionId) {
      appStore.selectedConnectionId = dbData.connectionId
    }
  }

  if (route.path === '/compare') {
    window.dispatchEvent(
      new CustomEvent('object-selected', { detail: { env, db, type, name } })
    )
  } else {
    const isNavigationNeeded = !['/schema', '/history'].includes(route.path)
    if (isNavigationNeeded) {
      await router.push('/schema')
    }
    setTimeout(
      () => {
        window.dispatchEvent(
          new CustomEvent('object-selected', { detail: { env, db, type, name } })
        )
      },
      isNavigationNeeded ? 200 : 0
    )
  }
}

const refreshPair = async (pairId: string) => {
  connectionPairsStore.selectPair(pairId)
  if (route.path !== '/compare') {
    await router.push({ path: '/compare', query: { action: 'fetch-compare' } })
  } else {
    window.dispatchEvent(new CustomEvent('pair-fetch-compare-requested', { detail: { pairId } }))
  }
}

const handleSmartRefresh = () => {
  const projectId = projectsStore.selectedProjectId || 'default'
  const storageKey = `andb_last_live_fetch_${projectId}`
  const lastLive = Number(localStorage.getItem(storageKey) || '0')
  const now = Date.now()

  // Smart Threshold: 5 minutes = 300,000 ms
  const FIVE_MINUTES = 5 * 60 * 1000

  if (now - lastLive >= FIVE_MINUTES) {
    // 🚀 Cache is stale: Trigger background intelligent server LIVE pull!
    localStorage.setItem(storageKey, now.toString())
    window.dispatchEvent(new CustomEvent('project-live-refresh-requested'))
  } else {
    // ⚡ Cache is fresh: Light UI re-sync from local SQLite to prevent server spamming
    sidebarStore.requestRefresh()
  }
}

const toggleEnvExcluded = (envName: string) => {
  const idx = appStore.excludedEnvironments.indexOf(envName)
  if (idx >= 0) {
    appStore.excludedEnvironments.splice(idx, 1)
    // Auto check (include) all databases and categories under this environment
    const envData = displayEnvironments.value.find((e: any) => e.name === envName)
    if (envData) {
      envData.databases.forEach((db: any) => {
        const dbKey = `${envName}:${db.name}`
        const dbIdx = appStore.excludedDatabases.indexOf(dbKey)
        if (dbIdx >= 0) {
          appStore.excludedDatabases.splice(dbIdx, 1)
        }
        ddlTypes.value.forEach(type => {
          const key = `${envName}:${db.name}:${type.key}`
          const catIdx = appStore.excludedCategories.indexOf(key)
          if (catIdx >= 0) {
            appStore.excludedCategories.splice(catIdx, 1)
          }
        })
      })
    }
  } else {
    appStore.excludedEnvironments.push(envName)
    // Auto uncheck (exclude) all databases and categories under this environment
    const envData = displayEnvironments.value.find((e: any) => e.name === envName)
    if (envData) {
      envData.databases.forEach((db: any) => {
        const dbKey = `${envName}:${db.name}`
        if (!appStore.excludedDatabases.includes(dbKey)) {
          appStore.excludedDatabases.push(dbKey)
        }
        ddlTypes.value.forEach(type => {
          const key = `${envName}:${db.name}:${type.key}`
          if (!appStore.excludedCategories.includes(key)) {
            appStore.excludedCategories.push(key)
          }
        })
      })
    }
  }
}

const toggleDbExcluded = (envName: string, dbName: string) => {
  const key = `${envName}:${dbName}`
  const idx = appStore.excludedDatabases.indexOf(key)
  if (idx >= 0) {
    appStore.excludedDatabases.splice(idx, 1)
    // Auto check all DDL categories under this database
    ddlTypes.value.forEach(type => {
      const catIdx = appStore.excludedCategories.indexOf(`${envName}:${dbName}:${type.key}`)
      if (catIdx >= 0) {
        appStore.excludedCategories.splice(catIdx, 1)
      }
    })
    // Auto check grandparent environment
    const envIdx = appStore.excludedEnvironments.indexOf(envName)
    if (envIdx >= 0) {
      appStore.excludedEnvironments.splice(envIdx, 1)
    }
  } else {
    appStore.excludedDatabases.push(key)
    // Auto uncheck all DDL categories under this database
    ddlTypes.value.forEach(type => {
      const catKey = `${envName}:${dbName}:${type.key}`
      if (!appStore.excludedCategories.includes(catKey)) {
        appStore.excludedCategories.push(catKey)
      }
    })
  }
}

const toggleCategoryExcluded = (envName: string, dbName: string, typeKey: string) => {
  const key = `${envName}:${dbName}:${typeKey}`
  const idx = appStore.excludedCategories.indexOf(key)
  if (idx >= 0) {
    // It was unchecked (excluded) → Now checking (including) it!
    appStore.excludedCategories.splice(idx, 1)
    
    // Auto check parent database
    const dbKey = `${envName}:${dbName}`
    const dbIdx = appStore.excludedDatabases.indexOf(dbKey)
    if (dbIdx >= 0) {
      appStore.excludedDatabases.splice(dbIdx, 1)
    }
    
    // Auto check grandparent environment
    const envIdx = appStore.excludedEnvironments.indexOf(envName)
    if (envIdx >= 0) {
      appStore.excludedEnvironments.splice(envIdx, 1)
    }
  } else {
    // It was checked (included) → Now unchecking (excluding) it!
    appStore.excludedCategories.push(key)
  }
}

const isDatabaseRefreshing = (db: any) => {
  if (!db.connectionId) return false
  return Object.keys(appStore.schemaFetchProgresses).some(key =>
    key.startsWith(`${db.connectionId}-`)
  )
}

const isCategoryRefreshing = (db: any, typeKey: string) => {
  if (!db.connectionId) return false
  const taskId = `${db.connectionId}-${typeKey.toLowerCase()}`
  return !!appStore.schemaFetchProgresses[taskId]
}

const getDatabaseDisplayName = (db: any) => {
  const conn = appStore.getConnectionById(db.connectionId)
  if (!conn) return db.name
  if (conn.type === 'dump') return conn.name
  return db.name || conn.name
}

const getPairIcon = (pair: any) => {
  const iconName = connectionPairsStore.getResolvedPairIcon(pair)
  return iconMap[iconName] || GitCompare
}

const getPairDisplayColor = (pair: any) => {
  return connectionPairsStore.getResolvedPairColor(pair)
}

const refreshSchemas = async (force = false) => {
  try {
    const conns = appStore.filteredConnections || [] // Connections for current project

    // Pass connections to loadSchemas — backend uses them for strict project isolation.
    // Do NOT call loadSchemas before we have connections (guards against loading global data).
    const result = await sidebarStore.loadSchemas(force, conns.length > 0 ? conns : undefined)
    if (!result) return

    // If no connections for this project, clear sidebar — but only after both stores are fully
    // initialized to avoid a race condition during cold-start where filteredConnections is
    // transiently [] before app.init() and projects.init() complete.
    if (conns.length === 0) {
      if (appStore.isInitialized && projectsStore.isLoaded) {
        sidebarStore.setEnvironments([])
      }
      return
    }

    // Group by environment
    const envMap = new Map<string, any>()

    // 1. Initialize with configured connections so they always appear
    conns.forEach((c: any) => {
      if (!envMap.has(c.environment)) {
        envMap.set(c.environment, { name: c.environment, databases: [] })
      }
      const env = envMap.get(c.environment)
      if (!env.databases.find((db: any) => db.name === c.database)) {
        env.databases.push({
          name: c.database,
          connectionId: c.id,
          tables: [],
          views: [],
          procedures: [],
          functions: [],
          triggers: [],
          events: [],
          totalCount: 0,
          lastUpdated: null
        })
      }
    })

    // 2. Merge with results from SQLite - ONLY for connections in the current project
    // loadSchemas returns a {success, data} object — extract the array from .data
    const schemaArray = Array.isArray(result) ? result : (result?.data || result)
    if (schemaArray && Array.isArray(schemaArray)) {
      console.log('[Sidebar] Processing Schema Result:', {
        totalEnvs: schemaArray.length,
        connsCount: conns.length,
        conns: conns.map(c => ({
          id: c.id,
          name: c.name,
          db: c.database,
          type: c.type,
          env: c.environment
        }))
      })

      schemaArray.forEach((remoteEnv: any) => {
        remoteEnv.databases.forEach((remoteDb: any) => {
          // Find matching connection in current project scope
          // Improved Logic:
          // 1. Can we match by Connection ID if available in remoteEnv? (Usually remote only has name/db)
          // 2. Normalize and check empty DB names for Dump files

          const projectConn = conns.find((c: any) => {
            const envMatch =
              (c.environment || '').toLowerCase() === (remoteEnv.name || '').toLowerCase()

            // 1. Strict ID Match (if remoteDb has connectionId, which it often doesn't from backend, but let's check)
            if (remoteDb.connectionId && c.id === remoteDb.connectionId) return true

            // 2. Dump File Logic:
            if (c.type === 'dump' && envMatch) {
              if ((remoteDb as any).host && c.host) {
                return (remoteDb as any).host.trim() === c.host.trim()
              }

              const cDbName = (c.database || '').toLowerCase()
              const cName = (c.name || '').toLowerCase()
              const rDbName = (remoteDb.name || '').toLowerCase()

              const isMatch = cDbName === rDbName || rDbName === '' || cName === rDbName

              if (isMatch)
                console.log('[Sidebar] Dump Match Found (Weak):', {
                  cName: c.name,
                  rDbName,
                  cHost: c.host
                })
              return isMatch
            }

            // 3. Standard Logic
            return (
              envMatch && (c.database || '').toLowerCase() === (remoteDb.name || '').toLowerCase()
            )
          })

          if (!projectConn) {
            console.warn('[Sidebar] Unmatched Schema:', remoteEnv.name, remoteDb.name)
          }

          if (projectConn) {
            let localEnv = envMap.get(remoteEnv.name)
            if (!localEnv) {
              localEnv = { name: remoteEnv.name, databases: [] }
              envMap.set(remoteEnv.name, localEnv)
            }

            let localDb = localEnv.databases.find(
              (db: any) =>
                db.name === remoteDb.name ||
                db.connectionId === projectConn.id ||
                (db.name || '').toLowerCase() === (remoteDb.name || '').toLowerCase()
            )

            if (localDb) {
              Object.assign(localDb, {
                tables: remoteDb.tables,
                views: remoteDb.views,
                procedures: remoteDb.procedures,
                functions: remoteDb.functions,
                triggers: remoteDb.triggers,
                events: remoteDb.events,
                totalCount: remoteDb.totalCount || 0
              })
            } else {
              localEnv.databases.push({ ...remoteDb, connectionId: projectConn.id })
            }
          }
        })
      })
    }

    const finalEnvs = Array.from(envMap.values())
    sidebarStore.setEnvironments(finalEnvs)

    // Auto-expand all environments by default to show connections
    finalEnvs.forEach((env: any) => expandedEnvironments.value.add(env.name))
  } catch (error: any) {
    if (window.electronAPI) {
      window.electronAPI.log.send('error', 'Failed to load schemas in sidebar', error.message)
    }
  }
}


// Watch for active pair changes to auto-expand
watch(
  activePair,
  newPair => {
    if (newPair?.sourceEnv) {
      expandedEnvironments.value.add(newPair.sourceEnv)
    }
  },
  { immediate: true }
)

watch(
  () => appStore.resolvedConnections,
  () => {
    refreshSchemas(false) // Use cache if available, don't force re-parse
  },
  { deep: true }
)

watch(
  () => sidebarStore.refreshKey,
  () => {
    refreshSchemas(false) // Triggered when individual category/object fetched, update from cache
  }
)

watch(
  () => sidebarStore.refreshRequestKey,
  () => {
    refreshSchemas(true) // Force full fetch from DB
  }
)

watch(
  () => projectsStore.selectedProjectId,
  (newProjectId) => {
    // Load the project-scoped sidebar cache — clears stale cross-project data immediately
    if (newProjectId) sidebarStore.loadFromStorage(newProjectId)
    refreshSchemas(false) // Regroup with correct connections
  }
)

onMounted(() => {
  // Load project-scoped cache on mount to avoid cross-project bleed from global key
  const projectId = projectsStore.selectedProjectId
  if (projectId) sidebarStore.loadFromStorage(projectId)
  refreshSchemas(false)
  sidebarStore.checkGitStatus()
})

defineExpose({
  refreshSchemas
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5); /* gray-400 */
  border-radius: 4px;
}
@media (prefers-color-scheme: dark) {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
  }
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8); /* gray-500 */
}
@media (prefers-color-scheme: dark) {
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
