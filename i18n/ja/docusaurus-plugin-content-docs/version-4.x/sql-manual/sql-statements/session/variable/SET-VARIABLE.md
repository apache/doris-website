---
{
  "title": "SET VARIABLE",
  "description": "この文は主にDorisシステム変数を変更するために使用されます。これらのシステム変数はglobalレベルとsessionレベルで変更することができます、",
  "language": "ja"
}
---
## デスクリプション

このステートメントは主にDorisシステム変数を変更するために使用されます。これらのシステム変数はグローバルレベルとセッションレベルで変更でき、一部は動的に変更することも可能です。これらのシステム変数は`SHOW VARIABLE`で確認することもできます。

## Syntax

```sql
SET variable_assignment [, variable_assignment] [ ... ]
```
説明:

```sql
variable_assignment
  : <user_var_name> = <expr>
  | [ <effective_scope> ] <system_var_name> = <expr>
```
## 必須パラメータ
**1. `<user_var_name>`**
> ユーザーレベルの変数を指定します。例：@@your_variable_name、変数名は`@@`で始まります

**2. `<system_var_name>`**
> システムレベルの変数を指定します。例：exec_mem_limitなど

## オプションパラメータ
**1. `<effective_scope>`**

> 有効範囲は`GLOBAL`、`SESSION`、`LOCAL`のいずれかです。有効範囲が指定されていない場合、デフォルト値は`SESSION`です。`LOCAL`は`SESSION`のエイリアスです。

## アクセス制御要件
このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限  | オブジェクト | 備考                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | Session  | グローバル変数の設定には管理者権限が必要 |


## 使用上の注意

- ADMINユーザーのみがグローバルに有効な変数を設定できます
- グローバルに有効な変数は現在のセッションとその後の新しいセッションに影響しますが、現在存在する他のセッションには影響しません。

## 例

- タイムゾーンを東8区に設定

   ```
   SET time_zone = "Asia/Shanghai";
   ```
- グローバル実行メモリサイズを設定する

   ```
   SET GLOBAL exec_mem_limit = 137438953472
   ```
- ユーザー変数を設定する

   ```
   SET @@your_variable_name = your_variable_value;
   ```
