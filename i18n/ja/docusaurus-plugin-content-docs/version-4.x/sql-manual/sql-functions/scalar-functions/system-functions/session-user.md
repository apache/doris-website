---
{
    "title": "SESSION_USER",
    "language": "ja",
    "description": "現在の Doris 接続のユーザー名と IP アドレスを取得します。MySQL プロトコルとの互換性があります。"
}
---

## 説明

現在の Doris 接続のユーザー名と IP アドレスを取得します。MySQL プロトコルとの互換性があります。

## 構文

```sql
SESSION_USER()
```

## 戻り値

現在の Doris 接続のユーザー名と IP アドレスを返します。
形式:`<user_name>@<ip>`

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
