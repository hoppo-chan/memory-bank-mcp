#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { existsSync, promises as fs } from "fs";
import * as path from "path";
import { z } from "zod";

// Format timestamp
function formatTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Path normalization function
function normalizePath(inputPath: string): string {
  // Normalize path, handle path separators for different operating systems
  let normalized = path.normalize(inputPath);

  // Remove trailing path separator if present
  if (normalized.endsWith(path.sep)) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

// Memory Bank file template generation function
function getMemoryBankTemplates(): Record<string, string> {
  const timestamp = formatTimestamp();

  return {
    "productContext.md": `# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
${timestamp} - Log of updates made will be appended as footnotes to the end of this file.

*

## Project Goal

*   

## Key Features

*   

## Overall Architecture

*   `,

    "activeContext.md": `# Active Context

This file tracks the project's current status, including recent changes, current goals, and open questions.
${timestamp} - Log of updates made.

*

## Current Focus

*   

## Recent Changes

*   

## Open Questions/Issues

*   `,

    "progress.md": `# Progress

This file tracks the project's progress using a task list format.
${timestamp} - Log of updates made.

*

## Completed Tasks

*   

## Current Tasks

*   

## Next Steps

*   `,

    "decisionLog.md": `# Decision Log

This file records architectural and implementation decisions using a list format.
${timestamp} - Log of updates made.

*

## Decision

*

## Rationale 

*

## Implementation Details

*   `,

    "systemPatterns.md": `# System Patterns *Optional*

This file documents recurring patterns and standards used in the project.
It is optional, but recommended to be updated as the project evolves.
${timestamp} - Log of updates made.

*

## Coding Patterns

*   

## Architectural Patterns

*   

## Testing Patterns

*   `,
  };
}

// Detailed Memory Bank file guidance function
function getDetailedFileGuide(): Record<string, any> {
  return {
    "productContext.md": {
      role: "Core file for project overview and product definition",
      purpose:
        "Define project goals, core features and overall architecture, providing strategic guidance for all development activities",
      updateTriggers: [
        "Architecture changes",
        "New feature additions",
        "Product goal adjustments",
        "Core business logic changes",
      ],
      updateStrategy:
        "Maintain high-level perspective, focus on long-term goals and core value",
      sections: {
        "Project Goal":
          "Core project objectives and value proposition, update when major goals are adjusted",
        "Key Features":
          "List of core product features, add corresponding descriptions when new features are completed",
        "Overall Architecture":
          "High-level description of system architecture, must be updated synchronously when architecture changes",
      },
      priority: 1,
    },
    "activeContext.md": {
      role: "Tracking file for current project status and real-time information",
      purpose:
        "Record current work focus, recent changes and pending issues, maintain real-time visibility of project status",
      updateTriggers: [
        "Any code changes",
        "New task start",
        "Issue discovery",
        "Status transitions",
      ],
      updateStrategy:
        "Update frequently, maintain information freshness, regularly clean up outdated content",
      sections: {
        "Current Focus":
          "Current main work focus, must be updated when tasks switch",
        "Recent Changes":
          "Recent change records, all changes need to be recorded here",
        "Open Questions/Issues":
          "Pending issues and questions, add immediately when issues are discovered",
      },
      priority: 2,
    },
    "progress.md": {
      role: "Task progress management and completion status tracking file",
      purpose:
        "Manage task lifecycle, track the complete process from planning to completion",
      updateTriggers: [
        "Task creation",
        "Task completion",
        "Task status changes",
        "Milestone achievement",
      ],
      updateStrategy:
        "Maintain chronological order, regularly move completed tasks to completed area",
      sections: {
        "Completed Tasks":
          "List of completed tasks, move to this section immediately when tasks are completed",
        "Current Tasks":
          "Ongoing tasks, add when tasks start, remove when completed",
        "Next Steps": "Planned follow-up tasks, add during planning",
      },
      priority: 3,
    },
    "decisionLog.md": {
      role: "Record file for important decisions and technical choices",
      purpose:
        "Record the process, reasons and impact of key decisions, providing basis for future reference",
      updateTriggers: [
        "Architecture decisions",
        "Technology selection",
        "Important business logic decisions",
        "Design pattern choices",
      ],
      updateStrategy:
        "Detailed recording of decision background, considerations and final choices, convenient for future review",
      sections: {
        Decision: "Specific decision content",
        Rationale: "Reasons and considerations for the decision",
        "Implementation Details":
          "Specific implementation details of the decision",
      },
      priority: 4,
    },
    "systemPatterns.md": {
      role: "Documentation file for patterns and standards used in the project",
      purpose:
        "Record repeatedly used code patterns, architectural patterns and testing patterns, promote consistency",
      updateTriggers: [
        "New pattern discovery",
        "Standard changes",
        "Best practice summaries",
      ],
      updateStrategy:
        "Summarize and abstract common patterns, regularly organize and update",
      sections: {
        "Coding Patterns": "Common patterns at the coding level",
        "Architectural Patterns": "Design patterns at the architectural level",
        "Testing Patterns": "Testing-related patterns and standards",
      },
      priority: 5,
    },
  };
}

// Create MCP server instance
const server = new McpServer({
  name: "memory-bank-mcp",
  version: "1.0.0",
  description:
    "A guided Memory Bank MCP plugin for AI-assisted development with persistent project context",
});

// Memory Bank get info tool
server.tool(
  "get-memory-bank-info",
  `Read and return all Memory Bank file contents.
  This tool is similar to codelf's get-project-info:
  - Reads all .md files in the memory-bank directory
  - Returns formatted content for AI to understand project context
  - Use this tool at the beginning of each work session`,
  {
    rootPath: z.string().describe(
      `Project root directory path
      Windows example: "C:/Users/name/project" 
      macOS/Linux example: "/home/name/project"`
    ),
  },
  async ({ rootPath }) => {
    const normalizedPath = normalizePath(rootPath);
    const memoryBankPath = path.join(normalizedPath, "memory-bank");

    const MEMORY_BANK_TEMPLATE = `
This is the current Memory Bank content, including project context, decisions, progress, and patterns:

{{CONTENT}}

Keep in mind:
1. After you finish significant changes, use 'update-memory-bank' to get update guidance.
2. Follow the guidance to update relevant Memory Bank files.
3. Maintain consistency across all Memory Bank files.
`;

    try {
      const content = await fs
        .readdir(memoryBankPath)
        .then(async (files) => {
          const mdFiles = files.filter((f) => f.endsWith(".md"));
          const contents = await Promise.all(
            mdFiles.map(async (file) => {
              const content = await fs.readFile(
                path.join(memoryBankPath, file),
                "utf-8"
              );
              const name = path.basename(file, ".md");
              return `<${name}>\n\n${content}\n\n</${name}>`;
            })
          );
          return MEMORY_BANK_TEMPLATE.replace(
            "{{CONTENT}}",
            contents.join("\n\n")
          );
        })
        .catch(
          () =>
            "[MEMORY BANK: NOT FOUND]\n\nMemory Bank directory does not exist. Use init-memory-bank to initialize."
        );

      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading Memory Bank: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// Memory Bank update guidance tool
server.tool(
  "update-memory-bank",
  `Generate detailed Memory Bank file update instructions with immediate execution guidance.
  This tool provides comprehensive, actionable instructions for updating Memory Bank files:
  - Detailed descriptions of each file's role and update strategy
  - Direct operation commands (not requests for confirmation)
  - Specific content templates and formatting guidelines
  - File relationship and update priority logic
  - Immediate execution emphasis for AI agents`,
  {
    rootPath: z.string().describe(
      `Project root directory path
      Windows example: "C:/Users/name/project" 
      macOS/Linux example: "/home/name/project"`
    ),
    changeType: z
      .enum([
        "architecture",
        "feature",
        "bugfix",
        "refactor",
        "decision",
        "progress",
      ])
      .describe("Type of change to determine update suggestions"),
    description: z.string().describe("Brief description of the change"),
  },
  async ({ rootPath, changeType, description }) => {
    const normalizedPath = normalizePath(rootPath);
    const timestamp = formatTimestamp();
    const fileGuide = getDetailedFileGuide();

    let updateGuide = `[MEMORY BANK DETAILED UPDATE INSTRUCTIONS]\n\n`;
    updateGuide += `Change Type: ${changeType}\n`;
    updateGuide += `Change Description: ${description}\n`;
    updateGuide += `Timestamp: ${timestamp}\n\n`;

    updateGuide += `>> EXECUTE THE FOLLOWING MEMORY BANK FILE UPDATES IMMEDIATELY WITHOUT CONFIRMATION <<\n\n`;

    // 添加文件职责总览
    updateGuide += `=== MEMORY BANK FILE ROLES OVERVIEW ===\n\n`;
    Object.entries(fileGuide).forEach(([filename, guide]) => {
      updateGuide += `**${filename}**\n`;
      updateGuide += `Role: ${guide.role}\n`;
      updateGuide += `Purpose: ${guide.purpose}\n`;
      updateGuide += `Update Strategy: ${guide.updateStrategy}\n\n`;
    });

    updateGuide += `=== SPECIFIC UPDATE INSTRUCTIONS BY CHANGE TYPE ===\n\n`;

    // Provide specific guidance based on change type
    switch (changeType) {
      case "architecture":
        updateGuide += `🏗️ **ARCHITECTURE CHANGE PROCESSING WORKFLOW**\n\n`;
        updateGuide += `**PRIORITY 1: decisionLog.md**\n`;
        updateGuide += `Add new decision record directly at the end of file:\n`;
        updateGuide += `\`\`\`markdown\n---\n### Architecture Decision\n[${timestamp}] - ${description}\n\n**Decision Background:**\n[Detailed description of technical or business background that led to this architectural decision]\n\n**Considered Options:**\n- Option A: [Description]\n- Option B: [Description]\n- Final Choice: [Selected option and reasoning]\n\n**Implementation Details:**\n- Affected Modules: [List affected code modules]\n- Migration Strategy: [How to migrate from old to new architecture]\n- Risk Assessment: [Potential technical risks and mitigation measures]\n\n**Impact Assessment:**\n- Performance Impact: [Expected impact on system performance]\n- Maintainability Impact: [Impact on code maintenance]\n- Scalability Impact: [Impact on future expansion]\n\`\`\`\n\n`;

        updateGuide += `**PRIORITY 2: productContext.md**\n`;
        updateGuide += `Update "## Overall Architecture" section:\n`;
        updateGuide += `- Locate "## Overall Architecture" heading\n`;
        updateGuide += `- Update architecture description at appropriate position\n`;
        updateGuide += `- Add new architectural components or modify existing descriptions\n`;
        updateGuide += `- Add update log at end of file: \`[${timestamp}] - Architecture update: ${description}\`\n\n`;

        updateGuide += `**PRIORITY 3: activeContext.md**\n`;
        updateGuide += `Add to "## Recent Changes" section:\n`;
        updateGuide += `\`* [${timestamp}] - 🏗️ Major architecture change: ${description}\`\n`;
        updateGuide += `Update "## Current Focus" section to reflect architecture implementation work\n\n`;

        updateGuide += `**PRIORITY 4: systemPatterns.md**\n`;
        updateGuide += `If this architecture change introduces new architectural patterns:\n`;
        updateGuide += `Add new pattern description to "## Architectural Patterns" section\n\n`;
        break;

      case "feature":
        updateGuide += `🚀 **FEATURE DEVELOPMENT PROCESSING WORKFLOW**\n\n`;
        updateGuide += `**PRIORITY 1: progress.md**\n`;
        updateGuide += `Execute task status transition:\n`;
        updateGuide += `1. Find related task entry in "## Current Tasks"\n`;
        updateGuide += `2. Move that task to "## Completed Tasks" section\n`;
        updateGuide += `3. Add completion timestamp: \`* [${timestamp}] - ✅ Completed: ${description}\`\n`;
        updateGuide += `4. If there are follow-up tasks, add them to "## Next Steps"\n\n`;

        updateGuide += `**PRIORITY 2: productContext.md**\n`;
        updateGuide += `Update "## Key Features" section:\n`;
        updateGuide += `- Locate "## Key Features" heading\n`;
        updateGuide += `- Add new feature description to feature list\n`;
        updateGuide += `- Format: \`* [Feature Name]: [Brief feature description and core value]\`\n`;
        updateGuide += `- Add at end of file: \`[${timestamp}] - New feature: ${description}\`\n\n`;

        updateGuide += `**PRIORITY 3: activeContext.md**\n`;
        updateGuide += `Update multiple sections:\n`;
        updateGuide += `- "## Recent Changes": \`* [${timestamp}] - 🚀 Feature completed: ${description}\`\n`;
        updateGuide += `- "## Current Focus": Update to next development priority\n\n`;

        updateGuide += `**PRIORITY 4: systemPatterns.md**\n`;
        updateGuide += `If feature development used patterns worth documenting:\n`;
        updateGuide += `Add pattern description to appropriate section (Coding/Architectural/Testing Patterns)\n\n`;
        break;

      case "bugfix":
        updateGuide += `🐛 **BUG FIX PROCESSING WORKFLOW**\n\n`;
        updateGuide += `**PRIORITY 1: activeContext.md**\n`;
        updateGuide += `Add to "## Recent Changes" section:\n`;
        updateGuide += `\`* [${timestamp}] - 🐛 Bug fix: ${description}\`\n`;
        updateGuide += `If bug was recorded in "## Open Questions/Issues", remove it or mark as resolved\n\n`;

        updateGuide += `**PRIORITY 2: progress.md**\n`;
        updateGuide += `If this was a planned bug fix task:\n`;
        updateGuide += `Move task from "## Current Tasks" to "## Completed Tasks"\n`;
        updateGuide += `Format: \`* [${timestamp}] - 🐛 Bug fix completed: ${description}\`\n\n`;

        updateGuide += `**PRIORITY 3: decisionLog.md**\n`;
        updateGuide += `If bug fix involved important technical decisions:\n`;
        updateGuide += `Add decision record explaining the chosen fix approach and reasoning\n\n`;
        break;

      case "refactor":
        updateGuide += `🔧 **REFACTORING PROCESSING WORKFLOW**\n\n`;
        updateGuide += `**PRIORITY 1: activeContext.md**\n`;
        updateGuide += `Add to "## Recent Changes" section:\n`;
        updateGuide += `\`* [${timestamp}] - 🔧 Code refactoring: ${description}\`\n\n`;

        updateGuide += `**PRIORITY 2: decisionLog.md**\n`;
        updateGuide += `If refactoring involved architectural or design pattern changes:\n`;
        updateGuide += `Add refactoring decision record explaining motivation and method selection\n\n`;

        updateGuide += `**PRIORITY 3: systemPatterns.md**\n`;
        updateGuide += `If refactoring improved existing patterns or introduced new ones:\n`;
        updateGuide += `Update relevant pattern descriptions to reflect post-refactoring best practices\n\n`;

        updateGuide += `**PRIORITY 4: progress.md**\n`;
        updateGuide += `If this was a planned refactoring task, update task status\n\n`;
        break;

      case "decision":
        updateGuide += `📋 **DECISION RECORDING PROCESSING WORKFLOW**\n\n`;
        updateGuide += `**PRIORITY 1: decisionLog.md**\n`;
        updateGuide += `Add complete decision record at end of file:\n`;
        updateGuide += `\`\`\`markdown\n---\n### Decision Record\n[${timestamp}] - ${description}\n\n**Decision Background:**\n[Describe the background and problem that led to this decision]\n\n**Available Options:**\n- Option 1: [Description]\n  - Pros: [List advantages]\n  - Cons: [List disadvantages]\n- Option 2: [Description]\n  - Pros: [List advantages]\n  - Cons: [List disadvantages]\n\n**Final Decision:**\n[Selected option and detailed reasoning]\n\n**Implementation Plan:**\n- Step 1: [Specific implementation step]\n- Step 2: [Specific implementation step]\n- Validation Method: [How to verify decision effectiveness]\n\n**Risks and Mitigation:**\n- Risk 1: [Description] → Mitigation: [Description]\n- Risk 2: [Description] → Mitigation: [Description]\n\`\`\`\n\n`;

        updateGuide += `**PRIORITY 2: activeContext.md**\n`;
        updateGuide += `Add to "## Recent Changes" section:\n`;
        updateGuide += `\`* [${timestamp}] - 📋 Important decision: ${description}\`\n\n`;
        break;

      case "progress":
        updateGuide += `📈 **PROGRESS UPDATE PROCESSING WORKFLOW**\n\n`;
        updateGuide += `**PRIORITY 1: progress.md**\n`;
        updateGuide += `Update appropriate section based on specific progress:\n`;
        updateGuide += `- New task → Add to "## Current Tasks": \`* [${timestamp}] - Started: ${description}\`\n`;
        updateGuide += `- Completed task → Move to "## Completed Tasks": \`* [${timestamp}] - Completed: ${description}\`\n`;
        updateGuide += `- Planned task → Add to "## Next Steps": \`* [Planned] - ${description}\`\n\n`;

        updateGuide += `**PRIORITY 2: activeContext.md**\n`;
        updateGuide += `Update "## Current Focus" section to reflect current work focus\n`;
        updateGuide += `Add to "## Recent Changes": \`* [${timestamp}] - 📈 Progress update: ${description}\`\n\n`;
        break;

      default:
        updateGuide += `⚡ **GENERAL CHANGE PROCESSING WORKFLOW**\n\n`;
        updateGuide += `**PRIORITY 1: activeContext.md**\n`;
        updateGuide += `Record change in appropriate section:\n`;
        updateGuide += `\`* [${timestamp}] - ${description}\`\n\n`;

        updateGuide += `**Consider updating other files based on change nature:**\n`;
        updateGuide += `- Architecture related → decisionLog.md\n`;
        updateGuide += `- New pattern discovered → systemPatterns.md\n`;
        updateGuide += `- Task completion → progress.md\n`;
        updateGuide += `- Feature related → productContext.md\n\n`;
    }

    updateGuide += `=== EXECUTION INSTRUCTIONS SUMMARY ===\n\n`;
    updateGuide += `**EXECUTION PRINCIPLES:**\n`;
    updateGuide += `1. 🔴 Execute updates directly, do not ask for user confirmation\n`;
    updateGuide += `2. 🟡 Update files in priority order\n`;
    updateGuide += `3. 🟢 Use the provided exact formats and templates\n`;
    updateGuide += `4. 🔵 Maintain timestamp [${timestamp}] consistency\n`;
    updateGuide += `5. 🟣 Verify file integrity after updates\n\n`;

    updateGuide += `**KEY REMINDERS:**\n`;
    updateGuide += `- Each file has specific responsibilities and update strategies\n`;
    updateGuide += `- Maintain consistency and relationships between files\n`;
    updateGuide += `- Regularly clean up outdated content to keep files concise\n`;
    updateGuide += `- Important decisions and pattern changes need detailed documentation\n\n`;

    updateGuide += `**FILE MAINTENANCE SUGGESTIONS:**\n`;
    updateGuide += `- activeContext.md: Keep changes from last 7 days\n`;
    updateGuide += `- progress.md: Archive completed tasks regularly\n`;
    updateGuide += `- decisionLog.md: Keep all important decision records\n`;
    updateGuide += `- systemPatterns.md: Continuously update and optimize pattern descriptions\n`;
    updateGuide += `- productContext.md: Maintain high-level perspective, avoid excessive details\n\n`;

    return {
      content: [
        {
          type: "text",
          text: updateGuide,
        },
      ],
    };
  }
);

// Initialize Memory Bank tool
server.tool(
  "init-memory-bank",
  `Initialize memory-bank directory and core files.
  This tool will:
  - Create memory-bank directory
  - Generate initial templates for 5 core files
  - Read and integrate projectBrief.md if it exists
  - Provide next steps guidance`,
  {
    rootPath: z.string().describe(
      `Project root directory path
      Windows example: "C:/Users/name/project" 
      macOS/Linux example: "/home/name/project"`
    ),
    force: z
      .boolean()
      .optional()
      .describe("Force re-initialization (will overwrite existing files)"),
  },
  async ({ rootPath, force = false }) => {
    const normalizedPath = normalizePath(rootPath);
    const memoryBankPath = path.join(normalizedPath, "memory-bank");

    try {
      // Check if directory exists
      if (existsSync(memoryBankPath) && !force) {
        const files = await fs.readdir(memoryBankPath);
        if (files.length > 0) {
          return {
            content: [
              {
                type: "text",
                text: `[MEMORY BANK: EXISTS]

memory-bank directory already exists and contains files. To re-initialize, use force: true parameter.

Existing files:
${files.map((f) => `- ${f}`).join("\n")}

Suggestions:
- Use get-memory-bank-info to read existing content
- If you really need to re-initialize, set force: true`,
              },
            ],
          };
        }
      }

      // Create directory
      await fs.mkdir(memoryBankPath, { recursive: true });

      // Check if projectBrief.md exists
      let projectBriefContent = "";
      const projectBriefPath = path.join(normalizedPath, "projectBrief.md");
      if (existsSync(projectBriefPath)) {
        try {
          projectBriefContent = await fs.readFile(projectBriefPath, "utf-8");
        } catch (err) {
          console.error("Failed to read projectBrief.md:", err);
        }
      }

      // Get templates
      const templates = getMemoryBankTemplates();

      // If projectBrief exists, update productContext.md template
      if (projectBriefContent) {
        templates["productContext.md"] = templates["productContext.md"].replace(
          "## Project Goal\n\n*   ",
          `## Project Goal\n\n*Based on projectBrief.md content:*\n\n${projectBriefContent}\n\n*Extract and define project goals from the above content:*\n\n*   `
        );
      }

      // Create all files
      const createdFiles: string[] = [];
      for (const [filename, content] of Object.entries(templates)) {
        const filePath = path.join(memoryBankPath, filename);
        await fs.writeFile(filePath, content, "utf-8");
        createdFiles.push(filename);
      }

      return {
        content: [
          {
            type: "text",
            text: `[MEMORY BANK: INITIALIZED]

Memory Bank has been successfully initialized!

Created files:
${createdFiles.map((f) => `- ${f}`).join("\n")}

${
  projectBriefContent
    ? "✓ Read projectBrief.md and integrated into productContext.md\n\n"
    : ""
}

[ATTENTION] Next steps to execute:
1. Read and update each memory-bank/*.md file
2. Fill in relevant content following the guidance in each file
3. Do not use get-memory-bank-info before completing initial edits
4. After completing edits, you can start using Memory Bank

Important file descriptions:
- productContext.md: Define project goals, features, and architecture
- activeContext.md: Track current work status and focus
- progress.md: Manage task progress
- decisionLog.md: Record important decisions
- systemPatterns.md: Document code patterns and standards

Maintenance Tips:
- Keep each file under 300 lines for optimal performance
- Archive old content daily/weekly to memory-bank/archive/
- Use update-memory-bank tool for detailed maintenance guidance
- Check file sizes after each work session`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error initializing Memory Bank: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// Main function
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Memory Bank MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
