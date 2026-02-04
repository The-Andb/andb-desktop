<template>
  <div class="bg-background-dark font-display text-slate-300 min-h-screen h-screen flex flex-col overflow-hidden">
    <!-- Header Area -->
    <slot name="header" />

    <!-- Main Workspace -->
    <div class="flex flex-1 overflow-hidden">
       <!-- Sidebar (Conflict List) -->
       <slot name="sidebar" />

       <!-- Central Work Area -->
       <main class="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
          <slot />
       </main>
    </div>

    <!-- Status Bar -->
    <slot name="footer" />
  </div>
</template>
