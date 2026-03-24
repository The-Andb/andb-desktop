<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-300">
    <!-- Breadcrumb Header -->
    <div class="shrink-0 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
      <div class="flex items-center gap-3 text-xs font-bold text-gray-500 dark:text-gray-400 select-none">
         <span class="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">Settings</span>
         <span class="text-gray-300 dark:text-gray-700">/</span>
         <span class="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">Global Connections</span>
         <span class="text-gray-300 dark:text-gray-700">/</span>
         <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full">
            <ShieldCheck class="w-3.5 h-3.5" />
            <span>Secure Configuration</span>
         </div>
      </div>

      <div class="relative group cursor-help">
        <div class="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
        <div class="relative flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-500/30 rounded-full shadow-sm">
          <div class="relative flex h-1.5 w-1.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </div>
          <span class="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
            STRICT SAFETY
          </span>
        </div>
      </div>
    </div>

    <!-- Stepper Navigation -->
    <div class="shrink-0 px-6 py-3 flex items-center justify-center gap-3 bg-white dark:bg-gray-950 border-b border-gray-50 dark:border-gray-900">
      <template v-for="step in totalSteps" :key="step">
        <div 
          class="flex items-center gap-2 transition-all duration-300"
          :class="store.currentStep >= step ? 'opacity-100' : 'opacity-40'"
        >
          <div 
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all"
            :class="store.currentStep === step ? 'bg-blue-600 text-white ring-2 ring-blue-500/20 shadow-md shadow-blue-500/20' : (store.currentStep > step ? 'bg-blue-600/10 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500')"
          >
            <Check v-if="store.currentStep > step" class="w-3 h-3" />
            <span v-else>{{ step }}</span>
          </div>
          <span class="text-[10px] font-black uppercase tracking-wider hidden md:block" :class="store.currentStep === step ? 'text-gray-900 dark:text-white' : 'text-gray-400'">
            {{ step === 1 ? 'Connection' : (step === 2 ? 'Configuration' : 'Execution') }}
          </span>
        </div>
        <div v-if="step < totalSteps" class="w-8 h-0.5 rounded-full" :class="store.currentStep > step ? 'bg-blue-600/30' : 'bg-gray-100 dark:bg-gray-800'"></div>
      </template>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar bg-white dark:bg-gray-950">
      
      <!-- STEP 1: Input Connection Details -->
      <div v-if="store.currentStep === SetupStep.INPUT" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <!-- Shared Connection Form -->
         <div class="grid grid-cols-2 gap-x-8 gap-y-6">
            <div class="col-span-2 space-y-2">
              <label class="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.connectionName') }}</label>
              <input v-model="connectionName" @focus="selectAll" type="text" class="form-input" placeholder="e.g. Production Master" />
            </div>

            <div class="col-span-2 h-px bg-gray-100 dark:bg-gray-800/50 my-2"></div>

            <div class="space-y-2">
               <label class="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.host') }}</label>
               <input v-model="store.adminCredentials.host" @focus="selectAll" type="text" class="form-input" placeholder="localhost" />
            </div>
            <div class="space-y-2">
               <label class="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.port') }}</label>
               <input v-model.number="store.adminCredentials.port" @focus="selectAll" type="number" class="form-input" placeholder="3306" />
            </div>
            <div class="col-span-2 space-y-2">
               <label class="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.database') }}</label>
               <input v-model="store.adminCredentials.database" @focus="selectAll" type="text" class="form-input" placeholder="database_name" />
            </div>
            
             <div v-if="!reconfigureMode" class="col-span-2 h-px bg-gray-100 dark:bg-gray-800/50 my-2"></div>

             <div v-if="!reconfigureMode" class="col-span-2 space-y-2">
                <label class="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{{ $t('restrictedUserSetup.restrictedUsername.label') }}</label>
                <input v-model="store.restrictedUser.username" @focus="selectAll" type="text" class="form-input" placeholder="the_andb" />
                <p class="text-[10px] text-gray-500 dark:text-gray-400 ml-1 italic leading-relaxed">
                  {{ $t('restrictedUserSetup.description') }}
                </p>
             </div>

            <!-- SSH TUNNEL SECTION -->
            <div class="col-span-2 pt-4">
              <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <ShieldCheck class="w-4 h-4 text-emerald-500" />
                  <span class="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">SSH Tunnel (Optional)</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer group">
                  <input type="checkbox" v-model="store.adminCredentials.ssh.enabled" class="sr-only peer">
                  <div class="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                  <div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                </label>
              </div>

              <div v-if="store.adminCredentials.ssh.enabled" class="grid grid-cols-2 gap-x-8 gap-y-6 animate-in slide-in-from-top-2 duration-300 mb-6">
                <div class="space-y-2">
                  <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SSH Host</label>
                  <input v-model="store.adminCredentials.ssh.host" @focus="selectAll" type="text" class="form-input" placeholder="ssh.example.com" />
                </div>
                <div class="space-y-2">
                  <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SSH Port</label>
                  <input v-model.number="store.adminCredentials.ssh.port" @focus="selectAll" type="number" class="form-input" placeholder="22" />
                </div>
                <div class="space-y-2">
                  <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SSH User</label>
                  <input v-model="store.adminCredentials.ssh.username" @focus="selectAll" type="text" class="form-input" placeholder="root" />
                </div>
                <div class="space-y-2">
                  <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SSH Private Key</label>
                  <div class="relative">
                    <input v-model="store.adminCredentials.ssh.privateKeyPath" @focus="selectAll" type="text" class="form-input pr-10" placeholder="~/.ssh/id_rsa" />
                    <button @click="pickSshKey" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500">
                      <FolderOpen class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p v-if="sshKeyWarning" class="col-span-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800 animate-in fade-in slide-in-from-top-1">
                  <ShieldQuestion class="w-3 h-3 shrink-0 mt-0.5" />
                  {{ sshKeyWarning }}
                </p>
              </div>
            </div>
         </div>
      </div>

      <!-- STEP 2: Configuration (Capabilities + Strategy) -->
      <div v-if="store.currentStep === SetupStep.CONFIG" class="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
          
          <!-- 1. Access Capabilities -->
          <div class="space-y-6">
            <div class="flex items-baseline justify-between">
              <h3 class="font-black text-gray-900 dark:text-white text-lg">1. Access Capabilities</h3>
              <span class="text-xs font-bold px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400">
                {{ securityLevelLabel }}
              </span>
            </div>
          
            <div class="space-y-3">
              <!-- Read Only (Locked) -->
              <div class="flex items-center justify-between p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 opacity-80 cursor-not-allowed">
                  <div class="flex items-center gap-4">
                      <div class="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                          <Eye class="w-5 h-5" />
                      </div>
                      <div>
                          <div class="flex items-center gap-2">
                              <span class="text-sm font-bold text-gray-900 dark:text-white">Read-Only Core</span>
                              <span class="text-xs font-black px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 uppercase">Mandatory</span>
                          </div>
                          <p class="text-xs text-gray-500 mt-1">Reads all schema definitions: Tables, Views, Procedures, Functions, Triggers, and Events — without modifying data.</p>
                      </div>
                  </div>
                  <div class="relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-emerald-500">
                      <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-4"></span>
                  </div>
              </div>

              <!-- Write/Alter -->
              <label class="flex items-center justify-between p-5 rounded-xl border-2 transition-all cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  :class="store.permissions.writeAlter ? 'border-indigo-500 bg-indigo-50/10' : 'border-gray-200 dark:border-gray-700'">
                  <div class="flex items-center gap-4">
                      <div class="p-2 rounded-lg transition-colors" :class="store.permissions.writeAlter ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'">
                          <FileCode2 class="w-5 h-5" />
                      </div>
                      <div>
                          <span class="text-sm font-bold text-gray-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Schema Change Support (ALTER TABLE)</span>
                          <p class="text-xs text-gray-500 mt-1">Allow TheAndb to suggest and apply table modifications for synchronization.</p>
                      </div>
                  </div>
                  <input type="checkbox" v-model="store.permissions.writeAlter" class="sr-only" />
                  <div class="w-10 h-6 rounded-full transition-colors flex items-center p-1" :class="store.permissions.writeAlter ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'">
                      <div class="w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform" :class="store.permissions.writeAlter ? 'translate-x-4' : 'translate-x-0'"></div>
                  </div>
              </label>

              <!-- View Management -->
              <label class="flex items-center justify-between p-5 rounded-xl border-2 transition-all cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  :class="store.permissions.writeView ? 'border-purple-500 bg-purple-50/10' : 'border-gray-200 dark:border-gray-700'">
                  <div class="flex items-center gap-4">
                      <div class="p-2 rounded-lg transition-colors" :class="store.permissions.writeView ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'">
                          <Layers class="w-5 h-5" />
                      </div>
                      <div>
                          <span class="text-sm font-bold text-gray-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">View Management</span>
                          <p class="text-xs text-gray-500 mt-1">Allow updating view definitions when differences are detected across environments.</p>
                      </div>
                  </div>
                  <input type="checkbox" v-model="store.permissions.writeView" class="sr-only" />
                  <div class="w-10 h-6 rounded-full transition-colors flex items-center p-1" :class="store.permissions.writeView ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'">
                      <div class="w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform" :class="store.permissions.writeView ? 'translate-x-4' : 'translate-x-0'"></div>
                  </div>
              </label>

              <!-- Routine Management -->
              <label class="flex items-center justify-between p-5 rounded-xl border-2 transition-all cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  :class="store.permissions.writeRoutine ? 'border-pink-500 bg-pink-50/10' : 'border-gray-200 dark:border-gray-700'">
                  <div class="flex items-center gap-4">
                      <div class="p-2 rounded-lg transition-colors" :class="store.permissions.writeRoutine ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'">
                          <Workflow class="w-5 h-5" />
                      </div>
                      <div>
                          <span class="text-sm font-bold text-gray-900 dark:text-white block group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Routine Management</span>
                          <p class="text-xs text-gray-500 mt-1">Allow updating Stored Procedures and Functions to ensure consistent business logic.</p>
                      </div>
                  </div>
                  <input type="checkbox" v-model="store.permissions.writeRoutine" class="sr-only" />
                  <div class="w-10 h-6 rounded-full transition-colors flex items-center p-1" :class="store.permissions.writeRoutine ? 'bg-pink-500' : 'bg-gray-200 dark:bg-gray-700'">
                      <div class="w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform" :class="store.permissions.writeRoutine ? 'translate-x-4' : 'translate-x-0'"></div>
                  </div>
              </label>
            </div>
          </div>

          <div class="h-px bg-gray-100 dark:bg-gray-800"></div>

          <!-- 2. Setup Strategy -->
          <div class="space-y-6">
            <h3 class="font-black text-gray-900 dark:text-white text-lg">2. Setup Strategy</h3>
            <div class="grid grid-cols-2 gap-6">
                <!-- Automatic Mode -->
                <button 
                  @click="store.setupMode = 'auto'"
                  class="relative p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-4 group"
                  :class="store.setupMode === 'auto' 
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 ring-4 ring-blue-500/10' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700'"
                >
                  <div class="flex items-center justify-between w-full">
                    <div class="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Wand2 class="w-6 h-6" />
                    </div>
                    <div v-if="store.setupMode === 'auto'" class="w-5 h-5 rounded-full bg-blue-500 shadow-sm ring-2 ring-white dark:ring-gray-900 flex items-center justify-center">
                        <Check class="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 class="font-black text-base text-gray-900 dark:text-white mb-2">Automatic Setup</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      TheAndb will execute the configuration for you immediately.
                    </p>
                    <div class="mt-4 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded inline-block">
                        RECOMMENDED
                    </div>
                  </div>
                </button>

                <!-- Manual Mode -->
                <button 
                  @click="store.setupMode = 'manual'"
                  class="relative p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-4 group"
                  :class="store.setupMode === 'manual' 
                    ? 'bg-gray-50 dark:bg-gray-800 border-gray-900 dark:border-gray-400 ring-4 ring-gray-500/10' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                >
                  <div class="flex items-center justify-between w-full">
                    <div class="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      <Terminal class="w-6 h-6" />
                    </div>
                    <div v-if="store.setupMode === 'manual'" class="w-5 h-5 rounded-full bg-gray-900 dark:bg-white shadow-sm ring-2 ring-white dark:ring-gray-900 flex items-center justify-center">
                        <Check class="w-3 h-3 text-white dark:text-black" />
                    </div>
                  </div>
                  <div>
                    <h4 class="font-black text-base text-gray-900 dark:text-white mb-2">Manual Setup</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      We generate the SQL script for you to review and run yourself.
                    </p>
                  </div>
                </button>
            </div>

            <!-- Security Warning -->
            <div v-if="store.setupMode === 'auto'" class="p-5 bg-blue-50 dark:bg-gray-900 border border-blue-200 dark:border-blue-500/30 rounded-xl flex items-start gap-4 animate-in fade-in zoom-in duration-300">
                <ShieldCheck class="w-6 h-6 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                <div class="space-y-2">
                <p class="text-xs text-blue-800 dark:text-blue-100 leading-relaxed font-medium">
                  <strong class="text-blue-900 dark:text-blue-300 block mb-1">Volatile Memory Processing:</strong>
                  Admin credentials provided are processed <strong>strictly in memory</strong> and are <strong>wiped immediately</strong> after setup.
                </p>
                </div>
            </div>
          </div>

          <div class="h-px bg-gray-100 dark:bg-gray-800"></div>

          <!-- 3. Admin Authentication (Required for Automatic Setup or Reconfigure) -->
          <div v-if="reconfigureMode || store.setupMode === 'auto'" class="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 class="font-black text-gray-900 dark:text-white text-lg">
              3. Admin Authentication
            </h3>
            <div class="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl flex items-start gap-2.5">
               <Info class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
               <p class="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                 <template v-if="reconfigureMode">
                   {{ $t('restrictedUserSetup.reconfigure.adminNote', { username: store.restrictedUser.username }) }}
                 </template>
                 <template v-else>
                   Admin credentials are required to create the restricted user. They are used only for this step and are <strong>not saved</strong>.
                 </template>
               </p>
            </div>
            <div class="grid grid-cols-2 gap-x-8 gap-y-6">
                <div class="space-y-2">
                  <label class="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.username') }} (Admin)</label>
                  <input v-model="store.adminCredentials.username" @focus="selectAll" type="text" class="form-input" placeholder="root" />
                </div>
                <div class="space-y-2">
                  <label class="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.password') }} (Admin)</label>
                  <div class="relative">
                    <input v-model="store.adminCredentials.password" @focus="selectAll" :type="showPass ? 'text' : 'password'" class="form-input pr-10" placeholder="••••••••" />
                    <button @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500">
                        <Eye v-if="!showPass" class="w-4 h-4" />
                        <EyeOff v-else class="w-4 h-4" />
                    </button>
                  </div>
                </div>
            </div>
          </div>
      </div>

      <!-- STEP 3: Execution (Review + Action + Verification) -->
      <div v-if="store.currentStep === SetupStep.EXECUTION" class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <!-- SQL Review Section -->
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div class="flex items-center justify-between mb-4">
                <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Terminal class="w-5 h-5 text-gray-500" />
                  Generated SQL Script
                </h4>
                <button @click="copyScript" class="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  <Copy class="w-3 h-3" /> Copy
                </button>
            </div>
            
            <div class="relative group">
                <div class="absolute right-3 top-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/5" @click="copyScript" title="Copy to clipboard">
                    <Copy class="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
                </div>
                <pre class="bg-gray-900 text-gray-300 p-5 rounded-2xl text-xs leading-relaxed font-mono overflow-x-auto border border-gray-800 shadow-inner custom-scrollbar max-h-48">{{ generatedScript }}</pre>
            </div>

            <div v-if="store.setupMode === 'auto' && !executionDone" class="mt-6">
                <button 
                  @click="startExecution"
                  :disabled="isExecuting"
                  class="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95 group disabled:opacity-50"
                >
                  <span v-if="isExecuting" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  <span v-else>Approve & Execute Configuration</span>
                  <Check v-if="!isExecuting" class="w-4 h-4 group-hover:scale-125 transition-transform" />
                </button>
                <p class="text-[10px] text-gray-400 text-center mt-3">By clicking above, you authorize TheAndb to execute these commands using the provided admin credentials.</p>
            </div>
            
            <div v-if="store.setupMode === 'manual'" class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-3">
                <Info class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p class="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                  Please execute the script above on your database server manually. Once finished, run the verification suite below to confirm connection.
                </p>
            </div>
          </div>

          <!-- Logs & Verification Section -->
          <div v-if="isExecuting || executionDone || store.setupMode === 'manual'" class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            
            <!-- Logs Terminal (Only for Auto) -->
            <div v-if="store.setupMode === 'auto'" class="space-y-3">
              <h5 class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Execution Status</h5>
              <div class="bg-black/90 rounded-2xl p-4 font-mono text-[10px] h-64 overflow-y-auto border border-gray-800 shadow-inner custom-scrollbar">
                <div v-for="(log, i) in store.executionLogs" :key="i" class="text-gray-300 mb-1 break-all">
                  <span class="text-gray-600 mr-2">[{{ new Date().toLocaleTimeString() }}]</span>
                  <span :class="log.includes('Error') ? 'text-red-400' : 'text-gray-300'">> {{ log }}</span>
                </div>
                <div v-if="isExecuting" class="animate-pulse text-primary-400 mt-2">_</div>
              </div>
            </div>

            <!-- Verification Suite -->
            <div class="space-y-3" :class="store.setupMode === 'manual' ? 'md:col-span-2' : ''">
              <div class="flex items-center justify-between ml-1">
                <h5 class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Suite</h5>
                <button 
                  v-if="store.setupMode === 'manual' || executionDone"
                  @click="performVerification" 
                  :disabled="isVerifying"
                  class="text-[10px] font-black text-primary-600 hover:text-primary-500 uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <RefreshCw v-if="!isVerifying" class="w-3 h-3" />
                  <span v-else class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></span>
                  Re-Verify
                </button>
              </div>

              <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
                <!-- Check 1: Connection -->
                <div class="p-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500">
                          <Plug class="w-3.5 h-3.5" />
                      </div>
                      <span class="text-xs font-bold text-gray-700 dark:text-gray-300">Connection</span>
                    </div>
                    <div>
                      <span v-if="store.verificationResults.baseConn === 'pass'" class="text-[10px] font-black text-green-500 uppercase">Passed</span>
                      <span v-else-if="store.verificationResults.baseConn === 'fail'" class="text-[10px] font-black text-red-500 uppercase">Failed</span>
                      <span v-else class="text-[10px] font-black text-gray-300 uppercase">Pending</span>
                    </div>
                </div>

                <!-- Check 2: Schema -->
                <div class="p-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500">
                          <Search class="w-3.5 h-3.5" />
                      </div>
                      <span class="text-xs font-bold text-gray-700 dark:text-gray-300">Introspection</span>
                    </div>
                    <div>
                      <span v-if="store.verificationResults.schemaRead === 'pass'" class="text-[10px] font-black text-green-500 uppercase">Passed</span>
                      <span v-else-if="store.verificationResults.schemaRead === 'fail'" class="text-[10px] font-black text-red-500 uppercase">Failed</span>
                      <span v-else class="text-[10px] font-black text-gray-300 uppercase">Pending</span>
                    </div>
                </div>

                <!-- Check 3: Boundaries -->
                <div class="p-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500">
                          <ShieldBan class="w-3.5 h-3.5" />
                      </div>
                      <span class="text-xs font-bold text-gray-700 dark:text-gray-300">Safety Guard</span>
                    </div>
                    <div>
                      <span v-if="store.verificationResults.sandboxTest === 'pass'" class="text-[10px] font-black text-green-500 uppercase">Active</span>
                      <span v-else-if="store.verificationResults.sandboxTest === 'fail'" class="text-[10px] font-black text-red-500 uppercase">Bypassed</span>
                      <span v-else class="text-[10px] font-black text-gray-300 uppercase">Pending</span>
                    </div>
                </div>
              </div>

              <div v-if="verificationDone && !allChecksPassed" class="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                 <p class="text-[10px] text-red-600 dark:text-red-400 font-bold leading-tight">
                   Verification failed. Please check if the script was executed correctly and the user has required permissions.
                 </p>
              </div>
            </div>
          </div>
      </div>
    </div>

    <!-- Actions Footer -->
    <div class="px-8 py-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white dark:bg-gray-950">
      <button 
        @click="prev"
        v-if="store.currentStep > 1"
        class="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
      >
        {{ $t('common.back') }}
      </button>
      <div v-else></div>

      <div class="flex items-center gap-6">
        <button 
          @click="$emit('cancel')"
          class="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white"
        >
          CANCEL
        </button>
        
        <button 
          @click="handlePrimaryNext"
          v-if="store.currentStep < totalSteps"
          :disabled="!canContinue || isAdminTesting"
          class="flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none group"
          :class="[
            currentActionIsTest ? (
              adminTestResult === 'pass' ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' :
              adminTestResult === 'fail' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' :
              'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            ) : 'bg-gray-700 text-white hover:bg-gray-600'
          ]"
        >
          <span v-if="isAdminTesting" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          <template v-else>
            <span v-if="currentActionIsTest">
              {{ adminTestResult === 'pass' ? 'NEXT' : (adminTestResult === 'fail' ? 'RETRY VERIFICATION' : 'VERIFY & NEXT') }}
            </span>
            <span v-else>NEXT</span>
            
            <component :is="primaryNextIcon" class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </template>
        </button>

        <button 
          @click="complete"
          v-if="store.currentStep === totalSteps"
          :disabled="!verificationDone"
          class="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-blue-500/20"
        >
          FINISH & CONNECT
          <Check class="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  ShieldCheck, Check, Info, Eye, EyeOff, Terminal, 
  Copy, ChevronRight, ShieldBan, Search, Plug, Layers, Workflow, FileCode2,
  ShieldQuestion, X, FolderOpen, RefreshCw, Wand2
} from 'lucide-vue-next'
import { useSetupStepsStore, SetupStep } from '@/stores/setupSteps'
import { Andb } from '@/utils/andb'

const props = defineProps<{
  initialData?: any
  reconfigureMode?: boolean
}>()

const { t: $t } = useI18n()
const store = useSetupStepsStore()

const showPass = ref(false)
const isExecuting = ref(false)
const executionDone = ref(false)
const isVerifying = ref(false)
const verificationDone = ref(false)
const isAdminTesting = ref(false)
const adminTestResult = ref<'idle' | 'pass' | 'fail'>('idle')
const sshKeyWarning = ref('')

// Local form state
const connectionName = ref('')
const productSettings = ref({
  domain: '',
  emailServer: ''
})

watch([() => store.adminCredentials, connectionName], () => {
  adminTestResult.value = 'idle'
}, { deep: true })



const selectAll = (event: FocusEvent) => {
  if (event.target instanceof HTMLInputElement) {
    event.target.select()
  }
}

onMounted(() => {
  store.reset()
  
  // Set helpful defaults for new connections
  store.adminCredentials.host = 'localhost'
  store.adminCredentials.port = 3306
  store.adminCredentials.username = 'root' 

  // Generate a random 16-character alphanumeric password for the RESTRICTED user
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let pass = ""
  for (let i = 0; i < 16; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  store.restrictedUser.password = pass
  
  if (props.reconfigureMode) {
    store.adminCredentials.username = 'root' // Still needed for reconfigure
    store.currentStep = SetupStep.CONFIG
  }

  if (props.initialData) {
    if (props.initialData.name) connectionName.value = props.initialData.name
    if (props.initialData.host) store.adminCredentials.host = props.initialData.host
    if (props.initialData.port) store.adminCredentials.port = props.initialData.port
    if (props.initialData.database) store.adminCredentials.database = props.initialData.database
    if (props.initialData.username) store.adminCredentials.username = (props.reconfigureMode ? 'root' : props.initialData.username)
    
    // Pre-fill restricted user username if editing/duplicating
    if (!props.reconfigureMode && props.initialData.username) {
        store.restrictedUser.username = props.initialData.username
    }

    // Pre-fill permissions if available
    if (props.initialData.permissions) {
      store.permissions = { ...props.initialData.permissions }
    }

    if (props.initialData.productSettings) {
      productSettings.value = { ...props.initialData.productSettings }
    }
  }
})

const emit = defineEmits(['cancel', 'complete'])

const totalSteps = computed(() => SetupStep.EXECUTION)

const securityLevelLabel = computed(() => {
  if (store.permissions.writeAlter && store.permissions.writeView && store.permissions.writeRoutine) return 'Advanced'
  if (store.permissions.writeAlter) return 'Standard'
  return 'Read-Only'
})

const activeLevel = computed(() => {
  let level = 1
  if (store.permissions.writeAlter) level = 2
  if (store.permissions.writeView || store.permissions.writeRoutine) level = 3
  return level
})

// Used for logging
const levelName = computed(() => {
  if (activeLevel.value === 1) return $t('restrictedUserSetup.levels.readonly')
  if (activeLevel.value === 2) return $t('restrictedUserSetup.levels.alter')
  return $t('restrictedUserSetup.levels.full')
})

const canContinue = computed(() => {
  // Step 1: Input Verification (No longer needs Admin U/P)
  if (store.currentStep === SetupStep.INPUT) {
      return !!(connectionName.value &&
             store.adminCredentials.host && 
             store.adminCredentials.port &&
             store.adminCredentials.database &&
             store.restrictedUser.username)
  }

  // Step 2: Config Verification (Admin Auth needed ONLY for Automatic Setup or Reconfigure)
  if (store.currentStep === SetupStep.CONFIG) {
    if (!store.setupMode) return false
    
    // Admin credentials required for Automatic/Reconfigure
    if (props.reconfigureMode || store.setupMode === 'auto') {
      return !!(store.adminCredentials.username && store.adminCredentials.password)
    }
    
    return true
  }

  // Step 3: Execution (Final)
  if (store.currentStep === SetupStep.EXECUTION) {
      return verificationDone.value
  }

  return true
})

const allChecksPassed = computed(() => {
  return store.verificationResults.baseConn === 'pass' && 
         store.verificationResults.schemaRead === 'pass' &&
         store.verificationResults.sandboxTest === 'pass'
})

const currentActionIsTest = computed(() => {
  // Step 1 is now just information, no test
  if (store.currentStep === SetupStep.INPUT) return false
  
  // Step 2 is a test step ONLY if we have admin credentials to test
  if (store.currentStep === SetupStep.CONFIG) {
    return props.reconfigureMode || store.setupMode === 'auto'
  }
  
  return false
})

const primaryNextIcon = computed(() => {
  if (!currentActionIsTest.value) return ChevronRight
  if (isAdminTesting.value) return null // Handled by spinner
  if (adminTestResult.value === 'pass') return Check
  if (adminTestResult.value === 'fail') return X
  return ShieldQuestion
})

const handlePrimaryNext = async () => {
  if (currentActionIsTest.value && adminTestResult.value !== 'pass') {
    const result = await testAdminConnection()
    if (result && result.success) {
      await next()
    }
    return
  }
  await next()
}

const generatedScript = ref('')

const testAdminConnection = async () => {
  if (isAdminTesting.value) return null
  isAdminTesting.value = true
  adminTestResult.value = 'idle'
  
  try {
    const result = await Andb.testConnection({
      host: store.adminCredentials.host,
      port: store.adminCredentials.port,
      database: store.adminCredentials.database,
      username: store.adminCredentials.username,
      password: store.adminCredentials.password,
      ssh: store.adminCredentials.ssh,
      id: 'temp-test',
      name: 'Temp Test',
      status: 'testing',
      environment: 'DEV'
    })
    adminTestResult.value = result.success ? 'pass' : 'fail'
    return result
  } catch (e) {
    adminTestResult.value = 'fail'
    return { success: false }
  } finally {
    isAdminTesting.value = false
  }
}

const next = async () => {
  if (store.currentStep < totalSteps.value) {
    store.currentStep++
    
    // Check if we just entered the "Execution" step
    const isExecutionStep = store.currentStep === SetupStep.EXECUTION

    if (isExecutionStep) {
      try {
        generatedScript.value = 'Generating script...'
        const script = await Andb.generateUserSetupScript({
          adminConnection: JSON.parse(JSON.stringify(store.adminCredentials)),
          restrictedUser: {
              username: store.restrictedUser.username,
              password: store.restrictedUser.password
          },
          permissions: store.permissions,
          isReconfigure: props.reconfigureMode
        })
        generatedScript.value = script
      } catch (e: any) {
        generatedScript.value = `-- Error generating script: ${e.message}`
      }
    }
  }
}

const prev = () => {
  if (store.currentStep > SetupStep.INPUT) store.currentStep--
}

const startExecution = async () => {
  isExecuting.value = true
  store.executionLogs = []
  
  const addLog = (msg: string) => {
    store.executionLogs.push(msg)
  }

  try {
    verificationDone.value = false
    executionDone.value = false
    addLog($t('restrictedUserSetup.execution.running'))
    
    addLog($t('restrictedUserSetup.logs.connecting', { host: store.adminCredentials.host, user: store.adminCredentials.username }))
    const testAdmin = await Andb.testConnection({
      host: store.adminCredentials.host,
      port: store.adminCredentials.port,
      database: store.adminCredentials.database,
      username: store.adminCredentials.username,
      password: store.adminCredentials.password,
      id: 'temp-admin',
      name: 'Temp Admin',
      status: 'testing',
      environment: 'DEV'
    })

    if (!testAdmin || !testAdmin.success) throw new Error('Admin connection failed. Please check credentials.')
    addLog($t('restrictedUserSetup.logs.adminOk'))
    
    addLog($t('restrictedUserSetup.logs.creatingUser', { user: store.restrictedUser.username }))
    
    // Call the actual setup IPC
    await Andb.setupRestrictedUser({
      adminConnection: JSON.parse(JSON.stringify(store.adminCredentials)),
      restrictedUser: {
          username: store.restrictedUser.username,
          password: store.restrictedUser.password
      },
      permissions: store.permissions,
      script: generatedScript.value
    })
    
    addLog($t('restrictedUserSetup.logs.userOk'))
    addLog($t('restrictedUserSetup.logs.applyingPerms', { level: levelName.value }))
    addLog($t('restrictedUserSetup.logs.permsOk'))
    addLog($t('restrictedUserSetup.logs.discardingAdmin'))
    store.adminCredentials.password = '' // Wipe from store
    
    addLog($t('restrictedUserSetup.logs.done'))
    executionDone.value = true

    // AUTOMATIC VERIFICATION after successful execution
    addLog('Starting verification suite...')
    await performVerification()
  } catch (err: any) {
    addLog(`ERROR: ${err.message}`)
  } finally {
    isExecuting.value = false
  }
}

// Verification for Manual Mode (can be re-triggered)
const performVerification = async () => {
  isVerifying.value = true
  verificationDone.value = false
  
  // Reset results
  store.verificationResults = { baseConn: 'idle', schemaRead: 'idle', sandboxTest: 'idle' }
  
  try {
    const restrictedConn = {
      host: store.adminCredentials.host,
      port: store.adminCredentials.port,
      database: store.adminCredentials.database,
      username: store.restrictedUser.username,
      password: store.restrictedUser.password,
      id: 'temp-restricted',
      name: 'Temp Restricted',
      status: 'idle' as const,
      environment: 'DEV' as const
    }

    // Probing via backend
    const probeResults = await Andb.probeRestrictedUser({
      connection: restrictedConn,
      permissions: store.permissions
    })

    store.verificationResults = {
      baseConn: probeResults.baseConn,
      schemaRead: probeResults.schemaRead,
      sandboxTest: probeResults.sandboxTest
    }

    if (store.verificationResults.baseConn === 'pass' && 
        store.verificationResults.schemaRead === 'pass') {
      verificationDone.value = true
    }

  } catch (err) {
    console.error(err)
    store.verificationResults.baseConn = 'fail'
  } finally {
    isVerifying.value = false
  }
}


const pickSshKey = async () => {
  if ((window as any).electronAPI?.pickFile) {
    const path = await (window as any).electronAPI.pickFile({
      title: 'Select SSH Private Key',
      filters: [
        { name: 'Keys', extensions: ['pem', 'key', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (path) {
      store.adminCredentials.ssh.privateKeyPath = path
      // Check permissions for security warning
      try {
        const check = await (window as any).electronAPI.invoke('check-file-permissions', path)
        if (check.success && check.isTooOpen) {
          sshKeyWarning.value = `Security Warning: Permissions for this key are too open (${check.mode}). SSH often rejects keys accessible by others. Run 'chmod 600 ${path}' to fix.`
        } else {
          sshKeyWarning.value = ''
        }
      } catch (e) {
        sshKeyWarning.value = ''
      }
    }
  }
}

const copyScript = () => {
  navigator.clipboard.writeText(generatedScript.value)
}

// Sub-component for Verification Suite to avoid duplication


const complete = () => {
    emit('complete', {
        name: connectionName.value,
        host: store.adminCredentials.host,
        port: store.adminCredentials.port,
        database: store.adminCredentials.database,
        type: 'mysql',
        username: store.restrictedUser.username,
        password: store.restrictedUser.password,
        permissions: { ...store.permissions },
        productSettings: productSettings.value
    })
}
</script>

<style scoped>
.form-input {
  @apply w-full px-4 py-3 text-sm 
    border border-gray-200 dark:border-gray-800
    rounded-xl 
    bg-gray-50 dark:bg-black 
    text-gray-900 dark:text-white 
    placeholder-gray-400 dark:placeholder-gray-600
    focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 
    transition-all outline-none font-bold;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  @apply bg-transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-700 rounded-full;
}
</style>
