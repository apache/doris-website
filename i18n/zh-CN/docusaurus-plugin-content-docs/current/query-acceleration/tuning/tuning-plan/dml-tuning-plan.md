---
{
    "title": "DML 计划调优",
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

DML 计划调优首先需要定位是导入引起的性能瓶颈，还是查询部分引起的性能瓶颈。查询部分的性能瓶颈的排查和调优详见[计划调优](optimizing-table-schema.md)其他小节。

Doris 支持从多种数据源导入数据，灵活运用 Doris 提供的多种导入功能，可以高效地将各种来源的数据导入到 Doris 中进行分析。最佳实践详情请参考[导入概览](../../../data-operate/import/load-manual.md)。
