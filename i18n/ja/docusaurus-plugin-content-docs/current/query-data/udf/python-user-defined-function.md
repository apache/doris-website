---
{
  "title": "Python UDF、UDAF、UDWF、UDTF",
  "language": "ja",
  "description": "Python UDFは、PythonでUDFを記述するためのインターフェースをユーザーに提供し、Python言語を使用したカスタム関数の実行を容易にします。DorisはPythonを使用したUDF、UDAF、UDTFの記述をサポートしています。特に指定がない限り、以下のテキストではUDFはすべてのユーザー定義関数を指すために使用されます。"
}
---
## Python UDF

Python UDF（User Defined Function）は、Apache Dorisが提供するカスタムスカラ関数拡張メカニズムで、ユーザーがデータのクエリと処理のためにPythonでカスタム関数を記述することを可能にします。Python UDFを通じて、ユーザーは複雑なビジネスロジックを柔軟に実装し、様々なデータ型を処理し、Pythonの豊富なライブラリエコシステムを最大限に活用できます。

Python UDFは2つの実行モードをサポートします：
- **Scalar Mode**：データを行ごとに処理し、シンプルな変換と計算に適しています
- **Vectorized Mode**：データをバッチで処理し、高性能コンピューティングのためにPandasを活用します

:::tip Note
**環境依存関係**：Python UDFを使用する前に、すべてのBEノードのPython環境に**`pandas`**と**`pyarrow`**ライブラリを事前にインストールする必要があります。これらはDoris Python UDF機能の必須依存関係です。[Python UDF Environment Configuration](python-user-defined-function#python-udfudafudtf-environment-configuration-and-multi-version-management)を参照してください。

**ログパス**：Python UDF Serverのランタイムログは`output/be/log/python_udf_output.log`にあります。ユーザーはこのログでPython Serverの動作ステータス、関数実行情報、およびデバッグエラーを確認できます。
:::

### Python UDFの作成

Python UDFは2つの作成モードをサポートします：`Inline Mode`と`Module Mode`。

:::caution Note
`file`パラメータと`AS $$`インラインPythonコードの両方が指定された場合、Dorisは**インラインPythonコード**の読み込みを優先し、Python UDFをインラインモードで実行します。
:::

#### Inline Mode

インラインモードはPythonコードを直接SQLに記述することができ、シンプルな関数ロジックに適しています。

**構文**：

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
**例1: 整数の加算**

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
**例2: 文字列の連結**

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
#### モジュールモード

モジュールモードは複雑な関数ロジックに適しており、Pythonコードを`.zip`アーカイブにパッケージ化し、関数作成時に参照する必要があります。

**ステップ1: Pythonモジュールの作成**

`python_udf_scalar_ops.py`ファイルを作成します：

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
**ステップ2: Pythonモジュールをパッケージ化する**

Pythonファイルを`.zip`形式にパッケージ化する**必要があります**（単一ファイルの場合でも）：

```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py
```
複数のPythonファイルの場合：

```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py utils.py helper.py ...
```
**ステップ3: Pythonモジュールアーカイブパスを設定する**

Pythonモジュールアーカイブは複数のデプロイメント方法をサポートしており、`.zip`パッケージパスの`file`パラメータを通じて指定されます：

**方法1: ローカルファイルシステム**（`file://`プロトコルを使用）

```sql
"file" = "file:///path/to/python_udf_scalar_ops.zip"
```
BEノードのローカルファイルシステムに`.zip`パッケージが保存されているシナリオに適しています。

**方法2: HTTP/HTTPSリモートダウンロード**（`http://`または`https://`プロトコルを使用）

```sql
"file" = "http://example.com/udf/python_udf_scalar_ops.zip"
"file" = "https://s3.amazonaws.com/bucket/python_udf_scalar_ops.zip"
```
オブジェクトストレージ（S3、OSS、COSなど）やHTTPサーバーから`.zip`パッケージをダウンロードするシナリオに適しています。Dorisは自動的にダウンロードしてローカルにキャッシュします。

:::caution Note
- リモートダウンロード方式を使用する場合、すべてのBEノードがURLにアクセスできることを確認してください
- 初回呼び出し時にファイルをダウンロードするため、多少の遅延が発生する可能性があります
- ファイルはキャッシュされるため、以降の呼び出しでは再ダウンロードの必要はありません
:::

**ステップ4: symbolパラメータの設定**

モジュールモードでは、`symbol`パラメータを使用してZIPパッケージ内の関数の場所を指定します。形式は次のとおりです：

```
[package_name.]module_name.func_name
```
**パラメータ説明**：
- `package_name`（オプション）：ZIPアーカイブ内のトップレベルPythonパッケージ名。関数がパッケージのルートモジュールにある場合、またはZIPアーカイブにパッケージがない場合は省略可能
- `module_name`（必須）：対象関数を含むPythonモジュールファイル名（`.py`拡張子なし）
- `func_name`（必須）：ユーザー定義関数名

**解析ルール**：
- Dorisは`symbol`文字列を`.`で分割します：
  - **2つ**の部分文字列が得られる場合、それらは`module_name`と`func_name`です
  - **3つ以上**の部分文字列が得られる場合、最初が`package_name`、中間が`module_name`、最後が`func_name`です
- `module_name`部分は`importlib`による動的インポートのモジュールパスとして使用されます
- `package_name`が指定されている場合、パス全体が有効なPythonインポートパスを形成する必要があり、ZIPパッケージ構造がこのパスと一致する必要があります

**例示**：

**例A：パッケージ構造なし（2部構成）**

```
ZIP Structure:
math_ops.py

symbol = "math_ops.add"
```
`math_ops.py` ファイルで定義された `add` 関数が、ZIPパッケージのルートに配置されていることを示しています。

**例B: パッケージ構造（3部構成）**

```
ZIP Structure:
mylib/
├── __init__.py
└── string_helper.py

symbol = "mylib.string_helper.split_text"
```
関数`split_text`が`mylib/string_helper.py`ファイルで定義されていることを示しています。ここで：
- `package_name` = `mylib`
- `module_name` = `string_helper`
- `func_name` = `split_text`

**例C: ネストされたパッケージ構造（4部構成）**

```
ZIP Structure:
mylib/
├── __init__.py
└── utils/
    ├── __init__.py
    └── string_helper.py

symbol = "mylib.utils.string_helper.split_text"
```
関数 `split_text` が `mylib/utils/string_helper.py` ファイルで定義されていることを示します。ここで：
- `package_name` = `mylib`
- `module_name` = `utils.string_helper`
- `func_name` = `split_text`

> **注意**:
> - `symbol` の形式が無効な場合（関数名の欠落、モジュール名が空、パス内の空のコンポーネントなど）、Dorisは関数呼び出し時にエラーを報告します
> - ZIPパッケージ内のディレクトリ構造は `symbol` で指定されたパスと一致する必要があります
> - 各パッケージディレクトリには `__init__.py` ファイルが含まれている必要があります（空でも可）

**ステップ5: UDF関数の作成**

**例1: ローカルファイルの使用（パッケージ構造なし）**

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
**例2: HTTP/HTTPSリモートファイルの使用**

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
**例3: パッケージ構造の使用**

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
**ステップ6: 関数を使用する**

```sql
SELECT py_add_three(10, 20, 30) AS sum_result; -- Result: 60
SELECT py_reverse('hello') AS reversed; -- Result: olleh
SELECT py_is_prime(17) AS is_prime; -- Result: true
```
### Python UDF の削除

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_type1, parameter_type2, ...);

-- Examples
DROP FUNCTION IF EXISTS py_add_three(INT, INT, INT);
DROP FUNCTION IF EXISTS py_reverse(STRING);
DROP FUNCTION IF EXISTS py_is_prime(INT);
```
### パラメータ説明

#### CREATE FUNCTION パラメータ

| パラメータ | 必須 | 説明 |
|------|---------|------|
| `function_name` | はい | 関数名、識別子命名規則に準拠する必要があります |
| `parameter_type` | はい | パラメータタイプリスト、様々なDorisデータタイプをサポート |
| `return_type` | はい | 戻り値のタイプ |

#### PROPERTIES パラメータ

| パラメータ | 必須 | デフォルト | 説明 |
|------|---------|--------|------|
| `type` | はい | - | `"PYTHON_UDF"`として固定 |
| `symbol` | はい | - | Python関数エントリ名。<br>• **インラインモード**: `"evaluate"`のように関数名を直接記述<br>• **モジュールモード**: フォーマットは`[package_name.]module_name.func_name`、モジュールモード説明を参照 |
| `file` | いいえ | - | Python `.zip`パッケージパス、モジュールモードでのみ必須。3つのプロトコルをサポート：<br>• `file://` - ローカルファイルシステムパス<br>• `http://` - HTTPリモートダウンロード<br>• `https://` - HTTPSリモートダウンロード |
| `runtime_version` | はい | - | Pythonランタイムバージョン、`"3.10.12"`のような完全なバージョン番号が必要 |
| `always_nullable` | いいえ | `true` | 常にnull許可の結果を返すかどうか |

#### ランタイムバージョンの説明

- Python 3.xバージョンをサポート
- 完全なバージョン番号（`"3.10.12"`など）の指定が必要、メジャー.マイナーバージョン番号のみ（`"3.10"`など）は使用不可
- `runtime_version`が指定されていない場合、関数呼び出し時にエラーが発生

### データタイプマッピング

以下の表はDorisデータタイプとPythonタイプ間のマッピング関係を示します：

| タイプカテゴリ | Dorisタイプ | Pythonタイプ | 説明 |
|---------|-----------|------------|------|
| Nullタイプ | `NULL` | `None` | Null値 |
| Boolean型 | `BOOLEAN` | `bool` | Boolean値 |
| 整数型 | `TINYINT` | `int` | 8ビット整数 |
| | `SMALLINT` | `int` | 16ビット整数 |
| | `INT` | `int` | 32ビット整数 |
| | `BIGINT` | `int` | 64ビット整数 |
| | `LARGEINT` | `int` | 128ビット整数 |
| 浮動小数点型 | `FLOAT` | `float` | 32ビット浮動小数点 |
| | `DOUBLE` | `float` | 64ビット浮動小数点 |
| | `TIME` / `TIMEV2` | `float` | 時間型（浮動小数点として） |
| 文字列型 | `CHAR` | `str` | 固定長文字列 |
| | `VARCHAR` | `str` | 可変長文字列 |
| | `STRING` | `str` | 文字列 |
| | `JSONB` | `str` | JSONバイナリフォーマット（文字列に変換） |
| | `VARIANT` | `str` | Variantタイプ（文字列に変換） |
| | `DATE` | `str` | 日付文字列、フォーマット`'YYYY-MM-DD'` |
| | `DATETIME` | `str` | DateTime文字列、フォーマット`'YYYY-MM-DD HH:MM:SS'` |
| 日付/時間型 | `DATEV2` | `datetime.date` | 日付オブジェクト |
| | `DATETIMEV2` | `datetime.datetime` | DateTimeオブジェクト |
| 小数型 | `DECIMAL` / `DECIMALV2` | `decimal.Decimal` | 高精度小数 |
| | `DECIMAL32` | `decimal.Decimal` | 32ビット固定小数点数 |
| | `DECIMAL64` | `decimal.Decimal` | 64ビット固定小数点数 |
| | `DECIMAL128` | `decimal.Decimal` | 128ビット固定小数点数 |
| | `DECIMAL256` | `decimal.Decimal` | 256ビット固定小数点数 |
| | `TIMESTAMPTZ` | `datetime.datetime` | タイムゾーン付きDateTimeオブジェクト |
| IPデータタイプ | `IPV4` | `ipaddress.IPv4Address` | IPv4アドレス |
| | `IPV6` | `ipaddress.IPv6Address` | IPv6アドレス |
| バイナリ型 | `BITMAP` | `bytes` | Bitmapデータ（現在サポートされていません） |
| | `HLL` | `bytes` | HyperLogLogデータ（現在サポートされていません） |
| | `QUANTILE_STATE` | `bytes` | Quantile状態データ（現在サポートされていません） |
| 複合データ型 | `ARRAY<T>` | `list` | 配列、要素タイプT |
| | `MAP<K,V>` | `dict` | 辞書、キータイプK、値タイプV |
| | `STRUCT<f1:T1, f2:T2, ...>` | `dict` | 構造体、フィールド名をキー、フィールド値を値として |

#### NULL値の取り扱い

- DorisのNULL値はPythonでは`None`にマッピングされます
- 関数パラメータが`NULL`の場合、Python関数は`None`を受け取ります
- Python関数が`None`を返す場合、Dorisは`NULL`として扱います
- ランタイムエラーを避けるため、関数内で`None`値を明示的に処理することを推奨します

例：

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

Vectorized modeは、バッチデータ処理にPandasを使用し、scalar modeよりも優れたパフォーマンスを提供します。vectorized modeでは、関数のパラメータは`pandas.Series`オブジェクトであり、戻り値も`pandas.Series`である必要があります。

:::caution Note
システムがvectorized modeを正しく認識することを確実にするため、関数シグネチャで型注釈（`a: pd.Series`など）を使用し、関数ロジック内でバッチデータ構造を直接操作してください。vectorized typesが明示的に使用されていない場合、システムはScalar Modeにフォールバックします。
:::

```python
## Vectorized Mode
def add(a: pd.Series, b: pd.Series) -> pd.Series:
    return a + b + 1

## Scalar Mode
def add(a, b):
    return a + b + 1
```
#### 基本的な例

**例1: ベクトル化された整数加算**

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
**例2: ベクトル化された文字列処理**

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
**例3: ベクトル化された数学演算**

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
#### Vectorized Modeの利点

1. **パフォーマンス最適化**: バッチ処理によりPythonとDoris間の相互作用頻度を削減
2. **Pandas/NumPyの活用**: ベクトル化計算のパフォーマンス上の利点を最大限に活用
3. **簡潔なコード**: Pandas APIにより複雑なロジックをより簡潔に表現可能

#### Vectorized Functionsの使用

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
### 複合データ型の処理

#### ARRAY型

**例: 配列要素の合計**

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
**例: 配列のフィルタリング**

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

**例: MAP キー数の取得**

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
**例: MAP値の取得**

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
#### STRUCT型

**例: STRUCTフィールドへのアクセス**

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
### 実用的な適用シナリオ

#### シナリオ1: Data Masking

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
#### シナリオ 2: 文字列類似度計算

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
#### シナリオ3: 日付計算

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
#### シナリオ4: IDカード検証

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
### パフォーマンス最適化の推奨事項

#### 1. Vectorized Modeを優先する

Vectorized modeはscalar modeを大幅に上回るパフォーマンスを発揮します：

```python
# Scalar Mode - Process row by row
def scalar_process(x):
    return x * 2

# Vectorized Mode - Batch processing
import pandas as pd
def vector_process(x: pd.Series) -> pd.Series:
    return x * 2
```
#### 2. 複雑なロジック管理にはモジュールモードを使用する

複雑な関数ロジックは別のPythonファイルに配置し、保守性と再利用性を向上させる。

#### 3. 関数内でのI/O操作を避ける

UDF内でファイルの読み書き、ネットワークリクエストなどのI/O操作を実行することは推奨されず、パフォーマンスに深刻な影響を与える。

### 制限事項と考慮事項

#### 1. Pythonバージョンサポート

- Python 3.xバージョンのみサポート
- Python 3.10以上の使用を推奨
- Dorisクラスタに対応するPythonランタイムがインストールされていることを確認する

#### 2. 依存ライブラリ

- Python標準ライブラリを組み込みサポート
- サードパーティライブラリはクラスタ環境に事前インストールが必要

#### 3. パフォーマンスに関する考慮事項

- Python UDFのパフォーマンスはDoris組み込み関数（C++実装）より低い
- パフォーマンスが重要なシナリオでは、Doris組み込み関数を優先する
- 大量データのシナリオではベクトル化モードの使用を推奨

#### 4. セキュリティ

- UDFコードはDorisプロセス内で実行されるため、コードが安全で信頼できることを確保する必要がある
- UDF内で危険な操作（システムコマンド、ファイル削除など）を避ける
- 本番環境ではUDFコードの監査を推奨

#### 5. リソース制限

- UDFの実行はBEノードのCPUとメモリリソースを占有する
- UDFの大量使用はクラスタ全体のパフォーマンスに影響する可能性がある
- UDFのリソース消費量の監視を推奨

### よくある質問（FAQ）

#### Q1: Python UDFでサードパーティライブラリを使用するには？

A: すべてのBEノードに対応するPythonライブラリをインストールする必要がある。例：

```bash
pip3 install numpy pandas
conda install numpy pandas
```
#### Q2: Python UDFは再帰関数をサポートしていますか？

A: はい、ただしスタックオーバーフローを避けるため再帰の深さに注意する必要があります。

#### Q3: Python UDFをデバッグする方法は？

A: まずローカルのPython環境で関数ロジックをデバッグし、正確性を確認してからUDFを作成できます。エラー情報についてはBEログを確認できます。

#### Q4: Python UDFはグローバル変数をサポートしていますか？

A: はい、ただし推奨されません。分散環境でのグローバル変数の動作は期待に沿わない可能性があるためです。

#### Q5: 既存のPython UDFを更新する方法は？

A: まず古いUDFを削除し、その後新しいものを作成します：

```sql
DROP FUNCTION IF EXISTS function_name(parameter_types);
CREATE FUNCTION function_name(...) ...;
```
#### Q6: Python UDFは外部リソースにアクセスできますか？

A: 技術的には可能ですが、**強く推奨されません**。Python UDFはネットワークリクエストライブラリ（`requests`など）を使用して外部API、データベースなどにアクセスできますが、これはパフォーマンスと安定性に深刻な影響を与えます。理由は以下の通りです：
- ネットワーク遅延によりクエリが遅くなる
- 外部サービスの利用不可によりUDFが失敗する
- 大量の並行リクエストが外部サービスにプレッシャーを与える可能性がある
- タイムアウトとエラーハンドリングの制御が困難

## Python UDAF

Python UDAF（User Defined Aggregate Function）は、Apache Dorisが提供するカスタム集約関数拡張メカニズムで、ユーザーがデータのグループ化集約およびウィンドウ計算のためにPythonでカスタム集約関数を作成できます。Python UDAFを通じて、ユーザーは統計分析、データ収集、カスタムメトリック計算などの複雑な集約ロジックを柔軟に実装できます。

Python UDAFのコア機能：
- **分散集約**: 分散環境でのデータ集約をサポートし、データパーティション、マージ、および最終計算を自動的に処理
- **状態管理**: クラスインスタンスを通じて集約状態を維持し、複雑な状態オブジェクトをサポート
- **ウィンドウ関数サポート**: ウィンドウ関数（OVER句）と組み合わせて使用でき、移動集約、ランキングなどの高度な機能を実装
- **高い柔軟性**: 組み込み集約関数に制限されることなく、任意に複雑な集約ロジックを実装可能

:::tip Note
**環境依存関係**: Python UDAFを使用する前に、すべてのBEノードのPython環境に**`pandas`**および**`pyarrow`**ライブラリを事前にインストールする必要があります。これらはDoris Python UDAF機能の必須依存関係です。[Python UDAF環境設定](python-user-defined-function#python-udfudafudtf-environment-configuration-and-multi-version-management)を参照してください。

**ログパス**: Python UDAF Serverの実行時ログは`output/be/log/python_udf_output.log`に配置されています。ユーザーはこのログでPython Serverの動作状況、集約関数の実行情報、およびエラーのデバッグを確認できます。
:::

### UDAF基本概念

#### 集約関数のライフサイクル

Python UDAFはクラスを通じて実装され、集約関数の実行には以下の段階が含まれます：

1. **初期化（__init__）**: 集約状態オブジェクトを作成し、状態変数を初期化
2. **蓄積（accumulate）**: 単一行データを処理し、集約状態を更新
3. **マージ（merge）**: 複数のパーティションからの集約状態をマージ（分散シナリオ）
4. **完了（finish）**: 最終集約結果を計算して返却

#### 必須クラスメソッドとプロパティ

完全なPython UDAFクラスは以下のメソッドを実装する必要があります：

| メソッド/プロパティ | 説明 | 必須 |
|----------|------|---------| 
| `__init__(self)` | 集約状態を初期化 | はい |
| `accumulate(self, *args)` | 単一行データを蓄積 | はい |
| `merge(self, other_state)` | 他のパーティションからの状態をマージ | はい |
| `finish(self)` | 最終集約結果を返却 | はい |
| `aggregate_state`（プロパティ） | シリアライズ可能な集約状態を返却、**pickle シリアライゼーションをサポートする必要があります** | はい |

### 基本構文

#### Python UDAFの作成

Python UDAFは2つの作成モードをサポートします：`Inline Mode`と`Module Mode`。

:::tip Note
`file`パラメータと`AS $$`インラインPythonコードの両方が指定された場合、Dorisは**インラインPythonコードの読み込みを優先**し、Python UDAFをインラインモードで実行します。
:::

##### インラインモード

インラインモードでは、SQLに直接Pythonクラスを記述でき、シンプルな集約ロジックに適しています。

**構文**:

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
**例1: Sum集約**

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
**例2: Average集約**

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

Module modeは複雑な集約ロジックに適しており、Pythonコードを`.zip`アーカイブにパッケージ化して、関数作成時に参照する必要があります。

**Step 1: Python Moduleを書く**

`stats_udaf.py`ファイルを作成します：

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
**ステップ2: Pythonモジュールのパッケージ化**

Pythonファイルを`.zip`形式にパッケージ化する**必要があります**（単一ファイルの場合でも）：

```bash
zip stats_udaf.zip stats_udaf.py
```
**ステップ3: Python モジュールアーカイブパスの設定**

複数のデプロイメント方法をサポートしており、`.zip`パッケージパスに対して`file`パラメータを通じて指定します：

**方法1: ローカルファイルシステム**（`file://`プロトコルを使用）

```sql
"file" = "file:///path/to/stats_udaf.zip"
```
**方法2: HTTP/HTTPSリモートダウンロード**（`http://`または`https://`プロトコルを使用）

```sql
"file" = "http://example.com/udaf/stats_udaf.zip"
"file" = "https://s3.amazonaws.com/bucket/stats_udaf.zip"
```
> **Note**: 
> - リモートダウンロード方式を使用する場合、すべてのBEノードがURLにアクセスできることを確認してください
> - 初回呼び出し時にファイルがダウンロードされるため、遅延が発生する可能性があります
> - ファイルはキャッシュされるため、後続の呼び出しでは再ダウンロードは不要です

**ステップ4: symbolパラメータの設定**

モジュールモードでは、`symbol`パラメータはZIPパッケージ内のクラスの場所を指定するために使用され、形式は次のとおりです:

```
[package_name.]module_name.ClassName
```
**パラメータ説明**：
- `package_name`（オプション）：ZIPアーカイブ内のトップレベルPythonパッケージ名
- `module_name`（必須）：対象クラスを含むPythonモジュールファイル名（`.py`サフィックスなし）
- `ClassName`（必須）：UDAFクラス名

**解析ルール**：
- Dorisは`symbol`文字列を`.`で分割します：
  - **2つ**のサブ文字列が得られた場合、それらは`module_name`と`ClassName`です
  - **3つ以上**のサブ文字列が得られた場合、最初が`package_name`、中間が`module_name`、最後が`ClassName`です

**ステップ5：UDAF関数を作成する**

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
**ステップ6: 関数を使用する**

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
#### Python UDAFの削除

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Examples
DROP FUNCTION IF EXISTS py_sum(INT);
DROP FUNCTION IF EXISTS py_avg(DOUBLE);
DROP FUNCTION IF EXISTS py_variance(DOUBLE);
```
### パラメータ説明

#### CREATE AGGREGATE FUNCTION パラメータ

| パラメータ | 説明 |
|------|------|
| `function_name` | 関数名、SQL識別子の命名規則に従う |
| `parameter_types` | パラメータ型リスト、例：`INT`、`DOUBLE`、`STRING`など |
| `RETURNS return_type` | 戻り値の型 |

#### PROPERTIES パラメータ

| パラメータ | 必須 | デフォルト | 説明 |
|------|---------|--------|------|
| `type` | はい | - | `"PYTHON_UDF"`に固定 |
| `symbol` | はい | - | Pythonクラス名。<br>• **インラインモード**: クラス名を直接記述、例：`"SumUDAF"`<br>• **モジュールモード**: 形式は`[package_name.]module_name.ClassName` |
| `file` | いいえ | - | Python`.zip`パッケージパス、モジュールモードでのみ必要。3つのプロトコルをサポート：<br>• `file://` - ローカルファイルシステムパス<br>• `http://` - HTTPリモートダウンロード<br>• `https://` - HTTPSリモートダウンロード |
| `runtime_version` | はい | - | Pythonランタイムバージョン、例：`"3.10.12"` |
| `always_nullable` | いいえ | `true` | 常にnullable結果を返すかどうか |

#### runtime_version説明

- Pythonバージョンの**完全なバージョン番号**を記入する必要があり、形式は`x.x.x`または`x.x.xx`
- Dorisは設定されたPython環境で一致するバージョンのインタープリターを検索する

### ウィンドウ関数

Python UDAFはウィンドウ関数（OVER句）と組み合わせて使用可能：
> Python UDAFがウィンドウ関数（OVER句）で使用される場合、Dorisは各ウィンドウフレームの計算後にUDAFの`reset`メソッドを呼び出すため、集約状態を初期値にリセットするためにクラス内で実装する必要がある

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
### データ型マッピング

Python UDAFは、整数、浮動小数点数、文字列、日付/時刻、Decimal、真偽値などのすべての型を含め、Python UDFとまったく同じデータ型マッピング規則を使用します。

**詳細なデータ型マッピング関係については、以下を参照してください**: [Data Type Mapping](python-user-defined-function#data-type-mapping)

#### NULL値の処理

- DorisはSQLの`NULL`値をPythonの`None`にマッピングします
- `accumulate`メソッドでは、パラメータが`None`かどうかを確認する必要があります
- 集約関数は結果が`NULL`であることを示すために`None`を返すことができます

### 実用的な応用シナリオ

#### シナリオ1: パーセンタイルを計算する

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
#### シナリオ2: 文字列の重複除去と集約

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
#### シナリオ3: Moving Average

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
### パフォーマンス最適化の推奨事項

#### 1. Stateオブジェクトサイズの最適化

- stateオブジェクトに大量の生データを保存することを避ける
- 可能な限り完全なデータリストの代わりに集計された統計を使用する
- データを保存する必要があるシナリオ（中央値など）では、サンプリングまたはデータ量の制限を検討する

**推奨されない使用方法**：

```python
class BadMedianUDAF:
    def __init__(self):
        self.all_values = []  # May be very large
    
    def accumulate(self, value):
        if value is not None:
            self.all_values.append(value)
```
#### 2. オブジェクト作成の削減

- stateオブジェクトを再利用し、新しいオブジェクトの頻繁な作成を避ける
- 複雑なオブジェクトの代わりにプリミティブデータ型を使用する

#### 3. mergeロジックの簡素化

- `merge`メソッドは分散環境で頻繁に呼び出される
- merge操作が効率的かつ正確であることを確認する

#### 4. 増分計算の使用

- 増分計算が可能なメトリクス（平均など）については、すべてのデータを保存する代わりに増分アプローチを使用する

#### 5. 外部リソースの使用を避ける

- UDAFでデータベースや外部APIにアクセスしない
- すべての計算は受信データと内部stateに基づいて行う

### 制限事項と考慮事項

#### 1. パフォーマンスの考慮

- Python UDAFのパフォーマンスは組み込み集計関数より低い
- 複雑なロジックを持つがデータ量が中程度のシナリオに推奨
- 大量データのシナリオでは、組み込み関数を優先するかUDAF実装を最適化する

#### 2. State のシリアライゼーション

- `aggregate_state`が返すオブジェクトは**pickle シリアライゼーションをサポートしている必要がある**
- サポートされる型：基本型（int、float、str、bool）、list、dict、tuple、set、およびpickle シリアライゼーションをサポートするカスタムクラスのインスタンス
- サポートされない：ファイルハンドル、データベース接続、socket接続、スレッドロック、およびpickle シリアライゼーションできないその他のオブジェクト
- stateオブジェクトがpickle シリアライゼーションできない場合、関数実行時にエラーが報告される
- 互換性と保守性を確保するため、**組み込み型**（dict、list、tuple）をstateオブジェクトとして優先することを推奨

#### 3. メモリ制限

- stateオブジェクトはメモリを占有するため、過度なデータ保存を避ける
- 大きなstateオブジェクトはパフォーマンスと安定性に影響する

#### 4. 関数の命名

- 同じ関数名を異なるデータベースで重複定義可能
- 呼び出し時はデータベース名を指定（`db.func()`など）して曖昧さを避ける

#### 5. 環境の一貫性

- すべてのBEノードでPython環境が一貫している必要がある
- Pythonバージョン、依存パッケージのバージョン、環境設定を含む

### よくある質問（FAQ）

#### Q1: UDAFとUDFの違いは何ですか？

A: **UDF**は単一行データを処理し、単一行の結果を返します。行ごとに1回関数が呼び出されます。**UDAF**は複数行のデータを処理し、単一の集計結果を返します。GROUP BYと併用されます。

```sql
-- UDF: Called for each row
SELECT id, py_upper(name) FROM users;

-- UDAF: Called once per group
SELECT category, py_sum(amount) FROM sales GROUP BY category;
```
#### Q2: aggregate_state プロパティの目的は何ですか？

A: `aggregate_state` は分散環境において集約状態をシリアル化し、伝送するために使用されます：
- **シリアル化**: 状態オブジェクトを伝送可能な形式に変換し、シリアル化には **pickle protocol** を使用します
- **マージ**: 異なるノード間の部分集約結果をマージします
- **pickle シリアル化をサポートする必要があります**: 基本型、リスト、辞書、タプル、セット、および pickle シリアル化をサポートするカスタムクラスインスタンスを返すことができます
- **返すことができないもの**: ファイルハンドル、データベース接続、socket 接続、スレッドロック、および pickle シリアル化できないその他のオブジェクト。そうでない場合、関数実行時にエラーが報告されます

#### Q3: UDAF をウィンドウ関数で使用できますか？

A: はい。Python UDAF はウィンドウ関数（OVER 句）を完全にサポートしています。

#### Q4: merge メソッドはいつ呼び出されますか？

A: `merge` メソッドは以下の状況で呼び出されます：
- **分散集約**: 異なる BE ノードからの部分集約結果をマージします
- **並列処理**: 同一ノード内の異なるスレッドからの部分結果をマージします
- **ウィンドウ関数**: ウィンドウフレーム内の部分結果をマージします

したがって、`merge` の実装は正確でなければならず、そうでない場合は誤った結果を引き起こします。


## Python UDTF

Python UDTF（User Defined Table Function）は Apache Doris が提供するカスタムテーブル関数拡張メカニズムで、ユーザーが Python でカスタムテーブル関数を記述し、単一行データを複数行出力に変換することができます。Python UDTF を通じて、ユーザーはデータの分割、拡張、生成などの複雑なロジックを柔軟に実装できます。

Python UDTF のコア機能：
- **1 行から複数行へ**: 単一行入力を受け取り、0、1、または複数行の結果を出力します
- **柔軟な出力構造**: 任意の数と型の出力カラムを定義でき、単純型と複雑な STRUCT 型の両方をサポートします
- **Lateral View サポート**: `LATERAL VIEW` と組み合わせて使用し、データ拡張と関連付けを実装します
- **関数型プログラミング**: Python 関数と `yield` ステートメントを使用し、簡潔で直感的です

:::tip Note
**環境依存**: Python UDTF を使用する前に、すべての BE ノードの Python 環境に **`pandas`** および **`pyarrow`** ライブラリを事前にインストールする必要があります。これらは Doris Python UDTF 機能の必須依存関係です。[Python UDTF 環境設定](python-user-defined-function#python-udfudafudtf-environment-configuration-and-multi-version-management) を参照してください。

**ログパス**: Python UDTF Server のランタイムログは `output/be/log/python_udf_output.log` にあります。ユーザーはこのログで Python Server の動作状況、集約関数の実行情報、およびエラーのデバッグを確認できます。
:::

### UDTF 基本概念

#### テーブル関数の実行方法

Python UDTF は **関数**（クラスではない）を通じて実装され、関数の実行フローは以下の通りです：

1. **入力受け取り**: 関数は単一行データのカラム値をパラメータとして受け取ります
2. **処理と生成**: `yield` ステートメントを通じて 0 または複数行の結果を生成します
3. **ステートレス**: 各関数呼び出しは独立して 1 行を処理し、前の行からの状態を保持しません

#### 関数要件

Python UDTF 関数は以下の要件を満たす必要があります：

- **yield を使用して結果を生成**: `yield` ステートメントを通じて出力行を生成します
- **パラメータ型の対応**: 関数パラメータは SQL で定義されたパラメータ型と対応します
- **出力形式の一致**: `yield` のデータ形式は `RETURNS ARRAY<...>` 定義と一致する必要があります

#### 出力方法

- **単一カラム出力**: `yield value` で単一値を生成します
- **複数カラム出力**: `yield (value1, value2, ...)` で複数値のタプルを生成します
- **条件付きスキップ**: `yield` を呼び出さない場合、この行は出力を生成しません

### 基本構文

#### Python UDTF の作成

Python UDTF は 2 つの作成モードをサポートしています：Inline Mode と Module Mode です。

:::caution Note
`file` パラメータと `AS $$` インライン Python コードの両方が指定されている場合、Doris は **インライン Python コードの読み込みを優先** し、inline mode で Python UDTF を実行します。
:::

##### Inline Mode

Inline mode では Python 関数を SQL 内に直接記述でき、シンプルなテーブル関数ロジックに適しています。

**構文**:

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
> **重要な構文に関する注意事項**:
> - `CREATE TABLES FUNCTION`を使用してください（**TABLES**は複数形であることに注意）
> - 単一カラム出力: `ARRAY<type>`（例：`ARRAY<INT>`）
> - 複数カラム出力: `ARRAY<STRUCT<col1:type1, col2:type2, ...>>`

**例1: 文字列分割（単一カラム出力）**

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
**例2: 数値シーケンスの生成（単一列出力）**

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
**例3: 複数列出力 (STRUCT)**

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
**例4: 直積（マルチカラムSTRUCT）**

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
**例5: JSON配列の解析**

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
##### モジュールモード

モジュールモードは複雑なテーブル関数ロジックに適しており、Python コードを `.zip` アーカイブにパッケージ化し、関数作成時に参照する必要があります。

**ステップ 1: Python モジュールを作成**

`text_udtf.py` ファイルを作成します：

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
**Step 2: Python モジュールをパッケージ化**

Python ファイルを `.zip` 形式にパッケージ化する**必要があります**（単一ファイルの場合でも）：

```bash
zip text_udtf.zip text_udtf.py
```
**ステップ 3: Python モジュールアーカイブパスの設定**

複数のデプロイメント方法をサポートしており、`.zip` パッケージパスの `file` パラメータを通じて指定します：

**方法 1: ローカルファイルシステム**（`file://` プロトコルを使用）

```sql
"file" = "file:///path/to/text_udtf.zip"
```
**方法2: HTTP/HTTPSリモートダウンロード** (`http://`または`https://`プロトコルを使用)

```sql
"file" = "http://example.com/udtf/text_udtf.zip"
"file" = "https://s3.amazonaws.com/bucket/text_udtf.zip"
```
:::caution Note
- リモートダウンロード方式を使用する場合、すべてのBEノードがURLにアクセスできることを確認してください
- 初回呼び出し時にファイルのダウンロードが行われるため、多少の遅延が発生する可能性があります
- ファイルはキャッシュされるため、以降の呼び出しでは再度ダウンロードする必要はありません
:::

**ステップ4: symbolパラメータの設定**

モジュールモードでは、`symbol`パラメータはZIPパッケージ内の関数の場所を指定するために使用され、形式は次のとおりです：

```
[package_name.]module_name.function_name
```
**パラメータ説明**:
- `package_name` (オプション): ZIPアーカイブ内のトップレベルPythonパッケージ名
- `module_name` (必須): 対象関数を含むPythonモジュールファイル名（`.py`拡張子なし）
- `function_name` (必須): UDTF関数名

**解析ルール**:
- Dorisは`symbol`文字列を`.`で分割します：
  - **2つ**の部分文字列が得られた場合、それらは`module_name`と`function_name`です
  - **3つ以上**の部分文字列が得られた場合、最初が`package_name`、中間が`module_name`、最後が`function_name`です

**ステップ5: UDTF関数の作成**

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
**ステップ 6: 関数を使用する**

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
#### Python UDTFの削除

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Examples
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
DROP FUNCTION IF EXISTS py_range(INT, INT);
DROP FUNCTION IF EXISTS py_explode_json(STRING);
```
#### Python UDTFの変更

Dorisは既存の関数の直接変更をサポートしていないため、まず削除してから再作成する必要があります：

```sql
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
CREATE TABLES FUNCTION py_split(STRING, STRING) ...;
```
### パラメータ説明

#### CREATE TABLES FUNCTION パラメータ

| パラメータ | 説明 |
|------|------|
| `function_name` | 関数名、SQL識別子の命名規則に従う |
| `parameter_types` | パラメータ型リスト、例：`INT`、`STRING`、`DOUBLE`など |
| `RETURNS ARRAY<...>` | 戻り配列型、出力構造を定義<br>• 単一列：`ARRAY<type>`<br>• 複数列：`ARRAY<STRUCT<col1:type1, col2:type2, ...>>` |

#### PROPERTIES パラメータ

| パラメータ | 必須 | デフォルト | 説明 |
|------|---------|--------|------|
| `type` | はい | - | `"PYTHON_UDF"`に固定 |
| `symbol` | はい | - | Python関数名。<br>• **インラインモード**：関数名を直接記述、例：`"split_string_udtf"`<br>• **モジュールモード**：形式は`[package_name.]module_name.function_name` |
| `file` | いいえ | - | Python `.zip`パッケージパス、モジュールモードでのみ必要。3つのプロトコルをサポート：<br>• `file://` - ローカルファイルシステムパス<br>• `http://` - HTTPリモートダウンロード<br>• `https://` - HTTPSリモートダウンロード |
| `runtime_version` | はい | - | Pythonランタイムバージョン、例：`"3.10.12"` |
| `always_nullable` | いいえ | `true` | 常にnullable結果を返すかどうか |

#### runtime_version 説明

- Pythonバージョンの**完全バージョン番号**を記入する必要があります。形式は`x.x.x`または`x.x.xx`
- Dorisは設定されたPython環境で一致するバージョンのインタープリターを検索します

### データ型マッピング

Python UDTFはPython UDFと全く同じデータ型マッピング規則を使用します。整数、浮動小数点、文字列、日付/時刻、Decimal、boolean、配列、STRUCTなどのすべての型を含みます。

**詳細なデータ型マッピング関係については、以下を参照してください**：[データ型マッピング](python-user-defined-function#data-type-mapping)

#### NULL値の処理

- DorisはSQL `NULL`値をPythonの`None`にマッピングします
- 関数内で、パラメータが`None`かどうかを確認する必要があります
- `yield`によって生成される値は`None`を含むことができ、その列が`NULL`であることを示します

### 実用的な応用シナリオ

#### シナリオ1：CSVデータ解析

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
#### シナリオ2: 日付範囲の生成

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
#### シナリオ3: テキストTokenization

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
#### シナリオ 4: URL パラメータ解析

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
#### シナリオ5：IP範囲の拡張

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
### パフォーマンス最適化の推奨事項

#### 1. 出力行数の制御

- 大量の出力が生成される可能性があるシナリオでは、適切な上限を設定する
- 直積の爆発的増加を避ける

#### 2. 重複計算の回避

同じ計算結果を複数回使用する必要がある場合は、事前に計算する：

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
#### 3. ジェネレータ式を使用する

Pythonのジェネレータ機能を活用し、中間リストの作成を避ける：

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
#### 4. 外部リソースへのアクセスを避ける

- UDTF内でデータベース、ファイル、ネットワークにアクセスしない
- すべての処理は入力パラメータに基づいて行う

### 制限事項と考慮事項

#### 1. ステートレスの制限

- Python UDTFは**ステートレス**であり、各関数呼び出しは1行を独立して処理する
- 複数の呼び出し間で状態を保持できない
- 行間集約が必要な場合は、UDAFを使用すべき

#### 2. パフォーマンスに関する考慮事項

- Python UDTFのパフォーマンスは組み込みテーブル関数より低い
- 複雑なロジックがあるが中程度のデータ量のシナリオに適している
- 大容量データのシナリオでは、最適化を優先するか組み込み関数を使用する

#### 3. 固定出力タイプ

- `RETURNS ARRAY<...>`で定義されるタイプは固定
- `yield`で生成される値は定義と一致する必要がある
- 単一列：`yield value`または`yield (value,)`、複数列：`yield (value1, value2, ...)`

#### 4. 関数の命名

- 同じ関数名を異なるデータベースで繰り返し定義可能
- 曖昧さを避けるため、呼び出し時にデータベース名を指定することを推奨

#### 5. 環境の一貫性

- すべてのBEノードのPython環境は一貫している必要がある
- Pythonバージョン、依存パッケージのバージョン、環境設定を含む

### よくある質問（FAQ）

#### Q1: UDTFとUDFの違いは何ですか？

A: **UDF**は単一行を入力し、単一行を出力する一対一の関係です。**UDTF**は単一行を入力し、ゼロまたは複数行を出力する一対多の関係です。

例：

```sql
SELECT py_upper(name) FROM users;

SELECT tag FROM users LATERAL VIEW py_split(tags, ',') tmp AS tag;
```
#### Q2: 複数の列を出力するには？

A: 複数列の出力はSTRUCTを使用して戻り値の型を定義し、`yield`でタプルを生成します：

```sql
CREATE TABLES FUNCTION func(...)
RETURNS ARRAY<STRUCT<col1:INT, col2:STRING>>
...

def func(...):
    yield (123, 'hello')  # Corresponds to col1 and col2
```
#### Q3: UDTFが出力を生成しないのはなぜですか？

A: 考えられる理由：
1. **`yield`を呼び出していない**：関数内で`yield`が呼び出されていることを確認してください
2. **条件フィルタリング**：すべてのデータがフィルタリングされました
3. **例外がキャッチされた**：try-exceptでエラーが隠蔽されていないか確認してください
4. **NULL入力**：入力がNULLで、関数が直接returnしています

#### Q4: UDTFは状態を維持できますか？

A: いいえ。Python UDTFはステートレスで、各関数呼び出しは独立して1行を処理します。行間の集約や状態維持が必要な場合は、Python UDAFを使用すべきです。

#### Q5: UDTFの出力行数を制限するにはどうすればよいですか？

A: 関数内にカウンターまたは条件判定を追加してください：

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
#### Q6: UDTF出力データ型に制限はありますか？

A: UDTFは、基本型（INT、STRING、DOUBLE等）および複合型（ARRAY、STRUCT、MAP等）を含むすべてのDorisデータ型をサポートします。出力型は`RETURNS ARRAY<...>`で明示的に定義する必要があります。

#### Q7: UDTFで外部リソースにアクセスできますか？

A: 技術的には可能ですが、**強く推奨されません**。UDTFは純粋に関数的であるべきで、入力パラメータに基づいてのみ処理を行うべきです。外部リソース（データベース、ファイル、ネットワーク）へのアクセスは、パフォーマンスの問題と予測できない動作を引き起こします。

## Python UDF/UDAF/UDTF環境設定とマルチバージョン管理

### Python環境管理

Python UDF/UDAF/UDTFを使用する前に、DorisのBackend（BE）ノードがPythonランタイム環境を適切に設定していることを確認してください。Dorisは**Conda**または**Virtual Environment（venv）**を通じてPython環境の管理をサポートしており、異なるUDFが異なるバージョンのPythonインタープリターと依存ライブラリを使用することを可能にします。

Dorisは2つのPython環境管理方法を提供します：
- **Condaモード**: Miniconda/Anacondaを使用してマルチバージョン環境を管理
- **Venvモード**: Pythonの組み込み仮想環境（venv）を使用してマルチバージョン環境を管理

### サードパーティライブラリのインストールと使用

Python UDF、UDAF、UDTFはすべてサードパーティライブラリを使用できます。ただし、Dorisの分散性により、サードパーティライブラリは**すべてのBEノード**に統一してインストールする必要があります。そうでなければ、一部のノードで実行が失敗します。

#### インストール手順

1. **各BEノードに依存関係をインストール**：

   ```bash
   # Install using pip
   pip install numpy pandas requests
   
   # Or install using conda
   conda install numpy pandas requests -y
   ```
2. **関数でのインポートと使用**:

   ```python
   import numpy as np
   import pandas as pd
   
   # Use in UDF/UDAF/UDTF functions
   def my_function(x):
       return np.sqrt(x)
   ```
:::caution 注意
- **`pandas`と`pyarrow`は必須の依存関係です**。すべてのPython環境に事前にインストールする必要があります。そうでなければPython UDF/UDAF/UDTFは実行できません
- **すべてのBEノード**に同じバージョンの依存関係をインストールする必要があります。そうでなければ一部のノードで実行が失敗します
- インストールパスは対応するUDF/UDAF/UDTFで使用されるPythonランタイム環境と一致する必要があります
- 仮想環境またはCondaを使用して依存関係を管理し、システムのPython環境との競合を避けることを推奨します
:::

### BE設定パラメータ

すべてのBEノードの`be.conf`設定ファイルに以下のパラメータを設定し、**BEを再起動**して設定を有効にしてください。

#### 設定パラメータの説明

| パラメータ名 | タイプ | 可能な値 | デフォルト値 | 説明 |
|--------|------|--------|--------|------|
| `enable_python_udf_support` | bool | `true` / `false` | `false` | Python UDF機能を有効にするかどうか |
| `python_env_mode` | string | `conda` / `venv` | `""` | Pythonマルチバージョン環境管理方式 |
| `python_conda_root_path` | string | ディレクトリパス | `""` | Minicondaのルートディレクトリ<br>`python_env_mode = conda`の場合のみ有効 |
| `python_venv_root_path` | string | ディレクトリパス | `${DORIS_HOME}/lib/udf/python` | venvマルチバージョン管理のルートディレクトリ<br>`python_env_mode = venv`の場合のみ有効 |
| `python_venv_interpreter_paths` | string | パスリスト（`:`で区切り） | `""` | 利用可能なPythonインタープリターのディレクトリリスト<br>`python_env_mode = venv`の場合のみ有効 |
| `max_python_process_num` | int32 | 整数 | `0` | Python Serverプロセスプール内の最大プロセス数<br>`0`はCPUコア数をデフォルト値として使用することを意味し、ユーザーは他の正の整数を設定してデフォルト値を上書きできます |

### 方式1: Condaを使用したPython環境の管理

#### 1. BEの設定

`be.conf`に以下の設定を追加してください:

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = conda
python_conda_root_path = /path/to/miniconda3
```
#### 2. 環境検索ルール

Dorisは`${python_conda_root_path}/envs/`ディレクトリの下で、UDFの`runtime_version`に一致するConda環境を検索します。

**マッチングルール**:
- `runtime_version`は**Pythonバージョンの完全なバージョン番号を記入する必要があります**。形式は`x.x.x`または`x.x.xx`で、例えば`"3.9.18"`、`"3.12.11"`のようになります
- Dorisはすべての Conda環境を走査し、各環境のPythonインタープリターの実際のバージョンが`runtime_version`と完全に一致するかを確認します
- 一致する環境が見つからない場合、エラーが報告されます：`Python environment with version x.x.x not found`

**例**:
- UDFが`runtime_version = "3.9.18"`を指定した場合、Dorisはすべての環境でPythonバージョン3.9.18の環境を検索します
- 環境名は任意です（`py39`、`my-env`、`data-science`など）。その環境のPythonバージョンが3.9.18であれば問題ありません
- 完全なバージョン番号を記入する必要があり、`"3.9"`や`"3.12"`のようなバージョンプレフィックスは使用できません

#### 3. ディレクトリ構造図

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
#### 4. Conda環境の作成

:::caution Note
DorisのPython UDF/UDAF/UDTF機能は`pandas`と`pyarrow`ライブラリに**必須で依存**しており、すべてのPython環境に事前にインストールされている**必要があります**。そうでなければUDFは正常に動作しません。
:::

**すべてのBEノードで以下のコマンドを実行してください**：

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
#### 5. UDFでの使用

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
### 方法2: Venvを使用してPython環境を管理する

#### 1. BEの設定

`be.conf`に以下の設定を追加してください:

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = venv
python_venv_root_path = /doris/python_envs
python_venv_interpreter_paths = /opt/python3.9/bin/python3.9:/opt/python3.12/bin/python3.12
```
#### 2. 設定パラメータの説明

- **`python_venv_root_path`**: 仮想環境のルートディレクトリ、すべてのvenv環境がこのディレクトリ下に作成されます
- **`python_venv_interpreter_paths`**: 英語のコロン`:`で区切られたPythonインタープリターの絶対パスのリスト。Dorisはそれぞれのインタープリターのバージョンをチェックし、UDFで指定された`runtime_version`（`"3.9.18"`などの完全なバージョン番号）に応じて対応するインタープリターをマッチングします

#### 3. ディレクトリ構造図

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
#### 4. Venv環境の作成

:::caution Note
DorisのPython UDF/UDAF/UDTF機能は`pandas`と`pyarrow`ライブラリに**必須で依存**しており、すべてのPython環境に事前にインストールされている**必要があります**。そうでなければUDFは正常に動作しません。
:::

**すべてのBEノードで以下のコマンドを実行してください**：

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
#### 5. UDFでの使用

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
### 環境管理のベストプラクティス

#### 1. 適切な管理方法の選択

| シナリオ | 推奨方法 | 理由 |
|------|---------|------|
| Pythonバージョンを頻繁に切り替える必要がある | Conda | 良好な環境分離、シンプルな依存関係管理 |
| すでにConda環境がある | Conda | 既存の環境を直接再利用可能 |
| システムリソースが限られている | Venv | 小さなフットプリント、高速起動 |
| すでにPythonシステム環境がある | Venv | 追加のCondaをインストールする必要がない |

#### 2. 環境一貫性要件
:::caution 注意
すべてのBEノードは**全く同じ**Python環境で構成する必要があります。以下を含みます：
- Pythonバージョンは一貫している必要があります
- インストールされた依存関係パッケージとそのバージョンは一貫している必要があります
- 環境ディレクトリパスは一貫している必要があります
:::

### 注意事項

#### 1. 設定変更の有効化

- `be.conf`を変更した後、**BEプロセスを再起動する必要があります**
- サービス中断を避けるため、再起動前に設定が正しいことを確認してください

#### 2. パス検証

設定前にパスが正しいことを確認してください：

```bash
# Conda mode: Verify conda path
ls -la /opt/miniconda3/bin/conda
/opt/miniconda3/bin/conda env list

# Venv mode: Verify interpreter path
/opt/python3.9/bin/python3.9 --version
/opt/python3.12/bin/python3.12 --version
```
#### 3. 権限設定

Doris BEプロセスがPython環境ディレクトリにアクセスする権限を持っていることを確認してください:

```bash
# Conda mode
chmod -R 755 /opt/miniconda3

# Venv mode
chmod -R 755 /doris/python_envs
chown -R doris:doris /doris/python_envs  # Assuming BE process user is doris
```
#### 4. リソース制限

実際のニーズに応じてPythonプロセスプールパラメータを調整してください：

```properties
## Confirm using CPU core count (recommended, max_python_process_num = 0)
max_python_process_num = 0

## High concurrency scenario, manually specify process count
max_python_process_num = 128

## Resource-constrained scenario, limit process count
max_python_process_num = 32
```
### 環境確認

各BEノードで環境が正しいかどうかを確認します：

#### 各BEノードで環境を確認：

```bash
# Conda mode
/opt/miniconda3/envs/py39/bin/python --version
/opt/miniconda3/envs/py39/bin/python -c "import pandas; print(pandas.__version__)"

# Venv mode
/doris/python_envs/python3.9.18/bin/python --version
/doris/python_envs/python3.9.18/bin/python -c "import pandas; print(pandas.__version__)"
```
#### BE で共有されているすべての Python バージョンを表示する。

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
#### 指定されたバージョンにインストールされた依存関係を表示する
`SHOW PYTHON PACKAGES IN '<version>'`を使用して、指定されたバージョンにインストールされた依存関係を表示します。BE間で異なる依存関係がある場合は、それらが個別にリストされます。

```sql
SHOW PYTHON PACKAGES IN '3.9.18'
```
各BEは同じインストールステータスを持っています:

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
各BEは異なるインストール状況を持ちます：

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
### よくある問題のトラブルシューティング

#### Q1: UDF呼び出し時に「Python environment not found」と表示される

**原因**: 
- `runtime_version`で指定されたバージョンがシステムに存在しない
- 環境パスの設定が正しくない

**解決方法**:

```bash
# Check Conda environment list
conda env list

# Check if Venv interpreter exists
ls -la /opt/python3.9/bin/python3.9

# Check BE configuration
grep python /path/to/be.conf
```
#### Q2: UDF呼び出し時に"ModuleNotFoundError: No module named 'xxx'"が表示される

**原因**: Python環境に必要な依存関係パッケージがインストールされていない

#### Q3: 異なるBEノード間で実行結果が一致しない

**原因**: BEノード間でPython環境または依存関係のバージョンが一致していない

**解決方法**:
1. すべてのノードでPythonバージョンと依存関係のバージョンを確認する。
2. すべてのノード間で環境の整合性を確認する。
3. `requirements.txt`（pip）または`environment.yml`（Conda）を使用して環境をデプロイする。一般的な使用例：

- `requirements.txt`（pip）を使用する場合：

```bash
# Export dependencies from development environment
pip freeze > requirements.txt
# On BE nodes, install with target Python interpreter
/path/to/python -m pip install -r requirements.txt
```
- `environment.yml` (Conda) を使用する場合：

```bash
# export dependencies
conda env export --from-history -n py312 -f environment.yml
# On BE nodes, create the environment
conda env create -f environment.yml -n py312
# Or update an existing environment
conda env update -f environment.yml -n py312
```
**注意**:
- **`pandas`** と **`pyarrow`** が依存関係ファイルに含まれており、すべてのBEノードで同じバージョンでインストールされていることを確認してください。
- インストール時は、Doris用に設定されたPythonインタープリターまたはCondaパスを使用してください（例：`/opt/miniconda3/bin/conda` またはBEで使用されるvenvインタープリターパス）。
- 依存関係ファイルをバージョン管理下または共有ストレージに保持し、運用チームがすべてのBEノードに一貫して配布できるようにしてください。
- 参考資料：[pip docs](https://pip.pypa.io/en/stable/cli/pip/)、[Conda export/import](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#exporting-the-environment)

#### Q4: be.conf modification not effective

**考えられる原因**: BEプロセスが再起動されていない

### 使用制限

1. **パフォーマンス上の考慮事項**：
   - Python UDFのパフォーマンスは組み込み関数よりも低く、複雑なロジックでデータ量が少ないシナリオに推奨されます
   - 大容量データの処理では、ベクトル化モードを優先してください

2. **型の制限**：
   - HLL、Bitmapなどの特殊型はサポートされていません

3. **環境の分離**：
   - 同じ関数名を異なるデータベースで重複して定義できます
   - 呼び出し時はデータベース名を指定し（`db.func()` など）、曖昧さを避けてください

4. **並行性の制限**：
   - Python UDFはプロセスプールを通じて実行され、並行性は `max_python_process_num` により制限されます
   - 高い並行性が必要なシナリオでは、このパラメータを適切に増加させる必要があります
