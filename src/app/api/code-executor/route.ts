import { NextRequest, NextResponse } from 'next/server';

interface ExecutionRequest {
  code: string;
  language: string;
  input?: string;
}

interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
}

// Simple code execution with safety limits
async function executeCode(code: string, language: string, input?: string): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    // For security reasons, we'll only execute JavaScript/TypeScript in a sandboxed environment
    if (language === 'javascript' || language === 'typescript') {
      return await executeJavaScript(code, input);
    } else if (language === 'python') {
      return await executePython(code, input);
    } else {
      throw new Error(`Code execution for ${language} is not supported in this demo`);
    }
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      executionTime: Date.now() - startTime
    };
  }
}

async function executeJavaScript(code: string, input?: string): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    // Create a safe execution context
    const safeContext = {
      console: {
        log: (...args: any[]) => args.map(arg => String(arg)).join(' ')
      },
      // Add safe built-ins
      Math: Math,
      JSON: JSON,
      Date: Date,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval
    };

    // Remove dangerous properties
    const dangerousProps = ['fetch', 'XMLHttpRequest', 'WebSocket', 'Worker', 'eval', 'Function', 'GeneratorFunction', 'AsyncFunction'];
    dangerousProps.forEach(prop => {
      if (prop in globalThis) {
        delete (globalThis as any)[prop];
      }
    });

    // Wrap code in a function to capture return value and console output
    const wrappedCode = `
      (function() {
        let output = '';
        const originalConsoleLog = console.log;
        console.log = (...args) => {
          output += args.map(arg => String(arg)).join(' ') + '\\n';
          originalConsoleLog(...args);
        };
        
        try {
          const result = (function() {
            ${code}
          })();
          
          if (result !== undefined) {
            output += String(result);
          }
          
          return { success: true, output: output.trim() };
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          console.log = originalConsoleLog;
        }
      })()
    `;

    // Execute the code with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Code execution timeout')), 5000);
    });

    const executionPromise = new Promise((resolve) => {
      try {
        // Note: In a real production environment, you would use a proper sandbox like VM2 or isolate-vm
        // This is a simplified version for demo purposes
        const func = new Function('return ' + wrappedCode);
        const result = func();
        resolve(result);
      } catch (error) {
        resolve({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    const result = await Promise.race([executionPromise, timeoutPromise]) as any;

    if (result.success) {
      return {
        output: result.output || 'Code executed successfully (no output)',
        executionTime: Date.now() - startTime
      };
    } else {
      return {
        output: '',
        error: result.error,
        executionTime: Date.now() - startTime
      };
    }
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      executionTime: Date.now() - startTime
    };
  }
}

async function executePython(code: string, input?: string): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    // For Python execution, we would typically use a service like Pyodide or a backend Python runner
    // For this demo, we'll simulate Python execution
    if (code.includes('import') || code.includes('exec') || code.includes('eval')) {
      throw new Error('Python imports and dynamic execution are not supported in this demo');
    }

    // Simple Python-like expression evaluation (very basic simulation)
    const pythonLikeOps = {
      'print': 'console.log',
      'len': 'Array.from',
      'range': 'Array.from',
      'str': 'String',
      'int': 'Number',
      'float': 'Number',
      'list': 'Array',
      'dict': 'Object',
      'True': 'true',
      'False': 'false',
      'None': 'null',
      'and': '&&',
      'or': '||',
      'not': '!'
    };

    let jsCode = code;
    Object.entries(pythonLikeOps).forEach(([py, js]) => {
      const regex = new RegExp(`\\b${py}\\b`, 'g');
      jsCode = jsCode.replace(regex, js);
    });

    // Replace Python-style comments
    jsCode = jsCode.replace(/#.*$/gm, '');

    // Basic Python to JS conversion
    jsCode = jsCode.replace(/(\w+)\s*=\s*\[(.*?)\]/g, 'const $1 = [$2];');
    jsCode = jsCode.replace(/(\w+)\s*=\s*\{(.*?)\}/g, 'const $1 = {$2};');
    jsCode = jsCode.replace(/def\s+(\w+)\s*\((.*?)\):/g, 'function $1($2) {');
    jsCode = jsCode.replace(/if\s+(.*?):/g, 'if ($1) {');
    jsCode = jsCode.replace(/for\s+(\w+)\s+in\s+(.*?):/g, 'for (let $1 of $2) {');
    jsCode = jsCode.replace(/while\s+(.*?):/g, 'while ($1) {');

    // Close braces
    const lines = jsCode.split('\n');
    let indentLevel = 0;
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      
      const currentIndent = line.length - line.trimStart.length;
      if (currentIndent < indentLevel) {
        indentLevel = currentIndent;
        return ' '.repeat(currentIndent) + trimmed + ' }';
      }
      indentLevel = currentIndent;
      return line;
    });

    jsCode = processedLines.join('\n');

    return await executeJavaScript(jsCode, input);
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Python execution error',
      executionTime: Date.now() - startTime
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, language, input }: ExecutionRequest = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }

    // Basic security checks
    if (code.length > 10000) {
      return NextResponse.json(
        { error: 'Code too long (max 10,000 characters)' },
        { status: 400 }
      );
    }

    // Check for potentially dangerous operations
    const dangerousPatterns = [
      /require\s*\(/,
      /import\s+/,
      /fetch\s*\(/,
      /XMLHttpRequest/,
      /WebSocket/,
      /Worker\s*\(/,
      /eval\s*\(/,
      /Function\s*\(/,
      /document\./,
      /window\./,
      /global\./,
      /process\./,
      /fs\./,
      /child_process/,
      /os\./,
      /path\./,
      /url\./,
      /http\./,
      /https\./,
      /net\./,
      /dns\./,
      /crypto\./,
      /buffer\./,
      /stream\./,
      /zlib\./,
      /readline\./,
      /vm\./,
      /inspector/,
      /cluster/,
      /domain/,
      /repl/,
      /tty/,
      /util\./,
      /v8\./
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return NextResponse.json(
          { error: 'Code contains potentially dangerous operations' },
          { status: 400 }
        );
      }
    }

    const result = await executeCode(code, language, input);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    );
  }
}