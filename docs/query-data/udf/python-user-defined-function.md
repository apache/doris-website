---
{
    "title": "Python UDF, UDAF, UDWF, UDTF",
    "language": "en",
    "description": "Python UDF provides users with an interface for writing UDFs in Python, facilitating the execution of custom functions using the Python language. Doris supports writing UDF, UDAF, and UDTF using Python. Unless otherwise specified, UDF is used to refer to all user-defined functions in the following text."
}
---

## Python UDF

Python UDF (User Defined Function) is a custom scalar function extension mechanism provided by Apache Doris, allowing users to write custom functions in Python for data querying and processing. Through Python UDF, users can flexibly implement complex business logic, handle various data types, and fully leverage Python's rich ecosystem of libraries.

Python UDF supports two execution modes:
- **Scalar Mode**: Processes data row by row, suitable for simple transformations and calculations
- **Vectorized Mode**: Processes data in batches, utilizing Pandas for high-performance computing

:::tip Note
**Environment Dependencies**: Before using Python UDF, you must pre-install **`pandas`** and **`pyarrow`** libraries in the Python environment on all BE nodes. These are mandatory dependencies for Doris Python UDF functionality. See [Python UDF Environment Configuration](python-user-defined-function#python-udfudafudtf-environment-configuration-and-multi-version-management).

**Log Path**: The Python UDF Server runtime log is located at `output/be/log/python_udf_output.log`. Users can check the Python Server's operation status, function execution information, and debug errors in this log.
:::

### Creating Python UDF

Python UDF supports two creation modes: `Inline Mode` and `Module Mode`.

:::caution Note
If both the `file` parameter and `AS $$` inline Python code are specified, Doris will prioritize loading the **inline Python code** and run the Python UDF in inline mode.
:::

#### Inline Mode

Inline mode allows writing Python code directly in SQL, suitable for simple function logic.

**Syntax**:
```sql
CREATE FUNCTION function_name(parameter_type1, parameter_type2, ...)
RETURNS return_type
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "entry_function_name",
    "runtime_version" = "python_version",
    "always_nullable" = "true|false"
)
AS $$
def entry_function_name(param1, param2, ...):
    # Python code here
    return result
$$;
```

**Example 1: Integer Addition**
```sql
DROP FUNCTION IF EXISTS py_add(INT, INT);

CREATE FUNCTION py_add(INT, INT)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12"
)
AS $$
def evaluate(a, b):
    return a + b
$$;

SELECT py_add(10, 20) AS result; -- Result: 30
```

**Example 2: String Concatenation**
```sql
DROP FUNCTION IF EXISTS py_concat(STRING, STRING);

CREATE FUNCTION py_concat(STRING, STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12"
)
AS $$
def evaluate(s1, s2):
    if s1 is None or s2 is None:
        return None
    return s1 + s2
$$;

SELECT py_concat('Hello', ' World') AS result; -- Result: Hello World
SELECT py_concat(NULL, ' World') AS result; -- Result: NULL
SELECT py_concat('Hello', NULL) AS result; -- Result: NULL
```

#### Module Mode

Module mode is suitable for complex function logic, requiring Python code to be packaged into a `.zip` archive and referenced during function creation.

**Step 1: Write Python Module**

Create `python_udf_scalar_ops.py` file:

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

**Step 2: Package Python Module**

**Must** package Python files into `.zip` format (even for a single file):
```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py
```

For multiple Python files:
```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py utils.py helper.py ...
```

**Step 3: Set Python Module Archive Path**

Python module archives support multiple deployment methods, specified through the `file` parameter for the `.zip` package path:

**Method 1: Local Filesystem** (using `file://` protocol)
```sql
"file" = "file:///path/to/python_udf_scalar_ops.zip"
```
Suitable for scenarios where the `.zip` package is stored on the BE node's local filesystem.

**Method 2: HTTP/HTTPS Remote Download** (using `http://` or `https://` protocol)
```sql
"file" = "http://example.com/udf/python_udf_scalar_ops.zip"
"file" = "https://s3.amazonaws.com/bucket/python_udf_scalar_ops.zip"
```
Suitable for scenarios where the `.zip` package is downloaded from object storage (such as S3, OSS, COS, etc.) or HTTP servers. Doris will automatically download and cache it locally.

:::caution Note
- When using remote download method, ensure all BE nodes can access the URL
- First call will download the file, which may have some delay
- Files will be cached, subsequent calls do not need to download again
:::

**Step 4: Set symbol Parameter**

In module mode, the `symbol` parameter is used to specify the function's location in the ZIP package, with the format:

```
[package_name.]module_name.func_name
```

**Parameter Description**:
- `package_name` (optional): Top-level Python package name in the ZIP archive. Can be omitted if the function is in the package's root module or if there is no package in the ZIP archive
- `module_name` (required): Python module filename containing the target function (without `.py` suffix)
- `func_name` (required): User-defined function name

**Parsing Rules**:
- Doris will split the `symbol` string by `.`:
  - If **two** substrings are obtained, they are `module_name` and `func_name`
  - If **three or more** substrings are obtained, the beginning is `package_name`, middle is `module_name`, and end is `func_name`
- The `module_name` part is used as the module path for dynamic import via `importlib`
- If `package_name` is specified, the entire path must form a valid Python import path, and the ZIP package structure must match this path

**Example Illustrations**:

**Example A: No Package Structure (Two-Part)**
```
ZIP Structure:
math_ops.py

symbol = "math_ops.add"
```
Indicates that the function `add` is defined in the `math_ops.py` file at the root of the ZIP package.

**Example B: Package Structure (Three-Part)**
```
ZIP Structure:
mylib/
├── __init__.py
└── string_helper.py

symbol = "mylib.string_helper.split_text"
```
Indicates that the function `split_text` is defined in the `mylib/string_helper.py` file, where:
- `package_name` = `mylib`
- `module_name` = `string_helper`
- `func_name` = `split_text`

**Example C: Nested Package Structure (Four-Part)**
```
ZIP Structure:
mylib/
├── __init__.py
└── utils/
    ├── __init__.py
    └── string_helper.py

symbol = "mylib.utils.string_helper.split_text"
```
Indicates that the function `split_text` is defined in the `mylib/utils/string_helper.py` file, where:
- `package_name` = `mylib`
- `module_name` = `utils.string_helper`
- `func_name` = `split_text`

> **Note**:
> - If the `symbol` format is invalid (such as missing function name, empty module name, empty components in path, etc.), Doris will report an error during function invocation
> - The directory structure in the ZIP package must match the path specified by `symbol`
> - Each package directory needs to contain an `__init__.py` file (can be empty)

**Step 5: Create UDF Function**

**Example 1: Using Local Files (No Package Structure)**
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
    "always_nullable" = "true"
);

CREATE FUNCTION py_reverse(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/python_udf_scalar_ops.zip",
    "symbol" = "python_udf_scalar_ops.reverse_string",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
);

CREATE FUNCTION py_is_prime(INT)
RETURNS BOOLEAN
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/python_udf_scalar_ops.zip",
    "symbol" = "python_udf_scalar_ops.is_prime",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
);
```

**Example 2: Using HTTP/HTTPS Remote Files**
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
    "always_nullable" = "true"
);

CREATE FUNCTION py_reverse(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "https://your-storage.com/udf/python_udf_scalar_ops.zip",
    "symbol" = "python_udf_scalar_ops.reverse_string",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
);

CREATE FUNCTION py_is_prime(INT)
RETURNS BOOLEAN
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "https://your-storage.com/udf/python_udf_scalar_ops.zip",
    "symbol" = "python_udf_scalar_ops.is_prime",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
);
```

**Example 3: Using Package Structure**
```sql
DROP FUNCTION IF EXISTS py_multiply(INT);

-- ZIP Structure: my_udf/__init__.py, my_udf/math_ops.py
CREATE FUNCTION py_multiply(INT)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/my_udf.zip",
    "symbol" = "my_udf.math_ops.multiply_by_two",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
);
```

**Step 6: Use Functions**

```sql
SELECT py_add_three(10, 20, 30) AS sum_result; -- Result: 60
SELECT py_reverse('hello') AS reversed; -- Result: olleh
SELECT py_is_prime(17) AS is_prime; -- Result: true
```

### Dropping Python UDF

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_type1, parameter_type2, ...);

-- Examples
DROP FUNCTION IF EXISTS py_add_three(INT, INT, INT);
DROP FUNCTION IF EXISTS py_reverse(STRING);
DROP FUNCTION IF EXISTS py_is_prime(INT);
```

### Parameter Description

#### CREATE FUNCTION Parameters

| Parameter | Required | Description |
|------|---------|------|
| `function_name` | Yes | Function name, must comply with identifier naming rules |
| `parameter_type` | Yes | Parameter type list, supports various Doris data types |
| `return_type` | Yes | Return value type |

#### PROPERTIES Parameters

| Parameter | Required | Default | Description |
|------|---------|--------|------|
| `type` | Yes | - | Fixed as `"PYTHON_UDF"` |
| `symbol` | Yes | - | Python function entry name.<br>• **Inline Mode**: Write function name directly, such as `"evaluate"`<br>• **Module Mode**: Format is `[package_name.]module_name.func_name`, see module mode description |
| `file` | No | - | Python `.zip` package path, only required for module mode. Supports three protocols:<br>• `file://` - Local filesystem path<br>• `http://` - HTTP remote download<br>• `https://` - HTTPS remote download |
| `runtime_version` | Yes | - | Python runtime version, such as `"3.10.12"`, requires complete version number |
| `always_nullable` | No | `true` | Whether to always return nullable results |

#### Runtime Version Description

- Supports Python 3.x versions
- Requires specifying complete version number (such as `"3.10.12"`), cannot use only major.minor version number (such as `"3.10"`)
- If `runtime_version` is not specified, function invocation will report an error

### Data Type Mapping

The following table lists the mapping relationship between Doris data types and Python types:

| Type Category | Doris Type | Python Type | Description |
|---------|-----------|------------|------|
| Null Type | `NULL` | `None` | Null value |
| Boolean Type | `BOOLEAN` | `bool` | Boolean value |
| Integer Types | `TINYINT` | `int` | 8-bit integer |
| | `SMALLINT` | `int` | 16-bit integer |
| | `INT` | `int` | 32-bit integer |
| | `BIGINT` | `int` | 64-bit integer |
| | `LARGEINT` | `int` | 128-bit integer |
| Floating Point Types | `FLOAT` | `float` | 32-bit floating point |
| | `DOUBLE` | `float` | 64-bit floating point |
| | `TIME` / `TIMEV2` | `float` | Time type (as floating point) |
| String Types | `CHAR` | `str` | Fixed-length string |
| | `VARCHAR` | `str` | Variable-length string |
| | `STRING` | `str` | String |
| | `JSONB` | `str` | JSON binary format (converted to string) |
| | `VARIANT` | `str` | Variant type (converted to string) |
| | `DATE` | `str` | Date string, format `'YYYY-MM-DD'` |
| | `DATETIME` | `str` | DateTime string, format `'YYYY-MM-DD HH:MM:SS'` |
| Date/Time Types | `DATEV2` | `datetime.date` | Date object |
| | `DATETIMEV2` | `datetime.datetime` | DateTime object |
| Decimal Types | `DECIMAL` / `DECIMALV2` | `decimal.Decimal` | High-precision decimal |
| | `DECIMAL32` | `decimal.Decimal` | 32-bit fixed-point number |
| | `DECIMAL64` | `decimal.Decimal` | 64-bit fixed-point number |
| | `DECIMAL128` | `decimal.Decimal` | 128-bit fixed-point number |
| | `DECIMAL256` | `decimal.Decimal` | 256-bit fixed-point number |
| | `TIMESTAMPTZ` | `datetime.datetime` | DateTime object with time zone |
| IP Data Types | `ipaddress.IPv4Address` | `int` | IPv4 address |
| | `IPV6` | `ipaddress.IPv6Address` | IPv6 address |
| Binary Types | `BITMAP` | `bytes` | Bitmap data (currently not supported) |
| | `HLL` | `bytes` | HyperLogLog data (currently not supported) |
| | `QUANTILE_STATE` | `bytes` | Quantile state data (currently not supported) |
| Complex Data Types | `ARRAY<T>` | `list` | Array, element type T |
| | `MAP<K,V>` | `dict` | Dictionary, key type K, value type V |
| | `STRUCT<f1:T1, f2:T2, ...>` | `dict` | Struct, field names as keys, field values as values |

#### NULL Value Handling

- Doris `NULL` values are mapped to `None` in Python
- If a function parameter is `NULL`, Python function receives `None`
- If Python function returns `None`, Doris treats it as `NULL`
- Recommend explicitly handling `None` values in functions to avoid runtime errors

Example:
```sql
DROP FUNCTION IF EXISTS py_safe_divide(DOUBLE, DOUBLE);

CREATE FUNCTION py_safe_divide(DOUBLE, DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
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

### Vectorized Mode

Vectorized mode uses Pandas for batch data processing, offering better performance than scalar mode. In vectorized mode, function parameters are `pandas.Series` objects, and return values should also be `pandas.Series`.

:::caution Note
To ensure the system correctly recognizes vectorized mode, please use type annotations in function signatures (such as `a: pd.Series`) and directly operate on batch data structures in function logic. If vectorized types are not explicitly used, the system will fall back to Scalar Mode.
:::

```python
## Vectorized Mode
def add(a: pd.Series, b: pd.Series) -> pd.Series:
    return a + b + 1

## Scalar Mode
def add(a, b):
    return a + b + 1
```

#### Basic Examples

**Example 1: Vectorized Integer Addition**
```sql
DROP FUNCTION IF EXISTS py_vec_add(INT, INT);

CREATE FUNCTION py_vec_add(INT, INT)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "add",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
import pandas as pd

def add(a: pd.Series, b: pd.Series) -> pd.Series:
    return a + b + 1
$$;

SELECT py_vec_add(1, 2); -- Result: 4
```

**Example 2: Vectorized String Processing**
```sql
DROP FUNCTION IF EXISTS py_vec_upper(STRING);

CREATE FUNCTION py_vec_upper(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "to_upper",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
import pandas as pd

def to_upper(s: pd.Series) -> pd.Series:
    return s.str.upper()
$$;

SELECT py_vec_upper('hello'); -- Result: 'HELLO'
```

**Example 3: Vectorized Mathematical Operations**
```sql
DROP FUNCTION IF EXISTS py_vec_sqrt(DOUBLE);

CREATE FUNCTION py_vec_sqrt(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "sqrt",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
import pandas as pd
import numpy as np

def sqrt(x: pd.Series) -> pd.Series:
    return np.sqrt(x)
$$;

SELECT py_vec_sqrt(16); -- Result: 4.0
```

#### Advantages of Vectorized Mode

1. **Performance Optimization**: Batch processing reduces interaction frequency between Python and Doris
2. **Leverage Pandas/NumPy**: Fully utilize vectorized computing performance advantages
3. **Concise Code**: Pandas API allows more concise expression of complex logic

#### Using Vectorized Functions

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

### Complex Data Type Handling

#### ARRAY Type

**Example: Array Element Sum**
```sql
DROP FUNCTION IF EXISTS py_array_sum(ARRAY<INT>);

CREATE FUNCTION py_array_sum(ARRAY<INT>)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
def evaluate(arr):
    """ ARRAY type in Doris corresponds to list in Python """
    if arr is None:
        return None
    return sum(arr)
$$;

SELECT py_array_sum([1, 2, 3, 4, 5]) AS result; -- Result: 15
```

**Example: Array Filtering**
```sql
DROP FUNCTION IF EXISTS py_array_filter_positive(ARRAY<INT>);

CREATE FUNCTION py_array_filter_positive(ARRAY<INT>)
RETURNS ARRAY<INT>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
def evaluate(arr):
    if arr is None:
        return None
    return [x for x in arr if x > 0]
$$;

SELECT py_array_filter_positive([1, -2, 3, -4, 5]) AS result; -- Result: [1, 3, 5]
```

#### MAP Type

**Example: Get MAP Key Count**
```sql
DROP FUNCTION IF EXISTS py_map_size(MAP<STRING, INT>);

CREATE FUNCTION py_map_size(MAP<STRING, INT>)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
def evaluate(m):
    """ MAP type in Doris corresponds to dict in Python """
    if m is None:
        return None
    return len(m)
$$;

SELECT py_map_size({'a': 1, 'b': 2, 'c': 3}) AS result; -- Result: 3
```

**Example: Get MAP Value**
```sql
DROP FUNCTION IF EXISTS py_map_get(MAP<STRING, STRING>, STRING);

CREATE FUNCTION py_map_get(MAP<STRING, STRING>, STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
def evaluate(m, key):
    if m is None or key is None:
        return None
    return m.get(key)
$$;

SELECT py_map_get({'name': 'Alice', 'age': '30'}, 'name') AS result; -- Result: Alice
```

#### STRUCT Type

**Example: Access STRUCT Field**
```sql
DROP FUNCTION IF EXISTS py_struct_get_name(STRUCT<name: STRING, age: INT>);

CREATE FUNCTION py_struct_get_name(STRUCT<name: STRING, age: INT>)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
def evaluate(s):
    """ STRUCT type in Doris corresponds to dict in Python """
    if s is None:
        return None
    return s.get('name')
$$;

SELECT py_struct_get_name({'Alice', 30}) AS result; -- Result: Alice
```

### Practical Application Scenarios

#### Scenario 1: Data Masking

```sql
DROP FUNCTION IF EXISTS py_mask_email(STRING);

CREATE FUNCTION py_mask_email(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12"
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

#### Scenario 2: String Similarity Calculation

```sql
DROP FUNCTION IF EXISTS py_levenshtein_distance(STRING, STRING);

CREATE FUNCTION py_levenshtein_distance(STRING, STRING)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12"
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

#### Scenario 3: Date Calculation

```sql
DROP FUNCTION IF EXISTS py_days_between(DATE, DATE);

CREATE FUNCTION py_days_between(DATE, DATE)
RETURNS INT
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12"
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

#### Scenario 4: ID Card Validation

```sql
DROP FUNCTION IF EXISTS py_validate_id_card(STRING);

CREATE FUNCTION py_validate_id_card(STRING)
RETURNS BOOLEAN
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.10.12"
)
AS $$
def evaluate(id_card):
    if id_card is None or len(id_card) != 18:
        return False
    
    # Validate first 17 digits are numeric
    if not id_card[:17].isdigit():
        return False
    
    # Check code weights
    weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    check_codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    
    # Calculate check code
    total = sum(int(id_card[i]) * weights[i] for i in range(17))
    check_code = check_codes[total % 11]
    
    return id_card[17].upper() == check_code
$$;

SELECT py_validate_id_card('11010519491231002X') AS is_valid; -- Result: True

SELECT py_validate_id_card('110105194912310021x') AS is_valid; -- Result: False
```

### Performance Optimization Recommendations

#### 1. Prefer Vectorized Mode

Vectorized mode significantly outperforms scalar mode:

```python
# Scalar Mode - Process row by row
def scalar_process(x):
    return x * 2

# Vectorized Mode - Batch processing
import pandas as pd
def vector_process(x: pd.Series) -> pd.Series:
    return x * 2
```

#### 2. Use Module Mode for Complex Logic Management

Place complex function logic in separate Python files for easier maintenance and reuse.

#### 3. Avoid I/O Operations in Functions

Not recommended to perform file read/write, network requests, and other I/O operations in UDF, which will seriously impact performance.

### Limitations and Considerations

#### 1. Python Version Support

- Only supports Python 3.x versions
- Recommend using Python 3.10 or higher
- Ensure Doris cluster has the corresponding Python runtime installed

#### 2. Dependency Libraries

- Built-in support for Python standard library
- Third-party libraries need to be pre-installed in the cluster environment

#### 3. Performance Considerations

- Python UDF performance is lower than Doris built-in functions (C++ implementation)
- For performance-sensitive scenarios, prioritize Doris built-in functions
- Large data volume scenarios recommend using vectorized mode

#### 4. Security

- UDF code executes in Doris processes, must ensure code is safe and trusted
- Avoid dangerous operations in UDF (such as system commands, file deletion, etc.)
- Production environments recommend auditing UDF code

#### 5. Resource Limitations

- UDF execution occupies BE node CPU and memory resources
- Heavy UDF usage may impact overall cluster performance
- Recommend monitoring UDF resource consumption

### Frequently Asked Questions (FAQ)

#### Q1: How to use third-party libraries in Python UDF?

A: Need to install corresponding Python libraries on all BE nodes. For example:
```bash
pip3 install numpy pandas
conda install numpy pandas
```

#### Q2: Does Python UDF support recursive functions?

A: Yes, but need to pay attention to recursion depth to avoid stack overflow.

#### Q3: How to debug Python UDF?

A: Can debug function logic in local Python environment first, ensure correctness before creating UDF. Can check BE logs for error information.

#### Q4: Does Python UDF support global variables?

A: Yes, but not recommended, because global variable behavior in distributed environments may not meet expectations.

#### Q5: How to update existing Python UDF?

A: Delete old UDF first, then create new one:
```sql
DROP FUNCTION IF EXISTS function_name(parameter_types);
CREATE FUNCTION function_name(...) ...;
```

#### Q6: Can Python UDF access external resources?

A: Technically possible, but **strongly not recommended**. Python UDF can use network request libraries (such as `requests`) to access external APIs, databases, etc., but this will seriously impact performance and stability. Reasons include:
- Network latency will slow down queries
- External service unavailability will cause UDF failure
- Large concurrent requests may cause external service pressure
- Difficult to control timeout and error handling

## Python UDAF

Python UDAF (User Defined Aggregate Function) is a custom aggregate function extension mechanism provided by Apache Doris, allowing users to write custom aggregate functions in Python for data grouping aggregation and window calculations. Through Python UDAF, users can flexibly implement complex aggregation logic such as statistical analysis, data collection, custom metric calculations, etc.

Core features of Python UDAF:
- **Distributed Aggregation**: Supports data aggregation in distributed environments, automatically handling data partitioning, merging, and final computation
- **State Management**: Maintains aggregation state through class instances, supporting complex state objects
- **Window Function Support**: Can be used with window functions (OVER clause) to implement advanced features like moving aggregations, ranking, etc.
- **High Flexibility**: Can implement arbitrarily complex aggregation logic without being limited by built-in aggregate functions

:::tip Note
**Environment Dependencies**: Before using Python UDAF, you must pre-install **`pandas`** and **`pyarrow`** libraries in the Python environment on all BE nodes. These are mandatory dependencies for Doris Python UDAF functionality. See [Python UDAF Environment Configuration](python-user-defined-function#python-udfudafudtf-environment-configuration-and-multi-version-management).

**Log Path**: The Python UDAF Server runtime log is located at `output/be/log/python_udf_output.log`. Users can check the Python Server's operation status, aggregate function execution information, and debug errors in this log.
:::

### UDAF Basic Concepts

#### Lifecycle of Aggregate Functions

Python UDAF is implemented through classes, and the execution of an aggregate function includes the following stages:

1. **Initialization (__init__)**: Creates aggregation state object, initializes state variables
2. **Accumulation (accumulate)**: Processes single row data, updates aggregation state
3. **Merging (merge)**: Merges aggregation states from multiple partitions (distributed scenario)
4. **Completion (finish)**: Computes and returns final aggregation result

#### Required Class Methods and Properties

A complete Python UDAF class must implement the following methods:

| Method/Property | Description | Required |
|----------|------|---------| 
| `__init__(self)` | Initialize aggregation state | Yes |
| `accumulate(self, *args)` | Accumulate single row data | Yes |
| `merge(self, other_state)` | Merge states from other partitions | Yes |
| `finish(self)` | Return final aggregation result | Yes |
| `aggregate_state` (property) | Return serializable aggregation state, **must support pickle serialization** | Yes |

### Basic Syntax

#### Creating Python UDAF

Python UDAF supports two creation modes: `Inline Mode` and `Module Mode`.

:::tip Note
If both the `file` parameter and `AS $$` inline Python code are specified, Doris will **prioritize loading inline Python code** and run the Python UDAF in inline mode.
:::

##### Inline Mode

Inline mode allows writing Python classes directly in SQL, suitable for simple aggregation logic.

**Syntax**:
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
        # Return serializable state
        
    def accumulate(self, *args):
        # Accumulate data
        
    def merge(self, other_state):
        # Merge state
        
    def finish(self):
        # Return final result
$$;
```

**Example 1: Sum Aggregation**

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
    "always_nullable" = "true"
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

**Example 2: Average Aggregation**

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
    "always_nullable" = "true"
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

##### Module Mode

Module mode is suitable for complex aggregation logic, requiring Python code to be packaged into a `.zip` archive and referenced during function creation.

**Step 1: Write Python Module**

Create `stats_udaf.py` file:

```python
import math

class VarianceUDAF:
    """Calculate population variance"""
    
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
    """Calculate population standard deviation"""
    
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
    """Calculate median"""
    
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

**Step 2: Package Python Module**

**Must** package Python files into `.zip` format (even for a single file):
```bash
zip stats_udaf.zip stats_udaf.py
```

**Step 3: Set Python Module Archive Path**

Supports multiple deployment methods, specified through the `file` parameter for the `.zip` package path:

**Method 1: Local Filesystem** (using `file://` protocol)
```sql
"file" = "file:///path/to/stats_udaf.zip"
```

**Method 2: HTTP/HTTPS Remote Download** (using `http://` or `https://` protocol)
```sql
"file" = "http://example.com/udaf/stats_udaf.zip"
"file" = "https://s3.amazonaws.com/bucket/stats_udaf.zip"
```

> **Note**: 
> - When using remote download method, ensure all BE nodes can access the URL
> - First call will download the file, which may have some delay
> - Files will be cached, subsequent calls do not need to download again

**Step 4: Set symbol Parameter**

In module mode, the `symbol` parameter is used to specify the class's location in the ZIP package, with the format:

```
[package_name.]module_name.ClassName
```

**Parameter Description**:
- `package_name` (optional): Top-level Python package name in the ZIP archive
- `module_name` (required): Python module filename containing the target class (without `.py` suffix)
- `ClassName` (required): UDAF class name

**Parsing Rules**:
- Doris will split the `symbol` string by `.`:
  - If **two** substrings are obtained, they are `module_name` and `ClassName`
  - If **three or more** substrings are obtained, the beginning is `package_name`, middle is `module_name`, and end is `ClassName`

**Step 5: Create UDAF Functions**

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
    "always_nullable" = "true"
);

CREATE AGGREGATE FUNCTION py_stddev(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/stats_udaf.zip",
    "symbol" = "stats_udaf.StdDevUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
);

CREATE AGGREGATE FUNCTION py_median(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/stats_udaf.zip",
    "symbol" = "stats_udaf.MedianUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
);
```

**Step 6: Use Functions**

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

#### Dropping Python UDAF

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Examples
DROP FUNCTION IF EXISTS py_sum(INT);
DROP FUNCTION IF EXISTS py_avg(DOUBLE);
DROP FUNCTION IF EXISTS py_variance(DOUBLE);
```

### Parameter Description

#### CREATE AGGREGATE FUNCTION Parameters

| Parameter | Description |
|------|------|
| `function_name` | Function name, follows SQL identifier naming rules |
| `parameter_types` | Parameter type list, such as `INT`, `DOUBLE`, `STRING`, etc. |
| `RETURNS return_type` | Return value type |

#### PROPERTIES Parameters

| Parameter | Required | Default | Description |
|------|---------|--------|------|
| `type` | Yes | - | Fixed as `"PYTHON_UDF"` |
| `symbol` | Yes | - | Python class name.<br>• **Inline Mode**: Write class name directly, such as `"SumUDAF"`<br>• **Module Mode**: Format is `[package_name.]module_name.ClassName` |
| `file` | No | - | Python `.zip` package path, only required for module mode. Supports three protocols:<br>• `file://` - Local filesystem path<br>• `http://` - HTTP remote download<br>• `https://` - HTTPS remote download |
| `runtime_version` | Yes | - | Python runtime version, such as `"3.10.12"` |
| `always_nullable` | No | `true` | Whether to always return nullable results |

#### runtime_version Description

- Must fill in **complete version number** of Python version, format is `x.x.x` or `x.x.xx`
- Doris will search for matching version interpreter in configured Python environment

### Window Functions

Python UDAF can be used with window functions (OVER clause):
> If Python UDAF is used in window functions (OVER clause), Doris will call the `reset` method of the UDAF after calculating each window frame, which needs to be implemented in the class to reset the aggregation state to its initial value

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
    "always_nullable" = "true"
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

### Data Type Mapping

Python UDAF uses exactly the same data type mapping rules as Python UDF, including all types such as integers, floats, strings, date/time, Decimal, boolean, etc.

**For detailed data type mapping relationships, please refer to**: [Data Type Mapping](python-user-defined-function#data-type-mapping)

#### NULL Value Handling

- Doris maps SQL `NULL` values to Python's `None`
- In the `accumulate` method, need to check if parameters are `None`
- Aggregate functions can return `None` to indicate result is `NULL`

### Practical Application Scenarios

#### Scenario 1: Calculate Percentiles

```sql
DROP FUNCTION IF EXISTS py_percentile(DOUBLE, INT);

CREATE AGGREGATE FUNCTION py_percentile(DOUBLE, INT)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "PercentileUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
class PercentileUDAF:
    """Calculate percentile, second parameter is percentile (0-100)"""
    
    def __init__(self):
        self.values = []
        self.percentile = 50  # Default median
    
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

#### Scenario 2: String Deduplication and Aggregation

```sql
DROP FUNCTION IF EXISTS py_collect_set(STRING);

CREATE AGGREGATE FUNCTION py_collect_set(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "CollectSetUDAF",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
class CollectSetUDAF:
    """Deduplicate and collect strings, return comma-separated string"""
    
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

#### Scenario 3: Moving Average

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

### Performance Optimization Recommendations

#### 1. Optimize State Object Size

- Avoid storing large amounts of raw data in state objects
- Use aggregated statistics instead of complete data lists whenever possible
- For scenarios that must store data (such as median), consider sampling or limiting data volume

**Not recommended usage**:
```python
class BadMedianUDAF:
    def __init__(self):
        self.all_values = []  # May be very large
    
    def accumulate(self, value):
        if value is not None:
            self.all_values.append(value)
```

#### 2. Reduce Object Creation

- Reuse state objects, avoid frequent creation of new objects
- Use primitive data types instead of complex objects

#### 3. Simplify merge Logic

- `merge` method is called frequently in distributed environments
- Ensure merge operations are efficient and correct

#### 4. Use Incremental Calculation

- For metrics that can be calculated incrementally (such as average), use incremental approach instead of storing all data

#### 5. Avoid Using External Resources

- Do not access databases or external APIs in UDAF
- All calculations should be based on incoming data and internal state

### Limitations and Considerations

#### 1. Performance Considerations

- Python UDAF performance is lower than built-in aggregate functions
- Recommended for scenarios with complex logic but moderate data volume
- For large data volume scenarios, prioritize built-in functions or optimize UDAF implementation

#### 2. State Serialization

- Objects returned by `aggregate_state` **must support pickle serialization**
- Supported types: basic types (int, float, str, bool), list, dict, tuple, set, and custom class instances that support pickle serialization
- Not supported: file handles, database connections, socket connections, thread locks, and other objects that cannot be pickle serialized
- If state object cannot be pickle serialized, function execution will report an error
- **Recommend prioritizing built-in types** (dict, list, tuple) as state objects to ensure compatibility and maintainability

#### 3. Memory Limitations

- State objects occupy memory, avoid storing too much data
- Large state objects will affect performance and stability

#### 4. Function Naming

- Same function name can be repeatedly defined in different databases
- Call time should specify database name (such as `db.func()`) to avoid ambiguity

#### 5. Environment Consistency

- Python environment on all BE nodes must be consistent
- Including Python version, dependency package versions, environment configuration

### Frequently Asked Questions (FAQ)

#### Q1: What is the difference between UDAF and UDF?

A: **UDF** processes single row data, returns single row result. Function is called once per row. **UDAF** processes multiple rows of data, returns single aggregation result. Used with GROUP BY.

```sql
-- UDF: Called for each row
SELECT id, py_upper(name) FROM users;

-- UDAF: Called once per group
SELECT category, py_sum(amount) FROM sales GROUP BY category;
```

#### Q2: What is the purpose of the aggregate_state property?

A: `aggregate_state` is used to serialize and transmit aggregation state in distributed environments:
- **Serialization**: Convert state object to transmittable format, using **pickle protocol** for serialization
- **Merging**: Merge partial aggregation results between different nodes
- **Must support pickle serialization**: Can return basic types, lists, dictionaries, tuples, sets, and custom class instances that support pickle serialization
- **Cannot return**: File handles, database connections, socket connections, thread locks, and other objects that cannot be pickle serialized, otherwise function execution will report error

#### Q3: Can UDAF be used in window functions?

A: Yes. Python UDAF fully supports window functions (OVER clause).

#### Q4: When is the merge method called?

A: The `merge` method is called in the following situations:
- **Distributed aggregation**: Merge partial aggregation results from different BE nodes
- **Parallel processing**: Merge partial results from different threads within the same node
- **Window functions**: Merge partial results within window frame

Therefore, `merge` implementation must be correct, otherwise it will lead to incorrect results.


## Python UDTF

Python UDTF (User Defined Table Function) is a custom table function extension mechanism provided by Apache Doris, allowing users to write custom table functions in Python to convert single-row data into multi-row output. Through Python UDTF, users can flexibly implement complex logic such as data splitting, expansion, and generation.

Core features of Python UDTF:
- **One Row to Multiple Rows**: Receives single row input, outputs zero, one, or multiple rows of results
- **Flexible Output Structure**: Can define any number and type of output columns, supports both simple types and complex STRUCT types
- **Lateral View Support**: Used with `LATERAL VIEW` to implement data expansion and association
- **Functional Programming**: Uses Python functions and `yield` statements, concise and intuitive

:::tip Note
**Environment Dependencies**: Before using Python UDTF, you must pre-install **`pandas`** and **`pyarrow`** libraries in the Python environment on all BE nodes. These are mandatory dependencies for Doris Python UDTF functionality. See [Python UDTF Environment Configuration](python-user-defined-function#python-udfudafudtf-environment-configuration-and-multi-version-management).

**Log Path**: The Python UDTF Server runtime log is located at `output/be/log/python_udf_output.log`. Users can check the Python Server's operation status, aggregate function execution information, and debug errors in this log.
:::

### UDTF Basic Concepts

#### Execution Method of Table Functions

Python UDTF is implemented through **functions** (not classes), and the execution flow of a function is as follows:

1. **Receive Input**: Function receives column values of single row data as parameters
2. **Process and Produce**: Produces zero or multiple rows of results through `yield` statement
3. **Stateless**: Each function call independently processes one row, does not retain state from previous row

#### Function Requirements

Python UDTF functions must meet the following requirements:

- **Use yield to produce results**: Produce output rows through `yield` statement
- **Parameter type correspondence**: Function parameters correspond to parameter types defined in SQL
- **Output format matching**: Data format of `yield` must match `RETURNS ARRAY<...>` definition

#### Output Methods

- **Single column output**: `yield value` produces single value
- **Multi-column output**: `yield (value1, value2, ...)` produces tuple of multiple values
- **Conditional skip**: Do not call `yield`, this row produces no output

### Basic Syntax

#### Creating Python UDTF

Python UDTF supports two creation modes: Inline Mode and Module Mode.

:::caution Note
If both the `file` parameter and `AS $$` inline Python code are specified, Doris will **prioritize loading inline Python code** and run the Python UDTF in inline mode.
:::

##### Inline Mode

Inline mode allows writing Python functions directly in SQL, suitable for simple table function logic.

**Syntax**:
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
    # or
    yield (result1, result2, ...)  # Multi-column output
$$;
```

> **Important Syntax Notes**:
> - Use `CREATE TABLES FUNCTION` (note **TABLES**, plural form)
> - Single column output: `ARRAY<type>`, such as `ARRAY<INT>`
> - Multi-column output: `ARRAY<STRUCT<col1:type1, col2:type2, ...>>`

**Example 1: String Split (Single Column Output)**
```sql
DROP FUNCTION IF EXISTS py_split(STRING, STRING);

CREATE TABLES FUNCTION py_split(STRING, STRING)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "split_string_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
def split_string_udtf(text, delimiter):
    '''Split string by delimiter into multiple rows'''
    if text is not None and delimiter is not None:
        parts = text.split(delimiter)
        for part in parts:
            # Also supports yield (part.strip(),) 
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

**Example 2: Generate Number Sequence (Single Column Output)**
```sql
DROP FUNCTION IF EXISTS py_range(INT, INT);

CREATE TABLES FUNCTION py_range(INT, INT)
RETURNS ARRAY<INT>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "generate_series_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
def generate_series_udtf(start, end):
    '''Generate integer sequence from start to end'''
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

**Example 3: Multi-Column Output (STRUCT)**
```sql
DROP FUNCTION IF EXISTS py_duplicate(STRING, INT);

CREATE TABLES FUNCTION py_duplicate(STRING, INT)
RETURNS ARRAY<STRUCT<output:STRING, idx:INT>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "duplicate_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
def duplicate_udtf(text, n):
    '''Duplicate text n times, each with sequence number'''
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

**Example 4: Cartesian Product (Multi-Column STRUCT)**
```sql
DROP FUNCTION IF EXISTS py_cartesian(STRING, STRING);

CREATE TABLES FUNCTION py_cartesian(STRING, STRING)
RETURNS ARRAY<STRUCT<item1:STRING, item2:STRING>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "cartesian_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
def cartesian_udtf(list1, list2):
    '''Generate Cartesian product of two lists'''
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

**Example 5: JSON Array Parsing**
```sql
DROP FUNCTION IF EXISTS py_explode_json(STRING);

CREATE TABLES FUNCTION py_explode_json(STRING)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "explode_json_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
import json

def explode_json_udtf(json_str):
    '''Parse JSON array, output each element as one row'''
    if json_str is not None:
        try:
            data = json.loads(json_str)
            if isinstance(data, list):
                for item in data:
                    yield (str(item),)
        except:
            pass  # Skip on parsing failure
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

##### Module Mode

Module mode is suitable for complex table function logic, requiring Python code to be packaged into a `.zip` archive and referenced during function creation.

**Step 1: Write Python Module**

Create `text_udtf.py` file:

```python
import json
import re

def split_lines_udtf(text):
    """Split text by lines"""
    if text:
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if line:  # Filter empty lines
                yield (line,)


def extract_emails_udtf(text):
    """Extract all email addresses from text"""
    if text:
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, text)
        for email in emails:
            yield (email,)


def parse_json_object_udtf(json_str):
    """Parse JSON object, output key-value pairs"""
    if json_str:
        try:
            data = json.loads(json_str)
            if isinstance(data, dict):
                for key, value in data.items():
                    yield (key, str(value))
        except:
            pass


def expand_json_array_udtf(json_str):
    """Expand objects in JSON array, output structured data"""
    if json_str:
        try:
            data = json.loads(json_str)
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        # Assume each object has id, name, score fields
                        item_id = item.get('id')
                        name = item.get('name')
                        score = item.get('score')
                        yield (item_id, name, score)
        except:
            pass


def ngram_udtf(text, n):
    """Generate N-gram phrases"""
    if text and n and n > 0:
        words = text.split()
        for i in range(len(words) - n + 1):
            ngram = ' '.join(words[i:i+n])
            yield (ngram,)
```

**Step 2: Package Python Module**

**Must** package Python files into `.zip` format (even for a single file):
```bash
zip text_udtf.zip text_udtf.py
```

**Step 3: Set Python Module Archive Path**

Supports multiple deployment methods, specified through the `file` parameter for the `.zip` package path:

**Method 1: Local Filesystem** (using `file://` protocol)
```sql
"file" = "file:///path/to/text_udtf.zip"
```

**Method 2: HTTP/HTTPS Remote Download** (using `http://` or `https://` protocol)
```sql
"file" = "http://example.com/udtf/text_udtf.zip"
"file" = "https://s3.amazonaws.com/bucket/text_udtf.zip"
```

:::caution Note
- When using remote download method, ensure all BE nodes can access the URL
- First call will download the file, which may have some delay
- Files will be cached, subsequent calls do not need to download again
:::

**Step 4: Set symbol Parameter**

In module mode, the `symbol` parameter is used to specify the function's location in the ZIP package, with the format:

```
[package_name.]module_name.function_name
```

**Parameter Description**:
- `package_name` (optional): Top-level Python package name in the ZIP archive
- `module_name` (required): Python module filename containing the target function (without `.py` suffix)
- `function_name` (required): UDTF function name

**Parsing Rules**:
- Doris will split the `symbol` string by `.`:
  - If **two** substrings are obtained, they are `module_name` and `function_name`
  - If **three or more** substrings are obtained, the beginning is `package_name`, middle is `module_name`, and end is `function_name`

**Step 5: Create UDTF Functions**

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
    "always_nullable" = "true"
);

CREATE TABLES FUNCTION py_extract_emails(STRING)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/text_udtf.zip",
    "symbol" = "text_udtf.extract_emails_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
);

CREATE TABLES FUNCTION py_parse_json(STRING)
RETURNS ARRAY<STRUCT<k:STRING, v:STRING>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/text_udtf.zip",
    "symbol" = "text_udtf.parse_json_object_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
);

CREATE TABLES FUNCTION py_expand_json(STRING)
RETURNS ARRAY<STRUCT<id:INT, name:STRING, score:DOUBLE>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/text_udtf.zip",
    "symbol" = "text_udtf.expand_json_array_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
);

CREATE TABLES FUNCTION py_ngram(STRING, INT)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "file" = "file:///path/to/text_udtf.zip",
    "symbol" = "text_udtf.ngram_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
);
```

**Step 6: Use Functions**

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

#### Dropping Python UDTF

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Examples
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
DROP FUNCTION IF EXISTS py_range(INT, INT);
DROP FUNCTION IF EXISTS py_explode_json(STRING);
```

#### Modifying Python UDTF

Doris does not support directly modifying existing functions, you need to drop first and then recreate:

```sql
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
CREATE TABLES FUNCTION py_split(STRING, STRING) ...;
```

### Parameter Description

#### CREATE TABLES FUNCTION Parameters

| Parameter | Description |
|------|------|
| `function_name` | Function name, follows SQL identifier naming rules |
| `parameter_types` | Parameter type list, such as `INT`, `STRING`, `DOUBLE`, etc. |
| `RETURNS ARRAY<...>` | Returned array type, defines output structure<br>• Single column: `ARRAY<type>`<br>• Multi-column: `ARRAY<STRUCT<col1:type1, col2:type2, ...>>` |

#### PROPERTIES Parameters

| Parameter | Required | Default | Description |
|------|---------|--------|------|
| `type` | Yes | - | Fixed as `"PYTHON_UDF"` |
| `symbol` | Yes | - | Python function name.<br>• **Inline Mode**: Write function name directly, such as `"split_string_udtf"`<br>• **Module Mode**: Format is `[package_name.]module_name.function_name` |
| `file` | No | - | Python `.zip` package path, only required for module mode. Supports three protocols:<br>• `file://` - Local filesystem path<br>• `http://` - HTTP remote download<br>• `https://` - HTTPS remote download |
| `runtime_version` | Yes | - | Python runtime version, such as `"3.10.12"` |
| `always_nullable` | No | `true` | Whether to always return nullable results |

#### runtime_version Description

- Must fill in **complete version number** of Python version, format is `x.x.x` or `x.x.xx`
- Doris will search for matching version interpreter in configured Python environment

### Data Type Mapping

Python UDTF uses exactly the same data type mapping rules as Python UDF, including all types such as integers, floats, strings, date/time, Decimal, boolean, arrays, STRUCT, etc.

**For detailed data type mapping relationships, please refer to**: [Data Type Mapping](python-user-defined-function#data-type-mapping)

#### NULL Value Handling

- Doris maps SQL `NULL` values to Python's `None`
- In functions, need to check if parameters are `None`
- Values produced by `yield` can contain `None`, indicating that column is `NULL`

### Practical Application Scenarios

#### Scenario 1: CSV Data Parsing

```sql
DROP FUNCTION IF EXISTS py_parse_csv(STRING);

CREATE TABLES FUNCTION py_parse_csv(STRING)
RETURNS ARRAY<STRUCT<name:STRING, age:INT, city:STRING>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "parse_csv_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
def parse_csv_udtf(csv_data):
    '''Parse multi-line data in CSV format'''
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

#### Scenario 2: Date Range Generation

```sql
DROP FUNCTION IF EXISTS py_date_range(STRING, STRING);

CREATE TABLES FUNCTION py_date_range(STRING, STRING)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "date_range_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
from datetime import datetime, timedelta

def date_range_udtf(start_date, end_date):
    '''Generate date range'''
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

#### Scenario 3: Text Tokenization

```sql
DROP FUNCTION IF EXISTS py_tokenize(STRING);

CREATE TABLES FUNCTION py_tokenize(STRING)
RETURNS ARRAY<STRUCT<word:STRING, position:INT>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "tokenize_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
import re

def tokenize_udtf(text):
    '''Tokenize text, output words and positions'''
    if text is None:
        return
    # Use regex to extract words
    words = re.findall(r'\b\w+\b', text.lower())
    for i, word in enumerate(words, 1):
        if len(word) >= 2:  # Filter single characters
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

#### Scenario 4: URL Parameter Parsing

```sql
DROP FUNCTION IF EXISTS py_parse_url_params(STRING);

CREATE TABLES FUNCTION py_parse_url_params(STRING)
RETURNS ARRAY<STRUCT<param_name:STRING, param_value:STRING>>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "parse_url_params_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
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

#### Scenario 5: IP Range Expansion

```sql
DROP FUNCTION IF EXISTS py_expand_ip_range(STRING, STRING);

CREATE TABLES FUNCTION py_expand_ip_range(STRING, STRING)
RETURNS ARRAY<STRING>
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "expand_ip_range_udtf",
    "runtime_version" = "3.10.12",
    "always_nullable" = "true"
)
AS $$
def expand_ip_range_udtf(start_ip, end_ip):
    '''Expand IP address range (only supports last octet)'''
    if start_ip is None or end_ip is None:
        return
    try:
        # Assume format: 192.168.1.10 to 192.168.1.20
        start_parts = start_ip.split('.')
        end_parts = end_ip.split('.')
        
        if len(start_parts) == 4 and len(end_parts) == 4:
            # Only expand last octet
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

### Performance Optimization Recommendations

#### 1. Control Output Row Count

- For scenarios that may produce large amounts of output, set reasonable upper limits
- Avoid Cartesian product explosion

#### 2. Avoid Duplicate Calculations

If you need to use the same calculation result multiple times, pre-calculate:

```python
# Not recommended
def bad_split_udtf(text):
    for i in range(len(text.split(','))):  # Split every time
        parts = text.split(',')
        yield (parts[i],)

# Recommended
def good_split_udtf(text):
    parts = text.split(',')  # Split only once
    for part in parts:
        yield (part,)
```

#### 3. Use Generator Expressions

Leverage Python's generator features, avoid creating intermediate lists:

```python
# Not recommended
def bad_filter_udtf(text, delimiter):
    parts = text.split(delimiter)
    filtered = [p.strip() for p in parts if p.strip()]  # Create list
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

#### 4. Avoid Accessing External Resources

- Do not access databases, files, networks in UDTF
- All processing should be based on input parameters

### Limitations and Considerations

#### 1. Stateless Limitation

- Python UDTF is **stateless**, each function call independently processes one row
- Cannot retain state between multiple calls
- If cross-row aggregation is needed, should use UDAF

#### 2. Performance Considerations

- Python UDTF performance is lower than built-in table functions
- Suitable for scenarios with complex logic but moderate data volume
- For large data volume scenarios, prioritize optimization or use built-in functions

#### 3. Fixed Output Type

- Type defined in `RETURNS ARRAY<...>` is fixed
- Values produced by `yield` must match definition
- Single column: `yield value` or `yield (value,)`, multi-column: `yield (value1, value2, ...)`

#### 4. Function Naming

- Same function name can be repeatedly defined in different databases
- Recommend specifying database name when calling to avoid ambiguity

#### 5. Environment Consistency

- Python environment on all BE nodes must be consistent
- Including Python version, dependency package versions, environment configuration

### Frequently Asked Questions (FAQ)

#### Q1: What is the difference between UDTF and UDF?

A: **UDF** inputs single row, outputs single row, one-to-one relationship. **UDTF** inputs single row, outputs zero or multiple rows, one-to-many relationship.

Example:
```sql
SELECT py_upper(name) FROM users;

SELECT tag FROM users LATERAL VIEW py_split(tags, ',') tmp AS tag;
```

#### Q2: How to output multiple columns?

A: Multi-column output uses STRUCT to define return type, and produces tuple in `yield`:

```sql
CREATE TABLES FUNCTION func(...)
RETURNS ARRAY<STRUCT<col1:INT, col2:STRING>>
...

def func(...):
    yield (123, 'hello')  # Corresponds to col1 and col2
```

#### Q3: Why doesn't my UDTF produce output?

A: Possible reasons:
1. **Did not call yield**: Ensure `yield` is called in function
2. **Condition filtering**: All data was filtered out
3. **Exception caught**: Check if try-except swallowed errors
4. **NULL input**: Input is NULL and function returns directly

#### Q4: Can UDTF maintain state?

A: No. Python UDTF is stateless, each function call independently processes one row. If cross-row aggregation or state maintenance is needed, should use Python UDAF.

#### Q5: How to limit UDTF output row count?

A: Add counter or conditional judgment in function:

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

#### Q6: Are there limitations on UDTF output data types?

A: UDTF supports all Doris data types, including basic types (INT, STRING, DOUBLE, etc.) and complex types (ARRAY, STRUCT, MAP, etc.). Output type must be explicitly defined in `RETURNS ARRAY<...>`.

#### Q7: Can external resources be accessed in UDTF?

A: Technically possible, but **strongly not recommended**. UDTF should be purely functional, only process based on input parameters. Accessing external resources (databases, files, networks) will cause performance issues and unpredictable behavior.

## Python UDF/UDAF/UDTF Environment Configuration and Multi-Version Management

### Python Environment Management

Before using Python UDF/UDAF/UDTF, please ensure that the Backend (BE) nodes of Doris have properly configured the Python runtime environment. Doris supports managing Python environments through **Conda** or **Virtual Environment (venv)**, allowing different UDFs to use different versions of Python interpreters and dependency libraries.

Doris provides two Python environment management methods:
- **Conda Mode**: Use Miniconda/Anaconda to manage multi-version environments
- **Venv Mode**: Use Python's built-in virtual environment (venv) to manage multi-version environments

### Installation and Usage of Third-Party Libraries

Python UDF, UDAF, and UDTF can all use third-party libraries. However, due to Doris's distributed nature, third-party libraries must be uniformly installed on **all BE nodes**, otherwise some nodes will fail to execute.

#### Installation Steps

1. **Install dependencies on each BE node**:
   ```bash
   # Install using pip
   pip install numpy pandas requests
   
   # Or install using conda
   conda install numpy pandas requests -y
   ```

2. **Import and use in functions**:
   ```python
   import numpy as np
   import pandas as pd
   
   # Use in UDF/UDAF/UDTF functions
   def my_function(x):
       return np.sqrt(x)
   ```

:::caution Note
- **`pandas` and `pyarrow` are mandatory dependencies**, must be pre-installed in all Python environments, otherwise Python UDF/UDAF/UDTF cannot run
- Must install same version dependencies on **all BE nodes**, otherwise some nodes will fail to execute
- Installation path must match Python runtime environment used by corresponding UDF/UDAF/UDTF
- Recommend using virtual environments or Conda to manage dependencies, avoid conflicts with system Python environment
:::

### BE Configuration Parameters

Set the following parameters in the `be.conf` configuration file on all BE nodes, and **restart BE** to make the configuration take effect.

#### Configuration Parameter Description

| Parameter Name | Type | Possible Values | Default Value | Description |
|--------|------|--------|--------|------|
| `enable_python_udf_support` | bool | `true` / `false` | `false` | Whether to enable Python UDF functionality |
| `python_env_mode` | string | `conda` / `venv` | `""` | Python multi-version environment management method |
| `python_conda_root_path` | string | Directory path | `""` | Root directory of Miniconda<br>Only effective when `python_env_mode = conda` |
| `python_venv_root_path` | string | Directory path | `${DORIS_HOME}/lib/udf/python` | Root directory for venv multi-version management<br>Only effective when `python_env_mode = venv` |
| `python_venv_interpreter_paths` | string | Path list (separated by `:`) | `""` | Directory list of available Python interpreters<br>Only effective when `python_env_mode = venv` |
| `max_python_process_num` | int32 | Integer | `0` | Maximum number of processes in Python Server process pool<br>`0` means using CPU core count as default value, users can set other positive integers to override default value |

### Method 1: Using Conda to Manage Python Environment

#### 1. Configure BE

Add the following configuration in `be.conf`:

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = conda
python_conda_root_path = /path/to/miniconda3
```

#### 2. Environment Search Rules

Doris will search for Conda environments matching the `runtime_version` in UDF under the `${python_conda_root_path}/envs/` directory.

**Matching Rules**:
- `runtime_version` **must fill in the complete version number of Python version**, in the format of `x.x.x` or `x.x.xx`, such as `"3.9.18"`, `"3.12.11"`
- Doris will traverse all Conda environments and check whether the actual version of the Python interpreter in each environment exactly matches `runtime_version`
- If no matching environment is found, an error will be reported: `Python environment with version x.x.x not found`

**Examples**:
- If UDF specifies `runtime_version = "3.9.18"`, Doris will search for an environment with Python version 3.9.18 in all environments
- The environment name can be arbitrary (such as `py39`, `my-env`, `data-science`, etc.), as long as the Python version in that environment is 3.9.18
- Must fill in complete version number, cannot use version prefix, such as `"3.9"` or `"3.12"`

#### 3. Directory Structure Diagram

```
## Doris BE Node Filesystem Structure (Conda Mode)

/path/to/miniconda3                  ← python_conda_root_path (configured by be.conf)
│
├── bin/
│   ├── conda                        ← conda command-line tool (used by operations)
│   └── ...                          ← Other conda tools
│
├── envs/                            ← All Conda environments directory
│   │
│   ├── py39/                        ← Conda environment 1 (created by user)
│   │   ├── bin/
│   │   │   ├── python               ← Python 3.9 interpreter (directly called by Doris)
│   │   │   ├── pip
│   │   │   └── ...
│   │   ├── lib/
│   │   │   └── python3.9/
│   │   │       └── site-packages/   ← Third-party dependencies for this environment (e.g., pandas, pyarrow)
│   │   └── ...
│   │
│   ├── py312/                       ← Conda environment 2 (created by user)
│   │   ├── bin/
│   │   │   └── python               ← Python 3.12 interpreter
│   │   └── lib/
│   │       └── python3.12/
│   │           └── site-packages/   ← Pre-installed dependencies (e.g., torch, sklearn)
│   │
│   └── ml-env/                      ← Semantic environment name (recommended)
│       ├── bin/
│       │   └── python               ← Possibly Python 3.12 + GPU dependencies
│       └── lib/
│           └── python3.12/
│               └── site-packages/
│
└── ...
```

#### 4. Create Conda Environment

:::caution Note
Doris Python UDF/UDAF/UDTF functionality **mandatorily depends on** `pandas` and `pyarrow` libraries, which **must** be pre-installed in all Python environments, otherwise UDF will not run normally.
:::

**Execute the following commands on all BE nodes**:

```bash
# Install Miniconda (if not already installed)
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh -b -p /opt/miniconda3

# Create Python 3.9.18 environment and install required dependencies (environment name can be customized)
/opt/miniconda3/bin/conda create -n py39 python=3.9.18 pandas pyarrow -y

# Create Python 3.12.11 environment and pre-install dependencies (Important: Python version must be precisely specified, and pandas and pyarrow must be installed)
/opt/miniconda3/bin/conda create -n py312 python=3.12.11 pandas pyarrow numpy -y

# Activate environment and install additional dependencies
source /opt/miniconda3/bin/activate py39
conda install requests beautifulsoup4 -y
conda deactivate

# Verify Python version in environment
/opt/miniconda3/envs/py39/bin/python --version     # Should output: Python 3.9.18
/opt/miniconda3/envs/py312/bin/python --version    # Should output: Python 3.12.11
```

#### 5. Use in UDF

```sql
-- Use Python 3.12.11 environment
CREATE FUNCTION py_ml_predict(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.12.11",  -- Must specify complete version number, matching Python 3.12.11
    "always_nullable" = "true"
)
AS $$
def evaluate(x):
    # Can use libraries installed in Python 3.12.11 environment
    return x * 2
$$;

-- Note: Whether the environment name is py312 or ml-env, as long as the Python version is 3.12.11, it can be used
-- runtime_version only cares about Python version, not environment name
```

### Method 2: Using Venv to Manage Python Environment

#### 1. Configure BE

Add the following configuration in `be.conf`:

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = venv
python_venv_root_path = /doris/python_envs
python_venv_interpreter_paths = /opt/python3.9/bin/python3.9:/opt/python3.12/bin/python3.12
```

#### 2. Configuration Parameter Description

- **`python_venv_root_path`**: Root directory of virtual environments, all venv environments will be created under this directory
- **`python_venv_interpreter_paths`**: List of absolute paths to Python interpreters separated by English colon `:`. Doris will check the version of each interpreter and match the corresponding interpreter according to the `runtime_version` (complete version number, such as `"3.9.18"`) specified in UDF

#### 3. Directory Structure Diagram

```
## Doris BE Configuration (be.conf)
python_venv_interpreter_paths = "/opt/python3.9/bin/python3.9:/opt/python3.12/bin/python3.12"
python_venv_root_path = /doris/python_envs

/opt/python3.9/bin/python3.9                ← System pre-installed Python 3.9
/opt/python3.12/bin/python3.12              ← System pre-installed Python 3.12

/doris/python_envs/                         ← Root directory of all virtual environments (python_venv_root_path)
│
├── python3.9.18/                           ← Environment ID = Python complete version
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

#### 4. Create Venv Environment

:::caution Note
Doris Python UDF/UDAF/UDTF functionality **mandatorily depends on** `pandas` and `pyarrow` libraries, which **must** be pre-installed in all Python environments, otherwise UDF will not run normally.
:::

**Execute the following commands on all BE nodes**:

```bash
# Create virtual environment root directory
mkdir -p /doris/python_envs

# Use Python 3.9 to create virtual environment
/opt/python3.9/bin/python3.9 -m venv /doris/python_envs/python3.9.18

# Activate environment and install required dependencies (pandas and pyarrow must be installed)
source /doris/python_envs/python3.9.18/bin/activate
pip install pandas pyarrow numpy
deactivate

# Use Python 3.12 to create virtual environment
/opt/python3.12/bin/python3.12 -m venv /doris/python_envs/python3.12.11

# Activate environment and install required dependencies (pandas and pyarrow must be installed)
source /doris/python_envs/python3.12.11/bin/activate
pip install pandas pyarrow numpy scikit-learn
deactivate
```

#### 5. Use in UDF

```sql
-- Use Python 3.9.18 environment
CREATE FUNCTION py_clean_text(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.9.18",  -- Must specify complete version number, matching Python 3.9.18
    "always_nullable" = "true"
)
AS $$
def evaluate(text):
    return text.strip().upper()
$$;

-- Use Python 3.12.11 environment
CREATE FUNCTION py_calculate(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.12.11",  -- Must specify complete version number, matching Python 3.12.11
    "always_nullable" = "true"
)
AS $$
import numpy as np

def evaluate(x):
    return np.sqrt(x)
$$;
```

### Environment Management Best Practices

#### 1. Choose Appropriate Management Method

| Scenario | Recommended Method | Reason |
|------|---------|------|
| Need to frequently switch Python versions | Conda | Good environment isolation, simple dependency management |
| Already have Conda environment | Conda | Can directly reuse existing environment |
| Limited system resources | Venv | Small footprint, fast startup |
| Already have Python system environment | Venv | No need to install additional Conda |

#### 2. Environment Consistency Requirements
:::caution Note
All BE nodes must be configured with **exactly the same** Python environment, including:
- Python version must be consistent
- Installed dependency packages and their versions must be consistent
- Environment directory paths must be consistent
:::

### Notes

#### 1. Configuration Modification Takes Effect

- After modifying `be.conf`, **must restart BE process** to take effect
- Please ensure configuration is correct before restart to avoid service interruption

#### 2. Path Verification

Please ensure paths are correct before configuration:

```bash
# Conda mode: Verify conda path
ls -la /opt/miniconda3/bin/conda
/opt/miniconda3/bin/conda env list

# Venv mode: Verify interpreter path
/opt/python3.9/bin/python3.9 --version
/opt/python3.12/bin/python3.12 --version
```

#### 3. Permission Settings

Ensure Doris BE process has permission to access Python environment directory:

```bash
# Conda mode
chmod -R 755 /opt/miniconda3

# Venv mode
chmod -R 755 /doris/python_envs
chown -R doris:doris /doris/python_envs  # Assuming BE process user is doris
```

#### 4. Resource Limitations

Adjust Python process pool parameters according to actual needs:

```properties
## Confirm using CPU core count (recommended, max_python_process_num = 0)
max_python_process_num = 0

## High concurrency scenario, manually specify process count
max_python_process_num = 128

## Resource-constrained scenario, limit process count
max_python_process_num = 32
```

### Environment Verification

Verify on each BE node whether the environment is correct:

```bash
# Conda mode
/opt/miniconda3/envs/py39/bin/python --version
/opt/miniconda3/envs/py39/bin/python -c "import pandas; print(pandas.__version__)"

# Venv mode
/doris/python_envs/python3.9.18/bin/python --version
/doris/python_envs/python3.9.18/bin/python -c "import pandas; print(pandas.__version__)"
```

### Common Problem Troubleshooting

#### Q1: UDF call prompts "Python environment not found"

**Reason**: 
- Version specified by `runtime_version` does not exist in the system
- Environment path configuration is incorrect

**Solution**:
```bash
# Check Conda environment list
conda env list

# Check if Venv interpreter exists
ls -la /opt/python3.9/bin/python3.9

# Check BE configuration
grep python /path/to/be.conf
```

#### Q2: UDF call prompts "ModuleNotFoundError: No module named 'xxx'"

**Reason**: Required dependency package not installed in Python environment

#### Q3: Execution results inconsistent across different BE nodes

**Reason**: Python environment or dependency versions inconsistent across BE nodes

**Solution**:
1. Check Python version and dependency versions on all nodes.
2. Verify environment consistency across all nodes.
3. Use `requirements.txt` (pip) or `environment.yml` (Conda) to deploy environments; common usage examples:

- Using `requirements.txt` (pip):
```bash
# Export dependencies from development environment
pip freeze > requirements.txt
# On BE nodes, install with target Python interpreter
/path/to/python -m pip install -r requirements.txt
```

- Using `environment.yml` (Conda):
```bash
# export dependencies
conda env export --from-history -n py312 -f environment.yml
# On BE nodes, create the environment
conda env create -f environment.yml -n py312
# Or update an existing environment
conda env update -f environment.yml -n py312
```

**Notes**:
- Ensure **`pandas`** and **`pyarrow`** are included in the dependency files and installed with the same versions on all BE nodes.
- When installing, use the Python interpreter or Conda path configured for Doris (for example, `/opt/miniconda3/bin/conda` or the venv interpreter path used by BE).
- Keep dependency files under version control or on shared storage so operations can distribute them consistently to all BE nodes.
- References: [pip docs](https://pip.pypa.io/en/stable/cli/pip/)，[Conda export/import](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#exporting-the-environment)

#### Q4: be.conf modification not effective

**Possible Reason**: BE process not restarted

### Usage Limitations

1. **Performance Considerations**:
   - Python UDF performance is lower than built-in functions, recommended for scenarios with complex logic but small data volume
   - For large data volume processing, prioritize vectorized mode

2. **Type Limitations**:
   - Does not support special types such as HLL, Bitmap

3. **Environment Isolation**:
   - Same function name can be repeatedly defined in different databases
   - Call time should specify database name (such as `db.func()`) to avoid ambiguity

4. **Concurrency Limitations**:
   - Python UDF executes through process pool, concurrency is limited by `max_python_process_num`
   - High concurrency scenarios need to appropriately increase this parameter
