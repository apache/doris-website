---
{
    "title": "QUANTILE_STATE_FROM_BASE64",
    "language": "ru"
}
---

## Описание {#description}

Преобразует строку в кодировке base64 (обычно создаваемую с помощью `QUANTILE_STATE_TO_BASE64`) в значение типа QUANTILE_STATE. Возвращает NULL, если входная строка некорректна или равна NULL.

## Синтаксис {#syntax}

```sql
QUANTILE_STATE_FROM_BASE64(<input>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<input>` | Строка в кодировке base64, обычно создаваемая с помощью `QUANTILE_STATE_TO_BASE64`. Возвращает NULL, если строка некорректна. |

## Возвращаемое значение {#return-value}

Возвращает quantile_state, полученный при декодировании base64. Возвращает NULL, если строка некорректна.

## Примеры {#examples}

```sql
select
  quantile_state_to_base64(
    quantile_state_from_base64(
      quantile_state_to_base64(to_quantile_state(1.0, 2048))
    )
  ) = quantile_state_to_base64(to_quantile_state(1.0, 2048)) AS equal_test;
```
```text
+------------+
| equal_test |
+------------+
|          1 |
+------------+
```

```sql
select quantile_state_from_base64('not_base64!');
```

```text
+-------------------------------------------+
| quantile_state_from_base64('not_base64!') |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```

```sql
select quantile_state_from_base64(NULL);
```

```text
+----------------------------------+
| quantile_state_from_base64(NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```
