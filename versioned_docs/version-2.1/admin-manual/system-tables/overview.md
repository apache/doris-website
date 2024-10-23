---
{
    "title": "Overview",
    "language": "en"
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

The information_schema database in Doris is a special virtual database that contains metadata about the Doris cluster and all its database objects. These objects include databases, tables, columns, privileges, and more. Within the information_schema database, there are multiple read-only tables, which are actually views rather than real tables. Therefore, only SELECT operations can be performed on these tables, and data modification operations such as INSERT, UPDATE, DELETE, etc., are not allowed.