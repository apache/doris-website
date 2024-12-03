---
{
    "title": "SHOW COMPUTE GROUPS",
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

在存算分离模式中，显示当前用户有集群使用权限的计算集群列表

## 语法

```sql
SHOW COMPUTE GROUPS
```

## 返回值

返回当前拥有计算集群权限的集群列表

- Name - 计算集群 compute group 名字
- IsCurrent 当前用户是否正在使用这个 compute group
- Users 将此项 compute group 设置为 default compute group 的用户名
- BackendNum 此项 compute group 拥有的 backend 个数

## 示例

指定使用该计算集群 compute_cluster

```sql
 show compute groups;
```

结果为

```sql
+-----------------+-----------+-------+------------+
| Name            | IsCurrent | Users | BackendNum |
+-----------------+-----------+-------+------------+
| compute_cluster | TRUE      |       | 3          |
+-----------------+-----------+-------+------------+
```

## 注意事项（Usage Note）

若当前用户无任何 compute group 权限，show compute group 将返回空列表