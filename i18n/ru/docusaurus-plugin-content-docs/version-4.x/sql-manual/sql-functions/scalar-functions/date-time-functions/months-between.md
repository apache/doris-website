---
{
    "title": "MONTHS_BETWEEN",
    "language": "ru",
    "description": "В отличие от функции MONTHSDIFF, функция MONTHSBETWEEN не игнорирует компонент дня и возвращает число с плавающей точкой, представляющее "
}
---

## Описание {#description}

В отличие от [функции MONTHS_DIFF](./months-diff), функция MONTHS_BETWEEN не игнорирует компонент дня и возвращает число с плавающей точкой, представляющее фактическую разницу в месяцах, а не простую разность значений месяцев в датах.

Функция MONTHS_BETWEEN вычисляет разницу в месяцах между двумя значениями даты и времени и возвращает результат с плавающей точкой. Эта функция поддерживает типы DATE и DATETIME и позволяет управлять округлением результата с помощью необязательного параметра.

Поведение этой функции соответствует поведению [функции MONTHS_BETWEEN](https://docs.oracle.com/cd/E11882_01/olap.112/e23381/row_functions042.htm#OLAXS434) в Oracle.

## Синтаксис {#syntax}

```sql
MONTHS_BETWEEN(`<date_or_time_expr1>`, `<date_or_time_expr2>` [, `<round_type>`])
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr1>` | Конечная дата. Поддерживает типы date/datetime. Подробнее о форматах даты и времени см. в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<date_or_time_expr2>` | Начальная дата. Поддерживает типы date/datetime и строки, соответствующие форматам даты и времени. |
| `<round_type>` | Определяет, следует ли округлять результат до 8-го знака после запятой. Допустимые значения: `true` или `false`. По умолчанию используется `true`. |

## Возвращаемое значение {#return-value}

Возвращает количество месяцев, полученное при вычитании `<date_or_time_expr2>` из `<date_or_time_expr1>`. Тип результата: DOUBLE.

Результат = (`<date_or_time_expr1>`.year - `<date_or_time_expr2>`.year) * 12 + `<date_or_time_expr1>`.month - `<date_or_time_expr2>`.month + (`<date_or_time_expr1>`.day - `<date_or_time_expr2>`.day) / 31.0

- Если `<date_or_time_expr1>` или `<date_or_time_expr2>` имеет значение NULL либо оба значения равны NULL, возвращается NULL
- Если `<round_type>` имеет значение true, результат округляется до 8-го знака после запятой; в противном случае сохраняется точность DOUBLE (15 знаков после запятой)
- Если `<date_or_time_expr1>` предшествует `<date_or_time_expr2>`, возвращается отрицательное значение
- Компоненты времени (часы, минуты, секунды) не влияют на вычисление; используются только компоненты даты (год, месяц, день)

Если `<date_or_time_expr1>` и `<date_or_time_expr2>` удовлетворяют следующим условиям, функция возвращает целочисленную разницу в месяцах, игнорируя дробную часть, возникающую из-за различия дней:

- Обе даты приходятся на последний день соответствующего месяца (например, 2024-01-31 и 2024-02-29)
- Обе даты имеют одинаковый компонент дня (например, 2024-01-15 и 2024-03-15)

## Примеры {#examples}

```sql
--- Month difference between two dates
SELECT MONTHS_BETWEEN('2020-12-26', '2020-10-25') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- Including time components (does not affect result)
SELECT MONTHS_BETWEEN('2020-12-26 15:30:00', '2020-10-25 08:15:00') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- Disable rounding (preserve original precision)
SELECT MONTHS_BETWEEN('2020-10-25', '2020-12-26', false) AS result;
+---------------------+
| result              |
+---------------------+
| -2.032258064516129  |
+---------------------+

--- Both are month-end dates (special handling, returns integer)
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-31') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- Same day component (special handling, returns integer)
SELECT MONTHS_BETWEEN('2024-03-15', '2024-01-15') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

--- Different day components and not month-end
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-30') AS result;
+------------+
| result     |
+------------+
| 0.96774194 |
+------------+

--- Input is NULL (returns NULL)
SELECT MONTHS_BETWEEN(NULL, '2024-01-01') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
