# GLM Setup Guide

## Prerequisites

- Node.js 18+ or Bun
- OpenAI API key or Anthropic API key
- VPS or local machine with Linux/macOS/Windows

## Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd GLM

# Install dependencies
npm install
# or with bun
bun install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required configuration:
```bash
# AI Configuration (choose one)
OPENAI_API_KEY=your_openai_api_key_here
# or
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# AI Model (optional, defaults to gpt-4)
AI_MODEL=gpt-4

# Other optional settings
LOG_LEVEL=info
MAX_CONTEXT_SIZE=100000
```

### 3. Start Using GLM

```bash
# Start a new session
npm run dev start

# Or with specific session name
npm run dev start -- --session "my-project-discussion"

# Continue last session
npm run dev start -- --continue

# List all sessions
npm run dev sessions

# Load specific session
npm run dev load "my-project-discussion"
```

## Docker Setup

### 1. Using Docker Compose

```bash
# Copy environment
cp .env.example .env
# Edit .env with your API keys

# Start with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f glm-cli

# Enter container for debugging
docker exec -it glm-cli bash
```

### 2. Manual Docker Build

```bash
# Build image
docker build -t glm-cli .

# Run container
docker run -it \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/logs:/app/logs \
  -e OPENAI_API_KEY=your_key_here \
  glm-cli
```

## VPS Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Deploy GLM

```bash
# Clone repository
git clone <your-repo-url> glm
cd glm

# Setup environment
cp .env.example .env
nano .env

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs glm-cli
```

### 3. Setup Reverse Proxy (Optional)

```nginx
# /etc/nginx/sites-available/glm
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `ANTHROPIC_API_KEY` | Anthropic API key | Required |
| `AI_MODEL` | AI model to use | `gpt-4` |
| `AI_MAX_TOKENS` | Maximum tokens per response | `4000` |
| `AI_TEMPERATURE` | AI response randomness | `0.7` |
| `DB_PATH` | Database file path | `./data/glm.db` |
| `MAX_CONTEXT_SIZE` | Maximum context size | `100000` |
| `LOG_LEVEL` | Logging level | `info` |
| `LOG_FILE` | Log file path | `./logs/glm.log` |

### Configuration File

Configuration is stored in `config/glm.json`:

```json
{
  "ai": {
    "model": "gpt-4",
    "apiKey": "your-api-key",
    "maxTokens": 4000,
    "temperature": 0.7
  },
  "database": {
    "path": "./data/glm.db",
    "maxContextSize": 100000
  },
  "session": {
    "autoSave": true,
    "saveInterval": 30000,
    "maxSessions": 100
  },
  "tools": {
    "enabled": true,
    "safeMode": true,
    "allowedCommands": ["ls", "cat", "grep", "find", "pwd"]
  }
}
```

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```bash
   # Check if API key is set
   echo $OPENAI_API_KEY
   
   # Set API key
   export OPENAI_API_KEY=your_key_here
   ```

2. **Permission Denied**
   ```bash
   # Fix permissions
   sudo chown -R $USER:$USER data/
   sudo chown -R $USER:$USER config/
   sudo chown -R $USER:$USER logs/
   ```

3. **Database Connection Error**
   ```bash
   # Check database file
   ls -la data/
   
   # Recreate database
   rm data/glm.db
   npm run dev start
   ```

4. **Docker Issues**
   ```bash
   # Clean Docker
   docker system prune -a
   
   # Rebuild image
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Debug Mode

Enable debug logging:

```bash
# Set log level to debug
export LOG_LEVEL=debug

# Or in configuration
npm run dev config -- --set logging.level=debug
```

### Health Check

Check system status:

```bash
# Check GLM status
npm run dev status

# Check Docker health
docker-compose ps
docker-compose logs glm-cli
```

## Next Steps

After setup, you can:

1. **Start your first session**: `npm run dev start`
2. **Explore commands**: `npm run dev -- --help`
3. **Configure tools**: Edit `config/glm.json`
4. **Setup web interface**: Enable in docker-compose.yml
5. **Customize prompts**: Create custom prompts in `config/prompts/`

## Support

For issues and questions:
1. Check logs in `logs/glm.log`
2. Run health checks
3. Review configuration
4. Check Docker container status