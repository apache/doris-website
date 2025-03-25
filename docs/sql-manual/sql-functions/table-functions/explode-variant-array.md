---
{
"title": "EXPLODE_VARIANT_ARRAY",
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

## Description

The `explode_variant_array` table function accepts one or more variant type, where each element is a JSON object, and expands each JSON object in the array into multiple rows, with each row containing one JSON object. It is used in conjunction with LATERAL VIEW.

## Syntax
```sql
EXPLODE_VARIANT_ARRAY(<variant>[, <variant>])
```

## Return Value

| Parameter | Description |
| -- | -- |
| `<variant>` | variant type |

## Parameters

Expands the JSON array, creating a row for each element, returning a JSON object column.

## Examples

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
  },
  "hobbies": ["Swimming", "Programming", "Music", "Photography"]
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

```sql
select v['eventId'], phone_numbers, hobbies
    from simple_nested_test lateral view explode_variant_array(v['body']['phoneNumbers'], v['hobbies']) tmp1 as phone_numbers,hobbies
    where phone_numbers['type'] = 'GSM' OR phone_numbers['type'] = 'HOME' and phone_numbers['callLimit'] > 2;   
```

```text
+--------------+----------------------------------------------------+-------------+
| v['eventId'] | phone_numbers                                      | hobbies     |
+--------------+----------------------------------------------------+-------------+
| 1            | {"callLimit":5,"number":"1111111111","type":"GSM"} | Swimming    |
| 1            | {"callLimit":3,"number":"222222222","type":"HOME"} | Programming |
+--------------+----------------------------------------------------+-------------+
```