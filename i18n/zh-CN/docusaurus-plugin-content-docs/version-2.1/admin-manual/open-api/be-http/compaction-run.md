---
{
    "title": "触发 Compaction",
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



## Request

`POST /api/compaction/run?tablet_id={int}&compact_type={enum}`
`POST /api/compaction/run?table_id={int}&compact_type=full` 注意，table_id=xxx 只有在 compact_type=full 时指定才会生效。
`GET /api/compaction/run_status?tablet_id={int}`


## Description

用于手动触发 Compaction 以及状态查询。

## Query parameters

* `tablet_id`
    
    - tablet 的 id

* `table_id`
   
    - table 的 id。注意，table_id=xxx 只有在 compact_type=full 时指定才会生效，并且 tablet_id 和 table_id 只能指定一个，不能够同时指定，指定 table_id 后会自动对此 table 下所有 tablet 执行 full_compaction。

* `compact_type`
  
    - 取值为`base`或`cumulative`或`full`。full_compaction 的使用场景请参考[数据恢复](../../data-admin/restore.md)。


## Request body

无

## Response

### 触发 Compaction

若 tablet 不存在，返回 JSON 格式的错误：

```json
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```

若 compaction 执行任务触发失败时，返回 JSON 格式的错误：

```json
{
    "status": "Fail",
    "msg": "fail to execute compaction, error = -2000"
}
```

若 compaction 执行触发成功时，则返回 JSON 格式的结果：

```json
{
    "status": "Success",
    "msg": "compaction task is successfully triggered."
}
```

结果说明：

* status：触发任务状态，当成功触发时为 Success；当因某些原因（比如，没有获取到合适的版本）时，返回 Fail。

* msg：给出具体的成功或失败的信息。

### 查询状态

若 tablet 不存在，返回 JSON 格式：

```json
{
    "status": "Fail",
    "msg": "Tablet not found"
}
```

若 tablet 存在并且 tablet 不在正在执行 compaction，返回 JSON 格式：

```json
{
    "status" : "Success",
    "run_status" : false,
    "msg" : "this tablet_id is not running",
    "tablet_id" : 11308,
    "schema_hash" : 700967178,
    "compact_type" : ""
}
```

若 tablet 存在并且 tablet 正在执行 compaction，返回 JSON 格式：

```json
{
    "status" : "Success",
    "run_status" : true,
    "msg" : "this tablet_id is running",
    "tablet_id" : 11308,
    "schema_hash" : 700967178,
    "compact_type" : "cumulative"
}
```

结果说明：

* run_status：获取当前手动 compaction 任务执行状态

### Examples

```shell
curl -X POST "http://127.0.0.1:8040/api/compaction/run?tablet_id=10015&compact_type=cumulative"
```