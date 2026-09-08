const fs = require('fs');
const file = 'client/src/components/ai/components/AskAiPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

const target =             const highlightedLines = highlighted.split("\\n");
            const lineRows = highlightedLines.map((line, i) =>
              \<div class="flex w-max min-w-full"><span class="sticky left-0 z-10 shrink-0 w-14 pr-4 text-right select-none text-slate-400 bg-[#fafbfc] border-r border-slate-200 dark:text-zinc-600 dark:bg-[#111113] dark:border-white/5">\</span><span class="px-4 whitespace-pre">\</span></div>\
            ).join("");
            const finalHtml = \<pre class="text-[13px] py-4 !m-0 flex flex-col"><code class="font-mono hljs">\</code></pre>\;;

const replacement =             // Build line-numbered HTML (COMMENTED OUT FOR AI CHAT UI)
            /*
            const highlightedLines = highlighted.split("\\n");
            const lineRows = highlightedLines.map((line, i) =>
              \<div class="flex w-max min-w-full"><span class="sticky left-0 z-10 shrink-0 w-14 pr-4 text-right select-none text-slate-400 bg-[#fafbfc] border-r border-slate-200 dark:text-zinc-600 dark:bg-[#111113] dark:border-white/5">\</span><span class="px-4 whitespace-pre">\</span></div>\
            ).join("");
            */
            const finalHtml = \<pre class="text-[13px] py-4 px-4 !m-0 flex flex-col"><code class="font-mono hljs">\</code></pre>\;;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
