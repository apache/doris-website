{
    "title": "Variant",
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

VARIANT 类型可以存储半结构化的 JSON 数据，允许存储包含不同数据类型（如整数、字符串、布尔值等）的复杂数据结构，而无需在表结构中预先定义具体的列。该类型特别适合处理复杂的嵌套结构，这些结构可能会随时发生变化。在写入过程中，VARIANT 类型能够自动推断列的结构和类型，动态合并写入的 schema，并通过将 JSON 键及其对应的值存储为列和动态子列。更多文档请参考[VARIANT](../../../sql-manual/sql-data-types/semi-structured/VARIANT.md)。

## 使用限制

支持 CSV 和 JSON 格式。

## CSV 格式导入

### 第 1 步：准备数据

创建名为 `test_variant.csv` 的 CSV 文件，内容如下：

```SQL
14186154924|PushEvent|{"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}|{"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}|{"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}|1|2020-11-14 02:00:00
```

### 第 2 步：在库中创建表

执行以下 SQL 语句创建表：

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10
properties("replication_num" = "1");
```

### 第 3 步：导入数据

以stream load为例，使用以下命令导入数据：

```SQL
curl --location-trusted -u root:  -T test_variant.csv -H "column_separator:|" http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

导入结果示例：

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### 第 4 步：检查导入数据

使用以下 SQL 查询检查导入的数据：

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```

## JSON 格式导入

### 第 1 步：准备数据

创建名为 `test_variant.json` 的 JSON 文件，内容如下：

```SQL
{"id": "14186154924","type": "PushEvent","actor": {"id": 282080,"login":"brianchandotcom","display_login": "brianchandotcom","gravatar_id": "","url": "https://api.github.com/users/brianchandotcom","avatar_url": "https://avatars.githubusercontent.com/u/282080?"},"repo": {"id": 1920851,"name": "brianchandotcom/liferay-portal","url": "https://api.github.com/repos/brianchandotcom/liferay-portal"},"payload": {"push_id": 6027092734,"size": 4,"distinct_size": 4,"ref": "refs/heads/master","head": "91edd3c8c98c214155191feb852831ec535580ba","before": "abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits": [""]},"public": true,"created_at": "2020-11-13T18:00:00Z"}
```

### 第 2 步：在库中创建表

执行以下 SQL 语句创建表：

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

### 第 3 步：导入数据

以stream load为例，使用以下命令导入数据：

```SQL
curl --location-trusted -u root:  -T test_variant.json -H "format:json"  http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

导入结果示例：

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### 第 4 步：检查导入数据

使用以下 SQL 查询检查导入的数据：

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```