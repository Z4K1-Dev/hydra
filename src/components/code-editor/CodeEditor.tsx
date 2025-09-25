'use client';

import { useState, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Play, Save } from 'lucide-react';
import { toast } from 'sonner';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  readOnly?: boolean;
  height?: string;
}

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' }
];

export function CodeEditor({ 
  value, 
  onChange, 
  language, 
  onLanguageChange, 
  readOnly = false,
  height = '400px' 
}: CodeEditorProps) {
  const [isCopied, setIsCopied] = useState(false);
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 1.6,
      fontFamily: 'Fira Code, Consolas, Monaco, monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      selectOnLineNumbers: true,
      matchBrackets: 'always',
      autoIndent: 'advanced',
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      parameterHints: { enabled: true },
      wordBasedSuggestions: true,
      tabCompletion: 'on'
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  const downloadCode = () => {
    const extension = language === 'typescript' ? 'ts' : 
                     language === 'javascript' ? 'js' :
                     language === 'python' ? 'py' :
                     language === 'java' ? 'java' :
                     language === 'cpp' ? 'cpp' :
                     language === 'c' ? 'c' :
                     language === 'go' ? 'go' :
                     language === 'rust' ? 'rs' :
                     language === 'php' ? 'php' :
                     language === 'ruby' ? 'rb' :
                     language === 'swift' ? 'swift' :
                     language === 'kotlin' ? 'kt' :
                     language === 'html' ? 'html' :
                     language === 'css' ? 'css' :
                     language === 'sql' ? 'sql' :
                     language === 'bash' ? 'sh' :
                     language === 'json' ? 'json' :
                     language === 'xml' ? 'xml' :
                     language === 'yaml' ? 'yaml' :
                     language === 'markdown' ? 'md' : 'txt';

    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  const formatCode = () => {
    if (editorRef.current) {
      const editor = editorRef.current;
      editor.getAction('editor.action.formatDocument').run();
      toast.success('Code formatted!');
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-muted border-b">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            {languages.find(l => l.value === language)?.label || language}
          </Badge>
          {!readOnly && (
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button variant="ghost" size="sm" onClick={formatCode}>
              Format
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadCode}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <Editor
          height={height}
          language={language}
          value={value}
          onChange={(newValue) => onChange(newValue || '')}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            domReadOnly: readOnly,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto'
            }
          }}
          theme="vs-dark"
        />
      </div>
    </div>
  );
}