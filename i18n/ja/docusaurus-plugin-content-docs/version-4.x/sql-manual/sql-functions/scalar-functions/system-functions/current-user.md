---
{
    "title": "CURRENT_USER",
    "language": "ja",
    "description": "現在のユーザー名と、その IP 許可リストを取得します。"
}
---

## 説明

現在のユーザー名と、その IP 許可リストを取得します。

## 構文

```sql
CURRENT_USER()
```

## 戻り値

現在のユーザー名とその IP 許可リストを返します。

形式:`<user_name>@<ip_white_list>`

## 例

- root ユーザー。IP 制限なし
```sql
select current_user();
```

```text
+----------------+
| current_user() |
+----------------+
| 'root'@'%'     |
+----------------+
```

- doris ユーザー。IP 許可リストは 192.168.*
```sql
select current_user();
```

```text
+---------------------+
| current_user()      |
+---------------------+
| 'doris'@'192.168.%' |
+---------------------+
```

