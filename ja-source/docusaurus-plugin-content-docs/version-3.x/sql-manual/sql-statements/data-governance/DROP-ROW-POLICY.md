---
{
  "title": "DROP ROW POLICY",
  "description": "行セキュリティポリシーを削除します。行セキュリティポリシーの詳細については、「Security Policies」の章を参照してください。",
  "language": "ja"
}
---
## 説明

行セキュリティポリシーを削除します。行セキュリティポリシーの詳細については、「Security Policies」の章を参照してください。


## 構文

```sql
DROP ROW POLICY <policy_name> on <table_name>
  [ FOR { <user_name> | ROLE <role_name> } ];
```
## 必須パラメータ
**<policy_name>**

> 行セキュリティポリシー名

**<table_name>**

> Table名

# オプションパラメータ（Optional パラメータ）

**<user_name>**

> ユーザー名

**<role_name>**

> ロール名

# アクセス制御要件（Access Control Requirements）

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限                       | オブジェクト | 注記 |
| :------------------------- | :----------- | :--- |
| ADMIN_PRIV または *GRANT_PRIV* | Global       |      |

# 例（Examples）

1. *db1.table1* の *policy1 行セキュリティポリシー* を削除する

  ```sql
  DROP ROW POLICY policy1 ON db1.table1
  ```
1. user1に適用されるdb1.table1のpolicy1行セキュリティポリシーを削除する

  ```sql
  DROP ROW POLICY policy1 ON db1.table1 FOR user1
  ```
1. role1に適用されるdb1.table1のpolicy1行セキュリティポリシーを削除する

  ```sql
  DROP ROW POLICY policy1 ON db1.table1 FOR role role1
  ```
