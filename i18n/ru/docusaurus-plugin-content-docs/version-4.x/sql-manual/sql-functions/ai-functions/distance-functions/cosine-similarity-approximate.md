---
{
    "title": "COSINE_SIMILARITY_APPROXIMATE",
    "language": "ru",
    "description": "Вычисляет косинусное сходство двух векторов. Если массивы имеют значение NULL или содержат элементы NULL, возникает ошибка."
}
---

## Описание {#description}

Вычисляет косинусное сходство двух векторов. Если массивы имеют значение NULL или содержат элементы NULL, возникает ошибка.

Функция доступна в сборках Doris 4.2, в которые она включена. Подходящие запросы Lance Top-N могут использовать встроенный приближённый поиск; остальные запросы выполняются с помощью скалярных ядер.

## Синтаксис {#syntax}

```sql
COSINE_SIMILARITY_APPROXIMATE(<array1>, <array2>)
```

## Параметры {#parameters}

| Параметр | Описание |
|---|---|
| `<array1>` | Числовой массив, неявно преобразуемый в ARRAY<FLOAT>; преобразование может повлиять на точность. |
| `<array2>` | Числовой массив, неявно преобразуемый в ARRAY<FLOAT>; преобразование может повлиять на точность. Длина обоих массивов должна совпадать. |

## Возвращаемое значение {#return-value}

Возвращает значение типа FLOAT: чем оно больше, тем выше сходство. При скалярном вычислении используется формула `dot(x,y) / (norm(x) * norm(y))`. Если норма хотя бы одного вектора равна нулю, в том числе когда оба массива пусты, функция возвращает 0. Если длины массивов не совпадают, массивы имеют значение NULL или содержат элементы NULL, возникает ошибка, а не возвращается NULL. Условия отбора кандидатов для встроенного поиска, числовая точность и поведение при NULL/NaN могут отличаться от скалярного выполнения; см. раздел [«Автоматический поиск»](../../../../lakehouse/best-practices/lance-hybrid-search.mdx#automatic-search).

## Пример {#example}

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([1,0], [0,1]) AS value;
```

```text
value
0
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([0,0], [1,0]) AS value;
```

```text
value
0
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE(NULL, [0,1]);
```

```text
ERROR: First argument for function cosine_similarity_approximate cannot be null
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function cosine_similarity_approximate cannot have null
```
