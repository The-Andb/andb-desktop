<template>
  <MainLayout>
    <template #toolbar>
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer select-none" @click="activeCategory = 'interface'">{{ $t('settings.title') }}</span>
        <ChevronRight class="w-3 h-3 text-gray-300 dark:text-gray-700" />
        <div v-if="activeCategoryInfo" class="flex items-center gap-2 group cursor-default">
           <component :is="activeCategoryInfo.icon" class="w-8 h-8 p-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg" />
           <div class="flex flex-col">
              <span class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white leading-none mb-0.5">{{ activeCategoryInfo.label }}</span>
              <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 leading-none">{{ activeCategoryInfo.subtitle }}</span>
           </div>
        </div>
      </div>
    </template>

    <!-- Settings Workspace -->
    <main class="flex-1 flex overflow-hidden bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
        <!-- Settings Category Sidebar -->
        <div class="w-64 border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 backdrop-blur-md flex flex-col shrink-0">
          <!-- Back to Project Button (Moved to Top) -->

          <div class="p-8 pb-4">
            <h1 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2 mb-1">
              <SettingsIcon class="w-5 h-5 text-primary-500" />
              {{ $t('settings.title') }}
            </h1>

          </div>
          
          <div class="flex-1 overflow-y-auto px-4 py-2 space-y-6">
            <!-- App Settings -->
            <div class="space-y-1">

              <button 
                v-for="cat in appSettings" :key="cat.id"
                @click="activeCategory = cat.id"
                class="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-left"
                :class="activeCategory === cat.id 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 active:scale-95' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'"
              >
                <component :is="cat.icon" class="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span class="text-xs font-bold uppercase tracking-widest leading-tight block">{{ cat.label }}</span>
                 <div v-if="activeCategory === cat.id" class="absolute inset-0 bg-white/10 translate-x-[-100%] animate-[shimmer_3s_infinite] pointer-events-none"></div>
              </button>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <button @click="resetToDefaults" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all border border-transparent hover:border-red-200/50 dark:hover:border-red-900/50">
              <RotateCcw class="w-3.5 h-3.5" />
              {{ $t('settings.reset') }}
            </button>
          </div>
        </div>
        
        <!-- Category Detail Pane -->
        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <!-- AI Section -->
          <div v-if="activeCategory === 'ai'" class="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="bg-primary-500/5 dark:bg-primary-500/10 p-6 rounded-3xl border border-primary-500/10 flex items-start gap-6">
              <div class="p-3 bg-primary-500 rounded-2xl shadow-xl shadow-primary-500/20">
                <Sparkles class="w-8 h-8 text-white" />
              </div>
              <div class="space-y-1">
                <h2 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">AI DBA Assistant (Beta)</h2>
                <p class="text-sm text-gray-500 leading-relaxed max-w-xl">
                  Unlock deep schema analysis, automated risk assessment, and natural language DBA troubleshooting powered by Google Gemini 1.5 Flash.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Gemini Config -->
              <div class="space-y-4">
                <div class="flex items-center justify-between px-1">
                   <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Gemini API Key</label>
                   <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-[10px] font-bold text-primary-500 hover:underline">Get Free Key →</a>
                </div>
                <div class="relative group">
                  <input 
                    v-model="settings.aiApiKey"
                    type="password"
                    placeholder="Enter your Google AI API Key..."
                    class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold font-mono outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                  />
                </div>
                
                <button 
                  @click="testAIConnection"
                  :disabled="aiStatus === 'testing'"
                  class="w-full flex items-center justify-center gap-2 py-4 px-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 rounded-2xl transition-all group font-bold uppercase text-[10px] tracking-widest text-gray-700 dark:text-gray-300 shadow-sm"
                >
                  <RefreshCw v-if="aiStatus !== 'testing'" class="w-3.5 h-3.5 text-primary-500 group-hover:rotate-180 transition-transform duration-500" />
                  <Loader2 v-else class="w-3.5 h-3.5 animate-spin text-primary-500" />
                  {{ aiStatus === 'testing' ? 'Connecting...' : 'Test Connection' }}
                </button>

                <div v-if="aiStatus === 'success'" class="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 animate-in zoom-in-95">
                   <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                     <Check class="w-4 h-4" />
                   </div>
                   <div class="flex-1">
                     <div class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">Authenticated Successfully</div>
                     <div class="text-[11px] text-emerald-800/60 dark:text-emerald-400/60 font-medium">Your AI DBA Assistant is ready to help.</div>
                   </div>
                </div>

                <div v-if="aiStatus === 'error'" class="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center gap-3 animate-in zoom-in-95">
                   <div class="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
                     <ShieldAlert class="w-4 h-4" />
                   </div>
                   <div class="flex-1">
                     <div class="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest leading-none mb-1">Configuration Error</div>
                     <div class="text-[11px] text-red-800/60 dark:text-red-400/60 font-medium line-clamp-2">{{ aiError }}</div>
                   </div>
                </div>
              </div>

              <!-- AI Capabilities -->
              <div class="bg-gray-50/50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 space-y-6">
                <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest">Active Capabilities</h3>
                
                <div class="space-y-4">
                  <div class="flex items-start gap-4">
                    <div class="w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
                    <div>
                      <div class="text-xs font-bold text-gray-900 dark:text-white uppercase leading-none mb-1">Schema Change Review</div>
                      <p class="text-[10px] text-gray-500 font-medium leading-relaxed">Automated analysis of DDL changes with risk level assessment.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
                    <div>
                      <div class="text-xs font-bold text-gray-900 dark:text-white uppercase leading-none mb-1">DBA Troubleshooting</div>
                      <p class="text-[10px] text-gray-500 font-medium leading-relaxed">Natural language interface to ask about complex table patterns and FK graphs.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
                    <div>
                      <div class="text-xs font-bold text-gray-900 dark:text-white uppercase leading-none mb-1">Semantic Diff (Preview)</div>
                      <p class="text-[10px] text-gray-500 font-medium leading-relaxed">Understand the intent of schema changes beyond text comparison.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div :class="activeCategory === 'templates' ? 'w-full' : 'max-w-4xl mx-auto'">
            
            <!-- INTERFACE & TYPOGRAPHY SECTION -->
            <div v-if="activeCategory === 'interface'" class="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">


              <!-- Main UI Settings -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

                <div class="md:col-span-2 space-y-6">
                    <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                     <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{{ $t('settings.interface.theme.label') }}</label>
                    <div class="flex items-center gap-6 bg-gray-50/50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-100 dark:border-gray-800">
                      <button 
                        @click="settingsStore.setTheme('system')"
                        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all"
                        :class="settings.theme === 'system' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'"
                      >
                         <div class="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" :class="settings.theme === 'system' ? 'border-primary-500' : 'border-gray-300'">
                           <div v-if="settings.theme === 'system'" class="w-2 h-2 bg-primary-500 rounded-full"></div>
                         </div>
                         {{ $t('settings.interface.theme.sync') }}
                      </button>
                      <button 
                        @click="settingsStore.setTheme(settings.theme === 'system' ? 'dark' : settings.theme)"
                        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all"
                        :class="settings.theme !== 'system' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'"
                      >
                         <div class="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" :class="settings.theme !== 'system' ? 'border-primary-500' : 'border-gray-300'">
                           <div v-if="settings.theme !== 'system'" class="w-2 h-2 bg-primary-500 rounded-full"></div>
                         </div>
                         {{ $t('settings.interface.theme.manual') }}
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-6">
                    <div 
                      v-for="t in themeOptions" :key="t.id"
                      @click="settingsStore.setTheme(t.id)"
                      class="group cursor-pointer space-y-3"
                    >
                      <div 
                        class="aspect-[16/10] rounded-xl border-2 transition-all duration-300 overflow-hidden relative"
                        :class="[
                          settings.theme === t.id 
                            ? 'border-primary-500 shadow-lg shadow-primary-500/10 scale-[1.02]' 
                            : 'border-transparent bg-gray-100 dark:bg-gray-800 group-hover:border-gray-200 dark:group-hover:border-gray-700'
                        ]"
                      >
                        <!-- Theme Thumbnail Mockup -->
                        <div class="absolute inset-0 flex flex-col" :style="{ backgroundColor: t.preview.main }">
                          <div class="h-1.5 w-full flex gap-0.5 p-0.5 border-b opacity-20" :style="{ backgroundColor: t.preview.sidebar, borderColor: 'currentColor' }">
                             <div class="w-1 h-1 rounded-full bg-red-400"></div>
                             <div class="w-1 h-1 rounded-full bg-amber-400"></div>
                             <div class="w-1 h-1 rounded-full bg-green-400"></div>
                          </div>
                          <div class="flex-1 flex overflow-hidden">
                             <div class="w-1/4 h-full border-r opacity-20" :style="{ backgroundColor: t.preview.sidebar, borderColor: 'currentColor' }"></div>
                             <div class="flex-1 p-2 space-y-1">
                                <div class="h-1 w-2/3 rounded-full opacity-20" :class="t.dark ? 'bg-gray-600' : 'bg-gray-300'"></div>
                                <div class="h-1.5 w-full rounded border border-dashed opacity-10" :class="t.dark ? 'border-gray-500' : 'border-gray-400'"></div>
                                <div class="grid grid-cols-3 gap-1 mt-2">
                                   <div class="h-3 rounded-sm opacity-20" :class="t.dark ? 'bg-gray-800' : 'bg-gray-100'"></div>
                                   <div class="h-3 rounded-sm opacity-20" :class="t.dark ? 'bg-gray-800' : 'bg-gray-100'"></div>
                                   <div class="h-3 rounded-sm opacity-20 bg-primary-500"></div>
                                </div>
                             </div>
                          </div>
                        </div>

                        <!-- Checkmark overlay for selected -->
                        <div v-if="settings.theme === t.id" class="absolute inset-0 bg-primary-500/5 flex items-center justify-center">
                           <div class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg transform scale-110 animate-in zoom-in-50 duration-300">
                             <Check class="w-4 h-4" />
                           </div>
                        </div>
                      </div>
                      
                      <div class="flex items-center gap-2 px-1">
                        <div class="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors" :class="settings.theme === t.id ? 'border-primary-500' : 'border-gray-300 dark:border-gray-700'">
                           <div v-if="settings.theme === t.id" class="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                        </div>
                        <span class="text-xs font-black uppercase tracking-widest transition-colors" :class="settings.theme === t.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600'">{{ $t('settings.themes.' + t.id) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{{ $t('settings.interface.language.label') }}</label>
                  <div class="relative group">
                    <select v-model="settings.language" @change="updateLanguage" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary-500/20 group-hover:border-primary-500 transition-all">
                      <option value="en">{{ $t('settings.english') }}</option>
                      <option value="vi">{{ $t('settings.vietnamese') }}</option>
                    </select>
                    <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <!-- Timezone Select -->
                <div class="md:col-span-2 space-y-2 pt-2">
                  <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{{ $t('settings.interface.timezone.label') }}</label>
                  <div class="relative group">
                    <select v-model="settings.timezone" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary-500/20 group-hover:border-primary-500 transition-all">
                      <option v-for="tz in timezones" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
                    </select>
                    <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <!-- Navigation Style -->
                <div class="md:col-span-2 space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-2">
                   <div class="flex items-center justify-between">
                      <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{{ $t('settings.interface.navigation.label') }}</label>
                   </div>

                   <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <button 
                       @click="appStore.navStyle = 'vertical-list'"
                       class="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group"
                       :class="appStore.navStyle === 'vertical-list' 
                         ? 'bg-white dark:bg-gray-800 border-primary-500 shadow-xl shadow-primary-500/10 ring-1 ring-primary-500/20' 
                         : 'bg-transparent border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'"
                     >
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="appStore.navStyle === 'vertical-list' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'">
                        <LayoutList class="w-5 h-5" />
                      </div>
                       <div class="text-left">
                         <div class="text-xs font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{{ $t('settings.interface.navigation.vertical') }}</div>
                         <div class="text-[10px] text-gray-400 uppercase tracking-tighter">{{ $t('settings.interface.navigation.verticalDesc') }}</div>
                       </div>
                     </button>

                     <button 
                       @click="appStore.navStyle = 'horizontal-tabs'"
                       class="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group"
                       :class="appStore.navStyle === 'horizontal-tabs' 
                         ? 'bg-white dark:bg-gray-800 border-primary-500 shadow-xl shadow-primary-500/10 ring-1 ring-primary-500/20' 
                         : 'bg-transparent border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'"
                     >
                       <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="appStore.navStyle === 'horizontal-tabs' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'">
                         <ColumnsIcon class="w-5 h-5" />
                       </div>
                       <div class="text-left">
                         <div class="text-xs font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{{ $t('settings.interface.navigation.horizontal') }}</div>
                         <div class="text-[10px] text-gray-400 uppercase tracking-tighter">{{ $t('settings.interface.navigation.horizontalDesc') }}</div>
                       </div>
                     </button>
                   </div>
                   
                   <!-- Visible Tabs Configuration -->
                   <div v-if="appStore.navStyle === 'horizontal-tabs'" class="mt-4 p-5 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2">
                     <label class="block text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">{{ $t('settings.interface.visibleConfig') }}</label>
                     <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
                       <label v-for="item in navItems" :key="item.path" class="flex items-center px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-xl cursor-pointer gap-3 transition-colors shadow-sm group">
                         <input type="checkbox" :checked="!appStore.hiddenHorizontalTabs.includes(item.path)" @change="toggleHorizontalTab(item.path)" class="w-4 h-4 rounded text-primary-500 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-primary-500 focus:ring-offset-0" />
                         <component :is="item.icon" class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                         <span class="text-xs font-black text-gray-700 dark:text-gray-300 truncate tracking-tight">{{ item.name }}</span>
                       </label>
                     </div>
                   </div>
                 </div>
               </div>

              <!-- Typography Matrix -->
              <div class="pt-8 border-t border-gray-100 dark:border-gray-800">
                <div class="mb-8">
                  <h3 class="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-1">{{ $t('settings.interface.typography.title') }}</h3>
                  <p class="text-[10px] text-gray-400 uppercase tracking-tighter">{{ $t('settings.interface.typography.subtitle') }}</p>
                </div>

                <div class="mb-6 grid grid-cols-4 gap-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <button 
                    v-for="profile in ['small', 'medium', 'large', 'custom']" 
                    :key="profile"
                    @click="appStore.applyFontSizeProfile(profile as any)"
                    class="py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    :class="appStore.fontSizeProfile === profile 
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
                  >
                    <Type v-if="profile !== 'custom'" class="w-3.5 h-3.5" :class="{'w-3 h-3': profile === 'small', 'w-4 h-4': profile === 'large'}" />
                    <SettingsIcon v-else class="w-3.5 h-3.5" />
                    <span class="hidden sm:inline">{{ $t('settings.interface.typography.profiles.' + profile) }}</span>
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div class="space-y-2">
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-tight">{{ $t('settings.interface.typography.mainFont') }}</label>
                    <select v-model="appStore.fontFamilies.general"
                      class="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white appearance-none cursor-pointer">
                      <option value="'Inter', sans-serif">{{ $t('settings.interface.typography.fonts.inter') }}</option>
                      <option value="'Roboto', sans-serif">{{ $t('settings.interface.typography.fonts.roboto') }}</option>
                      <option value="'Outfit', sans-serif">{{ $t('settings.interface.typography.fonts.outfit') }}</option>
                      <option value="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">{{ $t('settings.interface.typography.fonts.systemNative') }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-3 flex items-center gap-2">
                       <Code class="w-4 h-4 text-primary-500" />
                       {{ $t('settings.interface.typography.codeFont') }}
                    </label>
                    <select v-model="appStore.fontFamilies.code"
                      class="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white appearance-none cursor-pointer font-mono">
                      <option value="'JetBrains Mono', monospace">{{ $t('settings.interface.typography.fonts.jetbrains') }}</option>
                      <option value="'Fira Code', monospace">{{ $t('settings.interface.typography.fonts.fira') }}</option>
                      <option value="'Source Code Pro', monospace">{{ $t('settings.interface.typography.fonts.sourceCode') }}</option>
                      <option value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">{{ $t('settings.interface.typography.fonts.systemNativeMono') }}</option>
                    </select>
                  </div>

                  <div v-if="appStore.fontSizeProfile === 'custom'" class="md:col-span-2 mt-4 animate-in fade-in slide-in-from-top-2">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{{ $t('settings.interface.typography.granularMatrix') }}</label>
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div v-for="(_, key) in appStore.fontSizes" :key="key" class="p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all">
                        <label class="block text-xs font-bold text-gray-400 uppercase tracking-tight mb-2 truncate">{{ $t('settings.interface.typography.sizeLabels.' + key) }}</label>
                        <select v-model.number="appStore.fontSizes[key]" class="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg text-xs font-black outline-none focus:ring-1 focus:ring-primary-500">
                          <option v-for="s in getFontSizeRange(key)" :key="s" :value="s">{{ s }}px</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Button Style / Visual Density -->
              <div class="pt-8 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-2">
                <div class="mb-8">
                  <h3 class="text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-1">{{ $t('settings.interface.buttons.title') }}</h3>
                  <p class="text-xs text-gray-400 uppercase tracking-tighter">{{ $t('settings.interface.buttons.subtitle') }}</p>
                </div>

                <div class="flex flex-col lg:flex-row gap-8">
                  <div class="lg:w-1/3 space-y-3">
                    <button 
                      v-for="style in buttonStyles" :key="style.id"
                      @click="appStore.buttonStyle = style.id"
                      class="w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group"
                      :class="appStore.buttonStyle === style.id 
                        ? 'bg-white dark:bg-gray-800 border-primary-500 shadow-xl shadow-primary-500/10 ring-1 ring-primary-500/20' 
                        : 'bg-transparent border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'"
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" :class="appStore.buttonStyle === style.id ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-primary-500'">
                          <component :is="style.icon" class="w-5 h-5" />
                        </div>
                        <div class="text-left">
                          <div class="text-xs font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{{ style.label }}</div>
                          <div class="text-[10px] text-gray-500 uppercase tracking-tighter">{{ style.desc }}</div>
                        </div>
                      </div>
                      <div v-if="appStore.buttonStyle === style.id" class="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check class="w-2.5 h-2.5 text-white" />
                      </div>
                    </button>
                  </div>

                  <!-- Live Preview -->
                  <div class="lg:w-2/3 bg-gray-50/50 dark:bg-gray-950/50 rounded-2xl p-8 border border-gray-100/50 dark:border-gray-800/50 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div class="absolute inset-0 bg-primary-500/[0.02] dark:bg-primary-500/[0.01] pointer-events-none group-hover:bg-primary-500/[0.04] transition-all"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 mb-10 bg-primary-50 dark:bg-primary-950/30 px-4 py-2 rounded-full border border-primary-100 dark:border-primary-900/50 shadow-sm">{{ $t('settings.interface.preview.label') }}</span>
                    
                    <div class="flex flex-col items-center gap-10 w-full max-w-sm">
                      <div class="w-full flex flex-col items-center">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 opacity-60">{{ $t('settings.interface.preview.primary') }}</span>
                        <button 
                          class="flex items-center justify-center font-black uppercase transition-all duration-300 active:scale-95"
                          :class="[
                            appStore.buttonStyle === 'full' ? 'px-10 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl text-[11px] tracking-[0.2em] shadow-xl shadow-primary-500/30' : '',
                            appStore.buttonStyle === 'minimal' ? 'px-8 py-2.5 bg-primary-500 text-white rounded-xl text-[10px] tracking-widest shadow-lg shadow-primary-500/10' : '',
                            appStore.buttonStyle === 'icons' ? 'w-14 h-14 bg-primary-500 text-white rounded-full shadow-2xl shadow-primary-500/30 hover:scale-110' : ''
                          ]"
                        >
                          <Zap class="w-5 h-5" :class="appStore.buttonStyle !== 'icons' ? 'mr-3' : ''" :fill="appStore.buttonStyle === 'full' ? 'currentColor' : 'none'" />
                          <span v-if="appStore.buttonStyle !== 'icons'">{{ appStore.buttonStyle === 'full' ? $t('settings.interface.preview.initialize') : $t('settings.interface.preview.analyze') }}</span>
                        </button>
                      </div>

                      <div class="flex items-center gap-16">
                        <div class="flex flex-col items-center">
                          <span class="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 opacity-60">{{ $t('settings.interface.preview.secondary') }}</span>
                          <button class="transition-all duration-300 active:scale-95 hover:scale-105" :class="[
                            appStore.buttonStyle === 'full' ? 'flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-2xl text-[11px] font-black shadow-md' : '',
                            appStore.buttonStyle === 'minimal' ? 'flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl text-[10px] font-black' : '',
                            appStore.buttonStyle === 'icons' ? 'w-11 h-11 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm' : ''
                          ]">
                            <HistoryIcon class="w-4 h-4" />
                            <span v-if="appStore.buttonStyle !== 'icons'">{{ $t('settings.interface.preview.checkHistory') }}</span>
                          </button>
                        </div>
                        <div class="flex flex-col items-center">
                          <span class="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 opacity-60">{{ $t('settings.interface.preview.utility') }}</span>
                          <button class="transition-all duration-300 active:scale-95 group/u" :class="[
                            appStore.buttonStyle === 'full' ? 'flex items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl shadow-inner hover:bg-indigo-100 transition-colors' : '',
                            appStore.buttonStyle === 'minimal' ? 'flex items-center justify-center w-10 h-10 bg-gray-50 dark:bg-gray-800/80 text-gray-400 rounded-xl' : '',
                            appStore.buttonStyle === 'icons' ? 'text-gray-400 hover:text-primary-500 hover:scale-125 transition-transform' : ''
                          ]">
                            <SettingsIcon class="w-4.5 h-4.5 group-hover/u:rotate-90 transition-transform duration-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- TERMINAL INTEGRATION SECTION -->
            <div v-if="activeCategory === 'terminal'" class="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div class="space-y-8">
                  <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 relative overflow-hidden">
                     <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Terminal class="w-48 h-48" />
                     </div>
                     
                     <div class="relative z-10">
                        <div class="flex items-center gap-4 mb-6">
                           <div class="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                              <Terminal class="w-6 h-6" />
                           </div>
                           <div>
                              <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('settings.terminal.cliTitle') }}</h3>
                              <p class="text-xs text-gray-500 font-medium">{{ $t('settings.terminal.subtitle') }}</p>
                           </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                           <div class="flex-1">
                              <div class="flex items-center gap-2 mb-2">
                                 <span class="text-xs font-black uppercase tracking-widest">{{ $t('settings.terminal.install') }}</span>
                                 <div v-if="isCliInstalled" class="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black uppercase">
                                    <Check class="w-3 h-3" />
                                    {{ $t('settings.terminal.installed') }}
                                 </div>
                                 <div v-else class="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full text-[10px] font-black uppercase">
                                    <div class="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                    {{ $t('settings.terminal.notInstalled') }}
                                 </div>
                              </div>
                              <p class="text-xs text-gray-400 max-w-md leading-relaxed">
                                 {{ $t('settings.terminal.installDesc') }}
                              </p>
                           </div>

                           <button 
                              @click="handleInstallCli"
                              :disabled="isInstallingCli"
                              class="w-full md:w-auto px-8 py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                           >
                              <RefreshCw v-if="isInstallingCli" class="w-4 h-4 animate-spin" />
                              <Zap v-else class="w-4 h-4" />
                              {{ isInstallingCli ? $t('common.processing') : (isCliInstalled ? 'Reinstall CLI' : $t('settings.terminal.install')) }}
                           </button>
                        </div>

                        <!-- Code Block Example -->
                        <div class="mt-10 p-6 bg-gray-950 rounded-2xl border border-white/5 relative group">
                           <div class="flex items-center justify-between mb-4">
                              <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Usage Example</span>
                              <button @click="copyCommand" class="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                                 <Layers class="w-3.5 h-3.5" />
                              </button>
                           </div>
                           <div class="font-mono text-[11px] space-y-2">
                              <div class="text-gray-500"># Use andb from anywhere</div>
                              <div class="text-white"><span class="text-primary-400">$</span> andb compare dev prod --type tables</div>
                              <div class="text-gray-600 mt-2">// Response from andb engine v4.x</div>
                           </div>
                        </div>
                     </div>

                  </div>
                  
                  <!-- Default CLI Project Selector -->
                  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm rounded-2xl relative">
                        <div class="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                           <div class="flex items-start gap-4 flex-1">
                              <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                                 <Terminal class="w-5 h-5" />
                              </div>
                              <div>
                                 <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                                    {{ $t('settings.terminal.defaultScope') }}
                                 </h3>
                                 <p class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-xl">
                                    Select the target project when executing global command line tools like <code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-primary-500 dark:text-primary-400">andb compare</code> without explicitly specifying a project context.
                                 </p>
                              </div>
                           </div>
                           
                           <div class="md:w-64 shrink-0">
                              <select 
                                 v-model="defaultCliProject" 
                                 @change="saveDefaultCliProject" 
                                 class="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white appearance-none cursor-pointer"
                              >
                                 <option value="">{{ $t('settings.terminal.noDefaultContext') }}</option>
                                 <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id">
                                    Project: {{ p.name }}
                                 </option>
                              </select>
                           </div>
                        </div>
                     </div>

                     <!-- Path Settings added from Integrations -->
                     <div v-if="isCliInstalled" class="mt-8 space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                       <div class="text-sm text-gray-600 dark:text-gray-300">
                          To run <code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">andb</code> from your terminal without requiring administrator privileges, copy and paste one of the options below into your terminal.
                       </div>

                       <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div class="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                            <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-2">{{ $t('settings.terminal.option1') }}</h3>
                            <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-3">{{ $t('settings.terminal.option1Desc') }}</p>
                            <CopyableSnippet :content="`export PATH=\&quot;$PATH:${internalBinaryPath.split('/andb').join('')}\&quot;`" language="bash" />
                          </div>
                          
                          <div class="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                            <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-2">{{ $t('settings.terminal.option2') }}</h3>
                            <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-3">{{ $t('settings.terminal.option2Desc') }}</p>
                            <CopyableSnippet :content="`ln -sf &quot;${internalBinaryPath}&quot; ~/.local/bin/andb`" language="bash" />
                          </div>
                       </div>
                     </div>

                     <!-- Smart MCP Server (AI Architect) -->
                     <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-md">
                       <div class="p-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div class="flex items-center gap-4">
                           <div class="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-lg shadow-orange-500/10">
                             <Cpu class="w-6 h-6" />
                           </div>
                           <div>
                             <h2 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('settings.terminal.mcpTitle') }}</h2>
                             <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ $t('settings.terminal.mcpDesc') }}</p>
                           </div>
                         </div>
                         
                         <div class="flex items-center gap-3">
                           <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-black border bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 uppercase tracking-widest whitespace-nowrap">
                             <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                              {{ $t('settings.terminal.mcpMode') }}
                            </div>
                         </div>
                       </div>
                       
                       <div class="p-8 space-y-6">
                          <div class="text-sm text-gray-600 dark:text-gray-300" v-html="$t('settings.terminal.mcpInfo')"></div>

                          <div class="bg-gray-950 rounded-2xl p-5 border border-white/5 shadow-inner">
                             <CopyableSnippet 
                               :content="`{\n  \&quot;mcpServers\&quot;: {\n    \&quot;the-andb\&quot;: {\n      \&quot;command\&quot;: \&quot;node\&quot;,\n      \&quot;args\&quot;: [\&quot;${mcpBinaryPath}\&quot;]\n    }\n  }\n}`" 
                               language="json" 
                             />
                          </div>

                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                             <div class="p-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500/50 transition-colors">
                               <h4 class="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-2">{{ $t('settings.terminal.cursorConfig') }}</h4>
                               <code class="text-xs text-gray-600 dark:text-gray-400 break-all select-all block bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json</code>
                             </div>
                             <div class="p-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-teal-500/50 transition-colors">
                               <h4 class="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-2">{{ $t('settings.terminal.windsurfConfig') }}</h4>
                               <code class="text-xs text-gray-600 dark:text-gray-400 break-all select-all block bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">~/.codeium/windsurf/mcp_config.json</code>
                             </div>
                          </div>
                       </div>
                     </div>
               </div>
            </div>
            </div>

            <!-- CONNECTION TEMPLATES SECTION -->
            <div v-if="activeCategory === 'templates'" class="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
              <ConnectionTemplateManager class="flex-1 min-h-0" />
            </div>

            <!-- ENGINE SECTION -->
            <div v-if="activeCategory === 'engine'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">


               <div class="space-y-8">
                 <!-- Domain Normalization -->
                 <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                       <GitCompare class="w-32 h-32" />
                    </div>
                    <div class="relative z-10">
                       <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">{{ $t('settings.engine.domainNormalization.title') }}</h3>
                       <p class="text-xs text-gray-500 mb-6 max-w-lg leading-relaxed" v-html="$t('settings.engine.domainNormalization.desc')"></p>
                       
                       <div class="space-y-4">
                           <div v-for="(rep, index) in settingsStore.settings.envReplacements || []" :key="index"
                                class="p-4 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3 relative group/rep transition-colors hover:border-orange-500/50">
                             <button @click="removeEnvReplacementGlobal(index)" class="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover/rep:opacity-100"><Trash2 class="w-4 h-4" /></button>
                             
                             <div class="space-y-1.5 max-w-sm">
                               <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Variable Name</label>
                               <input v-model="rep.key" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-orange-500/20 outline-none" placeholder="e.g. APP_DOMAIN" />
                             </div>
                             
                             <div class="pt-2 border-t border-gray-200 dark:border-gray-800/50">
                               <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 mb-2">Environment Values</label>
                               <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                 <div v-for="env in connectionPairsStore.environments" :key="env.id" class="space-y-1">
                                   <span class="text-[10px] text-gray-500 font-bold ml-1 uppercase">{{ env.name }}</span>
                                   <input v-model="rep.values[env.name]" type="text" class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-mono focus:ring-2 focus:ring-orange-500/20 outline-none" placeholder="Value..." />
                                 </div>
                               </div>
                             </div>
                           </div>
                           
                           <button @click="addEnvReplacementGlobal" class="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors border border-orange-100 dark:border-orange-800/30">
                             <Plus class="w-4 h-4" /> Add Variable
                           </button>
                        </div>
                    </div>
                 </div>

                 <!-- Migration Exclusions -->
                 <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                     <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                       <Shield class="w-32 h-32" />
                    </div>
                    <div class="relative z-10">
                       <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">{{ $t('settings.engine.migrationExclusions.title') }}</h3>
                       <p class="text-xs text-gray-500 mb-6 max-w-lg leading-relaxed" v-html="$t('settings.engine.migrationExclusions.desc')"></p>

                        <div class="space-y-3">
                           <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Tags (Wildcards supported: `*`)</label>
                           <div class="flex flex-wrap gap-2 mb-2">
                             <div v-for="(tag, index) in settingsStore.settings.excludeTags || []" :key="index"
                                  class="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-mono font-medium border border-red-100 dark:border-red-800/50">
                               <span>{{ tag }}</span>
                               <button @click="removeExcludeTagGlobal(index)" class="p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded-md transition-colors"><X class="w-3 h-3" /></button>
                             </div>
                           </div>
                           <div class="relative max-w-sm">
                             <ShieldAlert class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                             <input v-model="newExcludeTagGlobal"
                               @keydown.enter.prevent="addExcludeTagGlobal"
                               type="text"
                               class="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                               placeholder="e.g. test_* (Press Enter to add)" />
                           </div>
                        </div>
                    </div>
                 </div>
               </div>
            </div>

            <!-- WORKSPACE VAULT SECTION -->
            <div v-if="activeCategory === 'vault'" class="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div class="grid grid-cols-1 gap-8">
                  <!-- Workspace Directory -->
                  <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                     <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Cloud class="w-32 h-32" />
                     </div>
                     <div class="relative z-10">
                        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1 flex items-center gap-2">{{ $t('settings.vault.title') }} <span class="bg-primary-500 text-white px-2 py-0.5 rounded-md text-[9px] tracking-widest animate-pulse-slow">{{ $t('settings.vault.localFirst') }}</span></h3>
                        <p class="text-xs text-gray-500 mb-6 max-w-lg leading-relaxed" v-html="$t('settings.vault.desc')"></p>
                        
                        <div class="space-y-4">
                           <div class="flex items-center gap-3">
                              <div class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-mono font-bold text-gray-500 truncate shadow-inner">
                                 {{ currentWorkspaceDir || $t('settings.vault.notSet') }}
                              </div>
                              <button 
                                 v-if="currentWorkspaceDir"
                                 @click="resetWorkspaceDir"
                                 class="px-5 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:border-red-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                              >
                                 {{ $t('settings.vault.reset') }}
                              </button>
                              <button 
                                 @click="pickWorkspaceDir"
                                 class="px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                              >
                                 {{ $t('settings.vault.relocate') }}
                              </button>
                           </div>
                           <p v-if="currentWorkspaceDir" class="text-[10px] text-gray-400 font-medium">
                             {{ $t('settings.vault.activeWorkspace') }}<code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">{{ currentWorkspaceDir }}</code><br/>{{ $t('settings.vault.activeDatabase') }}<code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">{{ currentDbPath }}</code><br />
                             <span class="flex items-center gap-1.5 mt-2 text-green-600 dark:text-green-500/80 font-black uppercase tracking-widest">
                               <Shield class="w-3 h-3" />
                               AES-256 Encrypted Vault
                             </span>
                             <span class="text-amber-500 block mt-1">{{ $t('settings.vault.restartRequired') }}</span>
                           </p>
                        </div>
                     </div>
                  </div>
                </div>
                  <!-- This block was extracted to Vault tab -->
            </div>

            <!-- SECURITY SECTION -->
            <div v-if="activeCategory === 'security'" class="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div>
                  <div class="mb-8 p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                       <Shield class="w-32 h-32" />
                    </div>
                    <div class="relative z-10">
                       <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                          {{ $t('settings.security.title') }}
                          <span class="bg-rose-500 text-white px-2 py-0.5 rounded-md text-[9px] tracking-widest uppercase">{{ $t('status.active') || 'Active' }}</span>
                       </h3>
                       <p class="text-xs text-gray-500 mb-6 max-w-lg leading-relaxed" v-html="$t('settings.security.desc')"></p>
                    </div>
                  </div>

                  <div class="space-y-6">
                 <!-- Public Key Display -->
                  <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-4">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{{ $t('settings.security.publicKey') }}</label>
                         <div class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <Check class="w-3 h-3" />
                            {{ $t('settings.security.active') }}
                         </div>
                    </div>
                    <div class="relative group">
                        <textarea 
                           readonly 
                           :value="publicKey" 
                           class="w-full h-32 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-600 dark:text-gray-300 resize-none outline-none focus:ring-2 focus:ring-rose-500/20"
                        ></textarea>
                    </div>
                    <p class="mt-2 text-xs text-gray-400">{{ $t('settings.security.publicKeyDesc') }}</p>
                 </div>

                 <!-- Regenerate Actions -->
                 <div class="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-6">
                     <h3 class="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest mb-2">{{ $t('settings.security.dangerZone') }}</h3>
                     <p class="text-sm text-rose-600/80 dark:text-rose-300/80 mb-6 leading-relaxed max-w-2xl font-medium">
                        {{ $t('settings.security.regenerateWarning') }}
                     </p>

                     <button 
                        @click="regenerateKeys"
                        :disabled="isRegeneratingKeys"
                        class="px-6 py-3 bg-white dark:bg-gray-800 text-rose-600 hover:text-rose-700 border border-rose-200 dark:border-rose-800 hover:border-rose-300 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:shadow active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                     >
                        <Key v-if="!isRegeneratingKeys" class="w-4 h-4" />
                        <span v-if="isRegeneratingKeys" class="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
                        {{ isRegeneratingKeys ? $t('common.processing') : $t('settings.security.regenerateKeys') }}
                     </button>
                 </div>
                  </div>
               </div>
            </div>

            <!-- BACKUP SECTION -->
            <div v-if="activeCategory === 'backup'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <BackupManager />
            </div>

            <!-- UPDATE SECTION -->
            <div v-if="activeCategory === 'update'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
                 <div class="space-y-6">
                 <!-- Status Card -->
                 <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center">
                    <div class="mb-4">
                       <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">{{ $t('settings.update.currentVersion') }}</span>
                       <div class="text-3xl font-black text-gray-900 dark:text-white mt-1">{{ updaterStore.currentVersion }}</div>
                    </div>

                    <div v-if="updaterStore.status === 'checking'" class="flex items-center gap-2 text-primary-500 font-bold mb-4">
                       <RefreshCw class="w-4 h-4 animate-spin" />
                       {{ $t('settings.update.checking') }}
                    </div>
                     <div v-else-if="updaterStore.status === 'available'" class="flex flex-col items-center gap-2 mb-4">
                       <div class="flex items-center gap-2 text-green-500 font-bold">
                          <Check class="w-4 h-4" />
                          {{ $t('settings.update.available', { version: updaterStore.updateInfo?.version }) }}
                       </div>
                    </div>
                    <div v-else-if="updaterStore.status === 'downloaded'" class="flex flex-col items-center gap-2 mb-4">
                       <div class="flex items-center gap-2 text-green-500 font-bold">
                          <Check class="w-4 h-4" />
                          {{ $t('settings.update.ready') }}
                       </div>
                    </div>
                    <div v-else-if="updaterStore.status === 'not-available'" class="flex items-center gap-2 text-gray-500 font-bold mb-4">
                       <Check class="w-4 h-4" />
                       {{ $t('settings.update.upToDate') }}
                    </div>

                    <!-- Action Button -->
                    <button 
                      @click="updaterStore.checkForUpdates()"
                      :disabled="updaterStore.status === 'checking' || updaterStore.status === 'downloading'"
                      class="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                       <RefreshCw v-if="updaterStore.status === 'checking'" class="w-4 h-4 animate-spin" />
                       <span v-else>{{ $t('settings.update.check') }}</span>
                    </button>
                    
                    <button 
                       v-if="updaterStore.status === 'available' || updaterStore.status === 'downloaded'"
                       @click="updaterStore.showModal = true"
                       class="mt-4 text-xs font-bold text-primary-500 hover:text-primary-600 underline"
                    >
                       {{ $t('settings.update.viewNotes') }}
                    </button>
                 </div>
                 
                 <!-- Settings -->
                 <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <label class="flex items-center justify-between cursor-pointer">
                       <div>
                          <div class="text-sm font-bold text-gray-900 dark:text-white">{{ $t('settings.update.autoDownload') }}</div>
                          <div class="text-xs text-gray-500">{{ $t('settings.update.autoDownloadDesc') }}</div>
                       </div>
                       <div class="relative">
                          <input type="checkbox" v-model="updaterStore.autoDownload" class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                       </div>
                    </label>
                 </div>
               </div>
            </div>
        </div>
    </main>

    <!-- Reset Data Confirmation Modal (Pro Style) -->
    <div v-if="showResetModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        class="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
        @click="showResetModal = false"
      ></div>
      
      <div class="relative bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <!-- Modal Header -->
        <div class="px-8 pt-8 pb-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shadow-inner">
              <Trash2 class="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('settings.resetModal.title') }}</h3>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">{{ $t('settings.resetModal.subtitle') }}</p>
            </div>
          </div>
          <button @click="showResetModal = false" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Modal Body -->
        <div class="px-8 py-6">
          <p class="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {{ $t('settings.resetModal.warning').split('{irreversible}')[0] }}<span class="font-black text-red-500 underline decoration-2 underline-offset-2">{{ $t('settings.resetModal.irreversible') }}</span>.
          </p>
          
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-6">
            <h4 class="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-[0.2em] mb-4">{{ $t('settings.resetModal.purgedListTitle') }}</h4>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <Database class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.cachedSchemas') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <GitCompare class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.comparisonResults') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <FileCode class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.generatedAlters') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <Activity class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.migrationHistory') }}</span>
              </div>
            </div>
          </div>
          
           <div class="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/20 rounded-xl border border-primary-100/50 dark:border-primary-900/50">
             <div class="p-1 bg-white dark:bg-gray-800 rounded-md text-primary-500 shadow-sm">
               <RotateCcw class="w-3 h-3" />
             </div>
             <p class="text-[10px] text-primary-700 dark:text-primary-300 font-bold uppercase leading-relaxed tracking-tight">
               {{ $t('settings.resetModal.preservationNote') }}
             </p>
           </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="px-8 py-6 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
          <button 
            @click="showResetModal = false" 
            class="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {{ $t('settings.resetModal.cancel') }}
          </button>
          <button 
            @click="confirmResetData" 
            class="flex-[1.5] py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            :disabled="isResetting"
          >
            <RotateCcw v-if="isResetting" class="w-3.5 h-3.5 animate-spin" />
            <span v-if="isResetting">{{ $t('settings.resetModal.purging') }}</span>
            <span v-else>{{ $t('settings.resetModal.confirm') }}</span>
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, markRaw } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  ChevronDown, 
  ChevronRight,
  Zap, 
  Check, 
  MousePointer2, 
  Layers,
  Settings as SettingsIcon, 
  MonitorSmartphone, 
  History as HistoryIcon,
  Database,
  Cloud,
  Trash2,
  X,
  FileCode,
  Activity,
  Type,
  DownloadCloud,
  LayoutTemplate,
  Shield,
  Key,
  RotateCcw,
  LayoutList,
  Columns as ColumnsIcon,
  RefreshCw,
  GitCompare,
  Cpu,
  Terminal,
  Home,
  Workflow,
  Network,
  Plus,
  ShieldAlert,
  Sparkles
} from 'lucide-vue-next'
import MainLayout from '@/layouts/MainLayout.vue'
import BackupManager from '@/components/general/BackupManager.vue'
import CopyableSnippet from '@/components/general/CopyableSnippet.vue'
import ConnectionTemplateManager from '@/components/connection/ConnectionTemplateManager.vue'
import { setLanguage } from '@/i18n'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useFeaturesStore } from '@/stores/features'
import { useConnectionTemplatesStore } from '@/stores/connectionTemplates'
import { useSettingsStore, themeOptions } from '@/stores/settings'
import { useOperationsStore } from '@/stores/operations'
import { useUpdaterStore } from '@/stores/updater'
import { useConsoleStore } from '@/stores/console'
import Andb from '@/utils/andb'



const { t } = useI18n()
const appStore = useAppStore()
const projectsStore = useProjectsStore()
const featuresStore = useFeaturesStore()

const currentWorkspaceDir = ref('')
const currentDbPath = ref('')

const loadWorkspacePaths = async () => {
    if ((window as any).electronAPI && (window as any).electronAPI.getWorkspaceStatus) {
        const res = await (window as any).electronAPI.getWorkspaceStatus()
        if (res && res.success) {
            currentWorkspaceDir.value = res.path
            currentDbPath.value = res.dbPath
        }
    }
}

onMounted(() => {
    loadPublicKey()
    loadWorkspacePaths()
})

// Navigation Configuration Setup
const navItems = computed(() => {
  const items = [
    { name: t('common.dashboard'), path: '/', icon: Home, visible: true },
    { name: t('common.schema'), path: '/schema', icon: Database, visible: true },
    { name: t('common.compare'), path: '/compare', icon: GitCompare, visible: true },
    { name: t('common.history'), path: '/history', icon: HistoryIcon, visible: true },
    { name: 'Instant Compare', path: '/instant-compare', icon: Workflow, visible: true },
    { name: 'Integrations', path: '/integrations', icon: Terminal, visible: true },
    { name: 'ER Diagram', path: '/er-diagram', icon: Network, visible: featuresStore.isEnabled('erDiagram') },
    { name: t('settings.project_settings'), path: '/project-settings', icon: SettingsIcon, visible: true }, 
  ]
  return items.filter(i => i.visible)
})

const toggleHorizontalTab = (path: string) => {
  const hidden = [...appStore.hiddenHorizontalTabs]
  const index = hidden.indexOf(path)
  if (index === -1) {
    hidden.push(path)
  } else {
    hidden.splice(index, 1)
  }
  appStore.hiddenHorizontalTabs = hidden
}

const connectionPairsStore = useConnectionPairsStore()
const settingsStore = useSettingsStore()

const newExcludeTagGlobal = ref('')

const addExcludeTagGlobal = () => {
  if (!newExcludeTagGlobal.value.trim()) return
  if (!settingsStore.settings.excludeTags) settingsStore.settings.excludeTags = []
  if (!settingsStore.settings.excludeTags.includes(newExcludeTagGlobal.value.trim())) {
    settingsStore.settings.excludeTags.push(newExcludeTagGlobal.value.trim())
  }
  newExcludeTagGlobal.value = ''
}

const removeExcludeTagGlobal = (index: number) => {
  if (!settingsStore.settings.excludeTags) return
  settingsStore.settings.excludeTags.splice(index, 1)
}

const addEnvReplacementGlobal = () => {
  if (!settingsStore.settings.envReplacements) settingsStore.settings.envReplacements = []
  settingsStore.settings.envReplacements.push({ key: '', values: {} })
}

const removeEnvReplacementGlobal = (index: number) => {
  if (!settingsStore.settings.envReplacements) return
  settingsStore.settings.envReplacements.splice(index, 1)
}
const operationsStore = useOperationsStore()
const updaterStore = useUpdaterStore()
const route = useRoute()

// Active Category State (Declared early for usage in watchers)
const activeCategory = ref<string>('interface')

// Security Logic
const publicKey = ref('')
const isRegeneratingKeys = ref(false)

const loadPublicKey = async () => {
  if ((window as any).electronAPI && (window as any).electronAPI.invoke) {
    const res = await (window as any).electronAPI.invoke('security-get-public-key')
    if (res.success) {
      publicKey.value = res.data
    }
  }
}

const regenerateKeys = async () => {
    if (!confirm(t('settings.security.regenerateConfirm'))) return
    
    isRegeneratingKeys.value = true
    try {
        if ((window as any).electronAPI && (window as any).electronAPI.invoke) {
            const res = await (window as any).electronAPI.invoke('security-regenerate-keys')
            if (res.success) {
                await loadPublicKey()
                
                // CRITICAL: Clear all passwords in memory to force re-entry
                // This ensures the regeneration of keys "invalidates" existing session data immediately.
                if (appStore.connections) {
                    appStore.connections.forEach(conn => {
                        conn.password = ''
                        conn.status = 'idle'
                    })
                }

                // Also clear templates
                const templatesStore = useConnectionTemplatesStore()
                if (templatesStore.templates) {
                    templatesStore.templates.forEach((t: any) => {
                        t.password = ''
                    })
                }

                alert(t('settings.security.regenerateSuccess'))
            } else {
                alert(t('settings.security.regenerateError') + ': ' + res.error)
            }
        }
    } catch (e: any) {
        console.error(e)
        alert('Error: ' + e.message)
    } finally {
        isRegeneratingKeys.value = false
    }
}

const resetWorkspaceDir = async () => {
    if (confirm('Are you sure you want to clear your custom Workspace? The app will revert to using the internal system cache storage.')) {
        if ((window as any).electronAPI && (window as any).electronAPI.resetWorkspaceDir) {
            await (window as any).electronAPI.resetWorkspaceDir()
            currentWorkspaceDir.value = ''
            alert('Workspace cleared. Please restart the app for changes to take full effect.')
        }
    }
}

const pickWorkspaceDir = async () => {
    if ((window as any).electronAPI && (window as any).electronAPI.pickWorkspaceDir) {
        const result = await (window as any).electronAPI.pickWorkspaceDir()
        
        if (result && result.success && result.path) {
            currentWorkspaceDir.value = result.path
            const actionMsg = result.action === 'linked' 
              ? 'Now running out of the existing Workspace vault.' 
              : 'Workspace moved successfully.';
            alert(`${actionMsg}\n${result.path}\n\nPlease restart the app for changes to take full effect.`)
        } else if (result && !result.success && !result.canceled) {
            alert('Failed to set workspace: ' + result.error)
        }
    }
}

// CLI Installation Logic
const isCliInstalled = ref(false)
const isInstallingCli = ref(false)

const checkCliStatus = async () => {
    isCliInstalled.value = await Andb.isCliInstalled()
}

const handleInstallCli = async () => {
    isInstallingCli.value = true
    try {
        const res = await Andb.installCli()
        if (res.success) {
            alert(t('settings.terminal.success'))
            await checkCliStatus()
        } else {
            alert(t('settings.terminal.failed') + ': ' + res.message)
        }
    } catch (e: any) {
        alert('Error: ' + e.message)
    } finally {
        isInstallingCli.value = false
    }
}

const copyCommand = () => {
    navigator.clipboard.writeText('andb compare dev prod --type tables')
    alert('Example command copied to clipboard')
}

watch(activeCategory, (newVal) => {
    if (newVal === 'security') {
        loadPublicKey()
    }
    if (newVal === 'terminal') {
        checkCliStatus()
    }
})

const internalBinaryPath = ref('')
const mcpBinaryPath = ref('')
const defaultCliProject = ref('')

const loadPaths = async () => {
  try {
    internalBinaryPath.value = await window.electronAPI?.cli?.getBinaryPath() || '/path/to/andb'
    mcpBinaryPath.value = await window.electronAPI?.mcp?.getMcpPath() || '/path/to/mcp/dist/index.js'
    
    // Load Default CLI Project Selection
    const settings = await (window.electronAPI?.storage as any)?.getUserSettings()
    if (settings && settings.default_cli_project_id) {
       defaultCliProject.value = settings.default_cli_project_id
    }
  } catch (error) {
    console.error('Failed to load internal paths', error)
  }
}

const saveDefaultCliProject = async () => {
   try {
      await (window.electronAPI?.storage as any)?.saveUserSetting('default_cli_project_id', defaultCliProject.value)
   } catch (error) {
      console.error('Failed to save default CLI project', error)
   }
}

onMounted(() => {
    checkCliStatus()
    loadPaths()
})

const categories = computed(() => {
  const appCats = [
    { id: 'interface', label: t('settings.categories.interface'), icon: markRaw(MonitorSmartphone), subtitle: t('settings.interface.subtitle') },
    { id: 'vault', label: 'Workspace Vault', icon: markRaw(Cloud), subtitle: 'Local storage & future cloud sync' },
    { id: 'templates', label: t('settings.categories.connections'), icon: markRaw(LayoutTemplate), subtitle: t('settings.global_connections.subtitle') },
    { id: 'engine', label: 'Engine', icon: markRaw(Cpu), subtitle: 'Core behavior settings' },
    { id: 'terminal', label: 'CLI & MCP', icon: markRaw(Terminal), subtitle: t('settings.terminal.subtitle') },
    { id: 'security', label: t('settings.categories.security'), icon: markRaw(Shield), subtitle: t('settings.security.subtitle') },
    { id: 'backup', label: t('settings.categories.backup'), icon: markRaw(Database), subtitle: t('settings.backup.subtitle') },
    { id: 'ai', label: 'AI Assistant', icon: markRaw(Sparkles), subtitle: 'DBA Intelligence powered by Gemini' },
    { id: 'update', label: t('settings.categories.update'), icon: markRaw(DownloadCloud), subtitle: t('settings.update.subtitle') }
  ]

  return appCats.map(c => ({ ...c, type: 'app' }))
})

const activeCategoryInfo = computed(() => {
   return categories.value.find(c => c.id === activeCategory.value)
})

const appSettings = computed(() => categories.value)



// Handle deep linking from query params
const handleDeepLink = (query: any) => {
  if (query.cat && categories.value.find(c => c.id === query.cat)) {
    activeCategory.value = query.cat as string
  }
  // Support 'tab' alias as used in dashboard (e.g. settings?tab=connections)
  if (query.tab && categories.value.find(c => c.id === query.tab)) {
    activeCategory.value = query.tab as string
  }
}

onMounted(() => {
  handleDeepLink(route.query)
})

watch(() => route.query, (newQuery) => {
  handleDeepLink(newQuery)
})

const timezones = [
  { label: 'UTC (+00:00)', value: 'UTC' },
  { label: 'Asia/Ho_Chi_Minh (+07:00)', value: 'Asia/Ho_Chi_Minh' },
  { label: "Singapore (+08:00)", value: "Asia/Singapore" },
  { label: "Tokyo (+09:00)", value: "Asia/Tokyo" },
  { label: "Sydney (+11:00)", value: "Australia/Sydney" },
  { label: 'America/New_York (-05:00)', value: 'America/New_York' },
  { label: 'Europe/London (+00:00)', value: 'Europe/London' }
]

const settings = computed(() => settingsStore.settings)


const updateLanguage = () => {
  setLanguage(settings.value.language)
}

const getFontSizeRange = (key: string) => {
  if (key === 'title') return [14, 16, 18, 20, 22, 24, 26, 28, 32]
  if (key === 'subtitle') return [11, 12, 13, 14, 15, 16, 18, 20, 22]
  if (key === 'quote') return [9, 10, 11, 12, 13, 14]
  return [10, 11, 12, 13, 14, 15, 16, 17, 18, 20] // content and code
}

const buttonStyles = computed<{ id: 'full' | 'minimal' | 'icons', label: string, icon: any, desc: string }[]>(() => [
  { id: 'full', label: t('settings.interface.buttons.premium'), icon: markRaw(Zap), desc: t('settings.interface.buttons.premiumDesc') },
  { id: 'minimal', label: t('settings.interface.buttons.minimal'), icon: markRaw(MousePointer2), desc: t('settings.interface.buttons.minimalDesc') },
  { id: 'icons', label: t('settings.interface.buttons.iconOnly'), icon: markRaw(Layers), desc: t('settings.interface.buttons.iconOnlyDesc') }
])


const showResetModal = ref(false)
const isResetting = ref(false)

const resetToDefaults = () => {
  showResetModal.value = true
}

const confirmResetData = async () => {
  isResetting.value = true
  try {
     if ((window as any).electronAPI && (window as any).electronAPI.andbClearStorage) {
         const res = await (window as any).electronAPI.andbClearStorage()
         
         const consoleStore = useConsoleStore()
         if (res.success && res.data) {
             const { ddl, comparison, snapshot, migration } = res.data
             consoleStore.addLog('APPLICATION DATA RESET COMPLETED', 'warn')
             consoleStore.addLog(`- Deleted ${ddl || 0} DDL records`, 'info')
             consoleStore.addLog(`- Deleted ${comparison || 0} Comparison records`, 'info')
             consoleStore.addLog(`- Deleted ${snapshot || 0} Snapshot records`, 'info')
             consoleStore.addLog(`- Deleted ${migration || 0} Migration records`, 'info')
             consoleStore.setVisibility(true)
         }
     } else {
         await new Promise(resolve => setTimeout(resolve, 800))
     }
     
     // Reload app data
     await Promise.all([
       appStore.reloadData(),
       connectionPairsStore.reloadData(),
       operationsStore.clearOperations(),
       operationsStore.loadOperations()
     ])
     
     showResetModal.value = false
  } catch (error: any) {
    if (window.electronAPI) {
      window.electronAPI.log.send('error', 'Failed to reset data in settings', error.message)
    }
    alert('Failed to reset data.')
  } finally {
    isResetting.value = false
  }
}

// AI Settings Logic
const aiStatus = ref<'idle' | 'testing' | 'success' | 'error'>('idle')
const aiError = ref('')

const testAIConnection = async () => {
  if (!settings.value.aiApiKey) {
    alert('Please enter an API Key first')
    return
  }
  
  aiStatus.value = 'testing'
  aiError.value = ''
  
  try {
    // 1. Configure the core engine
    await (window as any).electron.ipcRenderer.invoke('execute-core', 'ai-configure', {
      apiKey: settings.value.aiApiKey,
      provider: 'gemini'
    })
    
    // 2. Test with a simple prompt
    const res = await (window as any).electron.ipcRenderer.invoke('execute-core', 'ai-ask', {
      question: 'Ping'
    })
    
    if (res && res.content) {
      aiStatus.value = 'success'
    } else {
      throw new Error('No response from AI')
    }
  } catch (e: any) {
    aiStatus.value = 'error'
    aiError.value = e.message
  }
}
</script>


<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%) skewX(-15deg); }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb; /* gray-200 */
  border-radius: 9999px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f2937; /* gray-800 */
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db; /* gray-300 */
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #374151; /* gray-700 */
}
</style>
