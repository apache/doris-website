---
{
    "title": "SQL 拦截",
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

该功能用于限制执行 SQL 语句（DDL / DML 都可限制）。

支持按用户配置 SQL 的拦截规则，如使用正则表达式匹配和拦截 SQL，或使用支持的规则进行拦截。

## 创建和管理规则

### 创建规则

更多创建语法请参阅[CREATE SQL BLOCK RULE](../../sql-manual/sql-statements/data-governance/CREATE-SQL_BLOCK_RULE)

- `sql`：匹配规则 (基于正则匹配，特殊字符需要转译)，可选，默认值为 "NULL"
- `sqlHash`: sql hash 值，用于完全匹配，我们会在`fe.audit.log`打印这个值，可选，这个参数和 SQL 只能二选一，默认值为 "NULL"
- `partition_num`: 一个扫描节点会扫描的最大 Partition 数量，默认值为 0L
- `tablet_num`: 一个扫描节点会扫描的最大 Tablet 数量，默认值为 0L。
- `cardinality`: 一个扫描节点粗略的扫描行数，默认值为 0L
- `global`：是否全局 (所有用户) 生效，默认为 false
- `enable`：是否开启阻止规则，默认为 true

示例：

```sql
CREATE SQL_BLOCK_RULE test_rule1 
PROPERTIES(
  "sql"="select \\* from order_analysis",
  "global"="false",
  "enable"="true",
  "sqlHash"=""
);

CREATE SQL_BLOCK_RULE test_rule2
PROPERTIES(
	"partition_num" = "30",
	"cardinality"="10000000000",
	"global"="false",
	"enable"="true"
)
```

:::note
注意：这里 SQL 语句最后不要带分号
:::

从 2.1.6 版本开始，SQL 拦截规则支持外部表（External Catalog 中的表）。

- `sql`：和内表含义一致。
- `sqlHash`: 和内表含义一致。
- `partition_num`：和内表含义一致。
- `tablet_num`：限制外表的扫描的分片数量。不同的数据源，分片的定义不尽相同。比如 Hive 表中的文件分片，Hudi 表中的增量数据分片等。
- `cardinality`：和内表含义一致，限制扫描行数。只有当外表存在行数统计信息时（如通过手动或自动统计信息采集后），该参数才会生效。

### 绑定规则

`global` 为 `true` 的规则是全局生效的，不需要绑定到具体用户。

`global` 为 `false` 的规则，需要绑定到指定用户。一个用户可以绑定多个规则，多个规则使用 `,` 分隔：

```sql
SET PROPERTY [FOR 'jack'] 'sql_block_rules' = 'test_rule1,test_rule2'
```

### 查看规则

- 查看已配置的 SQL 阻止规则

	不指定规则名则为查看所有规则，具体语法请参阅 [SHOW SQL BLOCK RULE](../../sql-manual/sql-statements/data-governance/SHOW-SQL_BLOCK_RULE)

	```sql
	SHOW SQL_BLOCK_RULE [FOR RULE_NAME]
	```

- 查看用户绑定的规则

	```sql
	SHOW PROPERTY FOR user_name;
	```

### 修改规则

允许对 sql/sqlHash/partition_num/tablet_num/cardinality/global/enable 等每一项进行修改，具体语法请参阅[ALTER SQL BLOCK  RULE](../../sql-manual/sql-statements/data-governance/ALTER-SQL_BLOCK_RULE)

- `sql` 和 `sqlHash` 不能同时被设置。

	如果一个 rule 设置了 `sql` 或者 `sqlHash`，则另一个属性将无法被修改。

- `sql`/`sqlHash` 和 `partition_num`/`tablet_num`/`cardinality` 不能同时被设置

	举例，如果一个 rule 设置了 `partition_num`，那么 `sql` 或者 `sqlHash` 将无法被修改。

```sql
ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
```

```sql
ALTER SQL_BLOCK_RULE test_rule2 PROPERTIES("partition_num" = "10","tablet_num"="300","enable"="true")
```

### 删除规则

支持同时删除多个规则，以 `,` 隔开，具体语法请参阅 [DROP SQL BLOCK RULE](../../sql-manual/sql-statements/data-governance/DROP-SQL_BLOCK_RULE)

```
DROP SQL_BLOCK_RULE test_rule1,test_rule2
```

## 触发规则

当我们去执行刚才我们定义在规则里的 SQL 时就会返回异常错误，示例如下：

```sql
mysql> select * from order_analysis;
ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: order_analysis_rule
```
