---
{
    "title": "SHOW FRONTEND CONFIG",
    "language": "ja",
    "description": "このステートメントは、現在のクラスターの設定を表示するために使用します（現在サポートされているのはFEの設定項目のみです）"
}
---

## 説明 {#description}

このステートメントは、現在のクラスターの設定を表示するために使用します（現在サポートされているのはFEの設定項目のみです）。

4.1.5以降、初期rootパスワードやTLS、HTTPS、MySQL SSLのパスワードを含む、空でない機密設定値は`********`として`Value`列に表示されます。未設定で空の値は空のままです。マスキングによって実際の設定値が変更されることはありません。

## 構文 {#syntax}

```sql
SHOW FRONTEND CONFIG [LIKE "<pattern>"];
```

## オプションパラメーター {#optional-parameters}
**`<pattern>`**
> 通常の文字とワイルドカードを含められる文字列です。


## 戻り値 {#return-values}
| 列名        | 説明                                                |
|-------------|-----------------------------------------------------|
| Value       | 設定項目の値                                        |
| Type        | 設定項目の型                                        |
| IsMutable   | `ADMIN SET CONFIG`コマンドで設定できるかどうか      |
| MasterOnly  | Master FEにのみ適用されるかどうか                   |
| Comment     | 設定項目の説明                                      |


## 例 {#example}

1. 現在のFEノードの設定を表示する

   ```sql
   SHOW FRONTEND CONFIG;
   ```

2. LIKE条件を使用して現在のFEノードの設定を検索する

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
