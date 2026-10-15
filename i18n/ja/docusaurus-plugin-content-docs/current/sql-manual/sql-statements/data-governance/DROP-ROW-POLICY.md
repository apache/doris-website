---
{
    "title": "DROP ROW POLICY",
    "language": "ja",
    "description": "行セキュリティポリシーを削除します。行セキュリティポリシーの詳細については、「セキュリティポリシー」の章を参照してください"
}
---

## 説明

行セキュリティポリシーを削除します。行セキュリティポリシーの詳細については、「セキュリティポリシー」の章を参照してください。


## 構文

```sql
DROP ROW POLICY <policy_name> on <table_name>
  [ FOR { <user_name> | ROLE <role_name> } ];
```

## 必須パラメータ
**<policy_name>**

> 行セキュリティポリシー名

**<table_name>**

> テーブル名

# オプションパラメータ（省略可能）

**<user_name>**

> ユーザー名

**<role_name>**

> ロール名

# アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限                       | 対象         | 備考 |
| :------------------------- | :----------- | :--- |
| ADMIN_PRIV または *GRANT_PRIV* | グローバル |      |

# 使用例

1. *db1.table1* の *policy1 行セキュリティポリシー*を削除します。

  ```sql
  DROP ROW POLICY policy1 ON db1.table1
  ```

1. ユーザー user1 に適用される、db1.table1 の policy1 行セキュリティポリシーを削除します。

  ```sql
  DROP ROW POLICY policy1 ON db1.table1 FOR user1
  ```

1. ロール role1 に適用される、db1.table1 の policy1 行セキュリティポリシーを削除します。

  ```sql
  DROP ROW POLICY policy1 ON db1.table1 FOR role role1
  ```
