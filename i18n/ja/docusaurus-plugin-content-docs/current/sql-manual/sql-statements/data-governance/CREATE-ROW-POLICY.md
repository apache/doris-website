---
{
  "title": "CREATE ROW POLICY",
  "language": "ja",
  "description": "Explainは書き換えられた実行プランを表示できます。"
}
---
## 説明

Explainは書き換えられた実行プランを表示できます。

## 構文

```sql
CREATE ROW POLICY [ IF NOT EXISTS ] <policy_name> 
ON <table_name> 
AS { RESTRICTIVE | PERMISSIVE } 
TO { <user_name> | ROLE <role_name> } 
USING (<filter>);
```
## 必須パラメータ

**<policy_name>**

> 行セキュリティポリシー名

**<table_name>**

> テーブル名

**<filter_type>**

> RESTRICTIVEはポリシーのセットをANDで結合し、PERMISSIVEはポリシーのセットをORで結合します

> クエリ文のフィルタ条件と同等です。例：id=1

## オプションパラメータ

**<user_name>**

> ユーザー名。rootおよびadminユーザーには作成できません

**<role_name>**

> ロール名

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限                     | オブジェクト | 備考 |
| ------------------------ | ------------ | ---- |
| ADMIN_PRIV or GRANT_PRIV | Global       |      |

## 例

1. 行セキュリティポリシーのセットを作成する

  ```sql
  CREATE ROW POLICY test_row_policy_1 ON test.table1 
  AS RESTRICTIVE TO test USING (c1 = 'a');
  CREATE ROW POLICY test_row_policy_2 ON test.table1 
  AS RESTRICTIVE TO test USING (c2 = 'b');
  CREATE ROW POLICY test_row_policy_3 ON test.table1 
  AS PERMISSIVE TO test USING (c3 = 'c');
  CREATE ROW POLICY test_row_policy_3 ON test.table1 
  AS PERMISSIVE TO test USING (c4 = 'd');
  ```
table1でクエリを実行すると、書き換えられたSQLは次のようになります：

  ```sql
  SELECT * FROM (SELECT * FROM table1 WHERE (c1 = 'a' AND c2 = 'b') AND (c3 = 'c' OR c4 = 'd'))
  ```
