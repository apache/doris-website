---
{
    "title": "SHOW FRONTEND CONFIG",
    "language": "ja",
    "description": "このステートメントは、現在のクラスタの設定を表示します（現在は FE の設定項目のみサポートしています）"
}
---

## 説明

このステートメントは、現在のクラスタの設定を表示します（現在は FE の設定項目のみサポートしています）。

## 構文

```sql
SHOW FRONTEND CONFIG [LIKE "<pattern>"];
```

## オプションパラメータ
**`<pattern>`**
> 通常の文字とワイルドカードを含めることができる文字列です。


## 戻り値
| 列名        | 説明                                                  |
|-------------|-------------------------------------------------------|
| Value       | 設定項目の値                                          |
| Type        | 設定項目の型                                          |
| IsMutable   | `ADMIN SET CONFIG` コマンドで設定できるかどうか       |
| MasterOnly  | Master FE にのみ適用されるかどうか                     |
| Comment     | 設定項目の説明                                        |


## 例

1. 現在の FE ノードの設定を表示する

   ```sql
   SHOW FRONTEND CONFIG;
   ```

2. LIKE 述語を使用して、現在の FE ノードの設定を検索する

   ```sql
    SHOW FRONTEND CONFIG LIKE '%check_java_version%';
    ```
    ```text
    +--------------------+-------+---------+-----------+------------+---------+
    | Key                | Value | Type    | IsMutable | MasterOnly | Comment |
    +--------------------+-------+---------+-----------+------------+---------+
    | check_java_version | true  | boolean | false     | false      |         |
    +--------------------+-------+---------+-----------+------------+---------+
    ```

