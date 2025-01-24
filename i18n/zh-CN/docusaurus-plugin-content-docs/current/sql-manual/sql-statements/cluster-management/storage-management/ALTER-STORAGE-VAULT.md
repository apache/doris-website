---
{
"title": "ALTER STORAGE VAULT",
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

更改 Storage Vault 的可修改属性值

## 语法

```sql
ALTER STORAGE VAULT <storage_vault_name>
PROPERTIES (<storage_vault_property>)
```

## 必选参数

**<storage_vault_property>**

> - type：可选值为 s3, hdfs
>
> 
>
> 当 type 为 s3 时，允许出现的属性字段如下：
>
> - s3.access_key：s3 vault 的 ak
> - s3.secret_key：s3 vault 的 sk
> - vault_name：vault 的 名字。
> - use_path_style：是否允许 path style url，可选值为 true，false。默认值是 false。
>
> 
>
> 当 type 为 hdfs 时，禁止出现的字段：
>
> - path_prefix：存储路径前缀
> - fs.defaultFS：hdfs name

## 权限控制

执行此 SQL 命令的用户必须至少具有 ADMIN_PRIV 权限。

## 示例

修改 s3 storage vault ak

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="S3",
  "VAULT_NAME" = "new_vault_name",
   "s3.access_key" = "new_ak"
);
```

修改 hdfs storage vault 

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="hdfs",
  "VAULT_NAME" = "new_vault_name",
  "hadoop.username" = "hdfs"
);
```