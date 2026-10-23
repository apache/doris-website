---
{
    "title": "ST_ISCLOSED",
    "language": "ru",
    "description": "Определяет, замкнута ли LineString, сравнивая её первую и последнюю точки."
}
---

<version since="dev">

</version>

## Описание {#description}

Определяет, замкнута ли `LINESTRING`. `LINESTRING` считается замкнутой, если её первая и последняя точки в точности совпадают. Эта функция не использует допуск по расстоянию.

## Синтаксис {#syntax}

```sql
ST_ISCLOSED( <shape> )
```

## Параметры {#parameters}

| Параметр | Описание |
| :--- | :--- |
| `<shape>` | Закодированное геометрическое значение (`VARCHAR`), возвращаемое конструктором пространственных объектов, например `ST_GeometryFromText` или `ST_LineFromText`. Исходный текст WKT необходимо предварительно преобразовать с помощью конструктора. |

## Возвращаемое значение {#return-value}

Возвращает значение типа BOOLEAN:

- `true`, если на вход подана корректная `LINESTRING`, первая и последняя точки которой в точности совпадают.
- `false`, если на вход подана корректная `LINESTRING`, первая и последняя точки которой различаются.
- `NULL`, если входное значение равно `NULL`, не является `LINESTRING` или не может быть декодировано как корректный геометрический объект.

В выводе SQL значение `true` отображается как `1`, а значение `false` отображается как `0`.

## Пример {#example}

**Замкнутая LineString**

```sql
SELECT ST_IsClosed(
    ST_GeometryFromText('LINESTRING(0 0, 1 1, 0 0)')
) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|         1 |
+-----------+
```

**Незамкнутая LineString**

```sql
SELECT ST_IsClosed(
    ST_GeometryFromText('LINESTRING(0 0, 1 1)')
) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|         0 |
+-----------+
```

**Входное значение NULL**

```sql
SELECT ST_IsClosed(NULL) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|      NULL |
+-----------+
```

**Входное значение, не являющееся LineString**

```sql
SELECT ST_IsClosed(ST_Point(0, 0)) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|      NULL |
+-----------+
```
