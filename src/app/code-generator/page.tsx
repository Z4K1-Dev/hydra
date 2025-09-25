'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Code, Copy, Download, Play, Save } from 'lucide-react';
import { toast } from 'sonner';
import { CodeEditor } from '@/components/code-editor/CodeEditor';

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

const codeTemplates = [
  {
    name: 'React Component',
    prompt: 'Create a reusable React component with props, state management, and TypeScript types',
    language: 'typescript'
  },
  {
    name: 'API Endpoint',
    prompt: 'Create a REST API endpoint with error handling, validation, and proper HTTP status codes',
    language: 'javascript'
  },
  {
    name: 'Data Processing',
    prompt: 'Write a function to process and transform array data efficiently with error handling',
    language: 'python'
  },
  {
    name: 'Database Query',
    prompt: 'Create a complex SQL query with joins, aggregations, and proper indexing',
    language: 'sql'
  },
  {
    name: 'Utility Function',
    prompt: 'Create a utility function for string manipulation with comprehensive edge cases',
    language: 'javascript'
  },
  {
    name: 'Async Handler',
    prompt: 'Create an async function with proper error handling and timeout management',
    language: 'typescript'
  },
  {
    name: 'Data Validation',
    prompt: 'Create a data validation schema with comprehensive rules and error messages',
    language: 'javascript'
  },
  {
    name: 'File Operations',
    prompt: 'Create safe file operations with proper error handling and resource management',
    language: 'python'
  },
  {
    name: 'Authentication',
    prompt: 'Create a JWT authentication middleware with proper security measures',
    language: 'javascript'
  },
  {
    name: 'Algorithm',
    prompt: 'Implement an efficient sorting algorithm with time complexity analysis',
    language: 'python'
  }
];

export default function CodeGenerator() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [context, setContext] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ output: string; error?: string; executionTime: number } | null>(null);
  const [error, setError] = useState('');

  const generateCode = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');
    setExecutionResult(null);

    try {
      const response = await fetch('/api/code-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          language,
          context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate code');
      }

      setGeneratedCode(data.code);
      toast.success('Code generated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to generate code');
    } finally {
      setIsGenerating(false);
    }
  };

  const executeCode = async () => {
    if (!generatedCode.trim()) {
      setError('No code to execute');
      return;
    }

    setIsExecuting(true);
    setError('');

    try {
      const response = await fetch('/api/code-executor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: generatedCode,
          language
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute code');
      }

      setExecutionResult({
        output: data.output,
        error: data.error,
        executionTime: data.executionTime
      });

      if (data.error) {
        toast.error('Code execution failed');
      } else {
        toast.success('Code executed successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to execute code');
    } finally {
      setIsExecuting(false);
    }
  };

  const applyTemplate = (template: typeof codeTemplates[0]) => {
    setPrompt(template.prompt);
    setLanguage(template.language);
    toast.info('Template applied!');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
          <Code className="h-10 w-10" />
          AI Code Generator
        </h1>
        <p className="text-lg text-muted-foreground">
          Generate high-quality code using AI powered by Z-AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Code Requirements</CardTitle>
            <CardDescription>
              Describe what you want to create and let AI generate the code for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Programming Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Prompt</label>
              <Textarea
                placeholder="Describe what you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Additional Context (Optional)</label>
              <Textarea
                placeholder="Any specific requirements, frameworks, or constraints..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={generateCode} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Code className="mr-2 h-4 w-4" />
                  Generate Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Code</CardTitle>
            <CardDescription>
              AI-generated code based on your requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedCode ? (
              <>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{language}</Badge>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={executeCode}
                      disabled={isExecuting || !['javascript', 'typescript', 'python'].includes(language)}
                    >
                      {isExecuting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {isExecuting ? 'Executing...' : 'Run Code'}
                    </Button>
                  </div>
                </div>
                
                <CodeEditor
                  value={generatedCode}
                  onChange={setGeneratedCode}
                  language={language}
                  onLanguageChange={setLanguage}
                  readOnly={false}
                  height="400px"
                />

                {/* Execution Results */}
                {executionResult && (
                  <Card className={executionResult.error ? 'border-red-200' : 'border-green-200'}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          Execution Results
                        </CardTitle>
                        <Badge variant={executionResult.error ? 'destructive' : 'default'}>
                          {executionResult.error ? 'Error' : 'Success'}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Execution time: {executionResult.executionTime}ms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {executionResult.error ? (
                        <div className="text-red-600 text-sm font-mono bg-red-50 p-3 rounded">
                          {executionResult.error}
                        </div>
                      ) : (
                        <div className="text-sm font-mono bg-green-50 p-3 rounded whitespace-pre-wrap">
                          {executionResult.output}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your generated code will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle>Code Templates & Examples</CardTitle>
          <CardDescription>
            Quick-start templates for common programming tasks. Click any template to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {codeTemplates.map((template) => (
              <Card key={template.name} className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{template.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {template.language}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 flex-grow">
                    {template.prompt}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => applyTemplate(template)}
                    className="w-full mt-auto"
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              💡 <strong>Pro tip:</strong> You can modify the prompt after selecting a template to customize the generated code.
            </p>
            <p>
              🔒 <strong>Security:</strong> Code execution is limited to JavaScript, TypeScript, and Python for safety.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}