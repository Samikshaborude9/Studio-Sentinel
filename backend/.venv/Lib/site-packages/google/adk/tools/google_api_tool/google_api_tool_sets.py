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


import logging

from .google_api_tool_set import GoogleApiToolSet

logger = logging.getLogger(__name__)

calendar_tool_set = GoogleApiToolSet.load_tool_set(
    api_name="calendar",
    api_version="v3",
)

bigquery_tool_set = GoogleApiToolSet.load_tool_set(
    api_name="bigquery",
    api_version="v2",
)

gmail_tool_set = GoogleApiToolSet.load_tool_set(
    api_name="gmail",
    api_version="v1",
)

youtube_tool_set = GoogleApiToolSet.load_tool_set(
    api_name="youtube",
    api_version="v3",
)

slides_tool_set = GoogleApiToolSet.load_tool_set(
    api_name="slides",
    api_version="v1",
)

sheets_tool_set = GoogleApiToolSet.load_tool_set(
    api_name="sheets",
    api_version="v4",
)

docs_tool_set = GoogleApiToolSet.load_tool_set(
    api_name="docs",
    api_version="v1",
)
