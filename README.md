# Memory Bank MCP

> A guided Memory Bank plugin for AI-assisted development

[![CN](https://img.shields.io/badge/语言-中文版-red.svg)](./README_CN.md)

Memory Bank MCP is a Model Context Protocol (MCP) plugin that helps AI assistants maintain persistent project context through structured markdown files. It provides a systematic approach to tracking project goals, decisions, progress, and patterns through guided instructions rather than direct operations.

## Features

- **Guided Operations**: Provides instructions for AI assistants to perform operations themselves
- **Structured Context Management**: Organize project information across 5 core files
- **Intelligent Guidance**: Step-by-step instructions for initialization and updates
- **Flexible Updates**: Smart update guidance based on different change types
- **Cross-Platform Support**: Automatic path normalization for Windows/macOS/Linux

### MCP Configuration

Using the published npm package:

```json
{
  "mcpServers": {
    "memory-bank": {
      "command": "npx",
      "args": ["@neko0721/memory-bank-mcp"],
      "timeout": 600
    }
  }
}
```

## Quick Start

1. **Initialize Memory Bank**

   ```
   Use init-memory-bank to create the memory-bank directory and core files
   ```

2. **Read Memory Bank**

   ```
   Use get-memory-bank-info to view all Memory Bank content
   ```

3. **Update Memory Bank**
   ```
   Use update-memory-bank to get guidance on updating specific files
   ```

## Core Files

### 1. productContext.md (Product Context)

- High-level project overview
- Goals and key features
- Overall architecture
- Automatically incorporates projectBrief.md if available

### 2. activeContext.md (Active Context)

- Current work status
- Recent changes
- Open questions and issues
- Focus areas

### 3. progress.md (Progress)

- Task tracking in checklist format
- Completed, current, and planned tasks
- Progress timeline

### 4. decisionLog.md (Decision Log)

- Architectural and implementation decisions
- Rationale and implications
- Decision history

### 5. systemPatterns.md (System Patterns)

- Recurring patterns and standards
- Coding conventions
- Architectural patterns
- Testing strategies

## Usage Guidelines

### For AI Assistants

1. **Start Every Session**: Check if memory-bank directory exists, then use `get-memory-bank-info` to understand project state
2. **Initialize When Needed**: Use `init-memory-bank` for new projects
3. **Read Context**: Use `get-memory-bank-info` to understand project state
4. **Update Guidance**: Use `update-memory-bank` to get update instructions
5. **Follow Instructions**: Execute the provided guidance to maintain Memory Bank

### Update Triggers

- **Architecture Changes**: Major structural decisions
- **Feature Completion**: New features or capabilities
- **Bug Fixes**: Significant issue resolutions
- **Refactoring**: Code structure improvements
- **Decisions**: Any important technical choices
- **Progress Updates**: Task status changes

## Tool Reference

### init-memory-bank

Initializes Memory Bank with all core files.

**Parameters:**

- `rootPath`: Project root directory path
- `force` (optional): Force re-initialization

**Returns:** Created files list and next steps guidance

### get-memory-bank-info

Reads and returns all Memory Bank content (similar to codelf's get-project-info).

**Parameters:**

- `rootPath`: Project root directory path

**Returns:** Formatted Memory Bank content for AI context

### update-memory-bank

Provides guidance for updating Memory Bank files.

**Parameters:**

- `rootPath`: Project root directory path
- `changeType`: Type of change (architecture/feature/bugfix/refactor/decision/progress)
- `description`: Brief description of the change

**Returns:** Detailed update instructions with templates and timestamps

## Integration Tips

### Cursor Setup

Add to Settings → Rules → User Rules:

```
Before starting any task, check if memory-bank directory exists in the project. If not, run the MCP command init-memory-bank.
Use the MCP command get-memory-bank-info to read Memory Bank content at session start.
After completing tasks or conversations, use the MCP command update-memory-bank to update Memory Bank content.
Follow the MCP guidance to maintain Memory Bank files.
```

### Windsurf Setup

Add to Settings → Cascade → Memories and Rules → Global Rules:

```
Before starting any task, check if memory-bank directory exists in the project. If not, run the MCP command init-memory-bank.
Use the MCP command get-memory-bank-info to read Memory Bank content at session start.
After completing tasks or conversations, use the MCP command update-memory-bank to update Memory Bank content.
Follow the MCP guidance to maintain Memory Bank files.
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Acknowledgments

Inspired by the SPARC methodology and codelf.
