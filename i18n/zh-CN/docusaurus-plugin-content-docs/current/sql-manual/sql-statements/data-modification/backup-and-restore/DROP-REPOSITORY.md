---
{
    "title": "DROP REPOSITORY",
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

该语句用于删除一个已创建的仓库。

## 语法

```sql
DROP REPOSITORY <repo_name>;
```

## 必选参数
**<repo_name>**
> 仓库的唯一名称

## 权限控制
| 权限	          | 对象       | 说明                            |
|:-------------|:---------|:------------------------------|
| ADMIN_PRIV   | 整个集群管理权限 | 仅 root 或 superuser 用户可以创建仓库   |


## 注意事项
- 删除仓库，仅仅是删除该仓库在 Doris 中的映射，不会删除实际的仓库数据。删除后，可以再次通过指定相同的 LOCATION 映射到该仓库。


## 举例
删除名为 example_repo 的仓库：

```sql
DROP REPOSITORY `example_repo`;
```
