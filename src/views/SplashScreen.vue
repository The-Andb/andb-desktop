<template>
  <div class="fixed inset-0 bg-primary-900 flex items-center justify-center z-50">
    <div class="text-center">
      <!-- Logo -->
      <div class="animate-pulse-slow mb-16">
        <div class="flex items-center justify-center gap-4 mb-4">
          <img 
            src="/icon.png" 
            alt="Andb Icon" 
            class="w-20 h-auto"
          />
          <h3 class="text-5xl font-black text-white tracking-tighter">The Andb</h3>
        </div>
        <p class="text-xl font-bold text-primary-100 tracking-tight opacity-80">Keep Going. Keep Syncing.</p>
      </div>
      <!-- Loading Bar -->
      <div class="w-64 h-1.5 bg-primary-800 rounded-full mx-auto mb-8 overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r from-primary-400 to-white rounded-full transition-all duration-300 animate-loading"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>

      <!-- Status Text -->
      <p class="text-sm text-primary-200 mb-12 animate-fade-in">
        {{ statusText }}
      </p>

      <!-- Version & Copyright -->
      <div class="absolute bottom-8 left-0 right-0 text-center space-y-2">
        <p class="text-xs text-primary-300 font-medium">
          Version {{ version }}
        </p>
        <div class="flex flex-col items-center justify-center space-y-1">
          <p class="text-xs text-primary-400 opacity-70">
            © 2024 - 2026 {{ author }}
          </p>
          <p class="text-[10px] text-primary-500 uppercase tracking-widest font-bold">
            DMCA Protected | Built for Engineers
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

// App metadata from package.json
const version = __APP_VERSION__
const author = 'The Andb'
const license = 'Proprietary'

// Loading state
const progress = ref(0)
const statusText = ref(t('splash.status.init'))

const statusMessages = [
  t('splash.status.init'),
  t('splash.status.loadingDrivers'),
  t('splash.status.checkingConnections'),
  t('splash.status.preparingWorkspace'),
  t('splash.status.ready')
]

onMounted(() => {
  if (import.meta.env.DEV) {
    router.push('/')
    return
  }
  // Simulate loading progress
  let currentStep = 0
  const interval = setInterval(() => {
    progress.value += 20
    
    if (currentStep < statusMessages.length) {
      statusText.value = statusMessages[currentStep]
      currentStep++
    }

    if (progress.value >= 100) {
      clearInterval(interval)
      // Navigate to main app after splash
      setTimeout(() => {
        router.push('/')
      }, 100)
    }
  }, 400)
})
</script>

<style scoped>
@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

.animate-loading {
  animation: loading 1.5s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-in;
}
</style>

