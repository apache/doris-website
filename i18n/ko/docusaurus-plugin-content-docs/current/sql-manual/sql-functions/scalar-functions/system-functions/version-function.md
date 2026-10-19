---
{
    "title": "VERSION",
    "language": "ko",
    "description": "실질적인 의미는 없으며, MySQL 프로토콜과의 호환성을 위해 제공됩니다."
}
---

## 설명 {#description}

실질적인 의미는 없으며, MySQL 프로토콜과의 호환성을 위해 제공됩니다.

## 구문 {#syntax}

```sql
VERSION()
```

## 반환값 {#return-value}

MySQL 프로토콜과의 호환성을 위해 항상 "5.7.99"를 반환합니다.

## 예제 {#examples}

```sql
select version();
```

```text
+-----------+
| version() |
+-----------+
| 5.7.99    |
+-----------+
```
