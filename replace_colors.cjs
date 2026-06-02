const fs = require('fs');
const path = require('path');

const directoryPath = '/home/mrak/Work/engineeros/frontend/src';

const replacements = [
  { regex: /text-\[#0F172A\]/g, replace: 'text-text-primary' },
  { regex: /text-\[#475569\]/g, replace: 'text-text-secondary' },
  { regex: /text-\[#64748B\]/g, replace: 'text-text-secondary' },
  { regex: /text-\[#94A3B8\]/g, replace: 'text-text-muted' },
  { regex: /text-\[#CBD5E1\]/g, replace: 'text-text-muted' },
  
  { regex: /bg-\[#FFFFFF\]/g, replace: 'bg-surface' },
  { regex: /bg-white/g, replace: 'bg-surface' },
  
  { regex: /bg-\[#F8F9FD\]/g, replace: 'bg-surface-muted' },
  { regex: /bg-\[#F1F5F9\]/g, replace: 'bg-surface-muted' },
  { regex: /bg-\[#E6E8EA\]/g, replace: 'bg-surface-muted' },
  { regex: /bg-\[#F8FAFC\]/g, replace: 'bg-surface-muted' },
  { regex: /bg-\[#FFFBEB\]/g, replace: 'bg-surface-muted' },
  { regex: /bg-\[#F5F3FF\]/g, replace: 'bg-surface-muted' },
  
  { regex: /border-\[#E2E8F0\]/g, replace: 'border-border-default' },
  { regex: /border-\[#F1F5F9\]/g, replace: 'border-border-default' },
  { regex: /border-\[#D1D5DB\]/g, replace: 'border-border-default' },
  { regex: /border-\[#CBD5E1\]/g, replace: 'border-border-hover' },
  
  { regex: /text-\[#5E43FB\]/g, replace: 'text-accent' },
  { regex: /text-\[#4C35D6\]/g, replace: 'text-accent' },
  { regex: /text-\[#9333EA\]/g, replace: 'text-accent' },
  { regex: /text-\[#0EA5E9\]/g, replace: 'text-accent' },
  { regex: /text-\[#F59E0B\]/g, replace: 'text-warning' },
  { regex: /text-\[#DC2626\]/g, replace: 'text-error' },
  { regex: /text-\[#BA1A1A\]/g, replace: 'text-error' },
  
  { regex: /bg-\[#5E43FB\]/g, replace: 'bg-accent' },
  { regex: /bg-\[#7C3AED\]/g, replace: 'bg-accent' },
  { regex: /bg-\[#6D28D9\]/g, replace: 'bg-accent hover:opacity-90' },
  
  { regex: /hover:border-\[#5E43FB\]/g, replace: 'hover:border-accent' },
  { regex: /hover:border-\[#0EA5E9\]/g, replace: 'hover:border-accent' },
  { regex: /hover:text-\[#5E43FB\]/g, replace: 'hover:text-accent' },
  
  { regex: /bg-\[#5E43FB\]\/10/g, replace: 'bg-accent/10' },
  { regex: /bg-\[#9333EA\]\/10/g, replace: 'bg-accent/10' },
  { regex: /bg-\[#0EA5E9\]\/10/g, replace: 'bg-accent/10' },
  { regex: /bg-\[#F59E0B\]\/10/g, replace: 'bg-warning/10' },
  { regex: /bg-\[#5E43FB\]\/5/g, replace: 'bg-accent/5' },
  
  { regex: /border-\[#5E43FB\]\/20/g, replace: 'border-accent/20' },
  { regex: /border-\[#9333EA\]\/20/g, replace: 'border-accent/20' },
  { regex: /border-\[#0EA5E9\]\/20/g, replace: 'border-accent/20' },
  { regex: /hover:border-\[#5E43FB\]\/20/g, replace: 'hover:border-accent/20' },
  { regex: /hover:border-\[#9333EA\]\/20/g, replace: 'hover:border-accent/20' },
  { regex: /hover:border-\[#0EA5E9\]\/20/g, replace: 'hover:border-accent/20' },
  { regex: /hover:border-\[#7C3AED\]/g, replace: 'hover:border-accent' },
  { regex: /hover:text-\[#7C3AED\]/g, replace: 'hover:text-accent' },
  
  { regex: /text-\[#1E293B\]/g, replace: 'text-text-primary' },
  { regex: /text-\[#334155\]/g, replace: 'text-text-secondary' },
  { regex: /border-\[#334155\]/g, replace: 'border-border-default' },
  { regex: /border-\[#1E293B\]/g, replace: 'border-border-default' },
  { regex: /bg-\[#0F172A\]/g, replace: 'bg-accent' },
  { regex: /hover:bg-black/g, replace: 'hover:bg-accent-muted' }
];

function processFile(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    replacements.forEach(({ regex, replace }) => {
      if (regex.test(content)) {
        content = content.replace(regex, replace);
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

processDirectory(directoryPath);
console.log('Done.');
