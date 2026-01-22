<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
    <div class="max-w-2xl w-full text-center space-y-8">
      
      <div class="space-y-2">
        <h1 class="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Feynman's Classroom
        </h1>
        <p class="text-slate-400 text-lg">
          Master any topic by teaching it to AI students who <i>think</i> they know better.
        </p>
      </div>

      <div 
        class="border-2 border-dashed border-slate-700 rounded-xl p-12 transition-all cursor-pointer hover:border-blue-500 hover:bg-slate-800/50"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input 
          type="file" 
          ref="fileInput" 
          class="hidden" 
          accept=".txt,.md,.pdf"
          @change="handleFileSelect"
        />
        
        <div v-if="!isProcessing" class="space-y-4">
          <div class="text-6xl">📄</div>
          <h3 class="text-xl font-semibold">Drop your notes here</h3>
          <p class="text-sm text-slate-500">Supports .txt, .md, .pdf</p>
        </div>

        <div v-else class="space-y-4">
          <div class="animate-spin text-4xl">🌀</div>
          <p class="text-blue-400">Reviewing your notes...</p>
        </div>
      </div>
      
      <!-- Mock Start Button for Demo Speed -->
      <button 
        v-if="!isProcessing"
        @click="startDemo"
        class="text-sm text-slate-600 underline hover:text-blue-400"
      >
        Or start a demo class (No file needed)
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
const fileInput = ref<HTMLInputElement | null>(null);
const isProcessing = ref(false);

const triggerFileInput = () => fileInput.value?.click();

const processFile = async (file: File) => {
  isProcessing.value = true;
  
  // Read file as text (simple version)
  const text = await file.text();
  
  try {
    const { data } = await useFetch('/api/init', {
      method: 'POST',
      body: { 
        fileContent: text,
        fileName: file.name,
        fileType: file.type
      }
    });
    
    // Store state in localStorage or Pinia (using useState for simplicity)
    const classroomState = useState('classroom', () => data.value);
    classroomState.value = data.value;
    
    router.push('/classroom');
  } catch (e) {
    alert("Failed to load class. Check console.");
    console.error(e);
    isProcessing.value = false;
  }
};

const handleFileSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (files?.length) processFile(files[0]);
};

const handleDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files;
  if (files?.length) processFile(files[0]);
};

const startDemo = async () => {
  isProcessing.value = true;
  // Send empty content to trigger mock/default response
  const { data } = await useFetch('/api/init', {
    method: 'POST',
    body: { fileContent: "", fileName: "demo.txt", fileType: "text/plain" }
  });
  
  const classroomState = useState('classroom', () => data.value);
  classroomState.value = data.value;
  
  router.push('/classroom');
};
</script>
