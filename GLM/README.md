# GLM - General Language Model CLI

## Overview
GLM adalah CLI tool yang dirancang untuk memberikan Anda AI assistant capabilities langsung di VPS pribadi Anda dengan kemampuan:
- Unlimited discussions tanpa kehilangan konteks
- Full Linux tools integration
- Persistent conversation memory
- Customizable workflow

## Vision
Membuat AI assistant yang hidup di VPS pribadi Anda dengan kemampuan penuh seperti yang Anda alami sekarang, tapi tanpa batasan platform pihak ketiga.

## Features
- [ ] Unlimited conversation sessions
- [ ] Context persistence and compression
- [ ] Linux tools integration
- [ ] File operations
- [ ] Web access capabilities
- [ ] Multiple AI model support
- [ ] Session management
- [ ] Export/Import functionality
- [ ] Docker deployment ready
- [ ] Web interface (optional)

## Tech Stack
- **Runtime**: Node.js/Bun
- **Framework**: Custom CLI + OpenInterpreter integration
- **Database**: SQLite (local)
- **Vector Storage**: For context compression
- **Container**: Docker
- **AI Models**: OpenAI GPT-4, Anthropic Claude, etc.

## Quick Start
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Run the CLI
npm run dev

# Or with Docker
docker-compose up -d
```

## Project Structure
```
GLM/
├── src/
│   ├── core/           # Core CLI functionality
│   ├── session/        # Session management
│   ├── context/        # Context management
│   ├── tools/          # Linux tools integration
│   ├── ai/             # AI model integration
│   ├── storage/        # Data persistence
│   └── utils/          # Utility functions
├── config/             # Configuration files
├── docker/             # Docker setup
├── docs/               # Documentation
├── tests/              # Test files
└── data/               # Local data storage
```

## Development Status
- [x] Project structure setup
- [ ] Core CLI framework
- [ ] Session management
- [ ] Context compression
- [ ] AI integration
- [ ] Linux tools
- [ ] Docker deployment
- [ ] Web interface

## Contributing
This is a personal project for unlimited AI discussions. Development follows the "cek dua kali baru potong" principle.

## License
Private - Not open source