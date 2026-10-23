---
{
    "title": "Преобразование типов",
    "language": "ru",
    "description": "В Doris каждое выражение, например 1, col1 и fromunixtime(col2) в выражении select 1, col1, fromunixtime(col2) from table1, имеет тип."
}
---

В Doris каждое выражение, например `1`, `col1` и `from_unixtime(col2)` в выражении `select 1, col1, from_unixtime(col2) from table1`, имеет тип. Процесс преобразования выражения из одного типа в другой называется «преобразованием типов».

Преобразование типов бывает двух видов: явное и неявное.

Все преобразования типов выполняются по определённым правилам. Эти правила описаны в зависимости от **целевого типа** преобразования. Например, преобразование из `INT` в `DOUBLE` и преобразование из `STRING` в `DOUBLE` описаны в документе [Преобразование в FLOAT/DOUBLE](./float-double-conversion).

Возможность преобразования и допустимость NULL в типе результата зависят от того, включён ли строгий режим (переменная сеанса `enable_strict_cast`). Как правило, при включённом строгом режиме данные, которые не удалось преобразовать, немедленно вызывают ошибку и приводят к сбою выполнения SQL. При отключённом строгом режиме для строк данных, которые не удалось преобразовать, результатом будет `NULL`.

Правила разбора и миграции приведены в разделе [Преобразование UUID](./uuid-conversion.md). Строки можно преобразовывать в UUID, а UUID можно преобразовывать в строки или VARIANT, но нельзя напрямую преобразовывать в числовые типы, типы даты и времени или IP.

## Явное преобразование {#explicit-conversion}

Явное преобразование выполняется с помощью функции `CAST`, например:

`CAST(1.23 as INT)` преобразует число 1.23 в тип INT.

`CAST(colA as DATETIME(6))` преобразует столбец/выражение colA в тип DATETIME(6) (то есть тип DATETIME с точностью до микросекунд).

Ниже описаны возможности преобразования между различными типами в строгом режиме (`enable_strict_cast = true`) и нестрогом режиме (`enable_strict_cast = false`), включая следующие четыре случая:

|Символ|Значение|
|-|-|
|x|Преобразование не допускается|
|P|Возвращаемый тип будет Nullable только в том случае, если входной параметр уже имеет тип Nullable, то есть преобразование **не будет** преобразовывать значения, отличные от Null, в Null|
|A|Возвращаемый тип всегда Nullable. Преобразование **может преобразовывать значения, отличные от Null, в Null**|
|O|Возвращаемый тип является Nullable, если преобразование из входного типа в выходной **может вызвать переполнение**. Для входных значений, отличных от Null, результат преобразования может быть Null, если при преобразовании действительно возникает переполнение|

Подробные правила преобразования типов и свойства Nullable приведены в документации по преобразованию типов в текущем каталоге.

### Строгий режим {#strict-mode}

| **Из**\\**В** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | timestamp_ns | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant | UUID |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ------------ | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- | ---- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| date             | x    | x       | x        | P   | P      | P        | x     | x      | x       | P    | P        | A            | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| datetime         | x    | x       | x        | x   | P      | P        | x     | x      | x       | P    | A        | A            | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| timestamp_ns     | x    | x       | x        | x   | P      | P        | x     | x      | x       | P    | P        | P            | P    | x    | x    | P    | P       | P      | x      | x   | x    | x     | x   | x      | P       | x |
| time             | x    | A       | A        | A   | P      | P        | x     | x      | x       | P    | P        | P            | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         | x |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         | x |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x            | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         | x |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         | x |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         | x |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         | x |
| variant          |      |         |          |     |        |          |       |        |         |      |          | A            |      |      |      |      |         |        |        |     |      |       |     |        |         | A |
| UUID | x | x | x | x | x | x | x | x | x | x | x | x | x | x | x | P | P | P | x | x | x | x | x | x | P | P |

### Нестрогий режим {#non-strict-mode}

| **Из**\\**В** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | timestamp_ns | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant | UUID |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ------------ | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- | ---- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| date             | x    | x       | x        | P   | P      | P        | P     | P      | x       | P    | P        | A            | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| datetime         | x    | x       | x        | x   | P      | P        | P     | P      | x       | P    | A        | A            | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| timestamp_ns     | x    | x       | x        | x   | P      | P        | P     | P      | x       | P    | P        | P            | P    | x    | x    | P    | P       | P      | x      | x   | x    | x     | x   | x      | P       | x |
| time             | x    | A       | A        | A   | P      | P        | P     | P      | x       | P    | P        | P            | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         | x |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         | x |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x            | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         | x |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         | x |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         | x |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         | x |
| variant          |      |         |          |     |        |          |       |        |         |      |          | A            |      |      |      |      |         |        |        |     |      |       |     |        |         | A |
| UUID | x | x | x | x | x | x | x | x | x | x | x | x | x | x | x | P | P | P | x | x | x | x | x | x | P | P |

Подробные правила преобразования `TIMESTAMP_NS` приведены в разделе [Преобразование в TIMESTAMP_NS](./timestamp-ns-conversion.md). `TIMESTAMPTZ` не включён в приведённые выше матрицы; преобразование между `TIMESTAMP_NS` и `TIMESTAMPTZ` поддерживается как в строгом, так и в нестрогом режиме.

## Неявное преобразование {#implicit-conversion}

Неявное преобразование выполняется в определённых ситуациях, когда оно явно не задано во входном SQL, но Doris автоматически включает выражение CAST в план выполнения. Это происходит главным образом в следующих случаях:

1. При вызове функции тип фактического параметра не соответствует типу в сигнатуре функции.

2. Типы операндов в левой и правой частях математического выражения различаются.

и т. д.

### Матрица преобразований {#conversion-matrix}

TODO

### Общий тип {#common-type}

Если для выполнения математических операций над операндами требуется неявное преобразование, сначала определяется общий тип. Если типы операндов с обеих сторон не совпадают с общим типом, для каждого из них в план добавляется выражение CAST, преобразующее его к общему типу.

Если для строки и UUID требуется общий тип при сравнении, в CASE, COALESCE или операциях над множествами, общим типом становится UUID, а строка разбирается как текстовое представление UUID. К некорректным строкам применяются правила CAST. UUID не участвует в определении общего типа для числовых арифметических операций.
