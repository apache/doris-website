---
{
    "title": "从回收站恢复",
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

## 数据生命周期

当用户执行`DROP DATABASE/TABLE/PARTITION`命令而不使用`FORCE`时，Doris会将删除的数据库、表或分区移动到回收站。可以使用`RECOVER`命令从回收站恢复已删除的数据库、表或分区的所有数据，使其再次可见。

## 从回收站恢复

为了避免因误操作造成的灾难，Doris支持意外删除的数据库、表和分区的数据恢复。在删除表或数据库后，Doris不会立即物理删除数据。相反，它会在一定时间内将其移动到垃圾箱（默认是1天，可以通过`catalog_trash_expire_second`参数在`fe.conf`中进行配置）。管理员可以使用`RECOVER`命令恢复意外删除的数据。

**注意：** 如果使用`DROP FORCE`执行删除，则数据将立即被删除，无法恢复。

### 查询回收站

您可以使用以下命令查询回收站：

```sql
SHOW CATALOG RECYCLE BIN [WHERE NAME [= "name" | LIKE "name_matcher"]];
```

有关更详细的语法和最佳实践，请参阅[SHOW-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/Show-Statements/SHOW-CATALOG-RECYCLE-BIN.md)命令手册，您还可以在MySql客户端命令行中输入`help SHOW CATALOG RECYCLE BIN`以获取更多帮助。

### 开始数据恢复

要恢复已删除的数据，您可以使用以下命令：

1. *恢复名为`example_db`的数据库*：

```sql
RECOVER DATABASE example_db;
```

2. *恢复名为`example_tbl`的表*：

```sql
RECOVER TABLE example_db.example_tbl;
```

3. *恢复表`example_tbl`中的分区p1*：

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

有关RECOVER使用的更详细的语法和最佳实践，请参阅[RECOVER](../../sql-manual/sql-statements/Database-Administration-Statements/RECOVER.md)命令手册，您还可以在MySql客户端命令行中输入`HELP RECOVER`以获取更多帮助。
