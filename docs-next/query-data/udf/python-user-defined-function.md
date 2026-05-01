---
{
    "title": "Python UDF, UDAF, UDWF, UDTF",
    "language": "en",
    "description": "How to write UDFs, UDAFs, and UDTFs in Apache Doris using Python: covers creation, vectorization, environment configuration, and common troubleshooting.",
    "keywords": [
        "Doris Python UDF",
        "Python UDAF",
        "Python UDTF",
        "Vectorized UDF",
        "Pandas UDF",
        "PYTHON_UDF runtime_version",
        "Conda Python environment",
        "venv Python environment",
        "Python environment not found"
    ]
}
---

<!-- Knowledge type: Feature overview + Operations guide + Configuration parameters -->
<!-- Applicable scenario: Extending SQL capability in Doris / Implementing custom scalar, aggregate, and table functions in Python -->

Python UDF/UDAF/UDTF is the custom function extension mechanism provided by Apache Doris. It allows you to write scalar, aggregate, and table functions in Python so that SQL can express complex computation logic that is hard to implement with built-in functions, and so that you can reuse the rich Python ecosystem.

This document starts from typical user scenarios and describes the usage, parameters, data type mapping, performance recommendations, limitations, and the deployment of multi-version Python environments for each of the three function types.

## When to Choose Python UDF/UDAF/UDTF

<!-- Knowledge type: Selection decision -->

| Your scenario | Recommended | Relationship |
| --- | --- | --- |
| Per-row complex transformation, cleansing, masking, or validation | Python UDF (scalar function) | One row in to one row out |
| Custom aggregation metrics over GROUP BY or window (OVER clause) | Python UDAF (aggregate function) | Many rows in to one row out |
| Expanding one row into multiple rows, such as CSV/JSON parsing or sequence generation | Python UDTF (table function) | One row in to zero or many rows out |

If performance is critical, prefer Doris built-in functions (implemented in C++). Python UDFs fit scenarios where built-in functions cannot satisfy the requirement and the data volume is moderate.

## General Prerequisites

<!-- Knowledge type: Pre-deployment check -->
<!-- Applicable scenario: First time enabling Python UDF -->

Before creating any Python UDF/UDAF/UDTF, complete the following preparations:

1. **Enable Python UDF and configure the Python environment**: Enable the related parameters in the BE node `be.conf` and configure a multi-version Python environment using Conda or venv. See [Python UDF/UDAF/UDTF Environment Configuration and Multi-version Management](#python-udfudafudtf-environment-configuration-and-multi-version-management) for details.
2. **Mandatory dependencies**: Pre-install **`pandas`** and **`pyarrow`** in the corresponding Python environment on all BE nodes. These are mandatory dependencies for the Doris Python UDF feature, and the function cannot run if they are missing.
3. **Runtime logs**: The runtime log of the Python UDF Server is located at `output/be/log/python_udf_output.log`. You can inspect this log to view function execution and error messages for debugging.

:::tip Tip
All CREATE statements must explicitly specify `runtime_version` with a complete version number (such as `"3.10.12"`). You cannot specify only the major and minor version (such as `"3.10"`); otherwise the function call will fail.
:::

## Python UDF (Scalar Function)

<!-- Knowledge type: Operations guide -->

A Python UDF (User Defined Function) processes data row by row. The function is invoked once per row and returns a single result. It supports two execution modes:

- **Scalar mode**: Processes data row by row. Suitable for simple transformations and computations.
- **Vectorized mode**: Processes data in batches with the help of Pandas for high-performance computation.

### Creating a Python UDF

Python UDF supports two creation methods: **inline mode** and **module mode**.

:::caution Caution
If both the `file` parameter and the `AS $$` inline Python code are specified, Doris **prefers the inline Python code** and runs the function in inline mode.
:::

#### Inline Mode

Inline mode lets you write Python code directly in SQL. It is suitable for simple logic.

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

**Example 1: Integer addition**

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

**Example 2: String concatenation (with NULL handling)**

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
SELECT py_concat(NULL, ' World') AS result;    -- Result: NULL
SELECT py_concat('Hello', NULL) AS result;     -- Result: NULL
```

#### Module Mode

Module mode is suitable for complex logic. Package the Python code as a `.zip` archive and reference it in the `file` parameter when creating the function.

**Step 1: Write the Python module**

Create a file named `python_udf_scalar_ops.py`:

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

**Step 2: Package the Python module**

You **must** package the Python file in `.zip` format (even when there is only one file):

```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py
```

When there are multiple Python files:

```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py utils.py helper.py ...
```

**Step 3: Set the path of the `.zip` package**

Specify the `.zip` package path through the `file` parameter. Two methods are supported:

| Deployment method | Form | Applicable scenario |
| --- | --- | --- |
| Local file system | `"file" = "file:///path/to/python_udf_scalar_ops.zip"` | The `.zip` package is stored on the BE node local file system |
| HTTP/HTTPS remote download | `"file" = "http://example.com/udf/xx.zip"` or `"file" = "https://s3.amazonaws.com/bucket/xx.zip"` | Download the `.zip` package from object storage (S3, OSS, COS, and so on) or an HTTP server. Doris automatically downloads and caches it locally |

:::caution Caution
- When using remote download, ensure that all BE nodes can access the URL.
- The first call downloads the file, which may introduce some latency.
- The file is cached, so later calls do not download it again.
:::

**Step 4: Set the `symbol` parameter**

In module mode, `symbol` specifies the location of the target function inside the ZIP package. The format is:

```
[package_name.]module_name.func_name
```

Parameter description:

- `package_name` (optional): The name of the top-level Python package inside the ZIP package. Omit this when the function lives in the root module of the package or when the ZIP package contains no package.
- `module_name` (required): The Python module file name (without the `.py` suffix) that contains the target function.
- `func_name` (required): The user-defined function name.

Resolution rules:

- Doris splits the `symbol` string by `.`:
    - If the result has **two** substrings, they are `module_name` and `func_name`.
    - If the result has **three or more** substrings, the first is `package_name`, the middle is `module_name`, and the last is `func_name`.
- The `module_name` portion serves as the module path for dynamic import through `importlib`.
- When `package_name` is specified, the entire path must form a valid Python import path, and the ZIP package structure must match the path.

:::caution Warning
The namespace should be unique. Avoid names that collide with the Python standard library or common third-party libraries to prevent dependency conflicts and runtime exceptions caused by module shadowing.
:::

**Example A: No package structure (two-part)**

```
ZIP structure:
math_ops.py

symbol = "math_ops.add"
```

This indicates that the function `add` is defined in `math_ops.py` at the root of the ZIP package.

**Example B: With package structure (three-part)**

```
ZIP structure:
mylib/
├── __init__.py
└── string_helper.py

symbol = "mylib.string_helper.split_text"
```

This indicates that the function `split_text` is defined in `mylib/string_helper.py`, where:

- `package_name` = `mylib`
- `module_name` = `string_helper`
- `func_name` = `split_text`

**Example C: Nested package structure (four-part)**

```
ZIP structure:
mylib/
├── __init__.py
└── utils/
    ├── __init__.py
    └── string_helper.py

symbol = "mylib.utils.string_helper.split_text"
```

This indicates that the function `split_text` is defined in `mylib/utils/string_helper.py`, where:

- `package_name` = `mylib`
- `module_name` = `utils.string_helper`
- `func_name` = `split_text`

> **Note**:
> - When the `symbol` format is invalid (such as missing function name, empty module name, or empty path components), Doris reports an error at function call time.
> - The directory structure inside the ZIP package must match the path specified by `symbol`.
> - Each package directory must contain an `__init__.py` file (which can be empty).

**Step 5: Create the UDF**

Example 1: Use a local file (no package structure)

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

Example 2: Use an HTTP/HTTPS remote file

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

Example 3: Use a package structure

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
    "always_nullable" = "true"
);
```

**Step 6: Use the function**

```sql
SELECT py_add_three(10, 20, 30) AS sum_result; -- Result: 60
SELECT py_reverse('hello') AS reversed;        -- Result: olleh
SELECT py_is_prime(17) AS is_prime;            -- Result: true
```

### Dropping a Python UDF

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_type1, parameter_type2, ...);

-- Example
DROP FUNCTION IF EXISTS py_add_three(INT, INT, INT);
DROP FUNCTION IF EXISTS py_reverse(STRING);
DROP FUNCTION IF EXISTS py_is_prime(INT);
```

### Parameter Reference

#### CREATE FUNCTION Parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `function_name` | Yes | Function name. Must comply with identifier naming rules |
| `parameter_type` | Yes | Parameter type list. Supports the various Doris data types |
| `return_type` | Yes | Return value type |

#### PROPERTIES Parameters

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `type` | Yes | - | Fixed value `"PYTHON_UDF"` |
| `symbol` | Yes | - | Python function entry name.<br/>• **Inline mode**: write the function name directly, such as `"evaluate"`<br/>• **Module mode**: format is `[package_name.]module_name.func_name`. See the module mode description for details |
| `file` | No | - | Path to the Python `.zip` package. Required only in module mode. Supports three protocols:<br/>• `file://`: local file system path<br/>• `http://`: HTTP remote download<br/>• `https://`: HTTPS remote download |
| `runtime_version` | Yes | - | Python runtime version, such as `"3.10.12"`. The complete version number is required |
| `always_nullable` | No | `true` | Whether the function always returns a nullable result |

#### Runtime Version Notes

- Python 3.x is supported.
- The complete version number must be specified (such as `"3.10.12"`); only the major and minor version (such as `"3.10"`) is not allowed.
- When `runtime_version` is not specified, the function call fails.

### Data Type Mapping

<!-- Knowledge type: Reference -->

The following table lists the mapping between Doris data types and Python types:

| Type category | Doris type | Python type | Description |
| --- | --- | --- | --- |
| Null type | `NULL` | `None` | Null value |
| Boolean type | `BOOLEAN` | `bool` | Boolean value |
| Integer types | `TINYINT` | `int` | 8-bit integer |
|  | `SMALLINT` | `int` | 16-bit integer |
|  | `INT` | `int` | 32-bit integer |
|  | `BIGINT` | `int` | 64-bit integer |
|  | `LARGEINT` | `int` | 128-bit integer |
| Floating point types | `FLOAT` | `float` | 32-bit floating point |
|  | `DOUBLE` | `float` | 64-bit floating point |
|  | `TIME` / `TIMEV2` | `float` | Time type (represented as a floating point) |
| String types | `CHAR` | `str` | Fixed-length string |
|  | `VARCHAR` | `str` | Variable-length string |
|  | `STRING` | `str` | String |
|  | `JSONB` | `str` | JSON binary format (converted to a string) |
|  | `VARIANT` | `str` | Variant type (converted to a string) |
|  | `DATE` | `str` | Date string in `'YYYY-MM-DD'` format |
|  | `DATETIME` | `str` | Datetime string in `'YYYY-MM-DD HH:MM:SS'` format |
| Date/time types | `DATEV2` | `datetime.date` | Date object |
|  | `DATETIMEV2` | `datetime.datetime` | Datetime object |
|  | `TIMESTAMPTZ` | `datetime.datetime` | Datetime object with time zone |
| Decimal types | `DECIMAL` / `DECIMALV2` | `decimal.Decimal` | High-precision decimal |
|  | `DECIMAL32` | `decimal.Decimal` | 32-bit fixed-point |
|  | `DECIMAL64` | `decimal.Decimal` | 64-bit fixed-point |
|  | `DECIMAL128` | `decimal.Decimal` | 128-bit fixed-point |
|  | `DECIMAL256` | `decimal.Decimal` | 256-bit fixed-point |
| IP types | `IPV4` | `ipaddress.IPv4Address` | IPv4 address |
|  | `IPV6` | `ipaddress.IPv6Address` | IPv6 address |
| Binary types | `BITMAP` | `bytes` | Bitmap data (not supported yet) |
|  | `HLL` | `bytes` | HyperLogLog data (not supported yet) |
|  | `QUANTILE_STATE` | `bytes` | Quantile state data (not supported yet) |
| Complex data types | `ARRAY<T>` | `list` | Array with element type T |
|  | `MAP<K,V>` | `dict` | Dictionary with key type K and value type V |
|  | `STRUCT<f1:T1, f2:T2, ...>` | `dict` | Struct with field names as keys and field values as values |

#### NULL Handling

- A Doris `NULL` value maps to `None` in Python.
- When a function argument is `NULL`, the Python function receives `None`.
- When the Python function returns `None`, Doris treats it as `NULL`.
- Handle `None` values explicitly in your function to avoid runtime errors.

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

<!-- Applicable scenario: Large-batch data computation / Performance optimization -->

Vectorized mode uses Pandas to process data in batches and outperforms scalar mode. In vectorized mode, function arguments are `pandas.Series` objects, and the return value should also be a `pandas.Series`.

:::caution Caution
To make sure the system recognizes vectorized mode, use type annotations in the function signature (such as `a: pd.Series`) and operate directly on the batch data structure inside the function. Without explicit vectorized types, the system falls back to scalar mode.

When the function signature mixes `pd.Series` types with regular types, the system treats the input column corresponding to a regular type parameter as a constant column (the same value is reused for the entire batch), which may produce results that do not match expectations. In vectorized mode, keep the parameter style consistent: either use `pandas.Series` type annotations for all parameters, or use regular type parameters for all (scalar mode).
:::

```python
## Vectorized mode
def add(a: pd.Series, b: pd.Series) -> pd.Series:
    return a + b + 1

## Scalar mode
def add(a, b):
    return a + b + 1
```

#### Basic Examples

**Example 1: Vectorized integer addition**

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

**Example 2: Vectorized string processing**

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

**Example 3: Vectorized math operations**

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

**Example 4: Mixed parameter types in the function signature (both `pd.Series` and regular types)**

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
  "runtime_version"="3.12.11"
)
AS $$
import pandas as pd

# Keep the parameter style consistent
def py_mixed_vector_add_impl(x: pd.Series, y: int):
    return x + y
$$;

SELECT
	id
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

#### Advantages of Vectorized Mode

1. **Performance optimization**: Processes data in batches and reduces the number of interactions between Python and Doris.
2. **Leverages Pandas/NumPy**: Takes full advantage of vectorized computation.
3. **Concise code**: The Pandas API expresses complex logic more concisely.

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

### Handling Complex Data Types

#### ARRAY Type

**Example: Sum array elements**

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
    """ The Doris ARRAY type maps to a Python list """
    if arr is None:
        return None
    return sum(arr)
$$;

SELECT py_array_sum([1, 2, 3, 4, 5]) AS result; -- Result: 15
```

**Example: Filter an array**

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

**Example: Get the number of keys in a MAP**

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
    """ The Doris MAP type maps to a Python dict """
    if m is None:
        return None
    return len(m)
$$;

SELECT py_map_size({'a': 1, 'b': 2, 'c': 3}) AS result; -- Result: 3
```

**Example: Get a value from a MAP**

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

**Example: Access STRUCT fields**

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
    """ The Doris STRUCT type maps to a Python dict """
    if s is None:
        return None
    return s.get('name')
$$;

SELECT py_struct_get_name({'Alice', 30}) AS result; -- Result: Alice
```

### Real-world Scenarios

<!-- Knowledge type: Scenario examples -->

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

#### Scenario 4: ID Card Number Validation

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

### Performance Recommendations

#### 1. Prefer Vectorized Mode

Vectorized mode performs significantly better than scalar mode:

```python
# Scalar mode: row-by-row processing
def scalar_process(x):
    return x * 2

# Vectorized mode: batch processing
import pandas as pd
def vector_process(x: pd.Series) -> pd.Series:
    return x * 2
```

#### 2. Use Module Mode for Complex Logic

Place complex function logic in standalone Python files for easier maintenance and reuse.

#### 3. Avoid I/O Operations Inside Functions

Avoid file I/O, network requests, and other I/O operations in UDFs. They severely impact performance.

### Limitations and Notes

#### 1. Python Version Support

- Only Python 3.x is supported.
- Python 3.10 or later is recommended.
- Make sure the Doris cluster has the corresponding Python runtime installed.

#### 2. Dependency Libraries

- The Python standard library is supported out of the box.
- To use third-party libraries, install them in the cluster environment in advance.

#### 3. Performance Considerations

- Python UDF performance is lower than that of Doris built-in functions (implemented in C++).
- For performance-sensitive scenarios, prefer Doris built-in functions.
- For large data volumes, use vectorized mode.

#### 4. Security

- UDF code runs inside the Doris process, so the code must be safe and trusted.
- Avoid dangerous operations in UDFs (such as system commands or file deletion).
- Review UDF code in production environments.

#### 5. Resource Limits

- UDF execution consumes CPU and memory resources on BE nodes.
- Heavy UDF use can affect overall cluster performance.
- Monitor the resource consumption of UDFs.

### Frequently Asked Questions

<!-- Knowledge type: FAQ -->

#### Q1: How do I use a third-party library in a Python UDF?

A: Install the corresponding Python library on every BE node. For example:

```bash
pip3 install numpy pandas
conda install numpy pandas
```

#### Q2: Does Python UDF support recursive functions?

A: Yes, but be careful with recursion depth to avoid stack overflow.

#### Q3: How do I debug a Python UDF?

A: Debug the function logic in a local Python environment first to make sure it is correct, then create the UDF. View BE logs for error information.

#### Q4: Does Python UDF support global variables?

A: Yes, but they are not recommended. In a distributed environment, global variable behavior may not match expectations.

#### Q5: How do I update an existing Python UDF?

A: Drop the old UDF first, then create a new one:

```sql
DROP FUNCTION IF EXISTS function_name(parameter_types);
CREATE FUNCTION function_name(...) ...;
```

#### Q6: Can a Python UDF access external resources?

A: Technically yes, but it is **strongly discouraged**. You can use network libraries (such as `requests`) inside a Python UDF to access external APIs and databases, but this severely affects performance and stability. Reasons include:

- Network latency slows down queries.
- The UDF fails when the external service is unavailable.
- Heavy concurrent requests can put pressure on the external service.
- Timeouts and error handling are hard to control.

## Python UDAF (Aggregate Function)

<!-- Knowledge type: Operations guide -->

Python UDAF (User Defined Aggregate Function) lets you define custom aggregate functions for grouped aggregation and window computation. With Python UDAF, you can flexibly implement complex aggregation logic such as statistical analysis, data collection, and custom metric computation.

Core characteristics of Python UDAF:

- **Distributed aggregation**: Supports aggregation in a distributed environment, automatically handling data partitioning, merging, and final computation.
- **State management**: Maintains aggregation state through class instances, supporting complex state objects.
- **Window function support**: Works with window functions (the OVER clause) for moving aggregations, ranking, and other advanced features.
- **High flexibility**: Implements arbitrarily complex aggregation logic without being limited by built-in aggregate functions.

### UDAF Basic Concepts

#### Aggregate Function Lifecycle

A Python UDAF is implemented as a class. The execution of an aggregate function involves the following stages:

1. **Initialization (`__init__`)**: Creates the aggregation state object and initializes state variables.
2. **Accumulation (`accumulate`)**: Processes a single row and updates the aggregation state.
3. **Merge (`merge`)**: Merges aggregation states from multiple partitions (in distributed scenarios).
4. **Finish (`finish`)**: Computes and returns the final aggregation result.

#### Required Class Methods and Attributes

A complete Python UDAF class must implement the following:

| Method/attribute | Description | Required |
| --- | --- | --- |
| `__init__(self)` | Initializes the aggregation state | Yes |
| `accumulate(self, *args)` | Accumulates data from a single row | Yes |
| `merge(self, other_state)` | Merges states from other partitions | Yes |
| `finish(self)` | Returns the final aggregation result | Yes |
| `aggregate_state` (attribute) | Returns the serializable aggregation state. **Must support pickle serialization** | Yes |

### Basic Syntax

#### Creating a Python UDAF

Python UDAF supports two creation methods: **inline mode** and **module mode**.

:::tip Note
If both the `file` parameter and the `AS $$` inline Python code are specified, Doris **prefers the inline Python code** and runs the Python UDAF in inline mode.
:::

##### Inline Mode

Inline mode lets you write a Python class directly in SQL. It is suitable for simple aggregation logic.

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
        # Return the serializable state
        
    def accumulate(self, *args):
        # Accumulate data
        
    def merge(self, other_state):
        # Merge state
        
    def finish(self):
        # Return the final result
$$;
```

**Example 1: Sum aggregation**

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

**Example 2: Average aggregation**

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

Module mode is suitable for complex aggregation logic. Package the Python code as a `.zip` archive and reference it when creating the function.

**Step 1: Write the Python module**

Create a file named `stats_udaf.py`:

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

**Step 2: Package the Python module**

You **must** package the Python file in `.zip` format (even when there is only one file):

```bash
zip stats_udaf.zip stats_udaf.py
```

**Step 3: Set the path of the `.zip` package**

Specify the `.zip` package path through the `file` parameter:

| Deployment method | Form |
| --- | --- |
| Local file system (`file://` protocol) | `"file" = "file:///path/to/stats_udaf.zip"` |
| HTTP/HTTPS remote download (`http://` or `https://` protocol) | `"file" = "http://example.com/udaf/stats_udaf.zip"`<br/>`"file" = "https://s3.amazonaws.com/bucket/stats_udaf.zip"` |

> **Note**:
> - When using remote download, ensure that all BE nodes can access the URL.
> - The first call downloads the file, which may introduce some latency.
> - The file is cached, so later calls do not download it again.

**Step 4: Set the `symbol` parameter**

In module mode, `symbol` specifies the location of the class inside the ZIP package. The format is:

```
[package_name.]module_name.ClassName
```

Parameter description:

- `package_name` (optional): The name of the top-level Python package inside the ZIP package.
- `module_name` (required): The Python module file name (without the `.py` suffix) that contains the target class.
- `ClassName` (required): The UDAF class name.

Resolution rules:

- Doris splits the `symbol` string by `.`:
    - If the result has **two** substrings, they are `module_name` and `ClassName`.
    - If the result has **three or more** substrings, the first is `package_name`, the middle is `module_name`, and the last is `ClassName`.

:::caution Warning
The namespace should be unique. Avoid names that collide with the Python standard library or common third-party libraries to prevent dependency conflicts and runtime exceptions caused by module shadowing.
:::

**Step 5: Create the UDAF**

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

**Step 6: Use the function**

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

#### Dropping a Python UDAF

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Example
DROP FUNCTION IF EXISTS py_sum(INT);
DROP FUNCTION IF EXISTS py_avg(DOUBLE);
DROP FUNCTION IF EXISTS py_variance(DOUBLE);
```

### Parameter Reference

#### CREATE AGGREGATE FUNCTION Parameters

| Parameter | Description |
| --- | --- |
| `function_name` | Function name. Follows SQL identifier naming rules |
| `parameter_types` | Parameter type list, such as `INT`, `DOUBLE`, or `STRING` |
| `RETURNS return_type` | Return value type |

#### PROPERTIES Parameters

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `type` | Yes | - | Fixed value `"PYTHON_UDF"` |
| `symbol` | Yes | - | Python class name.<br/>• **Inline mode**: write the class name directly, such as `"SumUDAF"`<br/>• **Module mode**: format is `[package_name.]module_name.ClassName` |
| `file` | No | - | Path to the Python `.zip` package. Required only in module mode. Supports three protocols:<br/>• `file://`: local file system path<br/>• `http://`: HTTP remote download<br/>• `https://`: HTTPS remote download |
| `runtime_version` | Yes | - | Python runtime version, such as `"3.10.12"` |
| `always_nullable` | No | `true` | Whether the function always returns a nullable result |

#### runtime_version Notes

- The Python version must be specified as a **complete version number** in the format `x.x.x` or `x.x.xx`.
- Doris looks up an interpreter that matches this version in the configured Python environments.

### Window Functions

You can combine Python UDAF with window functions (the OVER clause):

> When you use a Python UDAF in a window function (OVER clause), Doris calls the `reset` method of the UDAF after each window frame is computed. Implement this method in the class to reset the aggregation state to its initial value.

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

Python UDAF uses the same data type mapping rules as Python UDF, including all integer, floating point, string, datetime, decimal, and boolean types.

**For the detailed type mapping, see**: [Data Type Mapping](#data-type-mapping).

#### NULL Handling

- Doris maps SQL `NULL` values to Python `None`.
- In the `accumulate` method, check whether the parameter is `None`.
- An aggregate function can return `None` to indicate that the result is `NULL`.

### Real-world Scenarios

#### Scenario 1: Compute Percentiles

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

#### Scenario 2: Deduplicated String Collection

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

### Performance Recommendations

#### 1. Optimize the Size of the State Object

- Avoid storing large amounts of raw data in the state object.
- Use aggregated statistics whenever possible instead of complete data lists.
- For scenarios that must store data (such as median computation), consider sampling or limiting the data volume.

**Not recommended**:

```python
class BadMedianUDAF:
    def __init__(self):
        self.all_values = []  # Can be very large
    
    def accumulate(self, value):
        if value is not None:
            self.all_values.append(value)
```

#### 2. Reduce Object Creation

- Reuse the state object and avoid creating new objects frequently.
- Use primitive data types instead of complex objects.

#### 3. Simplify Merge Logic

- The `merge` method is called frequently in distributed environments.
- Make sure the merge operation is efficient and correct.

#### 4. Use Incremental Computation

- For metrics that can be computed incrementally (such as the average), use incremental computation instead of storing all data.

#### 5. Avoid Using External Resources

- Do not access databases or external APIs in a UDAF.
- All computation should be based on the input data and internal state.

### Limitations and Notes

#### 1. Performance Considerations

- Python UDAF performance is lower than that of built-in aggregate functions.
- Use it for scenarios with complex logic and moderate data volumes.
- For large data volumes, prefer built-in functions or optimize the UDAF implementation.

#### 2. State Serialization

- The object returned by `aggregate_state` **must support pickle serialization**.
- Supported types: primitive types (int, float, str, bool), lists, dicts, tuples, sets, and custom class instances that support pickle serialization.
- Not supported: file handles, database connections, socket connections, thread locks, and other objects that cannot be pickled.
- When the state object cannot be pickled, the function fails at execution time.
- **Prefer built-in types** (dict, list, tuple) for state objects to ensure compatibility and maintainability.

#### 3. Memory Limits

- The state object consumes memory. Avoid storing too much data.
- Large state objects affect performance and stability.

#### 4. Function Naming

- The same function name can be defined in different databases.
- Specify the database name when calling (such as `db.func()`) to avoid ambiguity.

#### 5. Environment Consistency

- The Python environment on all BE nodes must be consistent.
- This includes the Python version, dependency package versions, and environment configuration.

### Frequently Asked Questions

<!-- Knowledge type: FAQ -->

#### Q1: What is the difference between UDAF and UDF?

A: A **UDF** processes a single row and returns a single result; the function is called once per row. A **UDAF** processes multiple rows and returns a single aggregated result, used together with GROUP BY.

```sql
-- UDF: invoked for each row
SELECT id, py_upper(name) FROM users;

-- UDAF: invoked once per group
SELECT category, py_sum(amount) FROM sales GROUP BY category;
```

#### Q2: What does the `aggregate_state` attribute do?

A: `aggregate_state` is used to serialize and transmit the aggregation state in a distributed environment:

- **Serialization**: Converts the state object to a transmittable format using the **pickle protocol**.
- **Merge**: Merges partial aggregation results across nodes.
- **Must support pickle serialization**: Can return primitive types, lists, dicts, tuples, sets, and custom class instances that support pickle serialization.
- **Not allowed to return**: file handles, database connections, socket connections, thread locks, or other objects that cannot be pickled. Otherwise the function fails at execution time.

#### Q3: Can a UDAF be used in window functions?

A: Yes. Python UDAF fully supports window functions (the OVER clause).

#### Q4: When is the `merge` method called?

A: `merge` is called in the following situations:

- **Distributed aggregation**: Merging partial aggregation results from different BE nodes.
- **Parallel processing**: Merging partial results from different threads on the same node.
- **Window functions**: Merging partial results inside the window frame.

The `merge` implementation must therefore be correct, otherwise the result is wrong.

## Python UDTF (Table Function)

<!-- Knowledge type: Operations guide -->

Python UDTF (User Defined Table Function) lets you define custom table functions that turn a single row into multiple output rows. It is useful for data splitting, expansion, and generation.

Core characteristics of Python UDTF:

- **One row to many rows**: Takes a single row as input and produces zero, one, or many rows of output.
- **Flexible output structure**: Allows any number and type of output columns, supporting simple types and complex STRUCT types.
- **Lateral view support**: Works with `LATERAL VIEW` for data expansion and joining.
- **Functional style**: Uses Python functions and the `yield` statement, which is concise and intuitive.

### UDTF Basic Concepts

#### How a Table Function Executes

A Python UDTF is implemented as a **function** (not a class). The execution flow is:

1. **Receive input**: The function takes the column values of a single row as parameters.
2. **Process and yield**: The `yield` statement yields zero or more output rows.
3. **Stateless**: Each function invocation processes one row independently and does not retain state from the previous row.

#### Function Requirements

A Python UDTF function must satisfy the following requirements:

- **Yield results with `yield`**: Use the `yield` statement to produce output rows.
- **Match parameter types**: The function parameters correspond to the parameter types defined in SQL.
- **Match output format**: The format of the data yielded must match the `RETURNS ARRAY<...>` definition.

#### Output Methods

- **Single column output**: `yield value` yields a single value.
- **Multi-column output**: `yield (value1, value2, ...)` yields a tuple of values.
- **Conditional skip**: Not calling `yield` produces no output for that row.

### Basic Syntax

#### Creating a Python UDTF

Python UDTF supports two creation methods: **inline mode** and **module mode**.

:::caution Caution
If both the `file` parameter and the `AS $$` inline Python code are specified, Doris **prefers the inline Python code** and runs the Python UDTF in inline mode.
:::

##### Inline Mode

Inline mode lets you write a Python function directly in SQL. It is suitable for simple table function logic.

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
    # Or
    yield (result1, result2, ...)  # Multi-column output
$$;
```

> **Important syntax notes**:
> - Use `CREATE TABLES FUNCTION` (note that **TABLES** is plural).
> - Single column output: `ARRAY<type>`, such as `ARRAY<INT>`.
> - Multi-column output: `ARRAY<STRUCT<col1:type1, col2:type2, ...>>`.

**Example 1: String split (single column output)**

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

**Example 2: Generate a number sequence (single column output)**

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

**Example 3: Multi-column output (STRUCT)**

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

**Example 4: Cartesian product (multi-column STRUCT)**

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

**Example 5: Parse a JSON array**

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

##### Module Mode

Module mode is suitable for complex table function logic. Package the Python code as a `.zip` archive and reference it when creating the function.

**Step 1: Write the Python module**

Create a file named `text_udtf.py`:

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

**Step 2: Package the Python module**

You **must** package the Python file in `.zip` format (even when there is only one file):

```bash
zip text_udtf.zip text_udtf.py
```

**Step 3: Set the path of the `.zip` package**

Specify the `.zip` package path through the `file` parameter:

| Deployment method | Form |
| --- | --- |
| Local file system (`file://` protocol) | `"file" = "file:///path/to/text_udtf.zip"` |
| HTTP/HTTPS remote download (`http://` or `https://` protocol) | `"file" = "http://example.com/udtf/text_udtf.zip"`<br/>`"file" = "https://s3.amazonaws.com/bucket/text_udtf.zip"` |

:::caution Caution
- When using remote download, ensure that all BE nodes can access the URL.
- The first call downloads the file, which may introduce some latency.
- The file is cached, so later calls do not download it again.
:::

**Step 4: Set the `symbol` parameter**

In module mode, `symbol` specifies the location of the function inside the ZIP package. The format is:

```
[package_name.]module_name.function_name
```

Parameter description:

- `package_name` (optional): The name of the top-level Python package inside the ZIP package.
- `module_name` (required): The Python module file name (without the `.py` suffix) that contains the target function.
- `function_name` (required): The UDTF function name.

Resolution rules:

- Doris splits the `symbol` string by `.`:
    - If the result has **two** substrings, they are `module_name` and `function_name`.
    - If the result has **three or more** substrings, the first is `package_name`, the middle is `module_name`, and the last is `function_name`.

:::caution Warning
The namespace should be unique. Avoid names that collide with the Python standard library or common third-party libraries to prevent dependency conflicts and runtime exceptions caused by module shadowing.
:::

**Step 5: Create the UDTF**

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

**Step 6: Use the function**

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

#### Dropping a Python UDTF

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Example
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
DROP FUNCTION IF EXISTS py_range(INT, INT);
DROP FUNCTION IF EXISTS py_explode_json(STRING);
```

#### Modifying a Python UDTF

Doris does not support modifying an existing function directly. Drop it first and then recreate it:

```sql
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
CREATE TABLES FUNCTION py_split(STRING, STRING) ...;
```

### Parameter Reference

#### CREATE TABLES FUNCTION Parameters

| Parameter | Description |
| --- | --- |
| `function_name` | Function name. Follows SQL identifier naming rules |
| `parameter_types` | Parameter type list, such as `INT`, `STRING`, or `DOUBLE` |
| `RETURNS ARRAY<...>` | The returned array type, which defines the output structure<br/>• Single column: `ARRAY<type>`<br/>• Multi-column: `ARRAY<STRUCT<col1:type1, col2:type2, ...>>` |

#### PROPERTIES Parameters

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `type` | Yes | - | Fixed value `"PYTHON_UDF"` |
| `symbol` | Yes | - | Python function name.<br/>• **Inline mode**: write the function name directly, such as `"split_string_udtf"`<br/>• **Module mode**: format is `[package_name.]module_name.function_name` |
| `file` | No | - | Path to the Python `.zip` package. Required only in module mode. Supports three protocols:<br/>• `file://`: local file system path<br/>• `http://`: HTTP remote download<br/>• `https://`: HTTPS remote download |
| `runtime_version` | Yes | - | Python runtime version, such as `"3.10.12"` |
| `always_nullable` | No | `true` | Whether the function always returns a nullable result |

#### runtime_version Notes

- The Python version must be specified as a **complete version number** in the format `x.x.x` or `x.x.xx`.
- Doris looks up an interpreter that matches this version in the configured Python environments.

### Data Type Mapping

Python UDTF uses the same data type mapping rules as Python UDF, including all integer, floating point, string, datetime, decimal, boolean, array, and STRUCT types.

**For the detailed type mapping, see**: [Data Type Mapping](#data-type-mapping).

#### NULL Handling

- Doris maps SQL `NULL` values to Python `None`.
- Check whether the parameter is `None` in the function.
- A value yielded by `yield` may contain `None`, indicating that the column is `NULL`.

### Real-world Scenarios

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

### Performance Recommendations

#### 1. Control the Output Row Count

- For scenarios that may produce a large number of output rows, set a reasonable upper limit.
- Avoid Cartesian product explosions.

#### 2. Avoid Repeated Computation

If you need to use the same computed result multiple times, compute it ahead of time:

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

#### 3. Use Generator Expressions

Take advantage of Python generators to avoid creating intermediate lists:

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

#### 4. Avoid Accessing External Resources

- Do not access databases, files, or networks in a UDTF.
- All processing should be based on the input parameters.

### Limitations and Notes

#### 1. Stateless Restriction

- Python UDTF is **stateless**. Each function invocation processes one row independently.
- State cannot be retained across invocations.
- For cross-row aggregation, use a UDAF.

#### 2. Performance Considerations

- Python UDTF performance is lower than that of built-in table functions.
- Use it for scenarios with complex logic and moderate data volumes.
- For large data volumes, prefer optimization or built-in functions.

#### 3. Fixed Output Type

- The type defined in `RETURNS ARRAY<...>` is fixed.
- The values yielded by `yield` must match the definition.
- Single column: `yield value` or `yield (value,)`. Multi-column: `yield (value1, value2, ...)`.

#### 4. Function Naming

- The same function name can be defined in different databases.
- Specify the database name when calling to avoid ambiguity.

#### 5. Environment Consistency

- The Python environment on all BE nodes must be consistent.
- This includes the Python version, dependency package versions, and environment configuration.

### Frequently Asked Questions

<!-- Knowledge type: FAQ -->

#### Q1: What is the difference between UDTF and UDF?

A: A **UDF** takes one row in and produces one row out, a one-to-one relationship. A **UDTF** takes one row in and produces zero or more rows out, a one-to-many relationship.

Example:

```sql
SELECT py_upper(name) FROM users;

SELECT tag FROM users LATERAL VIEW py_split(tags, ',') tmp AS tag;
```

#### Q2: How do I output multiple columns?

A: Define the return type with STRUCT for multi-column output and yield a tuple:

```sql
CREATE TABLES FUNCTION func(...)
RETURNS ARRAY<STRUCT<col1:INT, col2:STRING>>
...

def func(...):
    yield (123, 'hello')  # Corresponds to col1 and col2
```

#### Q3: Why does my UDTF produce no output?

A: Possible reasons:

1. **`yield` is not called**: Make sure the function calls `yield`.
2. **Filtering**: All data is filtered out.
3. **Exception swallowed**: Check whether a try-except block has swallowed the error.
4. **NULL input**: The input is NULL and the function returns directly.

#### Q4: Can a UDTF maintain state?

A: No. Python UDTF is stateless and each function invocation processes one row independently. For cross-row aggregation or state maintenance, use a Python UDAF.

#### Q5: How do I limit the output row count of a UDTF?

A: Add a counter or condition check in the function:

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

#### Q6: Are there limitations on the data types yielded by UDTF?

A: UDTF supports all Doris data types, including primitive types (INT, STRING, DOUBLE, and so on) and complex types (ARRAY, STRUCT, MAP, and so on). The output type must be explicitly defined in `RETURNS ARRAY<...>`.

#### Q7: Can I access external resources in a UDTF?

A: Technically yes, but it is **strongly discouraged**. A UDTF should be purely functional and process only the input parameters. Accessing external resources (databases, files, network) leads to performance issues and unpredictable behavior.

## Python UDF/UDAF/UDTF Environment Configuration and Multi-version Management

<!-- Knowledge type: Deployment and configuration -->
<!-- Applicable scenario: Cluster initialization / Coexistence of multiple Python UDF versions -->

### Python Environment Management

Before using Python UDF/UDAF/UDTF, make sure that the Python runtime environment is correctly configured on the Doris Backend (BE) nodes. Doris supports managing Python environments with **Conda** or **Virtual Environment (venv)**, which allows different UDFs to use different versions of the Python interpreter and dependencies.

Doris provides two ways to manage Python environments:

- **Conda mode**: Manage multi-version environments with Miniconda/Anaconda.
- **Venv mode**: Manage multi-version environments with the built-in Python virtual environment (venv).

### Installing and Using Third-party Libraries

Python UDF, UDAF, and UDTF can all use third-party libraries. Because Doris is distributed, you must install third-party libraries uniformly on **all BE nodes**, otherwise some nodes will fail to execute.

#### Installation Steps

1. **Install dependencies on each BE node**:

    ```bash
    # Install with pip
    pip install numpy pandas requests
    
    # Or install with conda
    conda install numpy pandas requests -y
    ```

2. **Import and use them in the function**:

    ```python
    import numpy as np
    import pandas as pd
    
    # Use them in a UDF/UDAF/UDTF function
    def my_function(x):
        return np.sqrt(x)
    ```

#### Notes

- **`pandas` and `pyarrow` are mandatory dependencies**. Pre-install them in every Python environment, otherwise Python UDF/UDAF/UDTF cannot run.
- Install the same versions of dependencies on **all BE nodes**, otherwise some nodes will fail to execute.
- The installation path must match the Python runtime environment used by the corresponding UDF/UDAF/UDTF.
- Use a virtual environment or Conda environment to manage dependencies and avoid conflicts with the system Python environment.

### BE Configuration Parameters

Set the following parameters in the `be.conf` configuration file on every BE node and **restart BE** for the configuration to take effect.

#### Configuration Parameter Reference

| Parameter | Type | Allowed values | Default | Description |
| --- | --- | --- | --- | --- |
| `enable_python_udf_support` | bool | `true` / `false` | `false` | Whether to enable the Python UDF feature |
| `python_env_mode` | string | `conda` / `venv` | `""` | The Python multi-version environment management mode |
| `python_conda_root_path` | string | Directory path | `""` | The root directory of Miniconda<br/>Effective only when `python_env_mode = conda` |
| `python_venv_root_path` | string | Directory path | `${DORIS_HOME}/lib/udf/python` | The root directory of venv multi-version management<br/>Effective only when `python_env_mode = venv` |
| `python_venv_interpreter_paths` | string | Path list (separated by `:`) | `""` | The list of available Python interpreter directories<br/>Effective only when `python_env_mode = venv` |
| `max_python_process_num` | int32 | Integer | `0` | The maximum number of processes in the Python Server process pool<br/>`0` means using the CPU core count as the default. You can set another positive integer to override the default |

### Method 1: Manage Python Environments with Conda

#### 1. Configure BE

Add the following configuration to `be.conf`:

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = conda
python_conda_root_path = /path/to/miniconda3
```

#### 2. Environment Lookup Rules

Doris looks up Conda environments under `${python_conda_root_path}/envs/` that match the `runtime_version` specified by the UDF.

**Matching rules**:

- `runtime_version` **must be the complete Python version number**, in the format `x.x.x` or `x.x.xx`, such as `"3.9.18"` or `"3.12.11"`.
- Doris iterates over all Conda environments and checks whether the actual Python interpreter version in each environment exactly matches `runtime_version`.
- When no matching environment is found, Doris reports an error: `Python environment with version x.x.x not found`.

**Example**:

- When the UDF specifies `runtime_version = "3.9.18"`, Doris searches for an environment whose Python version is 3.9.18.
- The environment name can be anything (such as `py39`, `my-env`, or `data-science`) as long as the Python version in that environment is 3.9.18.
- The complete version number is required. Version prefixes such as `"3.9"` or `"3.12"` are not allowed.

#### 3. Directory Structure Diagram

```
## File system layout on a Doris BE node (Conda mode)

/path/to/miniconda3                  ← python_conda_root_path (configured in be.conf)
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

#### 4. Create Conda Environments

:::caution Caution
The Doris Python UDF/UDAF/UDTF feature has **mandatory dependencies** on `pandas` and `pyarrow`. You **must** pre-install both libraries in every Python environment, otherwise UDFs will not run correctly.
:::

Run the following commands **on all BE nodes** to create the Python environments:

```bash
# Install Miniconda (when not yet installed)
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh -b -p /opt/miniconda3

# Create a Python 3.9.18 environment and install required dependencies (the environment name can be customized)
/opt/miniconda3/bin/conda create -n py39 python=3.9.18 pandas pyarrow -y

# Create a Python 3.12.11 environment and pre-install dependencies (Important: the Python version must be specified exactly, and pandas and pyarrow must be installed)
/opt/miniconda3/bin/conda create -n py312 python=3.12.11 pandas pyarrow numpy -y

# Activate an environment and install additional dependencies
source /opt/miniconda3/bin/activate py39
conda install requests beautifulsoup4 -y
conda deactivate

# Verify the Python version in the environment
/opt/miniconda3/envs/py39/bin/python --version     # Should output: Python 3.9.18
/opt/miniconda3/envs/py312/bin/python --version    # Should output: Python 3.12.11
```

#### 5. Use in a UDF

```sql
-- Use the Python 3.12.11 environment
CREATE FUNCTION py_ml_predict(DOUBLE)
RETURNS DOUBLE
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.12.11",  -- Must specify the complete version number to match Python 3.12.11
    "always_nullable" = "true"
)
AS $$
def evaluate(x):
    # Libraries installed in the Python 3.12.11 environment can be used
    return x * 2
$$;

-- Note: Whether the environment is named py312 or ml-env, any environment whose Python version is 3.12.11 can be used
-- runtime_version cares only about the Python version, not the environment name
```

### Method 2: Manage Python Environments with Venv

#### 1. Configure BE

Add the following configuration to `be.conf`:

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = venv
python_venv_root_path = /doris/python_envs
python_venv_interpreter_paths = /opt/python3.9/bin/python3.9:/opt/python3.12/bin/python3.12
```

#### 2. Configuration Parameter Notes

- **`python_venv_root_path`**: The root directory for the virtual environments. All venv environments are created under this directory.
- **`python_venv_interpreter_paths`**: A list of absolute paths to Python interpreters separated by colons (`:`). Doris checks the version of each interpreter and matches it against the `runtime_version` (the complete version number, such as `"3.9.18"`) specified in the UDF.

#### 3. Directory Structure Diagram

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

#### 4. Create Venv Environments

:::caution Caution
The Doris Python UDF/UDAF/UDTF feature has **mandatory dependencies** on `pandas` and `pyarrow`. You **must** pre-install both libraries in every Python environment, otherwise UDFs will not run correctly.
:::

Run the following commands **on all BE nodes**:

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

#### 5. Use in a UDF

```sql
-- Use the Python 3.9.18 environment
CREATE FUNCTION py_clean_text(STRING)
RETURNS STRING
PROPERTIES (
    "type" = "PYTHON_UDF",
    "symbol" = "evaluate",
    "runtime_version" = "3.9.18",  -- Must specify the complete version number to match Python 3.9.18
    "always_nullable" = "true"
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
    "always_nullable" = "true"
)
AS $$
import numpy as np

def evaluate(x):
    return np.sqrt(x)
$$;
```

### Best Practices for Environment Management

#### 1. Choose the Right Management Method

| Scenario | Recommended | Reason |
| --- | --- | --- |
| Frequent switching of Python versions | Conda | Strong environment isolation and simple dependency management |
| Existing Conda environments | Conda | Existing environments can be reused directly |
| Limited system resources | Venv | Smaller footprint and faster startup |
| Existing Python system environments | Venv | No need to install Conda separately |

#### 2. Environment Consistency Requirements

:::caution Caution
The Python environments on all BE nodes must be **completely identical**, including:

- The Python version must be the same.
- The installed dependency packages and their versions must be the same.
- The environment directory paths must be the same.
:::

### Notes

#### 1. Configuration Changes Take Effect

- After modifying `be.conf`, **you must restart the BE process** for the change to take effect.
- Verify that the configuration is correct before restarting to avoid service disruption.

#### 2. Path Verification

Before configuring, verify that the paths are correct:

```bash
# Conda mode: verify the conda path
ls -la /opt/miniconda3/bin/conda
/opt/miniconda3/bin/conda env list

# Venv mode: verify interpreter paths
/opt/python3.9/bin/python3.9 --version
/opt/python3.12/bin/python3.12 --version
```

#### 3. Permission Settings

Ensure the Doris BE process has permission to access the Python environment directory:

```bash
# Conda mode
chmod -R 755 /opt/miniconda3

# Venv mode
chmod -R 755 /doris/python_envs
chown -R doris:doris /doris/python_envs  # Assume the BE process user is doris
```

#### 4. Resource Limits

Adjust the Python process pool parameter according to actual needs:

```properties
## Use the CPU core count (recommended, max_python_process_num = 0)
max_python_process_num = 0

## High concurrency: specify the process count manually
max_python_process_num = 128

## Resource-constrained: limit the process count
max_python_process_num = 32
```

### Environment Verification

#### Verify the Environment on Each BE Node

```bash
# Conda mode
/opt/miniconda3/envs/py39/bin/python --version
/opt/miniconda3/envs/py39/bin/python -c "import pandas; print(pandas.__version__)"

# Venv mode
/doris/python_envs/python3.9.18/bin/python --version
/doris/python_envs/python3.9.18/bin/python -c "import pandas; print(pandas.__version__)"
```

#### Show Python Versions Common to All BE Nodes

```sql
SHOW PYTHON VERSIONS;
```

```text
+---------+---------+---------+-------------------+----------------------------------------+
| Version | EnvName | EnvType | BasePath          | ExecutablePath                         |
+---------+---------+---------+-------------------+----------------------------------------+
| 3.9.18  | py39    | conda   | path/to/miniconda | path/to/miniconda/envs/py39/bin/python |
+---------+---------+---------+-------------------+----------------------------------------+
```

#### Show Installed Dependencies for a Given Version

Use `SHOW PYTHON PACKAGES IN '<version>'` to show the installed dependencies for the specified version. When the dependencies differ across BE nodes, the differing parts are listed.

```sql
SHOW PYTHON PACKAGES IN '3.9.18'
```

When all BE nodes have identical dependencies:

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

When BE nodes have different dependencies:

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

### Common Troubleshooting

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Errors after Python UDF deployment -->

#### Q1: UDF call reports "Python environment not found"

**Cause**:

- The version specified by `runtime_version` does not exist on the system.
- The environment path is configured incorrectly.

**Solution**:

```bash
# Check the Conda environment list
conda env list

# Check whether the venv interpreter exists
ls -la /opt/python3.9/bin/python3.9

# Check the BE configuration
grep python /path/to/be.conf
```

#### Q2: UDF call reports "ModuleNotFoundError: No module named 'xxx'"

**Cause**: The required dependency package is not installed in the Python environment.

#### Q3: Different BE nodes return different results

**Cause**: The Python environment or dependency versions differ across BE nodes.

**Solution**:

1. Check the Python and dependency versions on all nodes.
2. Verify environment consistency across all nodes.
3. Use `requirements.txt` (pip) or `environment.yml` (Conda) to deploy environments uniformly. Common usage examples:

- Using `requirements.txt` (pip):

    ```bash
    # Export dependencies in the development environment
    pip freeze > requirements.txt
    # Install dependencies on a BE node using the target Python
    /path/to/python -m pip install -r requirements.txt
    ```

- Using `environment.yml` (Conda):

    ```bash
    # Export dependencies
    conda env export --from-history -n py312 -f environment.yml
    # Create the environment on a BE node
    conda env create -f environment.yml -n py312
    # Or update an existing environment
    conda env update -f environment.yml -n py312
    ```

:::caution Caution
- Make sure `pandas` and `pyarrow` appear in the dependency file and that the same versions are installed on all BE nodes.
- During installation, use the Python interpreter or Conda path that matches the Doris configuration (such as `/opt/miniconda3/bin/conda` or the specified venv interpreter).
- Put the dependency file under version control or in shared storage so that operations can distribute it uniformly to all BE nodes.
- Further reading: [pip official documentation](https://pip.pypa.io/en/stable/cli/pip/), [Conda environment export/import guide](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#exporting-the-environment).
:::

#### Q4: Changes to be.conf do not take effect

**Possible cause**: The BE process was not restarted.

### Usage Limitations

1. **Performance considerations**:
    - Python UDF performance is lower than that of built-in functions. Use it for scenarios with complex logic and small data volumes.
    - For large data volumes, prefer vectorized mode.

2. **Type limitations**:
    - Special types such as HLL and Bitmap are not supported.

3. **Environment isolation**:
    - The same function name can be defined in different databases.
    - Specify the database name when calling (such as `db.func()`) to avoid ambiguity.

4. **Concurrency limits**:
    - Python UDFs run via a process pool. Concurrency is bounded by `max_python_process_num`.
    - Increase this parameter for high-concurrency scenarios.
