---
{
    "title": "CURRENT_USER",
    "language": "ko",
    "description": "현재 사용자 이름과 해당 사용자의 IP 규칙 허용 목록을 가져옵니다."
}
---

## 설명 {#description}

현재 사용자 이름과 해당 사용자의 IP 규칙 허용 목록을 가져옵니다.

## 구문 {#syntax}

```sql
CURRENT_USER()
```

## 반환값 {#return-value}

현재 사용자 이름과 해당 사용자의 IP 허용 목록을 반환합니다.

형식:`<user_name>@<ip_white_list>`

## 예제 {#examples}

- root 사용자, IP 제한 없음
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

- doris 사용자, IP 허용 목록은 192.168.*
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
