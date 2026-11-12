---
{
    "title": "Преобразование типов",
    "language": "ru",
    "description": "В Doris каждое выражение имеет тип, например 1, col1 и fromunixtime(col2) в выражении select 1, col1, fromunixtime(col2) from table1."
}
---

В Doris каждое выражение имеет тип, например `1`, `col1` и `from_unixtime(col2)` в выражении `select 1, col1, from_unixtime(col2) from table1`. Процесс преобразования выражения из одного типа в другой называется «преобразованием типов».

Преобразование типов бывает явным и неявным.

Все преобразования типов выполняются по определённым правилам. Эти правила описаны в соответствии с **целевым типом** преобразования. Например, преобразование из `INT` в `DOUBLE` и преобразование из `STRING` в `DOUBLE` описаны в документе [Преобразование в FLOAT/DOUBLE](./float-double-conversion).

Возможность преобразования и то, будет ли результат иметь тип Nullable, зависят от того, включён ли строгий режим (переменная сеанса `enable_strict_cast`). Как правило, при включённом строгом режиме данные, которые не удаётся преобразовать, немедленно вызывают ошибку и приводят к сбою выполнения SQL. При отключённом строгом режиме строки данных, которые не удаётся преобразовать, дают `NULL`.

## Явное преобразование {#explicit-conversion}

Явное преобразование выполняется с помощью функции `CAST`, например:

`CAST(1.23 as INT)` преобразует число 1.23 в тип INT.

`CAST(colA as DATETIME(6))` преобразует столбец/выражение colA в тип DATETIME(6) (то есть тип DATETIME с точностью до микросекунд).

Ниже описаны возможности преобразования между различными типами в строгом режиме (`enable_strict_cast = true`) и нестрогом режиме (`enable_strict_cast = false`), включая следующие четыре случая:

|Символ|Значение|
|-|-|
|x|Преобразование не допускается|
|P|Возвращаемый тип будет Nullable, только если входной параметр уже имеет тип Nullable, то есть преобразование **не будет** преобразовывать значения, отличные от Null, в Null|
|A|Возвращаемый тип всегда Nullable. Преобразование **может преобразовать значения, отличные от Null, в Null**|
|O|Возвращаемый тип будет Nullable, если преобразование входного типа в выходной **может вызвать переполнение**. Для входных значений, отличных от Null, результат преобразования может быть Null, если преобразование действительно вызывает переполнение|

Подробные правила преобразования типов и свойства Nullable приведены в документах о преобразовании типов в текущем каталоге.

### Строгий режим {#strict-mode}

| **Из**\\**В** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| date             | x    | x       | x        | P   | P      | P        | x     | x      | x       | P    | P        | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| datetime         | x    | x       | x        | x   | P      | P        | x     | x      | x       | P    | A        | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| time             | x    | A       | A        | A   | P      | P        | x     | x      | x       | P    | P        | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         |
| variant          |      |         |          |     |        |          |       |        |         |      |          |      |      |      |      |         |        |        |     |      |       |     |        |         |

### Нестрогий режим {#non-strict-mode}

| **Из**\\**В** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| date             | x    | x       | x        | P   | P      | P        | P     | P      | x       | P    | P        | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| datetime         | x    | x       | x        | x   | P      | P        | P     | P      | x       | P    | A        | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| time             | x    | A       | A        | A   | P      | P        | P     | P      | x       | P    | P        | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         |
| variant          |      |         |          |     |        |          |       |        |         |      |          |      |      |      |      |         |        |        |     |      |       |     |        |         |

## Неявное преобразование {#implicit-conversion}

Неявное преобразование происходит в определённых ситуациях, когда оно явно не указано во входном SQL, но Doris автоматически добавляет в план выражение CAST. Основные примеры таких ситуаций:

1. При вызове функции тип фактического параметра не совпадает с типом в сигнатуре функции.

2. Типы по обе стороны математического выражения не совпадают.

И т. д.

### Матрица преобразований {#conversion-matrix}

TODO

### Общий тип {#common-type}

Если неявное преобразование требуется при использовании операндов в математических операциях, сначала определяется общий тип. Если типы операндов с обеих сторон не совпадают с общим типом, для каждого из них в план добавляется выражение CAST для преобразования к общему типу.
