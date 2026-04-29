---
{
    "title": "基于导入的批量删除",
    "language": "zh-CN",
    "description": "Doris 主键模型支持通过导入数据时携带删除标记实现批量删除，适用于 CDC 同步与大规模主键删除场景，性能优于 DELETE 语句。",
    "keywords": [
        "Doris 批量删除",
        "Unique Key 删除",
        "删除标记",
        "__DORIS_DELETE_SIGN__",
        "CDC 同步",
        "merge_type DELETE",
        "Stream Load 删除",
        "Broker Load 删除",
        "Routine Load 删除"
    ]
}
---

<!-- 知识类型: 操作步骤 + 特性说明 -->
<!-- 适用场景: CDC 同步 / 大规模主键删除 / 数据合并写入 -->

**基于导入的批量删除**是 Doris 主键模型（Unique Key）提供的一种删除方式：通过在导入数据时携带 **删除标记列**，将待删除行标记为已删除，由后台 Compaction 异步清理。

相比 `DELETE` 语句，删除标记在批量删除与 CDC 场景下具有更高的性能和易用性。

### 适用场景

| 场景 | 说明 |
|------|------|
| **CDC 同步** | 从 OLTP 数据库（如 MySQL）通过 binlog 同步到 Doris，binlog 中 Insert 与 Delete 交替出现，使用删除标记可统一处理两类操作，简化代码并提升导入与查询性能。 |
| **批量删除指定主键** | 需要按主键删除大量数据时，`DELETE` 语句每次执行都会生成一个空 Rowset 并产生新的数据版本，频繁删除会显著影响查询性能；删除标记则可批量写入，避免该问题。 |

### 与 DELETE 语句对比

| 对比项 | 基于导入的批量删除 | DELETE 语句 |
|------|------|------|
| 适用模型 | Unique Key | Unique Key / Aggregate Key / Duplicate Key |
| 触发方式 | 导入时携带删除标记 | 执行 SQL |
| 数据版本 | 与导入共用版本 | 每次产生新版本 |
| 大批量删除性能 | 高 | 低 |
| CDC 场景适配 | 原生支持 | 需额外处理 |

---

## 工作原理

<!-- 知识类型: 概念说明 -->

### 核心机制

- **隐藏列**：每张 Unique Key 表都包含隐藏列 `__DORIS_DELETE_SIGN__`，值为 `1` 表示该行被标记为删除。
- **导入写入**：导入任务可通过映射条件指定哪些行写入删除标记，不同导入方式语法略有不同。
- **查询过滤**：FE 在查询规划阶段自动追加 `__DORIS_DELETE_SIGN__ != true` 过滤条件，使被标记的行对用户不可见。
- **后台清理**：BE 的 Compaction 过程会定期物理清理被标记为删除的数据。

### 数据示例

#### 步骤 1：建表

创建一张 Unique Key 表：

```sql
CREATE TABLE example_table (
    id BIGINT NOT NULL,
    value STRING
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_num" = "3"
);
```

#### 步骤 2：查看隐藏列

通过 session 变量 `show_hidden_columns` 显示隐藏列：

```sql
mysql> set show_hidden_columns=true;

mysql> desc example_table;
+-----------------------+---------+------+-------+---------+-------+
| Field                 | Type    | Null | Key   | Default | Extra |
+-----------------------+---------+------+-------+---------+-------+
| id                    | bigint  | No   | true  | NULL    |       |
| value                 | text    | Yes  | false | NULL    | NONE  |
| __DORIS_DELETE_SIGN__ | tinyint | No   | false | 0       | NONE  |
| __DORIS_VERSION_COL__ | bigint  | No   | false | 0       | NONE  |
+-----------------------+---------+------+-------+---------+-------+
```

#### 步骤 3：写入删除标记

假设表中已有以下数据：

```sql
+------+-------+
| id   | value |
+------+-------+
|    1 | foo   |
|    2 | bar   |
+------+-------+
```

通过 `INSERT INTO` 为 `id = 1` 的行写入删除标记（仅作原理演示，实际生产请使用对应导入方式）：

```sql
mysql> insert into example_table (id, __DORIS_DELETE_SIGN__) values (1, 1);
```

#### 步骤 4：验证查询结果

默认查询会自动过滤被标记的行：

```sql
mysql> select * from example_table;
+------+-------+
| id   | value |
+------+-------+
|    2 | bar   |
+------+-------+
```

开启 `show_hidden_columns` 后可看到 `id = 1` 的行仍存在，仅被标记：

```sql
mysql> set show_hidden_columns=true;
mysql> select * from example_table;
+------+-------+-----------------------+-----------------------+
| id   | value | __DORIS_DELETE_SIGN__ | __DORIS_VERSION_COL__ |
+------+-------+-----------------------+-----------------------+
|    1 | NULL  |                     1 |                     3 |
|    2 | bar   |                     0 |                     2 |
+------+-------+-----------------------+-----------------------+
```

---

## 导入合并方式

<!-- 知识类型: 配置参数 -->

导入任务通过 `merge_type` 控制数据合并行为，共支持三种方式：

| merge_type | 行为 | 典型用途 |
|------|------|------|
| **APPEND**（默认） | 数据全部追加到现有数据中 | 普通写入 |
| **DELETE** | 删除所有与导入数据 Key 列相同的行 | 按主键批量删除 |
| **MERGE** | 根据 `DELETE ON` 条件判断每行执行 APPEND 或 DELETE | CDC 场景，Insert/Delete 混合 |

> 提示：`MERGE` 必须与 `DELETE ON <condition>` 配合使用。

---

## 各导入方式语法

<!-- 知识类型: 操作步骤 -->

不同导入方式设置删除标记的语法略有差异，以下分别说明。

### Stream Load

**写法**：在 HTTP Header 中通过 `columns`、`merge_type`、`delete` 三个字段配置。

**示例**：

```bash
-H "columns: k1, k2, label_c3"
-H "merge_type: [MERGE|APPEND|DELETE]"
-H "delete: label_c3=1"
```

**参数说明**：

- `columns`：导入字段映射，需包含用于判断删除的标记列。
- `merge_type`：合并方式，取值 `APPEND` / `DELETE` / `MERGE`。
- `delete`：当 `merge_type=MERGE` 时生效，指定删除条件。

更多示例请参阅 [Stream Load 使用手册](../import/import-way/stream-load-manual.md) 中"指定 merge_type 进行 Delete 操作"与"指定 merge_type 进行 Merge 操作"章节。

### Broker Load

**写法**：在 `LOAD` 子句中通过 `[MERGE|APPEND|DELETE]` 关键字与 `DELETE ON` 子句指定删除标记。

**语法示例**：

```sql
LOAD LABEL db1.label1
(
    [MERGE|APPEND|DELETE] DATA INFILE("hdfs://abc.com:8888/user/palo/test/ml/file1")
    INTO TABLE tbl1
    COLUMNS TERMINATED BY ","
    (tmp_c1, tmp_c2, label_c3)
    SET
    (
        id = tmp_c2,
        name = tmp_c1
    )
    [DELETE ON label_c3=true]
)
WITH BROKER 'broker'
(
    "username" = "user",
    "password" = "pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### Routine Load

**写法**：在创建例行导入作业时通过 `WITH [MERGE|APPEND|DELETE]` 与 `DELETE ON` 子句指定删除标记。

**语法示例**：

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
[WITH MERGE|APPEND|DELETE]
COLUMNS(k1, k2, k3, v1, v2, label),
WHERE k1 > 100 and k2 like "%doris%"
[DELETE ON label=true]
PROPERTIES
(
    "desired_concurrent_number" = "3",
    "max_batch_interval" = "20",
    "max_batch_rows" = "300000",
    "max_batch_size" = "209715200",
    "strict_mode" = "false"
)
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic",
    "kafka_partitions" = "0,1,2,3",
    "kafka_offsets" = "101,0,0,200"
);
```

---

## FAQ

<!-- 知识类型: 常见问题 -->

**Q1：基于导入的批量删除支持哪些表模型？**

仅支持主键模型（Unique Key）表。Aggregate Key 与 Duplicate Key 表请使用 `DELETE` 语句。

**Q2：被标记删除的数据何时真正释放磁盘空间？**

由 BE 的后台 Compaction 异步清理，时间取决于 Compaction 调度与数据版本数，通常无需用户干预。

**Q3：如何查看一行是否已被标记删除？**

执行 `SET show_hidden_columns=true;` 后查询，可看到隐藏列 `__DORIS_DELETE_SIGN__`，值为 `1` 表示已标记删除。

**Q4：CDC 场景应选择哪种 merge_type？**

推荐使用 `MERGE`，配合 `DELETE ON` 指定删除条件，可在同一次导入中混合处理 Insert 与 Delete。

**Q5：删除标记会影响查询性能吗？**

正常查询会自动过滤被标记行，性能影响可忽略；后台 Compaction 完成后，被标记数据将被物理清理。

---

## 相关链接

- [Stream Load 使用手册](../import/import-way/stream-load-manual.md)
- [Broker Load 使用手册](../import/import-way/broker-load-manual.md)
- [Routine Load 使用手册](../import/import-way/routine-load-manual.md)
