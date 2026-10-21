---
{
    "title": "USER",
    "language": "ko",
    "description": "Doris에 연결된 현재 사용자 이름과 IP를 가져옵니다."
}
---

## 설명 {#description}

Doris에 연결된 현재 사용자 이름과 IP를 가져옵니다.

## 구문 {#syntax}

```sql
USER()
```

## 반환 값 {#return-value}

Doris에 연결된 현재 사용자 이름과 IP를 반환합니다.
형식:`<user_name>@<ip>`

## 예제 {#examples}

```sql
select user();
```

```text
+---------------------+
| user()              |
+---------------------+
| 'root'@'10.244.2.5' |
+---------------------+
```
