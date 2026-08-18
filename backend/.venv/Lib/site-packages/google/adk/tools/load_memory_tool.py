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

from __future__ import annotations

from typing import TYPE_CHECKING

from typing_extensions import override

from .function_tool import FunctionTool
from .tool_context import ToolContext

if TYPE_CHECKING:
  from ..models import LlmRequest
  from ..memory.base_memory_service import MemoryResult


def load_memory(query: str, tool_context: ToolContext) -> 'list[MemoryResult]':
  """Loads the memory for the current user."""
  response = tool_context.search_memory(query)
  return response.memories


class LoadMemoryTool(FunctionTool):
  """A tool that loads the memory for the current user."""

  def __init__(self):
    super().__init__(load_memory)

  @override
  async def process_llm_request(
      self,
      *,
      tool_context: ToolContext,
      llm_request: LlmRequest,
  ) -> None:
    await super().process_llm_request(
        tool_context=tool_context, llm_request=llm_request
    )
    # Tell the model about the memory.
    llm_request.append_instructions(["""
You have memory. You can use it to answer questions. If any questions need
you to look up the memory, you should call load_memory function with a query.
"""])


load_memory_tool = LoadMemoryTool()
