# GLM Setup Example

## Quick Start

### 1. Install Dependencies
```bash
cd GLM
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your API keys:

```bash
cp .env.example .env
```

Edit `.env` file:
```env
# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
AI_MODEL=gpt-4
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7
OPENAI_BASE_URL=https://api.openai.com/v1

# Database Configuration
DB_PATH=./data/glm.db
MAX_CONTEXT_SIZE=100000

# Tools Configuration
TOOL_MAX_EXECUTION_TIME=30000
TOOL_MAX_OUTPUT_LENGTH=10000

# Logging Configuration
LOG_LEVEL=info
```

### 3. Run GLM

#### Development Mode (with tsx)
```bash
npx tsx src/index.ts --help
```

#### Basic Commands
```bash
# Show help
npx tsx src/index.ts --help

# Show system status
npx tsx src/index.ts status

# List sessions
npx tsx src/index.ts sessions

# Start new session
npx tsx src/index.ts start

# Start new session with specific model
npx tsx src/index.ts start --model claude-3

# Start new session with name
npx tsx src/index.ts start --session "my-project"

# Continue last session
npx tsx src/index.ts start --continue

# Load specific session
npx tsx src/index.ts load "my-project"

# Export session
npx tsx src/index.ts export "my-project" --format md

# Test Linux tools
npx tsx src/index.ts tools --execute "ls -la"
```

### 4. Interactive Mode

Once you start a session, you'll enter interactive mode:

```
💬 Starting interactive mode...
Type "exit" to end session, "help" for commands

glm> Hello, how are you?
🤖: I'm doing well, thank you! I'm GLM, your AI assistant. How can I help you today?

glm> /context
📊 Context size: 150 tokens

glm> /tools exec pwd
🔧 Tool result: /home/z/my-project/GLM

glm> /save
✅ Session saved

glm> /export md
✅ Session exported as MD

glm> exit
👋 Session ended
```

### 5. Configuration Management

```bash
# Show all configuration
npx tsx src/index.ts config --list

# Get specific configuration
npx tsx src/index.ts config --get ai.model

# Set configuration
npx tsx src/index.ts config --set "ai.model=claude-3"
```

## Docker Setup

### Build and Run
```bash
# Build Docker image
docker build -t glm-cli .

# Run with Docker
docker run -it glm-cli

# Or with docker-compose
docker-compose up -d
```

### Docker Environment Variables
```bash
# Set environment variables in docker-compose.yml
environment:
  - OPENAI_API_KEY=your_api_key_here
  - AI_MODEL=gpt-4
  - LOG_LEVEL=info
```

## API Key Setup

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Add to `.env`:
   ```env
   OPENAI_API_KEY=sk-your-openai-key
   ```

### Anthropic Claude
1. Go to https://console.anthropic.com/
2. Create new API key
3. Add to `.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
   ```

## Features Demonstrated

### ✅ Working Features
- **Session Management**: Create, load, save, and export sessions
- **AI Integration**: Support for OpenAI GPT-4 and Anthropic Claude
- **Linux Tools**: Safe command execution with permission system
- **Context Management**: Automatic compression and token management
- **Interactive CLI**: User-friendly command interface
- **Configuration**: Flexible configuration system
- **Logging**: Comprehensive logging system
- **Docker Support**: Containerized deployment

### 🚧 Advanced Features
- **Vector Search**: Semantic context search (requires vector database)
- **Streaming Responses**: Real-time AI responses
- **Cost Tracking**: Monitor API usage and costs
- **Web Interface**: Browser-based UI (planned)

## Troubleshooting

### Common Issues

1. **Module Not Found**
   ```bash
   # Ensure you're in the GLM directory
   cd GLM
   npx tsx src/index.ts --help
   ```

2. **API Connection Failed**
   - Check your API keys in `.env`
   - Verify internet connection
   - Check API service status

3. **Permission Denied**
   ```bash
   # For Linux tools, ensure you have necessary permissions
   # Some commands may require sudo access
   ```

4. **Database Errors**
   ```bash
   # Create data directory if it doesn't exist
   mkdir -p data
   chmod 755 data
   ```

### Getting Help

```bash
# Show help
npx tsx src/index.ts --help

# Show help for specific command
npx tsx src/index.ts help start
```

## Next Steps

1. **Add Your API Keys**: Configure OpenAI/Anthropic keys in `.env`
2. **Test AI Integration**: Start a session and test with real AI
3. **Explore Features**: Try different commands and tools
4. **Customize Configuration**: Adjust settings to your needs
5. **Deploy**: Use Docker for production deployment

## Support

For issues and feature requests, please check the documentation or create an issue in the project repository.