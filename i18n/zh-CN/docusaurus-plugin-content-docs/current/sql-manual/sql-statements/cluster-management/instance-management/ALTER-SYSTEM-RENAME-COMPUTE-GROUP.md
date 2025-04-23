---
{
    "title": "ALTER-SYSTEM-RENAME-COMPUTE-GROUP",
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

## ALTER-SYSTEM-RENAME-COMPUTE-GROUP

### Name

ALTER SYSTEM RENAME COMPUTE-GROUP

### Description

用于重命名计算组（仅限管理员使用！）

语法：

- 在存算分离集群中，该语句用于重命名现有的计算组。此操作是同步的，命令返回即表示执行完毕。

```sql
ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>
```

说明：
1. 计算组的命名规则与DORIS中库表名的命名规则一致。
2. 当前存算分离集群中的所有计算组，可以通过[显示计算组](../Show-Statements/SHOW-COMPUTE-GROUPS.md)查看。
3. 重命名操作完成后，也可以通过[显示计算组](../Show-Statements/SHOW-COMPUTE-GROUPS.md)进行确认。
4. 如果重命名操作失败，可以根据返回的提示信息查找原因，例如原计算组不存在，或者原计算组名称与目标计算组名称相同等。

### Example

1. 将名为 old_name 的计算组重命名为 new_name

```sql
ALTER SYSTEM RENAME COMPUTE GROUP <old_name> <new_name>
```

### Keywords

ALTER, SYSTEM, RENAME, ALTER SYSTEM
