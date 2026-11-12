---
{
    "title": "COSINE_DISTANCE_APPROXIMATE",
    "language": "ru",
    "description": "Вычисляет косинусное расстояние между двумя векторами. Если массив равен NULL или содержит элементы NULL, возникает ошибка."
}
---

## Описание {#description}

Вычисляет косинусное расстояние между двумя векторами. Если массив равен NULL или содержит элементы NULL, возникает ошибка.

Функция доступна в сборках Doris 4.2, в которые она включена. Подходящие запросы Lance Top-N могут использовать встроенный приближённый поиск; остальные запросы выполняются скалярными ядрами.

## Синтаксис {#syntax}

```sql
COSINE_DISTANCE_APPROXIMATE(<array1>, <array2>)
```

## Параметры {#parameters}

| Параметр | Описание |
|---|---|
| `<array1>` | Числовой массив, неявно преобразуемый в ARRAY<FLOAT>; преобразование может повлиять на точность. |
| `<array2>` | Числовой массив, неявно преобразуемый в ARRAY<FLOAT>; преобразование может повлиять на точность. Оба массива должны иметь одинаковую длину. |

## Возвращаемое значение {#return-value}

Возвращает FLOAT; чем меньше значение, тем ближе векторы. При скалярном вычислении используется формула `1 - dot(x,y) / (norm(x) * norm(y))`. Если норма любого из векторов равна нулю, в том числе когда оба массива пусты, возвращается 2. Если длины массивов различаются, массив равен NULL или содержит элементы NULL, возникает ошибка, а не возвращается NULL. Возможность использования встроенного поиска кандидатов, численная точность и поведение при NULL/NaN могут отличаться от скалярного выполнения; см. раздел [«Автоматический поиск»](../../../../lakehouse/best-practices/lance-hybrid-search.mdx#automatic-search).

## Пример {#example}

```sql
SELECT COSINE_DISTANCE_APPROXIMATE([1,0], [0,1]) AS value;
```

```text
value
1
```

```sql
SELECT COSINE_DISTANCE_APPROXIMATE([0,0], [1,0]) AS value;
```

```text
value
2
```

```sql
SELECT COSINE_DISTANCE_APPROXIMATE(NULL, [0,1]);
```

```text
ERROR: First argument for function cosine_distance_approximate cannot be null
```

```sql
SELECT COSINE_DISTANCE_APPROXIMATE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function cosine_distance_approximate cannot have null
```
