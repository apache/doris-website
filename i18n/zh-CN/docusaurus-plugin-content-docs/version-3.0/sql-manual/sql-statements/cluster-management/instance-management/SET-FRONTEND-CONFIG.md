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

## 语法：

```sql
ADMIN SET {ALL FRONTENDS | FRONTEND} CONFIG ("<fe_config_key>" = "<fe_config_value>")
```

## 必选参数
1. **`ALL FRONTENDS`**
   > 代表 Doris 集群中的所有 FE 节点
2. **`FRONTEND`**
   > 代表当前连接的 FE 节点，即用户当前交互的 FE 节点


## 可选参数
需要修改的 `<fe_config_key>`、`<fe_config_value>` 可通过 [SHOW FRONTEND CONFIG](./SHOW-FRONTEND-CONFIG) 命令查看

:::tip 提示

- 使用 `ALL` 关键字后配置参数将应用于所有 FE(除 `master_only` 参数外)。
- 该语法不会持久化修改的配置，FE 重启后，修改的配置失效。如需持久化，需要在 fe.conf 中同步添加配置项。

:::

## 示例

1. 设置 `disable_balance` 为 `true`

    ```sql
   ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");
   ```

2. 设置所有 FE 节点的 `disable_balance` 为 `true`
   ```sql
   ADMIN SET ALL FRONTENDS CONFIG ("disable_balance" = "true");
   ```