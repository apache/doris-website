---
{
  "title": "SHOW VARIABLES",
  "language": "ja",
  "description": "このステートメントは、条件によって照会できるDorisシステム変数を表示するために使用されます"
}
---
## 説明

このステートメントはDorisシステム変数を表示するために使用され、条件によってクエリできます

## 構文

```sql
SHOW [<effective_scope>] VARIABLES [<like_pattern> | <where clause>]
```
## オプションパラメータ
**1. `<effective_scope>`**
> 有効スコープは `GLOBAL`、`SESSION`、`LOCAL` のいずれかです。有効スコープが指定されていない場合、デフォルト値は `SESSION` です。`LOCAL` は `SESSION` のエイリアスです。

**2. `<like_pattern>`**
> like文を使用して結果をマッチングおよびフィルタリングします

**3. `<where>`**
> where文を使用して結果をマッチングおよびフィルタリングします

## アクセス制御要件
このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限  | オブジェクト | 注記                                        |
| :--------- | :----- | :------------------------------------------- |
| Any_PRIV | Session  | 任意の権限で変数を表示できます |


## 戻り値
| Variable_name | Value   | Default_Value                    | Changed |
|:--------------|:--------|:---------------------------------|:--------|
| variable name1      | value1 | default value1 |   0/1      |
| variable name2      | value2 | default value2 |   0/1      |


## 使用上の注意

- Show variablesは主にシステム変数の値を表示するために使用されます。
- SHOW VARIABLESコマンドの実行には特別な権限は必要なく、サーバーに接続できることのみが必要です。
- `戻り値`の`Changed`列において、0は変更なし、1は変更ありを意味します。
- `SHOW`文を使用する際にはいくつかの制限があります：
  - where句で`or`は使用できません
  - 列名は左側に配置します
  - where句では等価比較のみをサポートします
  - variable_nameとのマッチングにはlike文を使用します
  - %パーセントワイルドカードはマッチングパターンの任意の場所で使用できます


## 例


- ここでのデフォルトはVariable_nameとマッチングすることで、ここでは完全一致です

    ```sql
    show variables like 'max_connections';
    ```
- パーセント記号（%）ワイルドカードによるマッチングは複数の項目にマッチできます

    ```sql
    show variables like '%connec%';
    ```
- マッチングクエリにはWhere句を使用する

    ```sql
    show variables where variable_name = 'version';
    ```
