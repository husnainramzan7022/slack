/**
 * MCP Loader for Next.js
 * Handles dynamic loading of MCP modules with proper error handling
 */

export async function loadMCPModule() {
  try {
    // Import the built MCP module
    const mcpModule = await import('../dist/mcp/index.js');
    return mcpModule;
  } catch (error) {
    console.warn('Failed to load MCP module:', (error as any)?.message || error);
    console.warn('Make sure to run "npm run mcp:build" to build the MCP modules');
    return null;
  }
}

export async function executeMCPTool(serverId: string, toolName: string, args: any) {
  const mcpModule = await loadMCPModule();
  
  if (!mcpModule?.aiBrainMCP) {
    return { success: false, error: 'MCP not available' };
  }
  
  try {
    await mcpModule.aiBrainMCP.initialize();
    const result = await mcpModule.aiBrainMCP.executeTool(serverId, toolName, args);
    return { success: true, result };
  } catch (error) {
    console.error('MCP tool execution failed:', error);
    return { success: false, error: (error as any)?.message || 'MCP execution failed' };
  }
}