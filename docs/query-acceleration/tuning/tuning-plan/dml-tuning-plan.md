---
{
    "title": "DML Tuning Plan",
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

For DML plan tuning, it is first necessary to identify whether the performance bottleneck is caused by the import process or the query section. For the troubleshooting and tuning of performance bottlenecks in the query section, please refer to other subsections in [Plan Tuning](optimizing-table-schema.md) for details.

Doris supports importing data from multiple data sources. By flexibly utilizing the various import functions provided by Doris, data from various sources can be efficiently imported into Doris for analysis. For details of best practices, please refer to [Import Overview](../../../data-operate/import/load-manual.md). 