---
{
    "title": "SHOW VARIABLES",
    "language": "ja",
    "description": "このステートメントは Doris のシステム変数を表示します。条件を指定して絞り込むこともできます。"
}
---

## 説明

このステートメントは Doris のシステム変数を表示します。条件を指定して絞り込むこともできます。

## 構文

```sql
SHOW [<effective_scope>] VARIABLES [<like_pattern> | <where clause>]
```

## 任意パラメータ
**1. `<effective_scope>`**
> 有効範囲には `GLOBAL`、`SESSION`、`LOCAL` のいずれかを指定します。省略した場合のデフォルトは `SESSION` です。`LOCAL` は `SESSION` の別名です。

**2. `<like_pattern>`**
> LIKE 句を使って結果を照合し、絞り込みます。

**3. `<where>`**
> WHERE 句を使って結果を照合し、絞り込みます。

## アクセス制御要件
この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限  | 対象 | 備考                                        |
| :--------- | :----- | :------------------------------------------- |
| N/A      | セッション  | 変数の表示に特別な権限は必要ありません |


## 戻り値
| Variable_name | Value   | Default_Value                    | Changed |
|:--------------|:--------|:---------------------------------|:--------|
| variable name1      | value1 | default value1 |   0/1      |
| variable name2      | value2 | default value2 |   0/1      |


## 使用上の注意

- SHOW VARIABLES は主にシステム変数の値を確認するために使用します。
- SHOW VARIABLES の実行に特別な権限は必要ありません。サーバーに接続できれば実行できます。
- `Changed` 列は、`Return Value`（戻り値）の表で、0 が未変更、1 が変更済みであることを示します。
- `SHOW` ステートメントには次の制約があります。
  - WHERE 句では `or` を使用できません。
  - 列名は比較式の左辺に指定します。
  - WHERE 句でサポートされるのは等価比較のみです。
  - LIKE 句では variable_name に対して照合します。
  - % ワイルドカードは照合パターン内のどの位置にも使用できます。


## 例


- デフォルトでは Variable_name 列に対して照合します。次は完全一致の例です。

    ```sql
    show variables like 'max_connections';
    ```


- % ワイルドカードを使うと、複数の項目に一致させられます。

    ```sql
    show variables like '%connec%';
    ```


- WHERE 句を使って検索します。

    ```sql
    show variables where variable_name = 'version';
    ```

