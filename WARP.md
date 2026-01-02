# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Build & Run
```bash
npm run build           # Compile TypeScript to dist/
npm start               # Start the application
npm run start:dev       # Start with hot-reload (watch mode)
npm run start:debug     # Start with debugging
npm run start:prod      # Run production build
```

### Code Quality
```bash
npm run lint            # Run ESLint with auto-fix
npm run format          # Format code with Prettier
```

### Testing
```bash
npm test                              # Run all unit tests
npm run test:watch                    # Run tests in watch mode
npm run test:cov                      # Run tests with coverage report
npm run test:e2e                      # Run end-to-end integration tests
npm test -- hr-agent.service.spec.ts  # Run specific test file
npm test -- -t "test name"            # Run specific test by name
```

### Docker
```bash
docker-compose run --rm app  # Build and run with Docker
```

## Architecture Overview

This is a **multi-agent system** built with NestJS that orchestrates specialized AI agents for HR, IT support, and image generation tasks.

### Core Agent Flow

1. **Orchestrator Agent** (`orchestrator-agent.service.ts`) - Entry point that receives all user messages and routes them to specialized agents using OpenAI's `handoff` pattern
2. **Specialized Agents** - Domain-specific agents that handle routed queries:
   - **HR Agent** (`hr-agent.service.ts`) - Handles leave policies, leave requests, workplace questions
   - **IT Agent** (`it-agent.service.ts`) - Handles technical support, password resets, troubleshooting
   - **Image Generator Agent** (`image-gen.service.ts`) - Handles image generation requests using DALL-E

### Communication Interfaces

- **WebSocket Gateway** (`chat.gateway.ts`) - Real-time bidirectional communication with frontend (port 5173)
- **CLI Interface** (`agent-orc.service.ts`) - Interactive terminal-based chat interface

### Tools System

All agent tools are centralized in `tools/tools.service.ts` which acts as a registry:

- **RAG Service** (`rag.service.ts`) - Vector search against Qdrant for leave policy queries using OpenAI embeddings
- **Leave Tool Service** (`leave-tool.service.ts`) - MongoDB operations for leave request management
- **Image Tool Service** (`imgTool.service.ts`) - DALL-E 3 integration for image generation and storage
- **Ticket Service** (`ticket.service.ts`) - IT ticket creation in MongoDB

Tools use Zod schemas for validation and are exposed to agents via the OpenAI Agents SDK tool interface.

### Guardrails

The system implements input content moderation via `sdk-guardrails.service.ts` which uses an OpenAI agent to validate inputs against:
- NSFW content (explicit sexual content, violence, illegal activities)
- Out-of-scope topics (personal advice, cooking, travel, politics, etc.)

The guardrail is attached to the Orchestrator as an `InputGuardrail` and throws `InputGuardrailTripwireTriggered` exceptions when blocked.

### Database Layer

- **MongoDB** via Mongoose for persistent storage (leave requests, tickets)
- **Qdrant** vector database for RAG-based policy document retrieval
- Schemas defined in `database/schemas/`

### Module Structure

```
AppModule
├── ConfigModule (global) - Environment variables
├── AgentModule - All agent services
├── GuardrailsModule - Content moderation
└── DatabaseModule - MongoDB connection
```

## Environment Configuration

Required environment variables (see `.env.example`):
```
OPENAI_API_KEY         # OpenAI API for agents and embeddings
QDRANT_URL             # Qdrant cloud instance URL
QDRANT_API_KEY         # Qdrant authentication
QDRANT_COLLECTION_NAME # Collection name (default: policy_documents)
MONGODB_URI            # MongoDB connection string
```

## Key Patterns & Conventions

### Agent Pattern
- Agents are initialized in their service constructors
- All agents use the `@openai/agents` SDK's `Agent` class
- Agent responses are prefixed with `[Agent Name]` for identification
- Use `run()` function to execute agent with user message
- Use `handoff()` for routing between agents

### Tool Registration
- Tools are defined in `ToolsService.getTools()` with:
  - Function schema (name, description, parameters)
  - `execute` function that calls the underlying service
- Zod schemas define parameter validation
- Tool parameters use `zodToJsonSchema()` for OpenAI compatibility

### Error Handling
- Guardrail violations throw `InputGuardrailTripwireTriggered`
- WebSocket gateway catches errors and emits specific events (`guardrail_blocked`, `error`)
- All agent services log errors with `console.error`

### Testing Strategy
- Unit tests for each agent and tool service (`.spec.ts` files)
- E2E tests for complete workflows in `test/agents-integration.e2e-spec.ts`
- All external dependencies (OpenAI, Qdrant, MongoDB, fetch, fs) are mocked
- Coverage target: 80%+ overall, 85%+ for agents
- See `TEST_README.md` for comprehensive testing documentation

## Development Notes

- Server runs on port 3000 by default
- WebSocket CORS configured for `http://localhost:5173`
- Generated images are served statically from `generated_images/` directory
- The orchestrator uses specific routing instructions to determine which agent handles each query type
- When adding new tools, register them in `ToolsService` and add to appropriate agent's tools array
