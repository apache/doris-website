---
{
    "title": "Overview",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

In Doris, table names are case-sensitive by default. You can configure [lower_case_table_names](../admin-manual/config/fe-config.md)to make them case-insensitive during the initial cluster setup. The default maximum length for table names is 64 bytes, but you can change this by configuring [table_name_length_limit](../admin-manual/config/fe-config.md). It is not recommended to set this value too high. For syntax on creating tables, please refer to [CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE.md).