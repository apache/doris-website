---
{
  "title": "CURRENT_USER",
  "description": "現在のユーザー名とそのIPルールホワイトリストを取得します。",
  "language": "ja"
}
---
## 説明

現在のユーザー名とそのIPルールホワイトリストを取得します。

## 構文

```sql
CURRENT_USER()
```
## 戻り値

現在のユーザー名とそのIPホワイトリストを返します。

フォーマット:`<user_name>@<ip_white_list>`

## 例

- rootユーザー、IP制限なし

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
- doris ユーザー、IP ホワイトリストは 192.168.* です

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
