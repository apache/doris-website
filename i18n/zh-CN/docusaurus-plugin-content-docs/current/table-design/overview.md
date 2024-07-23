---
{
    "title": "概览",
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

Doris 中表名默认是大小写敏感的，可以在第一次初始化集群时配置[lower_case_table_names](../admin-manual/config/fe-config.md)为大小写不敏感的。默认的表名最大长度为 64 字节，可以通过配置[table_name_length_limit](../admin-manual/config/fe-config.md)更改，不建议配置过大。创建表的语法请参考[CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE.md)。