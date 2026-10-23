---
{
    "title": "XOR",
    "language": "ru",
    "description": "Возвращает результат операции XOR для двух чисел.",
    "sidebar_label": "XOR"
}
---

# XOR {#xor}

## Описание {#description}

Возвращает результат операции XOR для двух чисел.

## Синтаксис {#syntax}
`BOOLEAN xor BOOLEAN`

## Пример {#example}

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

## Ключевые слова {#keywords}
	XOR
