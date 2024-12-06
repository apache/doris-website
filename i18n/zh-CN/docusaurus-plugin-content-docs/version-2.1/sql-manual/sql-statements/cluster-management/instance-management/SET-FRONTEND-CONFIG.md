---
{
    "title": "SET FRONTEND CONFIG",
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

该语句用于设置集群的配置项（当前仅支持设置 FE 的配置项）。

可设置的配置项，可以通过 `SHOW FRONTEND CONFIG;` 命令查看。

语法：

```sql
ADMIN SET FRONTEND CONFIG ("key" = "value") [ALL];
-- or
ADMIN SET ALL FRONTENDS CONFIG ("key" = "value");
```

:::tip 提示   
  
- 2.0.11 和 2.1.5 版本开始支持 `ALL` 关键词。使用 `ALL` 关键字后配置参数将应用于所有 FE(除 `master_only` 参数外)。
- 该语法不会持久化修改的配置，FE 重启后，修改的配置失效。如需持久化，需要在 fe.conf 中同步添加配置项。

:::

## 示例

1. 设置 `disable_balance` 为 true

    `ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");`

## 关键词

    ADMIN, SET, CONFIG

## 最佳实践
