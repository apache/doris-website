---
{
    "title": "XOR",
    "language": "ko",
    "description": "두 숫자의 XOR 값을 반환합니다.",
    "sidebar_label": "XOR"
}
---

# XOR {#xor}

## 설명 {#description}

두 숫자의 XOR 값을 반환합니다.

## 구문 {#syntax}
`BOOLEAN xor BOOLEAN`

## 예제 {#example}

```sql
mysql> select true xor false, true xor true;
```

```text
+------------------+-----------------+
| (TRUE XOR FALSE) | (TRUE XOR TRUE) |
+------------------+-----------------+
|                1 |               0 |
+------------------+-----------------+
```

## 키워드 {#keywords}
	XOR
