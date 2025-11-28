export interface DesignPreferences {
  theme: 'dark' | 'light';
  defaultStyles: {
    background: string;
    text: string;
    accent: string;
  };
  htmlBoilerplate: string;
}

export const preferences: DesignPreferences = {
  theme: 'dark',
  defaultStyles: {
    background: 'bg-slate-950',
    text: 'text-slate-100',
    accent: 'text-blue-400',
  },
  htmlBoilerplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            arctic: {
              50: '#f0f9ff',
              100: '#e0f2fe',
              200: '#bae6fd',
              300: '#7dd3fc',
              400: '#38bdf8',
              500: '#0ea5e9',
              600: '#0284c7',
              700: '#0369a1',
              800: '#075985',
              900: '#0c4a6e',
            }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { font-family: 'Inter', sans-serif; }

    .glass {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .gradient-text {
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  {{CONTENT}}
</body>
</html>`,
};

export const guidelines = {
  always: [
    'Use dark mode (bg-slate-950, text-slate-100)',
    'Use Inter font family',
    'Use Arctic blue color palette for accents',
    'Use glass effect for cards/surfaces',
    'Use Tailwind CSS for styling',
  ],
  avoid: [
    'Light backgrounds (white, gray-100, etc.)',
    'High contrast borders on dark backgrounds',
    'System fonts without fallback',
  ],
  components: {
    card: 'glass rounded-xl p-4 border border-slate-700/50',
    button: 'px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors',
    input: 'glass rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500',
    heading: 'text-2xl font-bold gradient-text',
  },
};
