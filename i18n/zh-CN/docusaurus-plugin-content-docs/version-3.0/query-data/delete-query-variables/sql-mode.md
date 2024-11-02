---
{
"title": "SQL Mode",
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



Doris 新支持的 SQL Mode 参照了 Mysql 的 SQL Mode 管理机制，每个客户端都能设置自己的 SQL Mode，拥有 Admin 权限的数据库管理员可以设置全局 SQL Mode。

## SQL Mode 介绍

SQL Mode 使用户能在不同风格的 sql 语法和数据校验严格度间做切换，使 Doris 对其他数据库有更好的兼容性。例如在一些数据库里，'||'符号是一个字符串连接符，但在 Doris 里却是与'or'等价的，这时用户只需要使用 SQL Mode 切换到自己想要的风格。每个客户端都能设置 SQL Mode，并在当前对话中有效，只有拥有 Admin 权限的用户可以设置全局 SQL Mode。

## 原理

SQL Mode 用一个 64 位的 Long 型存储在 SessionVariables 中，这个地址的每一位都代表一个 mode 的开启/禁用 (1 表示开启，0 表示禁用) 状态，只要知道每一种 mode 具体是在哪一位，我们就可以通过位运算方便快速的对 SQL Mode 进行校验和操作。

每一次对 SQL Mode 的查询，都会对此 Long 型进行一次解析，变成用户可读的字符串形式，同理，用户发送给服务器的 SQL Mode 字符串，会被解析成能够存储在 SessionVariables 中的 Long 型。

已被设置好的全局 SQL Mode 会被持久化，因此对全局 SQL Mode 的操作总是只需一次，即使程序重启后仍可以恢复上一次的全局 SQL Mode。

## 操作方式

1. 设置 SQL Mode

```sql
set global sql_mode = "DEFAULT"
set session sql_mode = "DEFAULT"
```
:::note
- 目前 Doris 的默认 SQL Mode 是 DEFAULT（但马上会在后续修改中会改变）。

- 设置 global SQL Mode 需要 Admin 权限，并会影响所有在此后连接的客户端。

- 设置 session SQL Mode 只会影响当前对话客户端，默认为 session 方式。
:::

2. 查询 SQL Mode

```sql
select @@global.sql_mode
select @@session.sql_mode
```

:::note
除了这种方式，你还可以通过下面方式返回所有 session variables 来查看当前 sql mode
:::

```sql
show global variables
show session variables
```

## 已支持 mode

1. `PIPES_AS_CONCAT`

   在此模式下，'||'符号是一种字符串连接符号（同 CONCAT() 函数），而不是'OR'符号的同义词。(e.g., `'a'||'b' = 'ab'`, `1||0 = '10'`)

2. `NO_BACKSLASH_ESCAPES`

   启用此模式将禁用反斜杠字符（\）作为字符串和标识符中的转义字符。启用此模式后，反斜杠将变成一个普通字符，与其他字符一样。(e.g., `\b = \\b`, )

## 复合 mode

（待补充）
