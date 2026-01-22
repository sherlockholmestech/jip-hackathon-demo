<template>
  <div class="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
    
    <!-- Header -->
    <header class="h-16 border-b border-slate-700 flex items-center justify-between px-6 bg-slate-800/50 backdrop-blur">
      <h1 class="font-bold text-xl text-blue-400 truncate max-w-lg">{{ state?.topic || 'Classroom' }}</h1>
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-slate-500 uppercase tracking-widest">Understanding</span>
        <div class="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            class="h-full bg-green-500 transition-all duration-1000"
            :style="{ width: `${averageUnderstanding}%` }"
          ></div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col relative">
      
      <!-- Student Stage -->
      <div class="flex-1 flex items-end justify-center gap-4 pb-8 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
        <div 
          v-for="student in state?.students" 
          :key="student.id"
          class="relative group transition-all duration-500"
          :class="{ 'scale-110 -translate-y-4': speakingStudentId === student.id }"
        >
          <!-- Chat Bubble -->
          <div 
            v-if="studentMessages[student.id]"
            class="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 p-4 bg-white text-slate-900 rounded-2xl rounded-bl-none shadow-xl text-sm opacity-0 animate-pop-in"
            :class="{ 'opacity-100': studentMessages[student.id] }"
          >
            {{ studentMessages[student.id] }}
          </div>

          <!-- Avatar Card -->
          <div class="w-32 md:w-40 bg-slate-800 border border-slate-600 rounded-xl p-3 flex flex-col items-center gap-2 shadow-lg">
            <div class="text-5xl filter drop-shadow-md">{{ student.avatar }}</div>
            <div class="text-center">
              <div class="font-bold text-sm">{{ student.name }}</div>
              <!-- Persona description hidden for immersion -->
            </div>
            <!-- Individual Progress -->
            <div class="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
              <div 
                class="h-full transition-all duration-700"
                :class="getProgressColor(student.understanding)"
                :style="{ width: `${student.understanding}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Interaction Area -->
      <div class="h-auto bg-slate-900 border-t border-slate-700 p-4 pb-8">
        <div class="max-w-4xl mx-auto flex gap-4">
          <textarea 
            v-model="teacherInput"
            @keydown.enter.prevent="submitExplanation"
            placeholder="Explain the concept to the class..."
            class="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-24"
            :disabled="isThinking"
          ></textarea>
          <button 
            @click="submitExplanation"
            :disabled="!teacherInput.trim() || isThinking"
            class="px-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-colors flex flex-col items-center justify-center gap-1"
          >
            <span v-if="!isThinking">Teach</span>
            <span v-else class="animate-pulse">Thinking...</span>
          </button>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import confetti from 'canvas-confetti';

const state = useState<any>('classroom');
const teacherInput = ref("");
const isThinking = ref(false);
const studentMessages = ref<Record<string, string>>({});
const speakingStudentId = ref<string | null>(null);

const averageUnderstanding = computed(() => {
  if (!state.value?.students) return 0;
  const total = state.value.students.reduce((acc: number, s: any) => acc + s.understanding, 0);
  return Math.round(total / state.value.students.length);
});

const getProgressColor = (score: number) => {
  if (score < 40) return 'bg-red-500';
  if (score < 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

const submitExplanation = async () => {
  if (!teacherInput.value.trim()) return;
  
  const explanation = teacherInput.value;
  teacherInput.value = ""; // Clear input immediately
  isThinking.value = true;
  speakingStudentId.value = null;
  studentMessages.value = {}; // Clear old bubbles

  try {
    const { students: updates } = await $fetch('/api/chat', {
      method: 'POST',
      body: { 
        explanation, 
        students: state.value.students,
        topic: state.value.topic 
      }
    });

    // Update State & Show Responses
    updates.forEach((update: any) => {
      const studentIndex = state.value.students.findIndex((s: any) => s.id === update.id);
      if (studentIndex !== -1) {
        // Animate progress bar
        state.value.students[studentIndex].understanding = update.understanding;
        
        // Show bubble if they speak
        if (update.shouldSpeak && update.response) {
          studentMessages.value[update.id] = update.response;
          speakingStudentId.value = update.id;
        }
      }
    });

    // Win Condition
    if (averageUnderstanding.value >= 90) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      studentMessages.value['system'] = "Class Dismissed! Perfect Score!";
    }

  } catch (e) {
    console.error(e);
  } finally {
    isThinking.value = false;
  }
};

// Initial welcome message
onMounted(() => {
  if (!state.value) {
    navigateTo('/');
  }
});
</script>

<style>
@keyframes pop-in {
  0% { transform: translate(-50%, 20px) scale(0.9); opacity: 0; }
  100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
}
.animate-pop-in {
  animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
</style>
