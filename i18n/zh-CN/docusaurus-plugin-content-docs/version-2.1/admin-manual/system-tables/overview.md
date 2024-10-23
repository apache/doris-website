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

Doris 中的 information_schema 库是一个特殊的虚拟数据库，它包含了关于 Doris 集群 及其所有数据库对象的元数据。这些对象包括数据库、表、列、权限等。在 information_schema 库中，存在多张只读表，它们实际上是视图而不是真实的表。因此，在这些表上只能执行 SELECT 操作，而不能执行 INSERT，UPDATE，DELETE 等数据修改操作。

本章节将分别介绍所属数据库 `information_schema`、`mysql`、 `__internal_schema` 下的各类表信息。