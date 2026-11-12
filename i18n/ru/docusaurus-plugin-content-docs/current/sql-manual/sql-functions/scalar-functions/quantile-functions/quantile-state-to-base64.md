---
{
    "title": "QUANTILE_STATE_TO_BASE64",
    "language": "ru"
}
---

## Описание {#description}

Преобразует значение типа QUANTILE_STATE в строку в кодировке base64.

## Синтаксис {#syntax}

```sql
QUANTILE_STATE_TO_BASE64(<quantile_state_input>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<quantile_state_input>` | Данные типа QUANTILE_STATE. |

## Возвращаемое значение {#return-value}

Строка в кодировке Base64, представляющая QUANTILE_STATE.
Возвращает `NULL`, если значение QUANTILE_STATE равно `NULL`.

::: note

Поскольку порядок элементов в QUANTILE_STATE не гарантирован, результат кодирования одного и того же содержимого QUANTILE_STATE в base64 может различаться, однако после декодирования с помощью quantile_state_from_base64 гарантированно получается один и тот же QUANTILE_STATE.

:::

## Примеры {#examples}

```sql
select quantile_state_to_base64(quantile_state_empty());
```

```text
+--------------------------------------------------+
| quantile_state_to_base64(quantile_state_empty()) |
+--------------------------------------------------+
| AAAARQA=                                         |
+--------------------------------------------------+
```

```sql
select quantile_state_to_base64(to_quantile_state(1, 2048));
```

```text
+------------------------------------------------------+
| quantile_state_to_base64(to_quantile_state(1, 2048)) |
+------------------------------------------------------+
| AAAARQEAAAAAAADwPw==                                 |
+------------------------------------------------------+
```

```sql
select
  quantile_percent(
    quantile_union(
      quantile_state_from_base64(
        quantile_state_to_base64(to_quantile_state(1, 2048))
      )
    ),
    0.5
  ) as nested_test;
```

```text
+-------------+
| nested_test |
+-------------+
|           1 |
+-------------+
```

```sql
select quantile_state_to_base64(NULL);
```

```text
+--------------------------------+
| quantile_state_to_base64(NULL) |
+--------------------------------+
| NULL                           |
+--------------------------------+
```
