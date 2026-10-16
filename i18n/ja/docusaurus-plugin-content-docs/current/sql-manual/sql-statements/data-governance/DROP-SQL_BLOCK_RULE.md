---
{
    "title": "DROP SQL_BLOCK_RULE",
    "language": "ja",
    "description": "一つ以上の SQL ブロックルールを削除します。複数のルールをカンマで区切って一度に削除できます。"
}
---

## 説明 {#description}

一つ以上の SQL ブロックルールを削除します。複数のルールをカンマで区切って一度に削除できます。

## 構文 {#syntax}

```sql
DROP SQL_BLOCK_RULE <rule_name>[, ...]
```

## 必須パラメーター {#required-parameters}

<rule_name>
削除する SQL ブロックルールの名前。複数のルール名をカンマで区切って指定できます。

## アクセス制御の要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも以下の権限が必要です。
| 権限 | 対象 | 備考                |
| :---------------- | :------------- | :---------------------------- |
| ADMIN        | ユーザーまたはロール   | ADMIN 権限を持つユーザーまたはロールのみが DROP 操作を実行できます。 |


## 例 {#example}

ブロックルール `test_rule1` と `test_rule2` を削除します。

```sql
DROP SQL_BLOCK_RULE test_rule1, test_rule2;
```
