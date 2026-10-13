---
{
    "title": "SHOW PROPERTY",
    "language": "ja",
    "description": "ユーザー属性を表示します。"
}
---

## 説明

ユーザー属性を表示します。

## 構文

```sql
SHOW {ALL PROPERTIES | PROPERTY [FOR <user_name>]} [LIKE <key>]
```

## 任意パラメータ
**1. `[ALL PROPERTIES]`**

   すべてのユーザー属性を表示するかどうか。

**2. `<user_name>`**

   指定したユーザーの属性を表示します。省略すると現在のユーザーの属性を表示します。

**3. `<key>`**

   属性名であいまい検索できます。

## 戻り値
- 文で `PROPERTY` を使用する場合

   | 列 | 説明 |
   | -- | -- |
   | Key | 属性名 |
   | Value | 属性値 |

- 文で `PROPERTIES` を使用する場合

   | 列 | 説明 |
   | -- | -- |
   | User | ユーザー名 |
   | Properties | 対応するユーザーの各 `property` の `key:value` |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明                 |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role    | `GRANT_PRIV` 権限を持つユーザーまたはロールはすべてのユーザーの属性を表示できます。現在のユーザーの属性を `SHOW PROPERTY` で表示する場合は `GRANT_PRIV` 権限は不要です |

## 使用上の注意
-  `SHOW ALL PROPERTIES` ですべてのユーザーの属性を表示できます。
- `user_name` を指定すると、そのユーザーの属性を表示します。
- `user_name` を省略すると、現在のユーザーの属性を表示します。
- 現在のユーザーの属性を `SHOW PROPERTY` で表示する場合、`GRANT_PRIV` 権限は不要です。

## 例

- ユーザー jack の属性を表示します

   ```sql
   SHOW PROPERTY FOR 'jack';
   ```
   ```text
   +-------------------------------------+--------+
   | Key                                 | Value  |
   +-------------------------------------+--------+
   | cpu_resource_limit                  | -1     |
   | default_load_cluster                |        |
   | default_workload_group              | normal |
   | exec_mem_limit                      | -1     |
   | insert_timeout                      | -1     |
   | max_query_instances                 | 3000   |
   | max_user_connections                | 1000   |
   | parallel_fragment_exec_instance_num | -1     |
   | query_timeout                       | -1     |
   | resource_tags                       |        |
   | sql_block_rules                     |        |
   +-------------------------------------+--------+
   ```

- ユーザー jack の制限に関する属性を表示します

   ```sql
   SHOW PROPERTY FOR 'jack' LIKE '%limit%';
   ```

   ```text
   +--------------------+-------+
   | Key                | Value |
   +--------------------+-------+
   | cpu_resource_limit | -1    |
   | exec_mem_limit     | -1    |
   +--------------------+-------+
   ```

- すべてのユーザーの制限に関する属性を表示します

   ```sql
   SHOW ALL PROPERTIES LIKE '%limit%';
   ```

   ```text
   +-------+------------------------------------------------------------+
   | User  | Properties                                                 |
   +-------+------------------------------------------------------------+
   | root  | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   | admin | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   | jack  | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   +-------+------------------------------------------------------------+
   ```

