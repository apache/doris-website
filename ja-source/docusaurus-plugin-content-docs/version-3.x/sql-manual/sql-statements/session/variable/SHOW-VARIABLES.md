---
{
  "title": "SHOW VARIABLES",
  "description": "この文は、条件によってクエリできるDorisシステム変数を表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、条件によってクエリできるDorisシステム変数を表示するために使用されます。

## 構文

```sql
SHOW [<effective_scope>] VARIABLES [<like_pattern> | <where>]
```
## オプションパラメータ
**1. `<effective_scope>`**
> 有効なスコープは `GLOBAL`、`SESSION`、または `LOCAL` のいずれかです。有効なスコープが指定されていない場合、デフォルト値は `SESSION` です。`LOCAL` は `SESSION` のエイリアスです。

**2. `<like_pattern>`**
> like文を使用して結果をマッチングおよびフィルタリングします

**3. `<where>`**
> where文を使用して結果をマッチングおよびフィルタリングします

## アクセス制御要件
このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege  | Object | 注釈                                        |
| :--------- | :----- | :------------------------------------------- |
| Any_PRIV | Session  | いずれかの権限があれば変数を表示できます |

## 戻り値
| Variable_name | Value   | Default_Value                    | Changed |
|:--------------|:--------|:---------------------------------|:--------|
| variable name1      | value1 | default value1 |   0/1      |
| variable name2      | value2 | default value2 |   0/1      |

## 使用上の注意

- Show variablesは主にシステム変数の値を表示するために使用されます。
- SHOW VARIABLESコマンドの実行には特別な権限は必要なく、サーバーに接続できることのみが必要です。
- `戻り値`の `Changed` カラムは、0が変更なし、1が変更ありを意味します。
- `SHOW` 文を使用する際にはいくつかの制限があります：
  - where句で `or` は使用できません
  - カラム名は左側に配置されます
  - where句では等価比較のみサポートされます
  - variable_nameとのマッチングにはlike文を使用します
  - マッチングパターンの任意の場所で % パーセントワイルドカードを使用できます

## 例

- ここでのデフォルトはVariable_nameとのマッチングで、ここでは完全一致です

    ```sql
    show variables like 'max_connections';
    ```
パーセント記号（%）ワイルドカードによるマッチングは複数の項目にマッチすることができます

    ```sql
    show variables like '%connec%';
    ```
- 一致するクエリにはWhere句を使用する

    ```sql
    show variables where variable_name = 'version';
    ```
