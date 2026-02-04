import { defineStore } from 'pinia'
import { ref } from 'vue'

export enum SetupStep {
  STRATEGY = 1,
  CAPABILITIES = 2,
  INPUT = 3,
  ACTION = 4,
  VERIFICATION = 5
}

export const useSetupStepsStore = defineStore('setupSteps', () => {
  const currentStep = ref(1)
  const setupMode = ref<'auto' | 'manual'>('auto')

  const permissions = ref({
    read: true, // Mandatory
    writeAlter: false,
    writeView: false,
    writeRoutine: false
  })

  const adminCredentials = ref({
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: ''
  })

  const restrictedUser = ref({
    username: 'the_andb',
    password: ''
  })

  const executionLogs = ref<string[]>([])
  const verificationResults = ref<Record<string, 'pass' | 'fail' | 'idle'>>({
    baseConn: 'idle',
    schemaRead: 'idle',
    sandboxTest: 'idle'
  })

  function reset() {
    currentStep.value = 1
    setupMode.value = 'auto'
    permissions.value = {
      read: true,
      writeAlter: false,
      writeView: false,
      writeRoutine: false
    }
    adminCredentials.value = {
      host: '',
      port: 3306,
      database: '',
      username: '',
      password: ''
    }
    restrictedUser.value = {
      username: 'the_andb',
      password: ''
    }
    executionLogs.value = []
    verificationResults.value = {
      baseConn: 'idle',
      schemaRead: 'idle',
      sandboxTest: 'idle'
    }
  }

  return {
    currentStep,
    setupMode,
    permissions,
    adminCredentials,
    restrictedUser,
    executionLogs,
    verificationResults,
    reset
  }
})
