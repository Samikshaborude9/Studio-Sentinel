# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from contextlib import AsyncExitStack
from types import TracebackType
from typing import Any, List, Optional, Tuple, Type

# Attempt to import MCP Tool from the MCP library, and hints user to upgrade
# their Python version to 3.10 if it fails.
try:
  from mcp import ClientSession, StdioServerParameters
  from mcp.client.sse import sse_client
  from mcp.client.stdio import stdio_client
  from mcp.types import ListToolsResult
except ImportError as e:
  import sys

  if sys.version_info < (3, 10):
    raise ImportError(
        'MCP Tool requires Python 3.10 or above. Please upgrade your Python'
        ' version.'
    ) from e
  else:
    raise e

from pydantic import BaseModel

from .mcp_tool import MCPTool


class SseServerParams(BaseModel):
  url: str
  headers: dict[str, Any] | None = None
  timeout: float = 5
  sse_read_timeout: float = 60 * 5


class MCPToolset:
  """Connects to a MCP Server, and retrieves MCP Tools into ADK Tools.

  Usage:
  Example 1: (using from_server helper):
  ```
  async def load_tools():
    return await MCPToolset.from_server(
      connection_params=StdioServerParameters(
          command='npx',
          args=["-y", "@modelcontextprotocol/server-filesystem"],
          )
    )

  # Use the tools in an LLM agent
  tools, exit_stack = await load_tools()
  agent = LlmAgent(
      tools=tools
  )
  ...
  await exit_stack.aclose()
  ```

  Example 2: (using `async with`):

  ```
  async def load_tools():
    async with MCPToolset(
      connection_params=SseServerParams(url="http://0.0.0.0:8090/sse")
    ) as toolset:
      tools = await toolset.load_tools()

      agent = LlmAgent(
          ...
          tools=tools
      )
  ```

  Example 3: (provide AsyncExitStack):
  ```
  async def load_tools():
    async_exit_stack = AsyncExitStack()
    toolset = MCPToolset(
      connection_params=StdioServerParameters(...),
    )
    async_exit_stack.enter_async_context(toolset)
    tools = await toolset.load_tools()
    agent = LlmAgent(
        ...
        tools=tools
    )
    ...
    await async_exit_stack.aclose()

  ```

  Attributes:
    connection_params: The connection parameters to the MCP server. Can be
      either `StdioServerParameters` or `SseServerParams`.
    exit_stack: The async exit stack to manage the connection to the MCP server.
    session: The MCP session being initialized with the connection.
  """

  def __init__(
      self, *, connection_params: StdioServerParameters | SseServerParams
  ):
    """Initializes the MCPToolset.

    Usage:
    Example 1: (using from_server helper):
    ```
    async def load_tools():
      return await MCPToolset.from_server(
        connection_params=StdioServerParameters(
            command='npx',
            args=["-y", "@modelcontextprotocol/server-filesystem"],
            )
      )

    # Use the tools in an LLM agent
    tools, exit_stack = await load_tools()
    agent = LlmAgent(
        tools=tools
    )
    ...
    await exit_stack.aclose()
    ```

    Example 2: (using `async with`):

    ```
    async def load_tools():
      async with MCPToolset(
        connection_params=SseServerParams(url="http://0.0.0.0:8090/sse")
      ) as toolset:
        tools = await toolset.load_tools()

        agent = LlmAgent(
            ...
            tools=tools
        )
    ```

    Example 3: (provide AsyncExitStack):
    ```
    async def load_tools():
      async_exit_stack = AsyncExitStack()
      toolset = MCPToolset(
        connection_params=StdioServerParameters(...),
      )
      async_exit_stack.enter_async_context(toolset)
      tools = await toolset.load_tools()
      agent = LlmAgent(
          ...
          tools=tools
      )
      ...
      await async_exit_stack.aclose()

    ```

    Args:
      connection_params: The connection parameters to the MCP server. Can be:
        `StdioServerParameters` for using local mcp server (e.g. using `npx` or
        `python3`); or `SseServerParams` for a local/remote SSE server.
    """
    if not connection_params:
      raise ValueError('Missing connection params in MCPToolset.')
    self.connection_params = connection_params
    self.exit_stack = AsyncExitStack()

  @classmethod
  async def from_server(
      cls,
      *,
      connection_params: StdioServerParameters | SseServerParams,
      async_exit_stack: Optional[AsyncExitStack] = None,
  ) -> Tuple[List[MCPTool], AsyncExitStack]:
    """Retrieve all tools from the MCP connection.

    Usage:
    ```
    async def load_tools():
      tools, exit_stack = await MCPToolset.from_server(
        connection_params=StdioServerParameters(
            command='npx',
            args=["-y", "@modelcontextprotocol/server-filesystem"],
        )
      )
    ```

    Args:
      connection_params: The connection parameters to the MCP server.
      async_exit_stack: The async exit stack to use. If not provided, a new
        AsyncExitStack will be created.

    Returns:
      A tuple of the list of MCPTools and the AsyncExitStack.
      - tools: The list of MCPTools.
      - async_exit_stack: The AsyncExitStack used to manage the connection to
        the MCP server. Use `await async_exit_stack.aclose()` to close the
        connection when server shuts down.
    """
    toolset = cls(connection_params=connection_params)
    async_exit_stack = async_exit_stack or AsyncExitStack()
    await async_exit_stack.enter_async_context(toolset)
    tools = await toolset.load_tools()
    return (tools, async_exit_stack)

  async def _initialize(self) -> ClientSession:
    """Connects to the MCP Server and initializes the ClientSession."""
    if isinstance(self.connection_params, StdioServerParameters):
      client = stdio_client(self.connection_params)
    elif isinstance(self.connection_params, SseServerParams):
      client = sse_client(
          url=self.connection_params.url,
          headers=self.connection_params.headers,
          timeout=self.connection_params.timeout,
          sse_read_timeout=self.connection_params.sse_read_timeout,
      )
    else:
      raise ValueError(
          'Unable to initialize connection. Connection should be'
          ' StdioServerParameters or SseServerParams, but got'
          f' {self.connection_params}'
      )

    transports = await self.exit_stack.enter_async_context(client)
    self.session = await self.exit_stack.enter_async_context(
        ClientSession(*transports)
    )
    await self.session.initialize()
    return self.session

  async def _exit(self):
    """Closes the connection to MCP Server."""
    await self.exit_stack.aclose()

  async def load_tools(self) -> List[MCPTool]:
    """Loads all tools from the MCP Server.

    Returns:
      A list of MCPTools imported from the MCP Server.
    """
    tools_response: ListToolsResult = await self.session.list_tools()
    return [
        MCPTool(mcp_tool=tool, mcp_session=self.session)
        for tool in tools_response.tools
    ]

  async def __aenter__(self):
    try:
      await self._initialize()
      return self
    except Exception as e:
      raise e

  async def __aexit__(
      self,
      exc_type: Optional[Type[BaseException]],
      exc: Optional[BaseException],
      tb: Optional[TracebackType],
  ) -> None:
    await self._exit()
