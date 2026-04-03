---
{
  "title": "CURRENT_USER",
  "description": "現在のユーザー名とそのIPルールホワイトリストを取得します。",
  "language": "ja"
}
---
## デスクリプション

現在のユーザー名とそのIPルールホワイトリストを取得します。

## Syntax

```sql
CURRENT_USER()
```
## 戻り値

現在のユーザー名とそのIPホワイトリストを返します。

形式：`<user_name>@<ip_white_list>`

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
- dorisユーザー、IP許可リストは192.168.*

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
