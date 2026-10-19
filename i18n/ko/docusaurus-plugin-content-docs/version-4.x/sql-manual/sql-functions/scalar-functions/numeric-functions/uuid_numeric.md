---
{
    "title": "UUID_NUMERIC",
    "language": "ko",
    "description": "LARGEINT 타입의 uuid를 반환합니다"
}
---

## 설명 {#description}

LARGEINT 타입의 uuid를 반환합니다.

## 구문 {#syntax}

```sql
UUID_NUMERIC()
```

## 반환값 {#return-value}

LARGEINT 타입의 uuid를 반환합니다. LARGEINT는 Int128이므로 uuid_numeric()은 음수를 생성할 수 있습니다.

## 예제 {#example}

```sql
select uuid_numeric()
```

```text
+----------------------------------------+
| uuid_numeric()                         |
+----------------------------------------+
| 82218484683747862468445277894131281464 |
+----------------------------------------+
```
