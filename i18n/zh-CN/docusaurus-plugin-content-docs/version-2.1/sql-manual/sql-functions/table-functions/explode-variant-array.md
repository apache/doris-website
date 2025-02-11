---
{
"title": "EXPLODE_VARIANT_ARRAY",
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

## 描述

`explode_variant_array` 表函数，接受一个 variant 类型，其中每个元素是 JSON 对象类型，将该 json 数组中的每个 json 对象展开为多行，每行包含一个 JSON 对象。配合 LATERAL VIEW 使用。

## 语法

```sql
EXPLODE_VARIANT_ARRAY(<variant>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<variant>` | variant 类型 |

## 返回值

展开 JSON 数组，每个元素生成一行，返回 JSON 对象列。

## 举例

```sql
CREATE TABLE `simple_nested_test` (
  `k` bigint NULL,
  `v` variant NULL
) ENGINE=OLAP
DUPLICATE KEY(`k`)
DISTRIBUTED BY HASH(`k`) BUCKETS 8
PROPERTIES (
"file_cache_ttl_seconds" = "0",
"is_being_synced" = "false",
"storage_medium" = "hdd",
"storage_format" = "V2",
"inverted_index_storage_format" = "V2",
"light_schema_change" = "true",
"disable_auto_compaction" = "false",
"variant_enable_flatten_nested" = "true",
"enable_single_replica_compaction" = "false",
"group_commit_interval_ms" = "10000",
"group_commit_data_bytes" = "134217728"
);
```

```sql
insert into simple_nested_test values(1, '{
  "eventId": 1,
  "firstName": "Name1",
  "lastName": "Eric",
  "body": {
    "phoneNumbers": [
      {
        "number": "1111111111",
        "type": "GSM",
        "callLimit": 5
      },
      {
        "number": "222222222",
        "type": "HOME",
        "callLimit": 3
      },
      {
        "number": "33333333",
        "callLimit": 2,
        "type": "WORK"
      }
    ]
  }
}');
```

```sql
select v['eventId'], phone_numbers
    from simple_nested_test lateral view explode_variant_array(v['body']['phoneNumbers']) tmp1 as phone_numbers
    where phone_numbers['type'] = 'GSM' OR phone_numbers['type'] = 'HOME' and phone_numbers['callLimit'] > 2;   
```

```text
+--------------------------+----------------------------------------------------+
| element_at(v, 'eventId') | phone_numbers                                      |
+--------------------------+----------------------------------------------------+
| 1                        | {"callLimit":5,"number":"1111111111","type":"GSM"} |
| 1                        | {"callLimit":3,"number":"222222222","type":"HOME"} |
+--------------------------+----------------------------------------------------+
```