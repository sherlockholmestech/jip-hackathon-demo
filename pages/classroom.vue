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
    <!-- Main Content Area: Chat Centric Layout -->
    <div class="flex-1 flex overflow-hidden">
      
      <!-- Left Sidebar: Concepts Taught -->
      <aside class="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-700 p-4">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Concepts Taught</h3>
        <div class="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-600">
           <div v-if="conceptsTaught.length === 0" class="text-sm text-slate-500 italic">
            Start teaching to track concepts.
          </div>
          <div 
            v-for="(concept, i) in conceptsTaught" 
            :key="i"
            class="text-sm text-slate-200 border-l-2 border-blue-500 pl-3 py-1 bg-slate-800/30 rounded-r"
          >
            {{ concept }}
          </div>
        </div>
      </aside>

      <!-- Center: Chat & Input -->
      <main class="flex-1 flex flex-col relative w-full bg-slate-900">
        
        <!-- Student Deck (Persistent Top Row) -->
        <div class="h-auto py-4 px-6 bg-slate-800/50 border-b border-slate-700 flex justify-center gap-4 shrink-0 overflow-x-auto">
          <div 
            v-for="student in state?.students" 
            :key="student.id"
            class="flex flex-col items-center gap-1 min-w-[80px]"
          >
            <div class="text-3xl filter drop-shadow-md relative">
              {{ student.avatar }}
              <!-- Progress Indicator ring/bar could go here -->
            </div>
            <div class="text-[10px] font-bold text-center text-slate-300 truncate w-20">{{ student.name }}</div>
            <div class="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  class="h-full transition-all duration-700"
                  :class="getProgressColor(student.understanding)"
                  :style="{ width: `${student.understanding}%` }"
                ></div>
            </div>
          </div>
        </div>

        <!-- Chat History (Main View) -->
        <div 
          class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scroll-smooth"
          ref="chatContainer"
        >
          <div v-if="classHistory.length === 0" class="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
            <div class="text-6xl grayscale opacity-20">🎓</div>
            <div class="text-lg">The class is in session.</div>
          </div>
          
          <div 
             v-for="(msg, i) in classHistory" 
             :key="i"
             class="flex flex-col gap-1 max-w-3xl mx-auto w-full"
             :class="msg.role === 'teacher' ? 'items-end' : 'items-start'"
          >
             <div class="flex items-center gap-2 mb-1">
               <span class="text-xs font-bold text-slate-400">
                 {{ msg.role === 'teacher' ? 'You' : msg.name }}
               </span>
             </div>
             <div 
               class="p-4 rounded-2xl shadow-sm text-sm leading-relaxed max-w-[90%]"
               :class="msg.role === 'teacher' 
                 ? 'bg-blue-600 text-white rounded-tr-none' 
                 : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'"
             >
               {{ msg.content }}
             </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="p-4 bg-slate-900 border-t border-slate-700">
          <div class="max-w-3xl mx-auto flex gap-4">
            <textarea 
              v-model="teacherInput"
              @keydown.enter.prevent="submitExplanation"
              placeholder="Explain the concept to the class..."
              class="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-20 shadow-inner"
              :disabled="isThinking"
            ></textarea>
            <button 
              @click="submitExplanation"
              :disabled="!teacherInput.trim() || isThinking"
              class="px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-colors flex flex-col items-center justify-center gap-1 shadow-lg"
            >
              <span v-if="!isThinking">Teach</span>
              <span v-else class="animate-pulse">...</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import confetti from 'canvas-confetti';

const state = useState<any>('classroom');
const teacherInput = ref("");
const isThinking = ref(false);
const conceptsTaught = ref<string[]>([]);
const classHistory = ref<{ role: 'teacher' | 'student'; content: string; name?: string }[]>([]);
const chatContainer = ref<HTMLElement | null>(null);

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

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const submitExplanation = async () => {
  if (!teacherInput.value.trim()) return;
  
  const explanation = teacherInput.value;
  // Add to history
  classHistory.value.push({ role: 'teacher', content: explanation });
  scrollToBottom();

  teacherInput.value = ""; // Clear input immediately
  isThinking.value = true;

  try {
    const data = await $fetch<any>('/api/chat', {
      method: 'POST',
      body: { 
        explanation, 
        students: state.value.students,
        topic: state.value.topic 
      }
    });

    const updates = data.students;
    const newConcept = data.taught_concept;

    if (newConcept) {
      conceptsTaught.value.push(newConcept);
    }

    // Update State & Show Responses
    updates.forEach((update: any) => {
      const studentIndex = state.value.students.findIndex((s: any) => s.id === update.id);
      if (studentIndex !== -1) {
        const student = state.value.students[studentIndex];
        // Animate progress bar
        student.understanding = update.understanding;
        
        // Add to history if they speak
        if (update.shouldSpeak && update.response) {
          classHistory.value.push({ 
            role: 'student', 
            content: update.response,
            name: student.name 
          });
        }
      }
    });
    
    scrollToBottom();

    // Win Condition
    if (averageUnderstanding.value >= 90) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      classHistory.value.push({ role: 'student', content: "Class Dismissed! Perfect Score!", name: "System" });
      scrollToBottom();
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
