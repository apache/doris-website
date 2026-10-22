---
{
    "title": "ARRAY_SIZE",
    "language": "ru",
    "description": "Возвращает количество элементов в массиве."
}
---

## Назначение {#function}

Возвращает количество элементов в массиве.

## Синтаксис {#syntax}

- `ARRAY_SIZE(arr)`

## Параметры {#parameters}

- `arr`: `ARRAY<T>`.

## Возвращаемое значение {#return-value}

- Возвращает количество элементов в `arr`.

## Примечания по использованию {#usage-notes}

- Если входной массив `arr` равен `NULL`, возвращает `NULL`.

## Примеры {#examples}

- Массивы:
  - `ARRAY_SIZE([1, 2, 3])` -> `3`
  - `ARRAY_SIZE(['a', NULL, 'b'])` -> `3`

- Если входной массив `arr` равен `NULL`, возвращает `NULL`
  - `ARRAY_SIZE(NULL)` -> `NULL`
