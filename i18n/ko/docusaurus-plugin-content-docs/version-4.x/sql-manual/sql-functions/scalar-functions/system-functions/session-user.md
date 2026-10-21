---
{
    "title": "SESSION_USER",
    "language": "ko",
    "description": "현재 Doris 연결의 사용자 이름과 IP를 가져옵니다. MySQL 프로토콜과 호환됩니다."
}
---

## 설명 {#description}

현재 Doris 연결의 사용자 이름과 IP를 가져옵니다. MySQL 프로토콜과 호환됩니다.

## 구문 {#syntax}

```sql
SESSION_USER()
```

## 반환값 {#return-value}

현재 Doris 연결의 사용자 이름과 IP를 반환합니다.
형식:`<user_name>@<ip>`

## 예제 {#examples}

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
