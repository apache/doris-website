---
{
  "title": "SESSION_USER",
  "language": "ja",
  "description": "Doris接続の現在のユーザー名とIPを取得します。MySQLプロトコルと互換性があります。"
}
---
## 説明

Doris接続の現在のユーザー名とIPを取得します。MySQLプロトコルと互換性があります。

## 構文

```sql
SESSION_USER()
```
## 戻り値

Dorisが接続している現在のユーザー名とIPを返します。
フォーマット:`<user_name>@<ip>`

## 例

```sql
select session_user();
```
```text
+----------------------+
| session_user()       |
+----------------------+
| 'root'@'10.244.2.10' |
+----------------------+
```
