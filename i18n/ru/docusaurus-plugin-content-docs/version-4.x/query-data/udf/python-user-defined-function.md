---
{
    "title": "Python UDF, UDAF, UDWF, UDTF",
    "language": "ru",
    "description": "Как писать UDF, UDAF и UDTF в Apache Doris на Python: создание, векторизация, настройка среды и устранение распространённых неполадок.",
    "keywords": [
        "Doris Python UDF",
        "Python UDAF",
        "Python UDTF",
        "Векторизованная UDF",
        "Pandas UDF",
        "PYTHON_UDF runtime_version",
        "Среда Python Conda",
        "Среда Python venv",
        "Среда Python не найдена"
    ]
}
---

<!-- Knowledge type: Feature overview + Operations guide + Configuration parameters -->
<!-- Applicable scenario: Extending SQL capability in Doris / Implementing custom scalar, aggregate, and table functions in Python -->

:::caution Экспериментальная возможность
Python UDF/UDAF/UDTF — экспериментальная возможность, появившаяся в Apache Doris 4.1.3.
:::

Python UDF/UDAF/UDTF — это механизм расширения Apache Doris с помощью пользовательских функций. Он позволяет писать скалярные, агрегатные и табличные функции на Python, чтобы выражать в SQL сложную вычислительную логику, которую трудно реализовать встроенными функциями, и использовать богатую экосистему Python.

В этом документе на основе типичных пользовательских сценариев описаны использование, параметры, сопоставление типов данных, рекомендации по производительности, ограничения и развёртывание сред с несколькими версиями Python для каждого из трёх типов функций.

## Когда выбирать Python UDF/UDAF/UDTF {#when-to-choose-python-udfudafudtf}

<!-- Knowledge type: Selection decision -->

| Ваш сценарий | Рекомендуемый вариант | Соотношение строк |
| --- | --- | --- |
| Сложное преобразование, очистка, маскирование или проверка каждой строки | Python UDF (скалярная функция) | Одна входная строка — одна выходная |
| Пользовательские агрегатные показатели для GROUP BY или окна (предложение OVER) | Python UDAF (агрегатная функция) | Несколько входных строк — одна выходная |
| Разворачивание одной строки в несколько, например при разборе CSV/JSON или генерации последовательности | Python UDTF (табличная функция) | Одна входная строка — ни одной или несколько выходных |

Если производительность критична, отдавайте предпочтение встроенным функциям Doris (реализованным на C++). Python UDF подходят для сценариев, в которых встроенные функции не решают задачу, а объём данных умеренный.

## Общие предварительные требования {#general-prerequisites}

<!-- Knowledge type: Pre-deployment check -->
<!-- Applicable scenario: First time enabling Python UDF -->

Перед созданием любой Python UDF/UDAF/UDTF выполните следующие действия:

1. **Включите Python UDF и настройте среду Python**: включите соответствующие параметры в файле `be.conf` узла BE и настройте среду с несколькими версиями Python с помощью Conda или venv. Подробнее см. в разделе [Настройка среды Python UDF/UDAF/UDTF и управление несколькими версиями](#python-udfudafudtf-environment-configuration-and-multi-version-management).
2. **Обязательные зависимости**: заранее установите **`pandas`** и **`pyarrow`** в соответствующую среду Python на всех узлах BE. Это обязательные зависимости механизма Python UDF в Doris; без них функция не сможет работать.
3. **Журналы выполнения**: журнал выполнения Python UDF Server находится в файле `output/be/log/python_udf_output.log`. Для отладки просматривайте в нём сведения о выполнении функций и сообщения об ошибках.

:::tip Совет
Во всех операторах CREATE необходимо явно указывать `runtime_version` с полным номером версии (например, `"3.10.12"`). Нельзя указывать только основную и дополнительную версии (например, `"3.10"`), иначе вызов функции завершится ошибкой.
:::

## Python UDF (скалярная функция) {#python-udf-scalar-function}

<!-- Knowledge type: Operations guide -->

Python UDF (пользовательская функция) обрабатывает данные построчно. Функция вызывается один раз для каждой строки и возвращает один результат. Поддерживаются два режима выполнения:

- **Скалярный режим**: обрабатывает данные построчно. Подходит для простых преобразований и вычислений.
- **Векторизованный режим**: обрабатывает данные пакетами с помощью Pandas для высокопроизводительных вычислений.

### Создание Python UDF {#creating-a-python-udf}

Python UDF поддерживает два способа создания: **встроенный режим** и **модульный режим**.

:::caution Внимание
Если одновременно заданы параметр `file` и встроенный код Python `AS $$`, Doris **отдаёт предпочтение встроенному коду Python** и запускает функцию во встроенном режиме.
:::

#### Встроенный режим {#inline-mode}

Встроенный режим позволяет писать код Python непосредственно в SQL. Он подходит для простой логики.

**Синтаксис**:

```sql
CREATE FUNCTION function_name(parameter_type1, parameter_type2, ...)
RETURNS return_type
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "entry_function_name",
    "runtime_version" = "python_version",
    "always_nullable" = "true|false",
    "volatility" = "immutable|stable|volatile"
)
AS $$
def entry_function_name(param1, param2, ...):
    # Python code here
    return result
$$;
```

**Пример 1: сложение целых чисел**

```sql
DROP FUNCTION IF EXISTS py_add(INT, INT);

CREATE FUNCTION py_add(INT, INT)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "volatility" = "immutable"
)
AS $$
def evaluate(a, b):
    return a + b
$$;

SELECT py_add(10, 20) AS result; -- Result: 30
```

**Пример 2: объединение строк (с обработкой NULL)**

```sql
DROP FUNCTION IF EXISTS py_concat(STRING, STRING);

CREATE FUNCTION py_concat(STRING, STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "volatility" = "immutable"
)
AS $$
def evaluate(s1, s2):
    if s1 is None or s2 is None:
        return None
    return s1 + s2
$$;

SELECT py_concat('Hello', ' World') AS result; -- Result: Hello World
SELECT py_concat(NULL, ' World') AS result;    -- Result: NULL
SELECT py_concat('Hello', NULL) AS result;     -- Result: NULL
```

#### Модульный режим {#module-mode}

Модульный режим подходит для сложной логики. Упакуйте код Python в архив `.zip` и укажите его в параметре `file` при создании функции.

**Шаг 1: напишите модуль Python**

Создайте файл с именем `python_udf_scalar_ops.py`:

```python
def add_three_numbers(a, b, c):
    """Add three numbers"""
    if a is None or b is None or c is None:
        return None
    return a + b + c

def reverse_string(s):
    """Reverse a string"""
    if s is None:
        return None
    return s[::-1]

def is_prime(n):
    """Check if a number is prime"""
    if n is None or n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    import math
    for i in range(3, int(math.sqrt(n)) + 1, 2):
        if n % i == 0:
            return False
    return True
```

**Шаг 2: упакуйте модуль Python**

Файл Python **обязательно** нужно упаковать в формат `.zip` (даже если файл всего один):

```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py
```

Если файлов Python несколько:

```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py utils.py helper.py ...
```

**Шаг 3: задайте путь к архиву `.zip`**

Укажите путь к архиву `.zip` через параметр `file`. Поддерживаются два способа:

| Способ развёртывания | Формат | Подходящий сценарий |
| --- | --- | --- |
| Локальная файловая система | `"file" = "file:///path/to/python_udf_scalar_ops.zip"` | Архив `.zip` хранится в локальной файловой системе узла BE |
| Удалённое скачивание по HTTP/HTTPS | `"file" = "http://example.com/udf/xx.zip"` или `"file" = "https://s3.amazonaws.com/bucket/xx.zip"` | Скачивание архива `.zip` из объектного хранилища (S3, OSS, COS и т. п.) или с HTTP-сервера. Doris автоматически скачивает его и кэширует локально |

:::caution Внимание
- При удалённом скачивании убедитесь, что URL доступен со всех узлов BE.
- При первом вызове файл скачивается, что может вызвать небольшую задержку.
- Файл кэшируется, поэтому при последующих вызовах повторное скачивание не требуется.
:::

**Шаг 4: задайте параметр `symbol`**

В модульном режиме `symbol` указывает расположение целевой функции внутри ZIP-архива. Формат:

```
[package_name.]module_name.func_name
```

Описание параметров:

- `package_name` (необязательный): имя пакета Python верхнего уровня внутри ZIP-архива. Опустите его, если функция находится в корневом модуле пакета или если ZIP-архив не содержит пакета.
- `module_name` (обязательный): имя файла модуля Python (без суффикса `.py`), содержащего целевую функцию.
- `func_name` (обязательный): имя пользовательской функции.

Правила разрешения имени:

- Doris разбивает строку `symbol` по `.`:
    - Если получаются **две** подстроки, это `module_name` и `func_name`.
    - Если получаются **три или более** подстрок, первая — `package_name`, средняя часть — `module_name`, последняя — `func_name`.
- Часть `module_name` служит путём модуля для динамического импорта через `importlib`.
- Если указан `package_name`, весь путь должен быть допустимым путём импорта Python, а структура ZIP-архива должна соответствовать этому пути.

:::caution Предупреждение
Пространство имён должно быть уникальным. Избегайте имён, совпадающих с именами модулей стандартной библиотеки Python или распространённых сторонних библиотек, чтобы предотвратить конфликты зависимостей и исключения при выполнении из-за перекрытия модулей.
:::

**Пример A: без структуры пакетов (две части)**

```
ZIP structure:
math_ops.py

symbol = "math_ops.add"
```

Это означает, что функция `add` определена в файле `math_ops.py` в корне ZIP-архива.

**Пример B: со структурой пакетов (три части)**

```
ZIP structure:
mylib/
├── __init__.py
└── string_helper.py

symbol = "mylib.string_helper.split_text"
```

Это означает, что функция `split_text` определена в файле `mylib/string_helper.py`, где:

- `package_name` = `mylib`
- `module_name` = `string_helper`
- `func_name` = `split_text`

**Пример C: вложенная структура пакетов (четыре части)**

```
ZIP structure:
mylib/
├── __init__.py
└── utils/
    ├── __init__.py
    └── string_helper.py

symbol = "mylib.utils.string_helper.split_text"
```

Это означает, что функция `split_text` определена в файле `mylib/utils/string_helper.py`, где:

- `package_name` = `mylib`
- `module_name` = `utils.string_helper`
- `func_name` = `split_text`

> **Примечание**:
> - Если формат `symbol` некорректен (например, отсутствует имя функции, имя модуля пустое или в пути есть пустые компоненты), Doris сообщает об ошибке при вызове функции.
> - Структура каталогов внутри ZIP-архива должна соответствовать пути, указанному в `symbol`.
> - Каждый каталог пакета должен содержать файл `__init__.py` (он может быть пустым).

**Шаг 5: создайте UDF**

Пример 1: использование локального файла (без структуры пакетов)

```sql
DROP FUNCTION IF EXISTS py_add_three(INT, INT, INT);
DROP FUNCTION IF EXISTS py_reverse(STRING);
DROP FUNCTION IF EXISTS py_is_prime(INT);

CREATE FUNCTION py_add_three(INT, INT, INT)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/python_udf_scalar_ops.zip",
    "symbol" = "python_udf_scalar_ops.add_three_numbers",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);

CREATE FUNCTION py_reverse(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/python_udf_scalar_ops.zip",
    "symbol" = "python_udf_scalar_ops.reverse_string",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);

CREATE FUNCTION py_is_prime(INT)
RETURNS BOOLEAN
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/python_udf_scalar_ops.zip",
    "symbol" = "python_udf_scalar_ops.is_prime",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);
```

Пример 2: использование удалённого файла по HTTP/HTTPS

```sql
DROP FUNCTION IF EXISTS py_add_three(INT, INT, INT);
DROP FUNCTION IF EXISTS py_reverse(STRING);
DROP FUNCTION IF EXISTS py_is_prime(INT);

CREATE FUNCTION py_add_three(INT, INT, INT)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "https://your-storage.com/udf/python_udf_scalar_ops.zip",
    "symbol" = "python_udf_scalar_ops.add_three_numbers",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);

CREATE FUNCTION py_reverse(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "https://your-storage.com/udf/python_udf_scalar_ops.zip",
    "symbol" = "python_udf_scalar_ops.reverse_string",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);

CREATE FUNCTION py_is_prime(INT)
RETURNS BOOLEAN
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "https://your-storage.com/udf/python_udf_scalar_ops.zip",
    "symbol" = "python_udf_scalar_ops.is_prime",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);
```

Пример 3: использование структуры пакетов

```sql
DROP FUNCTION IF EXISTS py_multiply(INT);

-- ZIP structure: my_udf/__init__.py, my_udf/math_ops.py
CREATE FUNCTION py_multiply(INT)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/my_udf.zip",
    "symbol" = "my_udf.math_ops.multiply_by_two",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);
```

**Шаг 6: используйте функцию**

```sql
SELECT py_add_three(10, 20, 30) AS sum_result; -- Result: 60
SELECT py_reverse('hello') AS reversed;        -- Result: olleh
SELECT py_is_prime(17) AS is_prime;            -- Result: true
```

### Удаление Python UDF {#dropping-a-python-udf}

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_type1, parameter_type2, ...);

-- Example
DROP FUNCTION IF EXISTS py_add_three(INT, INT, INT);
DROP FUNCTION IF EXISTS py_reverse(STRING);
DROP FUNCTION IF EXISTS py_is_prime(INT);
```

### Справочник параметров {#parameter-reference}

#### Параметры CREATE FUNCTION {#create-function-parameters}

| Параметр | Обязательный | Описание |
| --- | --- | --- |
| `function_name` | Да | Имя функции. Должно соответствовать правилам именования идентификаторов |
| `parameter_type` | Да | Список типов параметров. Поддерживаются различные типы данных Doris |
| `return_type` | Да | Тип возвращаемого значения |

#### Параметры PROPERTIES {#properties-parameters}

| Параметр | Обязательный | Значение по умолчанию | Описание |
| --- | --- | --- | --- |
| `type` | Да | - | Фиксированное значение `"PYTHON_UDF"` |
| `symbol` | Да | - | Имя точки входа функции Python.<br/>• **Встроенный режим**: укажите непосредственно имя функции, например `"evaluate"`<br/>• **Модульный режим**: формат `[package_name.]module_name.func_name`. Подробнее см. в описании модульного режима |
| `file` | Нет | - | Путь к архиву Python `.zip`. Требуется только в модульном режиме. Поддерживаются три протокола:<br/>• `file://`: путь в локальной файловой системе<br/>• `http://`: удалённое скачивание по HTTP<br/>• `https://`: удалённое скачивание по HTTPS |
| `runtime_version` | Да | - | Версия среды выполнения Python, например `"3.10.12"`. Требуется полный номер версии |
| `always_nullable` | Нет | `true` | Всегда ли функция возвращает результат, допускающий NULL |
| `volatility` | Нет | `volatile` | Изменчивость функции, поддерживается начиная с 4.1.2. Допустимые значения: `immutable`, `stable` и `volatile`.<br/>`immutable`: одинаковые входные данные всегда дают одинаковый результат. Большинству детерминированных UDF следует задавать это значение для лучшей оптимизации плана.<br/>`stable`: результат стабилен в пределах одного оператора SQL, но может меняться между операторами, как у `now()`. Кэш SQL и переписывание запросов с использованием материализованных представлений отключены.<br/>`volatile`: результат может меняться при каждом вызове, как у `random()`. Кэш SQL, переписывание запросов с использованием материализованных представлений и многие правила переписывания оптимизатора отключены. |

#### Примечания о версии среды выполнения {#runtime-version-notes}

- Поддерживается Python 3.x.
- Необходимо указывать полный номер версии (например, `"3.10.12"`); указывать только основную и дополнительную версии (например, `"3.10"`) нельзя.
- Если `runtime_version` не указан, вызов функции завершается ошибкой.

### Сопоставление типов данных {#data-type-mapping}

<!-- Knowledge type: Reference -->

В следующей таблице приведено сопоставление типов данных Doris и типов Python:

| Категория типа | Тип Doris | Тип Python | Описание |
| --- | --- | --- | --- |
| Тип NULL | `NULL` | `None` | Значение NULL |
| Логический тип | `BOOLEAN` | `bool` | Логическое значение |
| Целочисленные типы | `TINYINT` | `int` | 8-битное целое число |
|  | `SMALLINT` | `int` | 16-битное целое число |
|  | `INT` | `int` | 32-битное целое число |
|  | `BIGINT` | `int` | 64-битное целое число |
|  | `LARGEINT` | `int` | 128-битное целое число |
| Типы с плавающей точкой | `FLOAT` | `float` | 32-битное число с плавающей точкой |
|  | `DOUBLE` | `float` | 64-битное число с плавающей точкой |
|  | `TIME` / `TIMEV2` | `float` | Тип времени (представлен числом с плавающей точкой) |
| Строковые типы | `CHAR` | `str` | Строка фиксированной длины |
|  | `VARCHAR` | `str` | Строка переменной длины |
|  | `STRING` | `str` | Строка |
|  | `JSONB` | `str` | Двоичный формат JSON (преобразуется в строку) |
|  | `VARIANT` | `str` | Тип Variant (преобразуется в строку) |
|  | `DATE` | `str` | Строка даты в формате `'YYYY-MM-DD'` |
|  | `DATETIME` | `str` | Строка даты и времени в формате `'YYYY-MM-DD HH:MM:SS'` |
| Типы даты и времени | `DATEV2` | `datetime.date` | Объект даты |
|  | `DATETIMEV2` | `datetime.datetime` | Объект даты и времени |
|  | `TIMESTAMPTZ` | `datetime.datetime` | Объект даты и времени с часовым поясом |
| Десятичные типы | `DECIMAL` / `DECIMALV2` | `decimal.Decimal` | Десятичное число высокой точности |
|  | `DECIMAL32` | `decimal.Decimal` | 32-битное число с фиксированной точкой |
|  | `DECIMAL64` | `decimal.Decimal` | 64-битное число с фиксированной точкой |
|  | `DECIMAL128` | `decimal.Decimal` | 128-битное число с фиксированной точкой |
|  | `DECIMAL256` | `decimal.Decimal` | 256-битное число с фиксированной точкой |
| Типы IP | `IPV4` | `ipaddress.IPv4Address` | Адрес IPv4 |
|  | `IPV6` | `ipaddress.IPv6Address` | Адрес IPv6 |
| Двоичные типы | `BITMAP` | `bytes` | Данные Bitmap (пока не поддерживаются) |
|  | `HLL` | `bytes` | Данные HyperLogLog (пока не поддерживаются) |
|  | `QUANTILE_STATE` | `bytes` | Данные состояния квантилей (пока не поддерживаются) |
| Сложные типы данных | `ARRAY<T>` | `list` | Массив с типом элементов T |
|  | `MAP<K,V>` | `dict` | Словарь с типом ключей K и типом значений V |
|  | `STRUCT<f1:T1, f2:T2, ...>` | `dict` | Структура, в которой ключи — имена полей, а значения — значения полей |

#### Обработка NULL {#null-handling}

- Значение Doris `NULL` соответствует `None` в Python.
- Если аргумент функции равен `NULL`, функция Python получает `None`.
- Если функция Python возвращает `None`, Doris трактует его как `NULL`.
- Явно обрабатывайте значения `None` в функции, чтобы избежать ошибок при выполнении.

Пример:

```sql
DROP FUNCTION IF EXISTS py_safe_divide(DOUBLE, DOUBLE);

CREATE FUNCTION py_safe_divide(DOUBLE, DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def evaluate(a, b):
    if a is None or b is None:
        return None
    if b == 0:
        return None
    return a / b
$$;

SELECT py_safe_divide(10.0, 2.0);   -- Result: 5.0
SELECT py_safe_divide(10.0, 0.0);   -- Result: NULL
SELECT py_safe_divide(10.0, NULL);  -- Result: NULL
```

### Векторизованный режим {#vectorized-mode}

<!-- Applicable scenario: Large-batch data computation / Performance optimization -->

Векторизованный режим использует Pandas для пакетной обработки данных и превосходит скалярный режим по производительности. В векторизованном режиме аргументы функции — объекты `pandas.Series`, а возвращаемое значение также должно быть объектом `pandas.Series`.

:::caution Внимание
Чтобы система распознала векторизованный режим, используйте аннотации типов в сигнатуре функции (например, `a: pd.Series`) и работайте непосредственно с пакетной структурой данных внутри функции. Без явного указания векторизованных типов система переходит в скалярный режим.

Если сигнатура функции сочетает типы `pd.Series` с обычными типами, система трактует входной столбец, соответствующий параметру обычного типа, как константный столбец (одно и то же значение используется для всего пакета). Это может привести к неожиданным результатам. В векторизованном режиме придерживайтесь единого стиля параметров: либо указывайте аннотации типа `pandas.Series` для всех параметров, либо используйте обычные типы для всех параметров (скалярный режим).
:::

```python
## Vectorized mode
def add(a: pd.Series, b: pd.Series) -> pd.Series:
    return a + b + 1

## Scalar mode
def add(a, b):
    return a + b + 1
```

#### Базовые примеры {#basic-examples}

**Пример 1: векторизованное сложение целых чисел**

```sql
DROP FUNCTION IF EXISTS py_vec_add(INT, INT);

CREATE FUNCTION py_vec_add(INT, INT)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "add",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
import pandas as pd

def add(a: pd.Series, b: pd.Series) -> pd.Series:
    return a + b + 1
$$;

SELECT py_vec_add(1, 2); -- Result: 4
```

**Пример 2: векторизованная обработка строк**

```sql
DROP FUNCTION IF EXISTS py_vec_upper(STRING);

CREATE FUNCTION py_vec_upper(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "to_upper",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
import pandas as pd

def to_upper(s: pd.Series) -> pd.Series:
    return s.str.upper()
$$;

SELECT py_vec_upper('hello'); -- Result: 'HELLO'
```

**Пример 3: векторизованные математические операции**

```sql
DROP FUNCTION IF EXISTS py_vec_sqrt(DOUBLE);

CREATE FUNCTION py_vec_sqrt(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "sqrt",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
import pandas as pd
import numpy as np

def sqrt(x: pd.Series) -> pd.Series:
    return np.sqrt(x)
$$;

SELECT py_vec_sqrt(16); -- Result: 4.0
```

**Пример 4: смешанные типы параметров в сигнатуре функции (`pd.Series` и обычные типы)**

```sql
CREATE TABLE t_bug_013 (
    id INT,
    a INT,
    b INT
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO t_bug_013 VALUES
    (1, 1, 10),
    (2, 2, 20),
    (3, 3, 30),
    (4, 4, NULL),
    (5, NULL, 50);

DROP FUNCTION IF EXISTS py_mixed_vector_add(INT, INT);

CREATE FUNCTION py_mixed_vector_add(INT, INT)
RETURNS INT
PROPERTIES (
  "type"="PYTHON_UDF",
  "symbol"="py_mixed_vector_add_impl",
  "always_nullable"="true",
  "runtime_version"="3.12.11",
  "volatility"="immutable"
)
AS $$
import pandas as pd

# Keep the parameter style consistent
def py_mixed_vector_add_impl(x: pd.Series, y: int):
    return x + y
$$;

SELECT
	id,
	a,
	b,
	py_mixed_vector_add(a, b) AS vector_val
FROM t_bug_013
ORDER BY id;
-- Column b is treated as a constant column
+------+------+------+------------+
| id   | a    | b    | vector_val |
+------+------+------+------------+
|    1 |    1 |   10 |         11 |
|    2 |    2 |   20 |         12 |
|    3 |    3 |   30 |         13 |
|    4 |    4 | NULL |         14 |
|    5 | NULL |   50 |       NULL |
+------+------+------+------------+
```

#### Преимущества векторизованного режима {#advantages-of-vectorized-mode}

1. **Оптимизация производительности**: пакетная обработка данных сокращает число взаимодействий между Python и Doris.
2. **Использование Pandas/NumPy**: позволяет в полной мере использовать векторизованные вычисления.
3. **Краткий код**: API Pandas позволяет выражать сложную логику более лаконично.

#### Использование векторизованных функций {#using-vectorized-functions}

```sql
DROP TABLE IF EXISTS test_table;

CREATE TABLE test_table (
    id INT,
    value INT,
    text STRING,
    score DOUBLE
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num" = "1");

INSERT INTO test_table VALUES
(1, 10, 'hello', 85.5),
(2, 20, 'world', 92.0),
(3, 30, 'python', 78.3);

SELECT 
    id,
    py_vec_add(value, value) AS sum_result,
    py_vec_upper(text) AS upper_text,
    py_vec_sqrt(score) AS sqrt_score
FROM test_table;

+------+------------+------------+-------------------+
| id   | sum_result | upper_text | sqrt_score        |
+------+------------+------------+-------------------+
|    1 |         21 | HELLO      | 9.246621004453464 |
|    2 |         41 | WORLD      | 9.591663046625438 |
|    3 |         61 | PYTHON     | 8.848728722251575 |
+------+------------+------------+-------------------+
```

### Обработка сложных типов данных {#handling-complex-data-types}

#### Тип ARRAY {#array-type}

**Пример: сумма элементов массива**

```sql
DROP FUNCTION IF EXISTS py_array_sum(ARRAY<INT>);

CREATE FUNCTION py_array_sum(ARRAY<INT>)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def evaluate(arr):
    """ The Doris ARRAY type maps to a Python list """
    if arr is None:
        return None
    return sum(arr)
$$;

SELECT py_array_sum([1, 2, 3, 4, 5]) AS result; -- Result: 15
```

**Пример: фильтрация массива**

```sql
DROP FUNCTION IF EXISTS py_array_filter_positive(ARRAY<INT>);

CREATE FUNCTION py_array_filter_positive(ARRAY<INT>)
RETURNS ARRAY<INT>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def evaluate(arr):
    if arr is None:
        return None
    return [x for x in arr if x > 0]
$$;

SELECT py_array_filter_positive([1, -2, 3, -4, 5]) AS result; -- Result: [1, 3, 5]
```

#### Тип MAP {#map-type}

**Пример: получение количества ключей в MAP**

```sql
DROP FUNCTION IF EXISTS py_map_size(MAP<STRING, INT>);

CREATE FUNCTION py_map_size(MAP<STRING, INT>)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def evaluate(m):
    """ The Doris MAP type maps to a Python dict """
    if m is None:
        return None
    return len(m)
$$;

SELECT py_map_size({'a': 1, 'b': 2, 'c': 3}) AS result; -- Result: 3
```

**Пример: получение значения из MAP**

```sql
DROP FUNCTION IF EXISTS py_map_get(MAP<STRING, STRING>, STRING);

CREATE FUNCTION py_map_get(MAP<STRING, STRING>, STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def evaluate(m, key):
    if m is None or key is None:
        return None
    return m.get(key)
$$;

SELECT py_map_get({'name': 'Alice', 'age': '30'}, 'name') AS result; -- Result: Alice
```

#### Тип STRUCT {#struct-type}

**Пример: доступ к полям STRUCT**

```sql
DROP FUNCTION IF EXISTS py_struct_get_name(STRUCT<name: STRING, age: INT>);

CREATE FUNCTION py_struct_get_name(STRUCT<name: STRING, age: INT>)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def evaluate(s):
    """ The Doris STRUCT type maps to a Python dict """
    if s is None:
        return None
    return s.get('name')
$$;

SELECT py_struct_get_name({'Alice', 30}) AS result; -- Result: Alice
```

### Практические сценарии {#real-world-scenarios}

<!-- Knowledge type: Scenario examples -->

#### Сценарий 1: маскирование данных {#scenario-1-data-masking}

```sql
DROP FUNCTION IF EXISTS py_mask_email(STRING);

CREATE FUNCTION py_mask_email(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "volatility" = "immutable"
)
AS $$
def evaluate(email):
    if email is None or '@' not in email:
        return None
    parts = email.split('@')
    if len(parts[0]) <= 1:
        return email
    masked_user = parts[0][0] + '***'
    return f"{masked_user}@{parts[1]}"
$$;

SELECT py_mask_email('user@example.com') AS masked; -- Result: u***@example.com
```

#### Сценарий 2: вычисление сходства строк {#scenario-2-string-similarity-calculation}

```sql
DROP FUNCTION IF EXISTS py_levenshtein_distance(STRING, STRING);

CREATE FUNCTION py_levenshtein_distance(STRING, STRING)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "volatility" = "immutable"
)
AS $$
def evaluate(s1, s2):
    if s1 is None or s2 is None:
        return None
    if len(s1) < len(s2):
        return evaluate(s2, s1)
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]
$$;

SELECT py_levenshtein_distance('kitten', 'sitting') AS distance; -- Result: 3
```

#### Сценарий 3: вычисления с датами {#scenario-3-date-calculation}

```sql
DROP FUNCTION IF EXISTS py_days_between(DATE, DATE);

CREATE FUNCTION py_days_between(DATE, DATE)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "volatility" = "immutable"
)
AS $$
from datetime import datetime

def evaluate(date1_str, date2_str):
    if date1_str is None or date2_str is None:
        return None
    try:
        d1 = datetime.strptime(str(date1_str), '%Y-%m-%d')
        d2 = datetime.strptime(str(date2_str), '%Y-%m-%d')
        return abs((d2 - d1).days)
    except:
        return None
$$;

SELECT py_days_between('2024-01-01', '2024-12-31') AS days; -- Result: 365
```

#### Сценарий 4: проверка номера удостоверения личности {#scenario-4-id-card-number-validation}

```sql
DROP FUNCTION IF EXISTS py_validate_id_card(STRING);

CREATE FUNCTION py_validate_id_card(STRING)
RETURNS BOOLEAN
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "volatility" = "immutable"
)
AS $$
def evaluate(id_card):
    if id_card is None or len(id_card) != 18:
        return False
    
    # Verify that the first 17 characters are digits
    if not id_card[:17].isdigit():
        return False
    
    # Check code weights
    weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    check_codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    
    # Compute the check code
    total = sum(int(id_card[i]) * weights[i] for i in range(17))
    check_code = check_codes[total % 11]
    
    return id_card[17].upper() == check_code
$$;

SELECT py_validate_id_card('11010519491231002X') AS is_valid;  -- Result: True
SELECT py_validate_id_card('110105194912310021x') AS is_valid; -- Result: False
```

### Рекомендации по производительности {#performance-recommendations}

#### 1. Отдавайте предпочтение векторизованному режиму {#1-prefer-vectorized-mode}

Векторизованный режим значительно производительнее скалярного:

```python
# Scalar mode: row-by-row processing
def scalar_process(x):
    return x * 2

# Vectorized mode: batch processing
import pandas as pd
def vector_process(x: pd.Series) -> pd.Series:
    return x * 2
```

#### 2. Используйте модульный режим для сложной логики {#2-use-module-mode-for-complex-logic}

Размещайте сложную логику функций в отдельных файлах Python, чтобы упростить сопровождение и повторное использование.

#### 3. Избегайте операций ввода-вывода внутри функций {#3-avoid-io-operations-inside-functions}

Избегайте файлового ввода-вывода, сетевых запросов и других операций ввода-вывода в UDF. Они существенно снижают производительность.

### Ограничения и примечания {#limitations-and-notes}

#### 1. Поддержка версий Python {#1-python-version-support}

- Поддерживается только Python 3.x.
- Рекомендуется Python 3.10 или новее.
- Убедитесь, что в кластере Doris установлена соответствующая среда выполнения Python.

#### 2. Библиотеки зависимостей {#2-dependency-libraries}

- Стандартная библиотека Python поддерживается без дополнительной настройки.
- Для использования сторонних библиотек заранее установите их в среду кластера.

#### 3. Особенности производительности {#3-performance-considerations}

- Производительность Python UDF ниже, чем у встроенных функций Doris (реализованных на C++).
- В сценариях, чувствительных к производительности, отдавайте предпочтение встроенным функциям Doris.
- Для больших объёмов данных используйте векторизованный режим.

#### 4. Безопасность {#4-security}

- Код UDF выполняется внутри процесса Doris, поэтому он должен быть безопасным и доверенным.
- Избегайте опасных операций в UDF (например, системных команд или удаления файлов).
- Проверяйте код UDF в производственных средах.

#### 5. Ограничения ресурсов {#5-resource-limits}

- Выполнение UDF потребляет ресурсы CPU и памяти на узлах BE.
- Интенсивное использование UDF может влиять на общую производительность кластера.
- Следите за потреблением ресурсов UDF.

### Часто задаваемые вопросы {#frequently-asked-questions}

<!-- Knowledge type: FAQ -->

#### Вопрос 1: как использовать стороннюю библиотеку в Python UDF? {#q1-how-do-i-use-a-third-party-library-in-a-python-udf}

Ответ: установите соответствующую библиотеку Python на каждом узле BE. Например:

```bash
pip3 install numpy pandas
conda install numpy pandas
```

#### Вопрос 2: поддерживает ли Python UDF рекурсивные функции? {#q2-does-python-udf-support-recursive-functions}

Ответ: да, но следите за глубиной рекурсии, чтобы избежать переполнения стека.

#### Вопрос 3: как отлаживать Python UDF? {#q3-how-do-i-debug-a-python-udf}

Ответ: сначала отладьте логику функции в локальной среде Python, чтобы убедиться в её корректности, затем создайте UDF. Сведения об ошибках смотрите в журналах BE.

#### Вопрос 4: поддерживает ли Python UDF глобальные переменные? {#q4-does-python-udf-support-global-variables}

Ответ: да, но использовать их не рекомендуется. В распределённой среде поведение глобальных переменных может не соответствовать ожиданиям.

#### Вопрос 5: как обновить существующую Python UDF? {#q5-how-do-i-update-an-existing-python-udf}

Ответ: сначала удалите старую UDF, затем создайте новую:

```sql
DROP FUNCTION IF EXISTS function_name(parameter_types);
CREATE FUNCTION function_name(...) ...;
```

#### Вопрос 6: может ли Python UDF обращаться к внешним ресурсам? {#q6-can-a-python-udf-access-external-resources}

Ответ: технически да, но это **настоятельно не рекомендуется**. Внутри Python UDF можно использовать сетевые библиотеки (например, `requests`) для обращения к внешним API и базам данных, однако это существенно влияет на производительность и стабильность. Причины:

- Сетевые задержки замедляют запросы.
- UDF завершается ошибкой, если внешний сервис недоступен.
- Большое число параллельных запросов может создавать нагрузку на внешний сервис.
- Тайм-ауты и обработку ошибок трудно контролировать.

## Python UDAF (агрегатная функция) {#python-udaf-aggregate-function}

<!-- Knowledge type: Operations guide -->

Python UDAF (пользовательская агрегатная функция) позволяет определять собственные агрегатные функции для агрегации по группам и оконных вычислений. С помощью Python UDAF можно гибко реализовать сложную логику агрегации: статистический анализ, сбор данных и вычисление пользовательских показателей.

Основные особенности Python UDAF:

- **Распределённая агрегация**: поддерживает агрегацию в распределённой среде, автоматически выполняя разбиение данных, слияние и итоговое вычисление.
- **Управление состоянием**: хранит состояние агрегации в экземплярах класса и поддерживает сложные объекты состояния.
- **Поддержка оконных функций**: работает с оконными функциями (предложением OVER) для скользящей агрегации, ранжирования и других расширенных возможностей.
- **Высокая гибкость**: позволяет реализовать сколь угодно сложную логику агрегации без ограничений встроенных агрегатных функций.

### Основные понятия UDAF {#udaf-basic-concepts}

#### Жизненный цикл агрегатной функции {#aggregate-function-lifecycle}

Python UDAF реализуется в виде класса. Выполнение агрегатной функции включает следующие этапы:

1. **Инициализация (`__init__`)**: создаёт объект состояния агрегации и инициализирует переменные состояния.
2. **Накопление (`accumulate`)**: обрабатывает одну строку и обновляет состояние агрегации.
3. **Слияние (`merge`)**: объединяет состояния агрегации из нескольких разделов данных (в распределённых сценариях).
4. **Завершение (`finish`)**: вычисляет и возвращает итоговый результат агрегации.

#### Обязательные методы и атрибуты класса {#required-class-methods-and-attributes}

Полноценный класс Python UDAF должен реализовывать следующее:

| Метод/атрибут | Описание | Обязательный |
| --- | --- | --- |
| `__init__(self)` | Инициализирует состояние агрегации | Да |
| `accumulate(self, *args)` | Накапливает данные одной строки | Да |
| `merge(self, other_state)` | Объединяет состояния из других разделов данных | Да |
| `finish(self)` | Возвращает итоговый результат агрегации | Да |
| `aggregate_state` (атрибут) | Возвращает сериализуемое состояние агрегации. **Должно поддерживать сериализацию pickle** | Да |

### Базовый синтаксис {#basic-syntax}

#### Создание Python UDAF {#creating-a-python-udaf}

Python UDAF поддерживает два способа создания: **встроенный режим** и **модульный режим**.

:::tip Примечание
Если одновременно заданы параметр `file` и встроенный код Python `AS $$`, Doris **отдаёт предпочтение встроенному коду Python** и запускает Python UDAF во встроенном режиме.
:::

##### Встроенный режим {#inline-mode-1}

Встроенный режим позволяет писать класс Python непосредственно в SQL. Он подходит для простой логики агрегации.

**Синтаксис**:

```sql
CREATE AGGREGATE FUNCTION function_name(parameter_type1, parameter_type2, ...)
RETURNS return_type
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "ClassName",
    "runtime_version" = "python_version",
    "always_nullable" = "true|false"
)
AS $$
class ClassName:
    def __init__(self):
        # Initialize state variables
        
    @property
    def aggregate_state(self):
        # Return the serializable state
        
    def accumulate(self, *args):
        # Accumulate data
        
    def merge(self, other_state):
        # Merge state
        
    def finish(self):
        # Return the final result
$$;
```

**Пример 1: агрегация суммы**

```sql
DROP TABLE IF EXISTS sales;

CREATE TABLE IF NOT EXISTS sales (
    id INT,
    category VARCHAR(50),
    amount INT
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num" = "1");

INSERT INTO sales VALUES 
(1, 'Electronics', 1000),
(2, 'Electronics', 1500),
(3, 'Books', 200),
(4, 'Books', 300),
(5, 'Clothing', 500),
(6, 'Clothing', 800),
(7, 'Electronics', 2000),
(8, 'Books', 150);

DROP FUNCTION IF EXISTS py_sum(INT);

CREATE AGGREGATE FUNCTION py_sum(INT)
RETURNS BIGINT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "SumUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
class SumUDAF:
    def __init__(self):
        self.total = 0
    
    @property
    def aggregate_state(self):
        return self.total
    
    def accumulate(self, value):
        if value is not None:
            self.total += value
    
    def merge(self, other_state):
        self.total += other_state
    
    def finish(self):
        return self.total
$$;

SELECT category, py_sum(amount) as total_amount
FROM sales
GROUP BY category
ORDER BY category;

+-------------+--------------+
| category    | total_amount |
+-------------+--------------+
| Books       |          650 |
| Clothing    |         1300 |
| Electronics |         4500 |
+-------------+--------------+
```

**Пример 2: агрегация среднего значения**

```sql
DROP TABLE IF EXISTS employees;

CREATE TABLE IF NOT EXISTS employees (
    id INT,
    name VARCHAR(100),
    department VARCHAR(50),
    salary DOUBLE
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num" = "1");

INSERT INTO employees VALUES 
(1, 'Alice', 'Engineering', 80000.0),
(2, 'Bob', 'Engineering', 90000.0),
(3, 'Charlie', 'Sales', 60000.0),
(4, 'David', 'Sales', 80000.0),
(5, 'Eve', 'HR', 50000.0),
(6, 'Frank', 'Engineering', 70000.0),
(7, 'Grace', 'HR', 70000.0);

DROP FUNCTION IF EXISTS py_avg(DOUBLE);

CREATE AGGREGATE FUNCTION py_avg(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "AvgUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
class AvgUDAF:
    def __init__(self):
        self.sum = 0.0
        self.count = 0
    
    @property
    def aggregate_state(self):
        return (self.sum, self.count)
    
    def accumulate(self, value):
        if value is not None:
            self.sum += value
            self.count += 1
    
    def merge(self, other_state):
        other_sum, other_count = other_state
        self.sum += other_sum
        self.count += other_count
    
    def finish(self):
        if self.count == 0:
            return None
        return self.sum / self.count
$$;

SELECT department, py_avg(salary) as avg_salary
FROM employees
GROUP BY department
ORDER BY department;

+-------------+------------+
| department  | avg_salary |
+-------------+------------+
| Engineering |      80000 |
| HR          |      60000 |
| Sales       |      70000 |
+-------------+------------+
```

##### Модульный режим {#module-mode-1}

Модульный режим подходит для сложной логики агрегации. Упакуйте код Python в архив `.zip` и укажите его при создании функции.

**Шаг 1: напишите модуль Python**

Создайте файл с именем `stats_udaf.py`:

```python
import math

class VarianceUDAF:
    """Compute the population variance"""
    
    def __init__(self):
        self.count = 0
        self.sum_val = 0.0
        self.sum_sq = 0.0
    
    @property
    def aggregate_state(self):
        return (self.count, self.sum_val, self.sum_sq)
    
    def accumulate(self, value):
        if value is not None:
            self.count += 1
            self.sum_val += value
            self.sum_sq += value * value
    
    def merge(self, other_state):
        other_count,  other_sum,  other_sum_sq = other_state
        self.count += other_count
        self.sum_val += other_sum
        self.sum_sq += other_sum_sq
    
    def finish(self):
        if self.count == 0:
            return None
        mean = self.sum_val / self.count
        variance = (self.sum_sq / self.count) - (mean * mean)
        return variance


class StdDevUDAF:
    """Compute the population standard deviation"""
    
    def __init__(self):
        self.count = 0
        self.sum_val = 0.0
        self.sum_sq = 0.0
    
    @property
    def aggregate_state(self):
        return (self.count, self.sum_val, self.sum_sq)
    
    def accumulate(self, value):
        if value is not None:
            self.count += 1
            self.sum_val += value
            self.sum_sq += value * value
    
    def merge(self, other_state):
        other_count, other_sum, other_sum_sq = other_state
        self.count += other_count
        self.sum_val += other_sum
        self.sum_sq += other_sum_sq
    
    def finish(self):
        if self.count == 0:
            return None
        mean = self.sum_val / self.count
        variance = (self.sum_sq / self.count) - (mean * mean)
        return math.sqrt(max(0, variance))


class MedianUDAF:
    """Compute the median"""
    
    def __init__(self):
        self.values = []
    
    @property
    def aggregate_state(self):
        return self.values
    
    def accumulate(self, value):
        if value is not None:
            self.values.append(value)
    
    def merge(self, other_state):
        if other_state:
            self.values.extend(other_state)
    
    def finish(self):
        if not self.values:
            return None
        sorted_vals = sorted(self.values)
        n = len(sorted_vals)
        if n % 2 == 0:
            return (sorted_vals[n//2 - 1] + sorted_vals[n//2]) / 2.0
        else:
            return sorted_vals[n//2]
```

**Шаг 2: упакуйте модуль Python**

Файл Python **обязательно** нужно упаковать в формат `.zip` (даже если файл всего один):

```bash
zip stats_udaf.zip stats_udaf.py
```

**Шаг 3: задайте путь к архиву `.zip`**

Укажите путь к архиву `.zip` через параметр `file`:

| Способ развёртывания | Формат |
| --- | --- |
| Локальная файловая система (протокол `file://`) | `"file" = "file:///path/to/stats_udaf.zip"` |
| Удалённое скачивание по HTTP/HTTPS (протокол `http://` или `https://`) | `"file" = "http://example.com/udaf/stats_udaf.zip"`<br/>`"file" = "https://s3.amazonaws.com/bucket/stats_udaf.zip"` |

> **Примечание**:
> - При удалённом скачивании убедитесь, что URL доступен со всех узлов BE.
> - При первом вызове файл скачивается, что может вызвать небольшую задержку.
> - Файл кэшируется, поэтому при последующих вызовах повторное скачивание не требуется.

**Шаг 4: задайте параметр `symbol`**

В модульном режиме `symbol` указывает расположение класса внутри ZIP-архива. Формат:

```
[package_name.]module_name.ClassName
```

Описание параметров:

- `package_name` (необязательный): имя пакета Python верхнего уровня внутри ZIP-архива.
- `module_name` (обязательный): имя файла модуля Python (без суффикса `.py`), содержащего целевой класс.
- `ClassName` (обязательный): имя класса UDAF.

Правила разрешения имени:

- Doris разбивает строку `symbol` по `.`:
    - Если получаются **две** подстроки, это `module_name` и `ClassName`.
    - Если получаются **три или более** подстрок, первая — `package_name`, средняя часть — `module_name`, последняя — `ClassName`.

:::caution Предупреждение
Пространство имён должно быть уникальным. Избегайте имён, совпадающих с именами модулей стандартной библиотеки Python или распространённых сторонних библиотек, чтобы предотвратить конфликты зависимостей и исключения при выполнении из-за перекрытия модулей.
:::

**Шаг 5: создайте UDAF**

```sql
DROP FUNCTION IF EXISTS py_variance(DOUBLE);
DROP FUNCTION IF EXISTS py_stddev(DOUBLE);
DROP FUNCTION IF EXISTS py_median(DOUBLE);

CREATE AGGREGATE FUNCTION py_variance(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/stats_udaf.zip",
    "symbol" = "stats_udaf.VarianceUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);

CREATE AGGREGATE FUNCTION py_stddev(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/stats_udaf.zip",
    "symbol" = "stats_udaf.StdDevUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);

CREATE AGGREGATE FUNCTION py_median(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/stats_udaf.zip",
    "symbol" = "stats_udaf.MedianUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);
```

**Шаг 6: используйте функцию**

```sql
DROP TABLE IF EXISTS exam_results;

CREATE TABLE IF NOT EXISTS exam_results (
    id INT,
    student_name VARCHAR(100),
    category VARCHAR(50),
    score DOUBLE
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num" = "1");

INSERT INTO exam_results VALUES 
(1, 'Alice', 'Math', 85.0),
(2, 'Bob', 'Math', 92.0),
(3, 'Charlie', 'Math', 78.0),
(4, 'David', 'Math', 88.0),
(5, 'Eve', 'Math', 95.0),
(6, 'Frank', 'English', 75.0),
(7, 'Grace', 'English', 82.0),
(8, 'Henry', 'English', 88.0),
(9, 'Iris', 'English', 79.0),
(10, 'Jack', 'Physics', 90.0),
(11, 'Kate', 'Physics', 85.0),
(12, 'Lily', 'Physics', 92.0),
(13, 'Mike', 'Physics', 88.0);

SELECT 
    category,
    py_variance(score) as variance,
    py_stddev(score) as std_dev,
    py_median(score) as median
FROM exam_results
GROUP BY category
ORDER BY category;

+----------+-------------------+-------------------+--------+
| category | variance          | std_dev           | median |
+----------+-------------------+-------------------+--------+
| English  |              22.5 | 4.743416490252569 |   80.5 |
| Math     | 34.64000000000033 | 5.885575587824892 |     88 |
| Physics  |            6.6875 |  2.58602010819715 |     89 |
+----------+-------------------+-------------------+--------+
```

#### Удаление Python UDAF {#dropping-a-python-udaf}

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Example
DROP FUNCTION IF EXISTS py_sum(INT);
DROP FUNCTION IF EXISTS py_avg(DOUBLE);
DROP FUNCTION IF EXISTS py_variance(DOUBLE);
```

### Справочник параметров {#parameter-reference-1}

#### Параметры CREATE AGGREGATE FUNCTION {#create-aggregate-function-parameters}

| Параметр | Описание |
| --- | --- |
| `function_name` | Имя функции. Должно соответствовать правилам именования идентификаторов SQL |
| `parameter_types` | Список типов параметров, например `INT`, `DOUBLE` или `STRING` |
| `RETURNS return_type` | Тип возвращаемого значения |

#### Параметры PROPERTIES {#properties-parameters-1}

| Параметр | Обязательный | Значение по умолчанию | Описание |
| --- | --- | --- | --- |
| `type` | Да | - | Фиксированное значение `"PYTHON_UDF"` |
| `symbol` | Да | - | Имя класса Python.<br/>• **Встроенный режим**: укажите непосредственно имя класса, например `"SumUDAF"`<br/>• **Модульный режим**: формат `[package_name.]module_name.ClassName` |
| `file` | Нет | - | Путь к архиву Python `.zip`. Требуется только в модульном режиме. Поддерживаются три протокола:<br/>• `file://`: путь в локальной файловой системе<br/>• `http://`: удалённое скачивание по HTTP<br/>• `https://`: удалённое скачивание по HTTPS |
| `runtime_version` | Да | - | Версия среды выполнения Python, например `"3.10.12"` |
| `always_nullable` | Нет | `true` | Всегда ли функция возвращает результат, допускающий NULL |
| `volatility` | Нет | `immutable` | Изменчивость функции, поддерживается начиная с 4.1.2. Допустимые значения: `immutable`, `stable` и `volatile`.<br/>`immutable`: одинаковые входные данные всегда дают одинаковый результат. Большинству детерминированных UDF следует задавать это значение для лучшей оптимизации плана.<br/>`stable`: результат стабилен в пределах одного оператора SQL, но может меняться между операторами, как у `now()`. Кэш SQL и переписывание запросов с использованием материализованных представлений отключены.<br/>`volatile`: результат может меняться при каждом вызове, как у `random()`. Кэш SQL, переписывание запросов с использованием материализованных представлений и многие правила переписывания оптимизатора отключены. |

#### Примечания о runtime_version {#runtime_version-notes}

- Версию Python необходимо указывать **полным номером версии** в формате `x.x.x` или `x.x.xx`.
- Doris ищет интерпретатор, соответствующий этой версии, в настроенных средах Python.

### Оконные функции {#window-functions}

Python UDAF можно использовать совместно с оконными функциями (предложением OVER):

> При использовании Python UDAF в оконной функции (предложении OVER) Doris вызывает метод `reset` UDAF после вычисления каждой рамки окна. Реализуйте этот метод в классе, чтобы сбрасывать состояние агрегации в начальное значение.

```sql
DROP TABLE IF EXISTS daily_sales_data;

CREATE TABLE IF NOT EXISTS daily_sales_data (
    sales_date DATE,
    daily_sales DOUBLE
) DUPLICATE KEY(sales_date)
DISTRIBUTED BY HASH(sales_date) BUCKETS 1
PROPERTIES("replication_num" = "1");

INSERT INTO daily_sales_data VALUES 
('2024-01-01', 1000),
('2024-01-01', 800),
('2024-01-02', 1200),
('2024-01-02', 950),
('2024-01-03', 900),
('2024-01-03', 1100),
('2024-01-04', 1500),
('2024-01-04', 850),
('2024-01-05', 1100),
('2024-01-05', 1300);

DROP FUNCTION IF EXISTS py_running_sum(DOUBLE);

CREATE AGGREGATE FUNCTION py_running_sum(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "RunningSumUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
class RunningSumUDAF:
    def __init__(self):
        self.total = 0.0

    def reset(self):
        self.total = 0.0
    
    @property
    def aggregate_state(self):
        return self.total
    
    def accumulate(self, value):
        if value is not None:
            self.total += value
    
    def merge(self, other_state):
        self.total += other_state
    
    def finish(self):
        return self.total
$$;

SELECT 
    sales_date,
    daily_sales,
    py_running_sum(daily_sales) OVER (
        ORDER BY sales_date 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as last_3_days_sum
FROM daily_sales_data
ORDER BY sales_date;

+------------+-------------+-----------------+
| sales_date | daily_sales | last_3_days_sum |
+------------+-------------+-----------------+
| 2024-01-01 |         800 |             800 |
| 2024-01-01 |        1000 |            1800 |
| 2024-01-02 |         950 |            2750 |
| 2024-01-02 |        1200 |            3150 |
| 2024-01-03 |        1100 |            3250 |
| 2024-01-03 |         900 |            3200 |
| 2024-01-04 |         850 |            2850 |
| 2024-01-04 |        1500 |            3250 |
| 2024-01-05 |        1300 |            3650 |
| 2024-01-05 |        1100 |            3900 |
+------------+-------------+-----------------+
```

### Сопоставление типов данных {#data-type-mapping-1}

Python UDAF использует те же правила сопоставления типов данных, что и Python UDF, включая все целочисленные, строковые, десятичные и логические типы, типы с плавающей точкой, а также типы даты и времени.

**Подробное сопоставление типов см. в разделе**: [Сопоставление типов данных](#data-type-mapping).

#### Обработка NULL {#null-handling-1}

- Doris сопоставляет значения SQL `NULL` со значением Python `None`.
- В методе `accumulate` проверяйте, равен ли параметр `None`.
- Агрегатная функция может возвращать `None`, чтобы указать, что результат равен `NULL`.

### Практические сценарии {#real-world-scenarios-1}

#### Сценарий 1: вычисление процентилей {#scenario-1-compute-percentiles}

```sql
DROP FUNCTION IF EXISTS py_percentile(DOUBLE, INT);

CREATE AGGREGATE FUNCTION py_percentile(DOUBLE, INT)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "PercentileUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
class PercentileUDAF:
    """Compute a percentile. The second argument is the percentile (0-100)"""
    
    def __init__(self):
        self.values = []
        self.percentile = 50  # Median by default
    
    @property
    def aggregate_state(self):
        return self.values
    
    def accumulate(self, value, percentile):
        if value is not None:
            self.values.append(value)
        if percentile is not None:
            self.percentile = percentile
    
    def merge(self, other_state):
        if other_state:
            self.values.extend(other_state)
    
    def finish(self):
        if not self.values:
            return None
        sorted_vals = sorted(self.values)
        n = len(sorted_vals)
        k = (n - 1) * (self.percentile / 100.0)
        f = int(k)
        c = k - f
        if f + 1 < n:
            return sorted_vals[f] + (sorted_vals[f + 1] - sorted_vals[f]) * c
        else:
            return sorted_vals[f]
$$;

DROP TABLE IF EXISTS api_logs;

CREATE TABLE IF NOT EXISTS api_logs (
    log_id INT,
    api_name VARCHAR(100),
    category VARCHAR(50),
    response_time DOUBLE
) DUPLICATE KEY(log_id)
DISTRIBUTED BY HASH(log_id) BUCKETS 1
PROPERTIES("replication_num" = "1");

INSERT INTO api_logs VALUES 
(1, '/api/users', 'User', 120.5),
(2, '/api/users', 'User', 95.3),
(3, '/api/users', 'User', 150.0),
(4, '/api/users', 'User', 80.2),
(5, '/api/users', 'User', 200.8),
(6, '/api/orders', 'Order', 250.0),
(7, '/api/orders', 'Order', 180.5),
(8, '/api/orders', 'Order', 300.2),
(9, '/api/orders', 'Order', 220.0),
(10, '/api/products', 'Product', 50.0),
(11, '/api/products', 'Product', 60.5),
(12, '/api/products', 'Product', 45.0),
(13, '/api/products', 'Product', 70.2),
(14, '/api/products', 'Product', 55.8);

SELECT 
    category,
    py_percentile(response_time, 25) as p25,
    py_percentile(response_time, 50) as p50,
    py_percentile(response_time, 75) as p75,
    py_percentile(response_time, 95) as p95
FROM api_logs
GROUP BY category
ORDER BY category;

+----------+-------+-------+-------+-------+
| category | p25   | p50   | p75   | p95   |
+----------+-------+-------+-------+-------+
| Order    |   235 |   235 |   235 |   235 |
| Product  |  55.8 |  55.8 |  55.8 |  55.8 |
| User     | 120.5 | 120.5 | 120.5 | 120.5 |
+----------+-------+-------+-------+-------+
```

#### Сценарий 2: сбор уникальных строк {#scenario-2-deduplicated-string-collection}

```sql
DROP FUNCTION IF EXISTS py_collect_set(STRING);

CREATE AGGREGATE FUNCTION py_collect_set(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "CollectSetUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
class CollectSetUDAF:
    """Collect deduplicated strings and return a comma-separated string"""
    
    def __init__(self):
        self.items = set()
    
    @property
    def aggregate_state(self):
        return list(self.items)
    
    def accumulate(self, value):
        if value is not None:
            self.items.add(value)
    
    def merge(self, other_state):
        if other_state:
            self.items.update(other_state)
    
    def finish(self):
        if not self.items:
            return None
        return ','.join(sorted(self.items))
$$;

DROP TABLE IF EXISTS page_views;

CREATE TABLE IF NOT EXISTS page_views (
    view_id INT,
    user_id INT,
    page_url VARCHAR(200),
    view_time DATETIME
) DUPLICATE KEY(view_id)
DISTRIBUTED BY HASH(view_id) BUCKETS 1
PROPERTIES("replication_num" = "1");

INSERT INTO page_views VALUES 
(1, 1001, '/home', '2024-01-01 10:00:00'),
(2, 1001, '/products', '2024-01-01 10:05:00'),
(3, 1001, '/home', '2024-01-01 10:10:00'),
(4, 1001, '/cart', '2024-01-01 10:15:00'),
(5, 1002, '/home', '2024-01-01 11:00:00'),
(6, 1002, '/about', '2024-01-01 11:05:00'),
(7, 1002, '/products', '2024-01-01 11:10:00'),
(8, 1003, '/products', '2024-01-01 12:00:00'),
(9, 1003, '/products', '2024-01-01 12:05:00'),
(10, 1003, '/cart', '2024-01-01 12:10:00'),
(11, 1003, '/checkout', '2024-01-01 12:15:00');

SELECT 
    user_id,
    py_collect_set(page_url) as visited_pages
FROM page_views
GROUP BY user_id
ORDER BY user_id;

+---------+---------------------------+
| user_id | visited_pages             |
+---------+---------------------------+
|    1001 | /cart,/home,/products     |
|    1002 | /about,/home,/products    |
|    1003 | /cart,/checkout,/products |
+---------+---------------------------+
```

#### Сценарий 3: скользящее среднее {#scenario-3-moving-average}

```sql
DROP TABLE IF EXISTS daily_sales;

CREATE TABLE IF NOT EXISTS daily_sales (
    id INT,
    date DATE,
    sales DOUBLE
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num" = "1");

INSERT INTO daily_sales VALUES 
(1, '2024-01-01', 1000.0),
(2, '2024-01-02', 1200.0),
(3, '2024-01-03', 900.0),
(4, '2024-01-04', 1500.0),
(5, '2024-01-05', 1100.0),
(6, '2024-01-06', 1300.0),
(7, '2024-01-07', 1400.0),
(8, '2024-01-08', 1000.0),
(9, '2024-01-09', 1600.0),
(10, '2024-01-10', 1250.0);

SELECT 
    date,
    sales,
    py_avg(sales) OVER (
        ORDER BY date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7days
FROM daily_sales
ORDER BY date;

+------------+-------+-------------------+
| date       | sales | moving_avg_7days  |
+------------+-------+-------------------+
| 2024-01-01 |  1000 |              1000 |
| 2024-01-02 |  1200 |              1100 |
| 2024-01-03 |   900 | 1033.333333333333 |
| 2024-01-04 |  1500 |              1150 |
| 2024-01-05 |  1100 |              1140 |
| 2024-01-06 |  1300 | 1166.666666666667 |
| 2024-01-07 |  1400 |              1200 |
| 2024-01-08 |  1000 |              1200 |
| 2024-01-09 |  1600 | 1257.142857142857 |
| 2024-01-10 |  1250 | 1307.142857142857 |
+------------+-------+-------------------+
```

### Рекомендации по производительности {#performance-recommendations-1}

#### 1. Оптимизируйте размер объекта состояния {#1-optimize-the-size-of-the-state-object}

- Не храните большие объёмы исходных данных в объекте состояния.
- По возможности используйте агрегированные статистики вместо полных списков данных.
- В сценариях, где данные необходимо хранить (например, при вычислении медианы), рассмотрите использование выборки или ограничение объёма данных.

**Не рекомендуется**:

```python
class BadMedianUDAF:
    def __init__(self):
        self.all_values = []  # Can be very large
    
    def accumulate(self, value):
        if value is not None:
            self.all_values.append(value)
```

#### 2. Сократите создание объектов {#2-reduce-object-creation}

- Повторно используйте объект состояния и избегайте частого создания новых объектов.
- Используйте простые типы данных вместо сложных объектов.

#### 3. Упростите логику слияния {#3-simplify-merge-logic}

- Метод `merge` часто вызывается в распределённых средах.
- Убедитесь, что операция слияния эффективна и корректна.

#### 4. Используйте инкрементальные вычисления {#4-use-incremental-computation}

- Для показателей, которые можно вычислять инкрементально (например, среднего значения), используйте инкрементальные вычисления вместо хранения всех данных.

#### 5. Избегайте использования внешних ресурсов {#5-avoid-using-external-resources}

- Не обращайтесь к базам данных или внешним API в UDAF.
- Все вычисления должны опираться на входные данные и внутреннее состояние.

### Ограничения и примечания {#limitations-and-notes-1}

#### 1. Особенности производительности {#1-performance-considerations}

- Производительность Python UDAF ниже, чем у встроенных агрегатных функций.
- Используйте их в сценариях со сложной логикой и умеренным объёмом данных.
- Для больших объёмов данных отдавайте предпочтение встроенным функциям или оптимизируйте реализацию UDAF.

#### 2. Сериализация состояния {#2-state-serialization}

- Объект, возвращаемый `aggregate_state`, **должен поддерживать сериализацию pickle**.
- Поддерживаемые типы: простые типы (int, float, str, bool), списки, словари, кортежи, множества и экземпляры пользовательских классов, поддерживающие сериализацию pickle.
- Не поддерживаются: файловые дескрипторы, соединения с базами данных, сокетные соединения, блокировки потоков и другие объекты, которые невозможно сериализовать с помощью pickle.
- Если объект состояния невозможно сериализовать с помощью pickle, функция завершается ошибкой при выполнении.
- **Отдавайте предпочтение встроенным типам** (dict, list, tuple) для объектов состояния, чтобы обеспечить совместимость и удобство сопровождения.

#### 3. Ограничения памяти {#3-memory-limits}

- Объект состояния потребляет память. Избегайте хранения слишком большого объёма данных.
- Большие объекты состояния влияют на производительность и стабильность.

#### 4. Именование функций {#4-function-naming}

- Одинаковое имя функции можно определять в разных базах данных.
- При вызове указывайте имя базы данных (например, `db.func()`), чтобы избежать неоднозначности.

#### 5. Единообразие сред {#5-environment-consistency}

- Среда Python на всех узлах BE должна быть одинаковой.
- Это включает версию Python, версии пакетов зависимостей и конфигурацию среды.

### Часто задаваемые вопросы {#frequently-asked-questions-1}

<!-- Knowledge type: FAQ -->

#### Вопрос 1: в чём разница между UDAF и UDF? {#q1-what-is-the-difference-between-udaf-and-udf}

Ответ: **UDF** обрабатывает одну строку и возвращает один результат; функция вызывается один раз для каждой строки. **UDAF** обрабатывает несколько строк и возвращает один агрегированный результат; используется совместно с GROUP BY.

```sql
-- UDF: invoked for each row
SELECT id, py_upper(name) FROM users;

-- UDAF: invoked once per group
SELECT category, py_sum(amount) FROM sales GROUP BY category;
```

#### Вопрос 2: для чего нужен атрибут `aggregate_state`? {#q2-what-does-the-aggregate_state-attribute-do}

Ответ: `aggregate_state` используется для сериализации и передачи состояния агрегации в распределённой среде:

- **Сериализация**: преобразует объект состояния в формат, пригодный для передачи, с помощью **протокола pickle**.
- **Слияние**: объединяет частичные результаты агрегации с разных узлов.
- **Обязательная поддержка сериализации pickle**: можно возвращать простые типы, списки, словари, кортежи, множества и экземпляры пользовательских классов, поддерживающие сериализацию pickle.
- **Нельзя возвращать**: файловые дескрипторы, соединения с базами данных, сокетные соединения, блокировки потоков и другие объекты, которые невозможно сериализовать с помощью pickle. Иначе функция завершится ошибкой при выполнении.

#### Вопрос 3: можно ли использовать UDAF в оконных функциях? {#q3-can-a-udaf-be-used-in-window-functions}

Ответ: да. Python UDAF полностью поддерживает оконные функции (предложение OVER).

#### Вопрос 4: когда вызывается метод `merge`? {#q4-when-is-the-merge-method-called}

Ответ: `merge` вызывается в следующих случаях:

- **Распределённая агрегация**: слияние частичных результатов агрегации с разных узлов BE.
- **Параллельная обработка**: слияние частичных результатов из разных потоков на одном узле.
- **Оконные функции**: слияние частичных результатов внутри рамки окна.

Поэтому реализация `merge` должна быть корректной, иначе результат будет неверным.

## Python UDTF (табличная функция) {#python-udtf-table-function}

<!-- Knowledge type: Operations guide -->

Python UDTF (пользовательская табличная функция) позволяет определять собственные табличные функции, преобразующие одну строку в несколько выходных строк. Это полезно для разбиения, разворачивания и генерации данных.

Основные особенности Python UDTF:

- **Из одной строки в несколько**: принимает одну строку и выдаёт ни одной, одну или несколько выходных строк.
- **Гибкая структура вывода**: допускает любое количество и тип выходных столбцов, поддерживает простые типы и сложные типы STRUCT.
- **Поддержка Lateral view**: работает с `LATERAL VIEW` для разворачивания и соединения данных.
- **Функциональный стиль**: использует функции Python и оператор `yield`, что делает код кратким и понятным.

### Основные понятия UDTF {#udtf-basic-concepts}

#### Как выполняется табличная функция {#how-a-table-function-executes}

Python UDTF реализуется в виде **функции** (а не класса). Порядок выполнения:

1. **Получение входных данных**: функция принимает значения столбцов одной строки в качестве параметров.
2. **Обработка и выдача**: оператор `yield` выдаёт ни одной или несколько выходных строк.
3. **Отсутствие состояния**: каждый вызов функции независимо обрабатывает одну строку и не сохраняет состояние предыдущей строки.

#### Требования к функции {#function-requirements}

Функция Python UDTF должна соответствовать следующим требованиям:

- **Выдача результатов через `yield`**: используйте оператор `yield` для формирования выходных строк.
- **Соответствие типов параметров**: параметры функции соответствуют типам параметров, определённым в SQL.
- **Соответствие формата вывода**: формат выдаваемых данных должен соответствовать определению `RETURNS ARRAY<...>`.

#### Способы вывода {#output-methods}

- **Вывод одного столбца**: `yield value` выдаёт одно значение.
- **Вывод нескольких столбцов**: `yield (value1, value2, ...)` выдаёт кортеж значений.
- **Условный пропуск**: если `yield` не вызывается, для этой строки ничего не выводится.

### Базовый синтаксис {#basic-syntax-1}

#### Создание Python UDTF {#creating-a-python-udtf}

Python UDTF поддерживает два способа создания: **встроенный режим** и **модульный режим**.

:::caution Внимание
Если одновременно заданы параметр `file` и встроенный код Python `AS $$`, Doris **отдаёт предпочтение встроенному коду Python** и запускает Python UDTF во встроенном режиме.
:::

##### Встроенный режим {#inline-mode-2}

Встроенный режим позволяет писать функцию Python непосредственно в SQL. Он подходит для простой логики табличных функций.

**Синтаксис**:

```sql
CREATE TABLES FUNCTION function_name(parameter_type1, parameter_type2, ...)
RETURNS ARRAY<return_type>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "function_name",
    "runtime_version" = "python_version",
    "always_nullable" = "true|false"
)
AS $$
def function_name(param1, param2, ...):
    '''Function description'''
    # Processing logic
    yield result  # Single column output
    # Or
    yield (result1, result2, ...)  # Multi-column output
$$;
```

> **Важные примечания о синтаксисе**:
> - Используйте `CREATE TABLES FUNCTION` (обратите внимание, что **TABLES** стоит во множественном числе).
> - Вывод одного столбца: `ARRAY<type>`, например `ARRAY<INT>`.
> - Вывод нескольких столбцов: `ARRAY<STRUCT<col1:type1, col2:type2, ...>>`.

**Пример 1: разбиение строки (вывод одного столбца)**

```sql
DROP FUNCTION IF EXISTS py_split(STRING, STRING);

CREATE TABLES FUNCTION py_split(STRING, STRING)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "split_string_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def split_string_udtf(text, delimiter):
    '''Split a string into multiple rows by the delimiter'''
    if text is not None and delimiter is not None:
        parts = text.split(delimiter)
        for part in parts:
            # yield (part.strip(),) is also supported
            yield part.strip()
$$;

SELECT part
FROM (SELECT 'apple,banana,orange' as fruits) t
LATERAL VIEW py_split(fruits, ',') tmp AS part;

+--------+
| part   |
+--------+
| apple  |
| banana |
| orange |
+--------+
```

**Пример 2: генерация числовой последовательности (вывод одного столбца)**

```sql
DROP FUNCTION IF EXISTS py_range(INT, INT);

CREATE TABLES FUNCTION py_range(INT, INT)
RETURNS ARRAY<INT>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "generate_series_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def generate_series_udtf(start, end):
    '''Generate an integer sequence from start to end'''
    if start is not None and end is not None:
        for i in range(start, end + 1):
            yield i
$$;

SELECT num
FROM (SELECT 1 as start_val, 5 as end_val) t
LATERAL VIEW py_range(start_val, end_val) tmp AS num;

+------+
| num  |
+------+
|    1 |
|    2 |
|    3 |
|    4 |
|    5 |
+------+

SELECT date_add('2024-01-01', n) as date
FROM (SELECT 0 as start_val, 6 as end_val) t
LATERAL VIEW py_range(start_val, end_val) tmp AS n;

+------------+
| date       |
+------------+
| 2024-01-01 |
| 2024-01-02 |
| 2024-01-03 |
| 2024-01-04 |
| 2024-01-05 |
| 2024-01-06 |
| 2024-01-07 |
+------------+
```

**Пример 3: вывод нескольких столбцов (STRUCT)**

```sql
DROP FUNCTION IF EXISTS py_duplicate(STRING, INT);

CREATE TABLES FUNCTION py_duplicate(STRING, INT)
RETURNS ARRAY<STRUCT<output:STRING, idx:INT>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "duplicate_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def duplicate_udtf(text, n):
    '''Duplicate text n times, each with a sequence number'''
    if text is not None and n is not None:
        for i in range(n):
            yield (text, i + 1)
$$;

SELECT output, idx
FROM (SELECT 'Hello' as text, 3 as times) t
LATERAL VIEW py_duplicate(text, times) tmp AS output, idx;

+--------+------+
| output | idx  |
+--------+------+
| Hello  |    1 |
| Hello  |    2 |
| Hello  |    3 |
+--------+------+
```

**Пример 4: декартово произведение (несколько столбцов STRUCT)**

```sql
DROP FUNCTION IF EXISTS py_cartesian(STRING, STRING);

CREATE TABLES FUNCTION py_cartesian(STRING, STRING)
RETURNS ARRAY<STRUCT<item1:STRING, item2:STRING>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "cartesian_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def cartesian_udtf(list1, list2):
    '''Generate the Cartesian product of two lists'''
    if list1 is not None and list2 is not None:
        items1 = [x.strip() for x in list1.split(',')]
        items2 = [y.strip() for y in list2.split(',')]
        for x in items1:
            for y in items2:
                yield (x, y)
$$;

SELECT item1, item2
FROM (SELECT 'A,B' as list1, 'X,Y,Z' as list2) t
LATERAL VIEW py_cartesian(list1, list2) tmp AS item1, item2;

+-------+-------+
| item1 | item2 |
+-------+-------+
| A     | X     |
| A     | Y     |
| A     | Z     |
| B     | X     |
| B     | Y     |
| B     | Z     |
+-------+-------+
```

**Пример 5: разбор массива JSON**

```sql
DROP FUNCTION IF EXISTS py_explode_json(STRING);

CREATE TABLES FUNCTION py_explode_json(STRING)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "explode_json_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
import json

def explode_json_udtf(json_str):
    '''Parse a JSON array and output one row per element'''
    if json_str is not None:
        try:
            data = json.loads(json_str)
            if isinstance(data, list):
                for item in data:
                    yield (str(item),)
        except:
            pass  # Skip on parse failure
$$;

SELECT element
FROM (SELECT '["apple", "banana", "cherry"]' as json_data) t
LATERAL VIEW py_explode_json(json_data) tmp AS element;

+---------+
| element |
+---------+
| apple   |
| banana  |
| cherry  |
+---------+
```

##### Модульный режим {#module-mode-2}

Модульный режим подходит для сложной логики табличных функций. Упакуйте код Python в архив `.zip` и укажите его при создании функции.

**Шаг 1: напишите модуль Python**

Создайте файл с именем `text_udtf.py`:

```python
import json
import re

def split_lines_udtf(text):
    """Split text by line"""
    if text:
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if line:  # Filter out empty lines
                yield (line,)


def extract_emails_udtf(text):
    """Extract all email addresses from text"""
    if text:
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, text)
        for email in emails:
            yield (email,)


def parse_json_object_udtf(json_str):
    """Parse a JSON object and output key-value pairs"""
    if json_str:
        try:
            data = json.loads(json_str)
            if isinstance(data, dict):
                for key, value in data.items():
                    yield (key, str(value))
        except:
            pass


def expand_json_array_udtf(json_str):
    """Expand the objects in a JSON array and output structured data"""
    if json_str:
        try:
            data = json.loads(json_str)
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        # Assume each object has id, name, and score fields
                        item_id = item.get('id')
                        name = item.get('name')
                        score = item.get('score')
                        yield (item_id, name, score)
        except:
            pass


def ngram_udtf(text, n):
    """Generate N-grams"""
    if text and n and n > 0:
        words = text.split()
        for i in range(len(words) - n + 1):
            ngram = ' '.join(words[i:i+n])
            yield (ngram,)
```

**Шаг 2: упакуйте модуль Python**

Файл Python **обязательно** нужно упаковать в формат `.zip` (даже если файл всего один):

```bash
zip text_udtf.zip text_udtf.py
```

**Шаг 3: задайте путь к архиву `.zip`**

Укажите путь к архиву `.zip` через параметр `file`:

| Способ развёртывания | Формат |
| --- | --- |
| Локальная файловая система (протокол `file://`) | `"file" = "file:///path/to/text_udtf.zip"` |
| Удалённое скачивание по HTTP/HTTPS (протокол `http://` или `https://`) | `"file" = "http://example.com/udtf/text_udtf.zip"`<br/>`"file" = "https://s3.amazonaws.com/bucket/text_udtf.zip"` |

:::caution Внимание
- При удалённом скачивании убедитесь, что URL доступен со всех узлов BE.
- При первом вызове файл скачивается, что может вызвать небольшую задержку.
- Файл кэшируется, поэтому при последующих вызовах повторное скачивание не требуется.
:::

**Шаг 4: задайте параметр `symbol`**

В модульном режиме `symbol` указывает расположение функции внутри ZIP-архива. Формат:

```
[package_name.]module_name.function_name
```

Описание параметров:

- `package_name` (необязательный): имя пакета Python верхнего уровня внутри ZIP-архива.
- `module_name` (обязательный): имя файла модуля Python (без суффикса `.py`), содержащего целевую функцию.
- `function_name` (обязательный): имя функции UDTF.

Правила разрешения имени:

- Doris разбивает строку `symbol` по `.`:
    - Если получаются **две** подстроки, это `module_name` и `function_name`.
    - Если получаются **три или более** подстрок, первая — `package_name`, средняя часть — `module_name`, последняя — `function_name`.

:::caution Предупреждение
Пространство имён должно быть уникальным. Избегайте имён, совпадающих с именами модулей стандартной библиотеки Python или распространённых сторонних библиотек, чтобы предотвратить конфликты зависимостей и исключения при выполнении из-за перекрытия модулей.
:::

**Шаг 5: создайте UDTF**

```sql
DROP FUNCTION IF EXISTS py_split_lines(STRING);
DROP FUNCTION IF EXISTS py_extract_emails(STRING);
DROP FUNCTION IF EXISTS py_parse_json(STRING);
DROP FUNCTION IF EXISTS py_expand_json(STRING);
DROP FUNCTION IF EXISTS py_ngram(STRING, INT);

CREATE TABLES FUNCTION py_split_lines(STRING)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/text_udtf.zip",
    "symbol" = "text_udtf.split_lines_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);

CREATE TABLES FUNCTION py_extract_emails(STRING)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/text_udtf.zip",
    "symbol" = "text_udtf.extract_emails_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);

CREATE TABLES FUNCTION py_parse_json(STRING)
RETURNS ARRAY<STRUCT<k:STRING, v:STRING>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/text_udtf.zip",
    "symbol" = "text_udtf.parse_json_object_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);

CREATE TABLES FUNCTION py_expand_json(STRING)
RETURNS ARRAY<STRUCT<id:INT, name:STRING, score:DOUBLE>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/text_udtf.zip",
    "symbol" = "text_udtf.expand_json_array_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);

CREATE TABLES FUNCTION py_ngram(STRING, INT)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/text_udtf.zip",
    "symbol" = "text_udtf.ngram_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
);
```

**Шаг 6: используйте функцию**

```sql
SELECT line
FROM (SELECT 'Line 1\nLine 2\nLine 3' as text) t
LATERAL VIEW py_split_lines(text) tmp AS line;

+--------+
| line   |
+--------+
| Line 1 |
| Line 2 |
| Line 3 |
+--------+

SELECT email
FROM (SELECT 'Contact us at support@example.com or sales@company.org' as content) t
LATERAL VIEW py_extract_emails(content) tmp AS email;

+---------------------+
| email               |
+---------------------+
| support@example.com |
| sales@company.org   |
+---------------------+

SELECT k, v
FROM (SELECT '{"name": "Alice", "age": "25"}' as json_data) t
LATERAL VIEW py_parse_json(json_data) tmp AS k, v;

+------+-------+
| k    | v     |
+------+-------+
| name | Alice |
| age  | 25    |
+------+-------+

SELECT id, name, score
FROM (
    SELECT '[{"id": 1, "name": "Alice", "score": 95.5}, {"id": 2, "name": "Bob", "score": 88.0}]' as data
) t
LATERAL VIEW py_expand_json(data) tmp AS id, name, score;

+------+-------+-------+
| id   | name  | score |
+------+-------+-------+
|    1 | Alice |  95.5 |
|    2 | Bob   |    88 |
+------+-------+-------+

SELECT ngram
FROM (SELECT 'Apache Doris is a fast database' as text) t
LATERAL VIEW py_ngram(text, 2) tmp AS ngram;

+---------------+
| ngram         |
+---------------+
| Apache Doris  |
| Doris is      |
| is a          |
| a fast        |
| fast database |
+---------------+
```

#### Удаление Python UDTF {#dropping-a-python-udtf}

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Example
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
DROP FUNCTION IF EXISTS py_range(INT, INT);
DROP FUNCTION IF EXISTS py_explode_json(STRING);
```

#### Изменение Python UDTF {#modifying-a-python-udtf}

Doris не поддерживает непосредственное изменение существующей функции. Сначала удалите её, затем создайте заново:

```sql
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
CREATE TABLES FUNCTION py_split(STRING, STRING) ...;
```

### Справочник параметров {#parameter-reference-2}

#### Параметры CREATE TABLES FUNCTION {#create-tables-function-parameters}

| Параметр | Описание |
| --- | --- |
| `function_name` | Имя функции. Должно соответствовать правилам именования идентификаторов SQL |
| `parameter_types` | Список типов параметров, например `INT`, `STRING` или `DOUBLE` |
| `RETURNS ARRAY<...>` | Тип возвращаемого массива, определяющий структуру вывода<br/>• Один столбец: `ARRAY<type>`<br/>• Несколько столбцов: `ARRAY<STRUCT<col1:type1, col2:type2, ...>>` |

#### Параметры PROPERTIES {#properties-parameters-2}

| Параметр | Обязательный | Значение по умолчанию | Описание |
| --- | --- | --- | --- |
| `type` | Да | - | Фиксированное значение `"PYTHON_UDF"` |
| `symbol` | Да | - | Имя функции Python.<br/>• **Встроенный режим**: укажите непосредственно имя функции, например `"split_string_udtf"`<br/>• **Модульный режим**: формат `[package_name.]module_name.function_name` |
| `file` | Нет | - | Путь к архиву Python `.zip`. Требуется только в модульном режиме. Поддерживаются три протокола:<br/>• `file://`: путь в локальной файловой системе<br/>• `http://`: удалённое скачивание по HTTP<br/>• `https://`: удалённое скачивание по HTTPS |
| `runtime_version` | Да | - | Версия среды выполнения Python, например `"3.10.12"` |
| `always_nullable` | Нет | `true` | Всегда ли функция возвращает результат, допускающий NULL |
| `volatility` | Нет | `immutable` | Изменчивость функции, поддерживается начиная с 4.1.2. Допустимые значения: `immutable`, `stable` и `volatile`.<br/>`immutable`: одинаковые входные данные всегда дают одинаковый результат. Большинству детерминированных UDF следует задавать это значение для лучшей оптимизации плана.<br/>`stable`: результат стабилен в пределах одного оператора SQL, но может меняться между операторами, как у `now()`. Кэш SQL и переписывание запросов с использованием материализованных представлений отключены.<br/>`volatile`: результат может меняться при каждом вызове, как у `random()`. Кэш SQL, переписывание запросов с использованием материализованных представлений и многие правила переписывания оптимизатора отключены. |

#### Примечания о runtime_version {#runtime_version-notes-1}

- Версию Python необходимо указывать **полным номером версии** в формате `x.x.x` или `x.x.xx`.
- Doris ищет интерпретатор, соответствующий этой версии, в настроенных средах Python.

### Сопоставление типов данных {#data-type-mapping-2}

Python UDTF использует те же правила сопоставления типов данных, что и Python UDF, включая все целочисленные, строковые, десятичные и логические типы, типы с плавающей точкой, типы даты и времени, массивы и типы STRUCT.

**Подробное сопоставление типов см. в разделе**: [Сопоставление типов данных](#data-type-mapping).

#### Обработка NULL {#null-handling-2}

- Doris сопоставляет значения SQL `NULL` со значением Python `None`.
- Проверяйте в функции, равен ли параметр `None`.
- Значение, выдаваемое оператором `yield`, может содержать `None`, что означает, что значение столбца равно `NULL`.

### Практические сценарии {#real-world-scenarios-2}

#### Сценарий 1: разбор данных CSV {#scenario-1-csv-data-parsing}

```sql
DROP FUNCTION IF EXISTS py_parse_csv(STRING);

CREATE TABLES FUNCTION py_parse_csv(STRING)
RETURNS ARRAY<STRUCT<name:STRING, age:INT, city:STRING>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "parse_csv_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def parse_csv_udtf(csv_data):
    '''Parse multi-row CSV data'''
    if csv_data is None:
        return
    lines = csv_data.strip().split('\n')
    for line in lines:
        parts = line.split(',')
        if len(parts) >= 3:
            name = parts[0].strip()
            age = int(parts[1].strip()) if parts[1].strip().isdigit() else None
            city = parts[2].strip()
            yield (name, age, city)
$$;

SELECT name, age, city
FROM (
    SELECT 'Alice,25,Beijing\nBob,30,Shanghai\nCharlie,28,Guangzhou' as data
) t
LATERAL VIEW py_parse_csv(data) tmp AS name, age, city;

+---------+------+-----------+
| name    | age  | city      |
+---------+------+-----------+
| Alice   |   25 | Beijing   |
| Bob     |   30 | Shanghai  |
| Charlie |   28 | Guangzhou |
+---------+------+-----------+
```

#### Сценарий 2: генерация диапазона дат {#scenario-2-date-range-generation}

```sql
DROP FUNCTION IF EXISTS py_date_range(STRING, STRING);

CREATE TABLES FUNCTION py_date_range(STRING, STRING)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "date_range_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
from datetime import datetime, timedelta

def date_range_udtf(start_date, end_date):
    '''Generate a date range'''
    if start_date is None or end_date is None:
        return
    try:
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        current = start
        while current <= end:
            yield (current.strftime('%Y-%m-%d'),)
            current += timedelta(days=1)
    except:
        pass
$$;

SELECT date
FROM (SELECT '2024-01-01' as start_date, '2024-01-07' as end_date) t
LATERAL VIEW py_date_range(start_date, end_date) tmp AS date;

+------------+
| date       |
+------------+
| 2024-01-01 |
| 2024-01-02 |
| 2024-01-03 |
| 2024-01-04 |
| 2024-01-05 |
| 2024-01-06 |
| 2024-01-07 |
+------------+
```

#### Сценарий 3: токенизация текста {#scenario-3-text-tokenization}

```sql
DROP FUNCTION IF EXISTS py_tokenize(STRING);

CREATE TABLES FUNCTION py_tokenize(STRING)
RETURNS ARRAY<STRUCT<word:STRING, position:INT>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "tokenize_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
import re

def tokenize_udtf(text):
    '''Tokenize text and output the words and their positions'''
    if text is None:
        return
    # Use a regex to extract words
    words = re.findall(r'\b\w+\b', text.lower())
    for i, word in enumerate(words, 1):
        if len(word) >= 2:  # Filter out single characters
            yield (word, i)
$$;

SELECT word, position
FROM (SELECT 'Apache Doris is a fast OLAP database' as text) t
LATERAL VIEW py_tokenize(text) tmp AS word, position;

+----------+----------+
| word     | position |
+----------+----------+
| apache   |        1 |
| doris    |        2 |
| is       |        3 |
| fast     |        5 |
| olap     |        6 |
| database |        7 |
+----------+----------+
```

#### Сценарий 4: разбор параметров URL {#scenario-4-url-parameter-parsing}

```sql
DROP FUNCTION IF EXISTS py_parse_url_params(STRING);

CREATE TABLES FUNCTION py_parse_url_params(STRING)
RETURNS ARRAY<STRUCT<param_name:STRING, param_value:STRING>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "parse_url_params_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
from urllib.parse import urlparse, parse_qs

def parse_url_params_udtf(url):
    '''Parse URL parameters'''
    if url is None:
        return
    try:
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        for key, values in params.items():
            for value in values:
                yield (key, value)
    except:
        pass
$$;

SELECT param_name, param_value
FROM (
    SELECT 'https://example.com/page?id=123&category=tech&tag=python&tag=database' as url
) t
LATERAL VIEW py_parse_url_params(url) tmp AS param_name, param_value;

+------------+-------------+
| param_name | param_value |
+------------+-------------+
| id         | 123         |
| category   | tech        |
| tag        | python      |
| tag        | database    |
+------------+-------------+
```

#### Сценарий 5: разворачивание диапазона IP-адресов {#scenario-5-ip-range-expansion}

```sql
DROP FUNCTION IF EXISTS py_expand_ip_range(STRING, STRING);

CREATE TABLES FUNCTION py_expand_ip_range(STRING, STRING)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "expand_ip_range_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def expand_ip_range_udtf(start_ip, end_ip):
    '''Expand an IP address range (only the last octet is supported)'''
    if start_ip is None or end_ip is None:
        return
    try:
        # Assume the format is 192.168.1.10 to 192.168.1.20
        start_parts = start_ip.split('.')
        end_parts = end_ip.split('.')
        
        if len(start_parts) == 4 and len(end_parts) == 4:
            # Expand only the last octet
            if start_parts[:3] == end_parts[:3]:
                prefix = '.'.join(start_parts[:3])
                start_num = int(start_parts[3])
                end_num = int(end_parts[3])
                for i in range(start_num, end_num + 1):
                    yield (f"{prefix}.{i}",)
    except:
        pass
$$;

SELECT ip
FROM (SELECT '192.168.1.10' as start_ip, '192.168.1.15' as end_ip) t
LATERAL VIEW py_expand_ip_range(start_ip, end_ip) tmp AS ip;

+--------------+
| ip           |
+--------------+
| 192.168.1.10 |
| 192.168.1.11 |
| 192.168.1.12 |
| 192.168.1.13 |
| 192.168.1.14 |
| 192.168.1.15 |
+--------------+
```

### Рекомендации по производительности {#performance-recommendations-2}

#### 1. Контролируйте количество выходных строк {#1-control-the-output-row-count}

- Для сценариев, которые могут порождать большое число выходных строк, задавайте разумный верхний предел.
- Избегайте взрывного роста декартова произведения.

#### 2. Избегайте повторных вычислений {#2-avoid-repeated-computation}

Если один и тот же результат нужен несколько раз, вычислите его заранее:

```python
# Not recommended
def bad_split_udtf(text):
    for i in range(len(text.split(','))):  # split is called every time
        parts = text.split(',')
        yield (parts[i],)

# Recommended
def good_split_udtf(text):
    parts = text.split(',')  # split only once
    for part in parts:
        yield (part,)
```

#### 3. Используйте генераторные выражения {#3-use-generator-expressions}

Используйте генераторы Python, чтобы избежать создания промежуточных списков:

```python
# Not recommended
def bad_filter_udtf(text, delimiter):
    parts = text.split(delimiter)
    filtered = [p.strip() for p in parts if p.strip()]  # Creates a list
    for part in filtered:
        yield (part,)

# Recommended
def good_filter_udtf(text, delimiter):
    parts = text.split(delimiter)
    for part in parts:
        part = part.strip()
        if part:  # Filter directly
            yield (part,)
```

#### 4. Избегайте обращения к внешним ресурсам {#4-avoid-accessing-external-resources}

- Не обращайтесь к базам данных, файлам или сети в UDTF.
- Вся обработка должна опираться на входные параметры.

### Ограничения и примечания {#limitations-and-notes-2}

#### 1. Ограничение на сохранение состояния {#1-stateless-restriction}

- Python UDTF **не сохраняет состояние**. Каждый вызов функции независимо обрабатывает одну строку.
- Состояние не может сохраняться между вызовами.
- Для агрегации нескольких строк используйте UDAF.

#### 2. Особенности производительности {#2-performance-considerations}

- Производительность Python UDTF ниже, чем у встроенных табличных функций.
- Используйте их в сценариях со сложной логикой и умеренным объёмом данных.
- Для больших объёмов данных отдавайте предпочтение оптимизации или встроенным функциям.

#### 3. Фиксированный тип вывода {#3-fixed-output-type}

- Тип, определённый в `RETURNS ARRAY<...>`, фиксирован.
- Значения, выдаваемые оператором `yield`, должны соответствовать этому определению.
- Один столбец: `yield value` или `yield (value,)`. Несколько столбцов: `yield (value1, value2, ...)`.

#### 4. Именование функций {#4-function-naming-1}

- Одинаковое имя функции можно определять в разных базах данных.
- При вызове указывайте имя базы данных, чтобы избежать неоднозначности.

#### 5. Единообразие сред {#5-environment-consistency-1}

- Среда Python на всех узлах BE должна быть одинаковой.
- Это включает версию Python, версии пакетов зависимостей и конфигурацию среды.

### Часто задаваемые вопросы {#frequently-asked-questions-2}

<!-- Knowledge type: FAQ -->

#### Вопрос 1: в чём разница между UDTF и UDF? {#q1-what-is-the-difference-between-udtf-and-udf}

Ответ: **UDF** принимает одну строку и выдаёт одну строку — отношение «один к одному». **UDTF** принимает одну строку и выдаёт ни одной или несколько строк — отношение «один ко многим».

Пример:

```sql
SELECT py_upper(name) FROM users;

SELECT tag FROM users LATERAL VIEW py_split(tags, ',') tmp AS tag;
```

#### Вопрос 2: как вывести несколько столбцов? {#q2-how-do-i-output-multiple-columns}

Ответ: определите возвращаемый тип с помощью STRUCT для вывода нескольких столбцов и выдавайте кортеж:

```sql
CREATE TABLES FUNCTION func(...)
RETURNS ARRAY<STRUCT<col1:INT, col2:STRING>>
...

def func(...):
    yield (123, 'hello')  # Corresponds to col1 and col2
```

#### Вопрос 3: почему UDTF ничего не выводит? {#q3-why-does-my-udtf-produce-no-output}

Ответ: возможные причины:

1. **`yield` не вызывается**: убедитесь, что функция вызывает `yield`.
2. **Фильтрация**: все данные отфильтрованы.
3. **Исключение подавлено**: проверьте, не подавил ли ошибку блок try-except.
4. **Входное значение NULL**: на вход подаётся NULL, и функция сразу завершает работу.

#### Вопрос 4: может ли UDTF сохранять состояние? {#q4-can-a-udtf-maintain-state}

Ответ: нет. Python UDTF не сохраняет состояние, и каждый вызов функции независимо обрабатывает одну строку. Для агрегации нескольких строк или сохранения состояния используйте Python UDAF.

#### Вопрос 5: как ограничить количество выходных строк UDTF? {#q5-how-do-i-limit-the-output-row-count-of-a-udtf}

Ответ: добавьте в функцию счётчик или проверку условия:

```python
def limited_udtf(data):
    max_rows = 1000
    count = 0
    for item in data.split(','):
        if count >= max_rows:
            break
        yield (item,)
        count += 1
```

#### Вопрос 6: есть ли ограничения на типы данных, выдаваемых UDTF? {#q6-are-there-limitations-on-the-data-types-yielded-by-udtf}

Ответ: UDTF поддерживает все типы данных Doris, включая простые типы (INT, STRING, DOUBLE и т. п.) и сложные типы (ARRAY, STRUCT, MAP и т. п.). Тип вывода необходимо явно определить в `RETURNS ARRAY<...>`.

#### Вопрос 7: можно ли обращаться к внешним ресурсам в UDTF? {#q7-can-i-access-external-resources-in-a-udtf}

Ответ: технически да, но это **настоятельно не рекомендуется**. UDTF должна быть чистой функцией и обрабатывать только входные параметры. Обращение к внешним ресурсам (базам данных, файлам, сети) приводит к проблемам с производительностью и непредсказуемому поведению.

## Настройка среды Python UDF/UDAF/UDTF и управление несколькими версиями {#python-udfudafudtf-environment-configuration-and-multi-version-management}

<!-- Knowledge type: Deployment and configuration -->
<!-- Applicable scenario: Cluster initialization / Coexistence of multiple Python UDF versions -->

### Управление средами Python {#python-environment-management}

Перед использованием Python UDF/UDAF/UDTF убедитесь, что среда выполнения Python правильно настроена на узлах Doris Backend (BE). Doris поддерживает управление средами Python с помощью **Conda** или **виртуальной среды (venv)**, что позволяет разным UDF использовать разные версии интерпретатора Python и зависимостей.

Doris предоставляет два способа управления средами Python:

- **Режим Conda**: управление средами с несколькими версиями с помощью Conda. Во всех последующих примерах используется Miniforge. Также поддерживаются другие дистрибутивы Conda, включая Miniconda и Anaconda.
- **Режим Venv**: управление средами с несколькими версиями с помощью встроенной виртуальной среды Python (venv).

### Установка и использование сторонних библиотек {#installing-and-using-third-party-libraries}

Python UDF, UDAF и UDTF могут использовать сторонние библиотеки. Поскольку Doris — распределённая система, сторонние библиотеки необходимо одинаково установить на **всех узлах BE**, иначе на некоторых узлах выполнение завершится ошибкой.

#### Шаги установки {#installation-steps}

1. **Установите зависимости на каждом узле BE**:

    ```bash
    # Install with pip
    pip install numpy pandas requests
    
    # Or install with conda
    conda install numpy pandas requests -y
    ```

2. **Импортируйте и используйте их в функции**:

    ```python
    import numpy as np
    import pandas as pd
    
    # Use them in a UDF/UDAF/UDTF function
    def my_function(x):
        return np.sqrt(x)
    ```

#### Примечания {#notes}

- **`pandas` и `pyarrow` — обязательные зависимости**. Заранее установите их в каждую среду Python, иначе Python UDF/UDAF/UDTF не смогут работать.
- Установите одинаковые версии зависимостей на **всех узлах BE**, иначе на некоторых узлах выполнение завершится ошибкой.
- Путь установки должен соответствовать среде выполнения Python, используемой соответствующей UDF/UDAF/UDTF.
- Используйте виртуальную среду или среду Conda для управления зависимостями и предотвращения конфликтов с системной средой Python.

### Параметры конфигурации BE {#be-configuration-parameters}

Задайте следующие параметры в конфигурационном файле `be.conf` на каждом узле BE и **перезапустите BE**, чтобы конфигурация вступила в силу.

#### Справочник параметров конфигурации {#configuration-parameter-reference}

| Параметр | Тип | Допустимые значения | Значение по умолчанию | Описание |
| --- | --- | --- | --- | --- |
| `enable_python_udf_support` | bool | `true` / `false` | `false` | Включать ли возможность Python UDF |
| `python_env_mode` | string | `conda` / `venv` | `""` | Режим управления средами с несколькими версиями Python |
| `python_conda_root_path` | string | Путь к каталогу | `""` | Корневой каталог установки Conda<br/>Действует только при `python_env_mode = conda` |
| `python_venv_root_path` | string | Путь к каталогу | `${DORIS_HOME}/lib/udf/python` | Корневой каталог для управления несколькими версиями venv<br/>Действует только при `python_env_mode = venv` |
| `python_venv_interpreter_paths` | string | Список путей (разделённых `:`) | `""` | Список каталогов доступных интерпретаторов Python<br/>Действует только при `python_env_mode = venv` |
| `max_python_process_num` | int32 | Целое число | `0` | Максимальное количество процессов в пуле процессов Python Server<br/>`0` означает использование количества ядер CPU по умолчанию. Чтобы переопределить значение по умолчанию, можно задать другое положительное целое число |

### Способ 1: управление средами Python с помощью Conda {#method-1-manage-python-environments-with-conda}

#### 1. Настройте BE {#1-configure-be}

Добавьте следующую конфигурацию в `be.conf`:

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = conda
python_conda_root_path = /path/to/miniforge3
```

#### 2. Правила поиска среды {#2-environment-lookup-rules}

Doris ищет в `${python_conda_root_path}/envs/` среды Conda, соответствующие значению `runtime_version`, указанному в UDF.

**Правила сопоставления**:

- `runtime_version` **должен содержать полный номер версии Python** в формате `x.x.x` или `x.x.xx`, например `"3.9.18"` или `"3.12.11"`.
- Doris перебирает все среды Conda и проверяет, точно ли совпадает фактическая версия интерпретатора Python в каждой среде с `runtime_version`.
- Если подходящая среда не найдена, Doris сообщает об ошибке: `Python environment with version x.x.x not found`.

**Пример**:

- Если в UDF указано `runtime_version = "3.9.18"`, Doris ищет среду с версией Python 3.9.18.
- Имя среды может быть любым (например, `py39`, `my-env` или `data-science`), если версия Python в этой среде — 3.9.18.
- Требуется полный номер версии. Префиксы версий, такие как `"3.9"` или `"3.12"`, не допускаются.

#### 3. Схема структуры каталогов {#3-directory-structure-diagram}

```
## File system layout on a Doris BE node (Conda mode)

/path/to/miniforge3                  ← python_conda_root_path (configured in be.conf)
│
├── bin/
│   ├── conda                        ← conda CLI (used for operations)
│   └── ...                          ← Other conda tools
│
├── envs/                            ← Directory for all Conda environments
│   │
│   ├── py39/                        ← Conda environment 1 (user-created)
│   │   ├── bin/
│   │   │   ├── python               ← Python 3.9 interpreter (called directly by Doris)
│   │   │   ├── pip
│   │   │   └── ...
│   │   ├── lib/
│   │   │   └── python3.9/
│   │   │       └── site-packages/   ← Third-party dependencies for this environment (such as pandas, pyarrow)
│   │   └── ...
│   │
│   ├── py312/                       ← Conda environment 2 (user-created)
│   │   ├── bin/
│   │   │   └── python               ← Python 3.12 interpreter
│   │   └── lib/
│   │       └── python3.12/
│   │           └── site-packages/   ← Pre-installed dependencies (such as torch, sklearn)
│   │
│   └── ml-env/                      ← Semantic environment name (recommended)
│       ├── bin/
│       │   └── python               ← May be Python 3.12 with GPU dependencies
│       └── lib/
│           └── python3.12/
│               └── site-packages/
│
└── ...
```

#### 4. Создайте среды Conda {#4-create-conda-environments}

:::caution Внимание
Для работы Python UDF/UDAF/UDTF в Doris **обязательно требуются** `pandas` и `pyarrow`. Вы **должны** заранее установить обе библиотеки в каждую среду Python, иначе UDF не будут работать корректно.
:::

Выполните следующие команды **на всех узлах BE**, чтобы создать среды Python:

```bash
# Install Miniforge (when not yet installed)
wget https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh
bash Miniforge3-Linux-x86_64.sh -b -p /opt/miniforge3

# Create a Python 3.9.18 environment and install required dependencies (the environment name can be customized)
/opt/miniforge3/bin/conda create -n py39 python=3.9.18 pandas pyarrow -y

# Create a Python 3.12.11 environment and pre-install dependencies (Important: the Python version must be specified exactly, and pandas and pyarrow must be installed)
/opt/miniforge3/bin/conda create -n py312 python=3.12.11 pandas pyarrow numpy -y

# Activate an environment and install additional dependencies
source /opt/miniforge3/bin/activate py39
conda install requests beautifulsoup4 -y
conda deactivate

# Verify the Python version in the environment
/opt/miniforge3/envs/py39/bin/python --version     # Should output: Python 3.9.18
/opt/miniforge3/envs/py312/bin/python --version    # Should output: Python 3.12.11
```

#### 5. Используйте среду в UDF {#5-use-in-a-udf}

```sql
-- Use the Python 3.12.11 environment
CREATE FUNCTION py_ml_predict(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.12.11",  -- Must specify the complete version number to match Python 3.12.11
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def evaluate(x):
    # Libraries installed in the Python 3.12.11 environment can be used
    return x * 2
$$;

-- Note: Whether the environment is named py312 or ml-env, any environment whose Python version is 3.12.11 can be used
-- runtime_version cares only about the Python version, not the environment name
```

### Способ 2: управление средами Python с помощью Venv {#method-2-manage-python-environments-with-venv}

#### 1. Настройте BE {#1-configure-be-1}

Добавьте следующую конфигурацию в `be.conf`:

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = venv
python_venv_root_path = /doris/python_envs
python_venv_interpreter_paths = /opt/python3.9/bin/python3.9:/opt/python3.12/bin/python3.12
```

#### 2. Примечания о параметрах конфигурации {#2-configuration-parameter-notes}

- **`python_venv_root_path`**: корневой каталог виртуальных сред. Все среды venv создаются в этом каталоге.
- **`python_venv_interpreter_paths`**: список абсолютных путей к интерпретаторам Python, разделённых двоеточиями (`:`). Doris проверяет версию каждого интерпретатора и сопоставляет её со значением `runtime_version` (полным номером версии, например `"3.9.18"`), указанным в UDF.

#### 3. Схема структуры каталогов {#3-directory-structure-diagram-1}

```
## Doris BE configuration (be.conf)
python_venv_interpreter_paths = "/opt/python3.9/bin/python3.9:/opt/python3.12/bin/python3.12"
python_venv_root_path = /doris/python_envs

/opt/python3.9/bin/python3.9                ← System pre-installed Python 3.9
/opt/python3.12/bin/python3.12              ← System pre-installed Python 3.12

/doris/python_envs/                         ← Root directory for all virtual environments (python_venv_root_path)
│
├── python3.9.18/                           ← Environment ID = complete Python version
│   ├── bin/
│   │   ├── python
│   │   └── pip
│   └── lib/python3.9/site-packages/
│       ├── pandas==2.1.0
│       └── pyarrow==15.0.0
│
├── python3.12.11/                          ← Python 3.12.11 environment
│   ├── bin/
│   │   ├── python
│   │   └── pip
│   └── lib/python3.12/site-packages/
│       ├── pandas==2.1.0
│       └── pyarrow==15.0.0
│
└── python3.12.10/                          ← Python 3.12.10 environment
    └── ...
```

#### 4. Создайте среды Venv {#4-create-venv-environments}

:::caution Внимание
Для работы Python UDF/UDAF/UDTF в Doris **обязательно требуются** `pandas` и `pyarrow`. Вы **должны** заранее установить обе библиотеки в каждую среду Python, иначе UDF не будут работать корректно.
:::

Выполните следующие команды **на всех узлах BE**:

```bash
# Create the root directory for virtual environments
mkdir -p /doris/python_envs

# Create a virtual environment with Python 3.9
/opt/python3.9/bin/python3.9 -m venv /doris/python_envs/python3.9.18

# Activate the environment and install the required dependencies (pandas and pyarrow are required)
source /doris/python_envs/python3.9.18/bin/activate
pip install pandas pyarrow numpy
deactivate

# Create a virtual environment with Python 3.12
/opt/python3.12/bin/python3.12 -m venv /doris/python_envs/python3.12.11

# Activate the environment and install the required dependencies (pandas and pyarrow are required)
source /doris/python_envs/python3.12.11/bin/activate
pip install pandas pyarrow numpy scikit-learn
deactivate
```

#### 5. Используйте среду в UDF {#5-use-in-a-udf-1}

```sql
-- Use the Python 3.9.18 environment
CREATE FUNCTION py_clean_text(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.9.18",  -- Must specify the complete version number to match Python 3.9.18
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
def evaluate(text):
    return text.strip().upper()
$$;

-- Use the Python 3.12.11 environment
CREATE FUNCTION py_calculate(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.12.11",  -- Must specify the complete version number to match Python 3.12.11
    "always_nullable" = "true",
    "volatility" = "immutable"
)
AS $$
import numpy as np

def evaluate(x):
    return np.sqrt(x)
$$;
```

### Рекомендации по управлению средами {#best-practices-for-environment-management}

#### 1. Выберите подходящий способ управления {#1-choose-the-right-management-method}

| Сценарий | Рекомендуемый вариант | Причина |
| --- | --- | --- |
| Частое переключение версий Python | Conda | Надёжная изоляция сред и простое управление зависимостями |
| Уже есть среды Conda | Conda | Существующие среды можно использовать напрямую |
| Ограниченные системные ресурсы | Venv | Меньшее потребление ресурсов и более быстрый запуск |
| Уже есть системные среды Python | Venv | Не требуется отдельно устанавливать Conda |

#### 2. Требования к единообразию сред {#2-environment-consistency-requirements}

:::caution Внимание
Среды Python на всех узлах BE должны быть **полностью идентичными**, в том числе:

- Версия Python должна быть одинаковой.
- Установленные пакеты зависимостей и их версии должны быть одинаковыми.
- Пути к каталогам сред должны быть одинаковыми.
:::

### Примечания {#notes-1}

#### 1. Вступление изменений конфигурации в силу {#1-configuration-changes-take-effect}

- После изменения `be.conf` **необходимо перезапустить процесс BE**, чтобы изменение вступило в силу.
- Перед перезапуском проверьте правильность конфигурации, чтобы избежать перебоев в работе сервиса.

#### 2. Проверка путей {#2-path-verification}

Перед настройкой проверьте правильность путей:

```bash
# Conda mode: verify the conda path
ls -la /opt/miniforge3/bin/conda
/opt/miniforge3/bin/conda env list

# Venv mode: verify interpreter paths
/opt/python3.9/bin/python3.9 --version
/opt/python3.12/bin/python3.12 --version
```

#### 3. Настройка прав доступа {#3-permission-settings}

Убедитесь, что процесс Doris BE имеет права доступа к каталогу среды Python:

```bash
# Conda mode
chmod -R 755 /opt/miniforge3

# Venv mode
chmod -R 755 /doris/python_envs
chown -R doris:doris /doris/python_envs  # Assume the BE process user is doris
```

#### 4. Ограничения ресурсов {#4-resource-limits}

Настройте параметр пула процессов Python в соответствии с фактическими потребностями:

```properties
## Use the CPU core count (recommended, max_python_process_num = 0)
max_python_process_num = 0

## High concurrency: specify the process count manually
max_python_process_num = 128

## Resource-constrained: limit the process count
max_python_process_num = 32
```

### Проверка среды {#environment-verification}

#### Проверка среды на каждом узле BE {#verify-the-environment-on-each-be-node}

```bash
# Conda mode
/opt/miniforge3/envs/py39/bin/python --version
/opt/miniforge3/envs/py39/bin/python -c "import pandas; print(pandas.__version__)"

# Venv mode
/doris/python_envs/python3.9.18/bin/python --version
/doris/python_envs/python3.9.18/bin/python -c "import pandas; print(pandas.__version__)"
```

#### Просмотр версий Python, общих для всех узлов BE {#show-python-versions-common-to-all-be-nodes}

```sql
SHOW PYTHON VERSIONS;
```

```text
+---------+---------+---------+--------------------+-----------------------------------------+
| Version | EnvName | EnvType | BasePath           | ExecutablePath                          |
+---------+---------+---------+--------------------+-----------------------------------------+
| 3.9.18  | py39    | conda   | path/to/miniforge3 | path/to/miniforge3/envs/py39/bin/python |
+---------+---------+---------+--------------------+-----------------------------------------+
```

#### Просмотр установленных зависимостей для заданной версии {#show-installed-dependencies-for-a-given-version}

Используйте `SHOW PYTHON PACKAGES IN '<version>'`, чтобы просмотреть установленные зависимости для указанной версии. Если зависимости на узлах BE различаются, в выводе перечисляются различия.

```sql
SHOW PYTHON PACKAGES IN '3.9.18'
```

Если зависимости на всех узлах BE одинаковы:

```text
+-----------------+-------------+
| Package         | Version     |
+-----------------+-------------+
| pyarrow         | 21.0.0      |
| Bottleneck      | 1.4.2       |
| jieba           | 0.42.1      |
| six             | 1.17.0      |
| wheel           | 0.45.1      |
| python-dateutil | 2.9.0.post0 |
| tzdata          | 2025.3      |
| setuptools      | 80.9.0      |
| numpy           | 2.0.1       |
| psutil          | 7.0.0       |
| pandas          | 2.3.3       |
| mkl_random      | 1.2.8       |
| pip             | 25.3        |
| snownlp         | 0.12.3      |
| pytz            | 2025.2      |
| mkl_fft         | 1.3.11      |
| mkl-service     | 2.4.0       |
| numexpr         | 2.10.1      |
+-----------------+-------------+
```

Если зависимости на узлах BE различаются:

```text
+-----------------+-------------+------------+----------------+
| Package         | Version     | Consistent | Backends       |
+-----------------+-------------+------------+----------------+
| pyarrow         | 21.0.0      | Yes        |                |
| Bottleneck      | 1.4.2       | Yes        |                |
| six             | 1.17.0      | Yes        |                |
| jieba           | 0.42.1      | No         | 127.0.0.1:9660 |
| wheel           | 0.45.1      | Yes        |                |
| python-dateutil | 2.9.0.post0 | Yes        |                |
| tzdata          | 2025.3      | Yes        |                |
| setuptools      | 80.9.0      | Yes        |                |
| numpy           | 2.0.1       | Yes        |                |
| psutil          | 7.0.0       | No         | 127.0.0.1:9660 |
| pandas          | 2.3.3       | Yes        |                |
| mkl_random      | 1.2.8       | Yes        |                |
| pip             | 26.0.1      | No         | 127.0.0.1:9077 |
| pip             | 25.3        | No         | 127.0.0.1:9660 |
| snownlp         | 0.12.3      | No         | 127.0.0.1:9660 |
| pytz            | 2025.2      | Yes        |                |
| numexpr         | 2.10.1      | Yes        |                |
| mkl-service     | 2.4.0       | Yes        |                |
| mkl_fft         | 1.3.11      | Yes        |                |
+-----------------+-------------+------------+----------------+
```

### Устранение распространённых неполадок {#common-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Errors after Python UDF deployment -->

#### Вопрос 1: вызов UDF сообщает об ошибке "Python environment not found" {#q1-udf-call-reports-python-environment-not-found}

**Причина**:

- Версия, указанная в `runtime_version`, отсутствует в системе.
- Путь к среде настроен неверно.

**Решение**:

```bash
# Check the Conda environment list
conda env list

# Check whether the venv interpreter exists
ls -la /opt/python3.9/bin/python3.9

# Check the BE configuration
grep python /path/to/be.conf
```

#### Вопрос 2: вызов UDF сообщает об ошибке "ModuleNotFoundError: No module named 'xxx'" {#q2-udf-call-reports-modulenotfounderror-no-module-named-xxx}

**Причина**: требуемый пакет зависимости не установлен в среде Python.

#### Вопрос 3: разные узлы BE возвращают разные результаты {#q3-different-be-nodes-return-different-results}

**Причина**: среды Python или версии зависимостей на узлах BE различаются.

**Решение**:

1. Проверьте версии Python и зависимостей на всех узлах.
2. Убедитесь, что среды на всех узлах одинаковы.
3. Используйте `requirements.txt` (pip) или `environment.yml` (Conda) для единообразного развёртывания сред. Типичные примеры использования:

- Использование `requirements.txt` (pip):

    ```bash
    # Export dependencies in the development environment
    pip freeze > requirements.txt
    # Install dependencies on a BE node using the target Python
    /path/to/python -m pip install -r requirements.txt
    ```

- Использование `environment.yml` (Conda):

    ```bash
    # Export dependencies
    conda env export --from-history -n py312 -f environment.yml
    # Create the environment on a BE node
    conda env create -f environment.yml -n py312
    # Or update an existing environment
    conda env update -f environment.yml -n py312
    ```

:::caution Внимание
- Убедитесь, что `pandas` и `pyarrow` указаны в файле зависимостей и что на всех узлах BE установлены одинаковые версии.
- При установке используйте интерпретатор Python или путь к Conda, соответствующий конфигурации Doris (например, `/opt/miniforge3/bin/conda` или указанный интерпретатор venv).
- Храните файл зависимостей в системе контроля версий или в общем хранилище, чтобы специалисты по эксплуатации могли единообразно распространять его на все узлы BE.
- Дополнительные материалы: [официальная документация pip](https://pip.pypa.io/en/stable/cli/pip/), [руководство по экспорту и импорту сред Conda](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#exporting-the-environment).
:::

#### Вопрос 4: изменения в be.conf не вступают в силу {#q4-changes-to-beconf-do-not-take-effect}

**Возможная причина**: процесс BE не был перезапущен.

### Ограничения использования {#usage-limitations}

1. **Особенности производительности**:
    - Производительность Python UDF ниже, чем у встроенных функций. Используйте их в сценариях со сложной логикой и небольшим объёмом данных.
    - Для больших объёмов данных отдавайте предпочтение векторизованному режиму.

2. **Ограничения типов**:
    - Специальные типы, такие как HLL и Bitmap, не поддерживаются.

3. **Изоляция сред**:
    - Одинаковое имя функции можно определять в разных базах данных.
    - При вызове указывайте имя базы данных (например, `db.func()`), чтобы избежать неоднозначности.

4. **Ограничения параллелизма**:
    - Python UDF выполняются через пул процессов. Параллелизм ограничен параметром `max_python_process_num`.
    - Увеличьте этот параметр для сценариев с высокой степенью параллелизма.
