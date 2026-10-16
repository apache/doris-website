---
{
    "title": "CREATE ROW POLICY",
    "language": "ja",
    "description": "テーブルに行レベルセキュリティポリシーを作成し、指定したユーザーまたはロールに返される行を制限します。"
}
---

## 説明

テーブルに行レベルセキュリティポリシーを作成します。このポリシーは、テーブルへのクエリに適用されるフィルター条件を設定することで、指定したユーザーまたはロールが参照できる行を制限します。

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

> RESTRICTIVE は複数のポリシーを AND で結合し、PERMISSIVE は OR で結合します。



> クエリ文のフィルター条件に相当します。例: id=1

## オプションパラメータ

**<user_name>**

> ユーザー名。root ユーザーと admin ユーザーに対しては作成できません。

**<role_name>**

> ロール名

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限                     | オブジェクト | 備考 |
| ------------------------ | ------------ | ---- |
| ADMIN_PRIV または GRANT_PRIV | グローバル   |      |

## 例

1. 一連の行セキュリティポリシーを作成します。

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

  table1 にクエリを実行すると、書き換え後の SQL は次のようになります。

  ```sql
  SELECT * FROM (SELECT * FROM table1 WHERE (c1 = 'a' AND c2 = 'b') AND (c3 = 'c' OR c4 = 'd'))
  ```
