---
{
    "title": "SET VARIABLE",
    "language": "ja",
    "description": "Doris のシステム変数を変更するための文です。変数はグローバルレベルまたはセッションレベルで変更でき、"
}
---

## 説明

Doris のシステム変数を変更するための文です。変数はグローバルレベルまたはセッションレベルで変更でき、一部は動的に変更することもできます。`SHOW VARIABLE` で変数を確認できます。

## 構文

```sql
SET variable_assignment [, variable_assignment] [ ... ]
```

各要素は次のとおりです。
```sql
variable_assignment
  : <user_var_name> = <expr>
  | [ <effective_scope> ] <system_var_name> = <expr>
```

## 必須パラメータ
**1. `<user_var_name>`**
> ユーザーレベルの変数を指定します。例: @your_variable_name。変数名は `@` で始まります。

**2. `<system_var_name>`**
> システムレベルの変数を指定します。例: exec_mem_limit など。

## 任意パラメータ
**1. `<effective_scope>`**

> 有効範囲は `GLOBAL`、`SESSION`、`LOCAL` のいずれかです。省略した場合のデフォルトは `SESSION` です。`LOCAL` は `SESSION` の別名です。

## 必要な権限
この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限  | 対象 | 説明                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | Session  | グローバル変数の設定には管理者権限が必要です |


## 使用上の注意

- グローバルに有効な変数を設定できるのは ADMIN ユーザーのみです
- グローバルに有効な変数は現在のセッションとその後に作成される新しいセッションに適用されます。既存の他のセッションには影響しません。

## 例

- タイムゾーンを東八区に設定します

   ```
   SET time_zone = "Asia/Shanghai";
   ```


- グローバルな実行メモリサイズを設定します

   ```
   SET GLOBAL exec_mem_limit = 137438953472
   ```
- ユーザー変数を設定します

   ```
   SET @your_variable_name = your_variable_value;
   ```


