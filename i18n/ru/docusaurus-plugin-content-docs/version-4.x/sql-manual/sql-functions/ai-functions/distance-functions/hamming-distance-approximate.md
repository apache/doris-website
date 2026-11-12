---
{
    "title": "HAMMING_DISTANCE_APPROXIMATE",
    "language": "ru",
    "description": "Вычисляет расстояние Хэмминга между двумя байтовыми векторами: число различающихся битов после побитового XOR. Если массив или его элемент имеет значение NULL, возникает ошибка."
}
---

## Описание {#description}

Вычисляет расстояние Хэмминга между двумя байтовыми векторами: число различающихся битов после побитового XOR. Если массив или его элемент имеет значение NULL, возникает ошибка.

Доступна в сборках Doris 4.2, включающих эту функцию. Для подходящих запросов Lance Top-N может использоваться встроенный приближённый поиск; остальные запросы выполняются скалярными ядрами.

## Синтаксис {#syntax}

```sql
HAMMING_DISTANCE_APPROXIMATE(<array1>, <array2>)
```

## Параметры {#parameters}

| Параметр | Описание |
|---|---|
| `<array1>` | Массив целых чисел типа TINYINT, SMALLINT, INT или BIGINT, приводимый к ARRAY<BIGINT>. Каждый элемент должен находиться в диапазоне `[0,255]`; массивы чисел с плавающей точкой, десятичных чисел и значений LARGEINT не принимаются. |
| `<array2>` | Массив целых чисел типа TINYINT, SMALLINT, INT или BIGINT, приводимый к ARRAY<BIGINT>. Каждый элемент должен находиться в диапазоне `[0,255]`; массивы чисел с плавающей точкой, десятичных чисел и значений LARGEINT не принимаются. Оба массива должны иметь одинаковую длину. |

## Возвращаемое значение {#return-value}

Возвращает FLOAT; чем меньше значение, тем ближе векторы. Для двух пустых массивов возвращается 0; максимальное расстояние между векторами длиной N байт составляет 8N. Если длины массивов различаются, массивы имеют значение NULL или содержат элементы со значением NULL, возникает ошибка, а не возвращается NULL. Элементы вне допустимого диапазона также вызывают ошибку. Условия использования встроенного поиска кандидатов, числовая точность и поведение при NULL и NaN могут отличаться от скалярного выполнения; см. раздел [«Автоматический поиск»](../../../../lakehouse/best-practices/lance-hybrid-search.mdx#automatic-search).

## Пример {#example}

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([0,255,170], [255,0,85]) AS value;
```

```text
value
24
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([], []) AS value;
```

```text
value
0
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE(NULL, [0,1]);
```

```text
ERROR: First argument for function hamming_distance_approximate cannot be null
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function hamming_distance_approximate cannot have null
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([256], [0]);
```

```text
ERROR: Hamming vector elements must be integers in [0, 255]
```
