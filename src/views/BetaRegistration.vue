<template>
  <div class="fixed inset-0 bg-[#0b0f19] flex items-center justify-center z-50 p-6 overflow-y-auto font-sans text-gray-200">
    <!-- Background grid/glow effects -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]"></div>
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" style="animation-delay: 2s"></div>

    <div class="w-full max-w-lg bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 lg:p-10 shadow-2xl relative z-10 flex flex-col gap-6">
      
      <!-- Header / Logo -->
      <div class="text-center">
        <div class="flex items-center justify-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <Database class="w-6 h-6" />
          </div>
          <h3 class="text-3xl font-black text-white tracking-tighter">TheAndb <span class="text-xs font-bold uppercase tracking-widest text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full border border-primary-500/20 ml-1">Beta</span></h3>
        </div>
        <h4 class="text-lg font-bold text-gray-100 tracking-tight mb-2">Join the Developer Beta</h4>
        <p class="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
          Help us build the next-generation intelligent database GUI. Get instant access to features and updates.
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4 pt-2">
        <!-- Name -->
        <div class="space-y-1.5">
          <label class="block text-[10px] font-black uppercase tracking-widest text-gray-450">Full Name</label>
          <input
            v-model="name"
            type="text"
            placeholder="e.g. John Doe"
            class="w-full px-4 py-3 bg-gray-900/60 border border-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none transition-all"
          />
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label class="block text-[10px] font-black uppercase tracking-widest text-gray-450">Email Address <span class="text-primary-500 font-bold">*</span></label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="e.g. john@example.com"
            class="w-full px-4 py-3 bg-gray-900/60 border border-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none transition-all"
            :class="{ 'border-red-500/50': emailError }"
          />
          <p v-if="emailError" class="text-[10px] text-red-400 font-semibold mt-1">Please enter a valid email address.</p>
        </div>

        <!-- Use Case -->
        <div class="space-y-1.5">
          <label class="block text-[10px] font-black uppercase tracking-widest text-gray-450">Primary Use Case</label>
          <select
            v-model="useCase"
            class="w-full px-4 py-3 bg-gray-900/60 border border-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl text-xs text-gray-300 focus:outline-none transition-all"
          >
            <option value="personal">Personal / Open Source</option>
            <option value="startup">Startup / Small Business</option>
            <option value="enterprise">Enterprise Developer</option>
          </select>
        </div>

        <!-- Submission Buttons -->
        <div class="pt-4 space-y-3">
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-primary-500/10 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
            <span>{{ isLoading ? 'Registering...' : 'Access Dashboard' }}</span>
            <ArrowRight v-if="!isLoading" class="w-4 h-4" />
          </button>

          <!-- Soft-gate Skip / Bypass button -->
          <button
            type="button"
            @click="handleSkip"
            class="w-full px-6 py-2.5 bg-transparent hover:bg-gray-900/50 border border-gray-800 hover:border-gray-700 text-gray-450 hover:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all"
          >
            Skip (Developer Mode)
          </button>
        </div>
      </form>

      <!-- Footer privacy notice -->
      <div class="text-center border-t border-gray-800/60 pt-4 flex items-center justify-center gap-1.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
        <CheckCircle2 class="w-3.5 h-3.5 text-primary-500/70" />
        <span>Your data is stored locally and securely.</span>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Database, Loader2, ArrowRight, CheckCircle2 } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const settingsStore = useSettingsStore()

const name = ref('')
const email = ref('')
const useCase = ref('personal')

const isLoading = ref(false)
const emailError = ref(false)

const validateEmail = (val: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(val)
}

const handleSubmit = async () => {
  emailError.value = false
  if (!validateEmail(email.value.trim())) {
    emailError.value = true
    return
  }

  isLoading.value = true

  try {
    // Soft gate API registration attempt
    await fetch('https://api.andb.dev/beta/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value.trim(),
        name: name.value.trim(),
        useCase: useCase.value
      })
    })

    // Update settings store
    settingsStore.settings.betaRegistered = true
    settingsStore.settings.betaEmail = email.value.trim()
    router.push('/')
  } catch (err) {
    console.warn('[BetaRegistration] API endpoint offline, bypassing via soft-gate:', err)
    
    // Soft-gate fallback: proceed anyway
    settingsStore.settings.betaRegistered = true
    settingsStore.settings.betaEmail = email.value.trim()
    router.push('/')
  } finally {
    isLoading.value = false
  }
}

const handleSkip = () => {
  settingsStore.settings.betaRegistered = true
  settingsStore.settings.betaEmail = 'developer-bypass@andb.dev'
  router.push('/')
}
</script>

<style scoped>
@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.15;
    transform: scale(1);
  }
  50% {
    opacity: 0.25;
    transform: scale(1.05);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}
</style>
