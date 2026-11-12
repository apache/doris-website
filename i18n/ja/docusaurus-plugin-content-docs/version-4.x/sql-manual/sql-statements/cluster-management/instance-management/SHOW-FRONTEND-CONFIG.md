---
{
    "title": "SHOW FRONTEND CONFIG",
    "language": "ja",
    "description": "このステートメントは、現在のクラスターの構成を表示するために使用されます（現在は FE の構成項目のみサポートされています）"
}
---

## 説明 {#description}

このステートメントは、現在のクラスターの構成を表示するために使用されます（現在は FE の構成項目のみサポートされています）。

4.1.5 以降、空でない機密構成値は `********` として `Value` に表示されます。これには初期 root パスワードと、TLS、HTTPS、MySQL SSL のパスワードが含まれます。設定されていない空の値は空のままです。マスキングによって実際の構成値が変更されることはありません。

## 構文 {#syntax}

```sql
SHOW FRONTEND CONFIG [LIKE "<pattern>"];
```

## オプションパラメータ {#optional-parameters}
**`<pattern>`**
> 通常の文字とワイルドカードを含めることができる文字列。


## 戻り値 {#return-values}
| 列名 | 説明                                            |
|-------------|-----------------------------------------------------|
| Value       | 構成項目の値                            |
| Type        | 構成項目の型                             |
| IsMutable   | `ADMIN SET CONFIG` コマンドで設定できるかどうか |
| MasterOnly  | Master FE にのみ適用されるかどうか                  |
| Comment     | 構成項目の説明                      |


## 例 {#example}

1. 現在の FE ノードの構成を表示する

   ```sql
   SHOW FRONTEND CONFIG;
   ```

2. LIKE 述語を使用して現在の FE ノードの構成を検索する

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
