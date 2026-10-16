---
{
    "title": "Python UDF、UDAF、UDWF、UDTF",
    "language": "ja",
    "description": "Apache Doris で Python を使って UDF、UDAF、UDTF を作成する方法。関数の作成、ベクトル化、環境設定、よくある問題の対処方法を説明します。",
    "keywords": [
        "Doris の Python UDF",
        "Python UDAF",
        "Python UDTF",
        "ベクトル化 UDF",
        "Pandas UDF",
        "PYTHON_UDF runtime_version",
        "Conda の Python 環境",
        "venv の Python 環境",
        "Python 環境が見つからない"
    ]
}
---

<!-- Knowledge type: Feature overview + Operations guide + Configuration parameters -->
<!-- Applicable scenario: Extending SQL capability in Doris / Implementing custom scalar, aggregate, and table functions in Python -->

:::caution 実験的機能
Python UDF/UDAF/UDTF は Apache Doris 4.1.3 でリリースされた実験的機能です。
:::

Python UDF/UDAF/UDTF は、Apache Doris が提供するカスタム関数の拡張機能です。Python でスカラー関数、集約関数、テーブル関数を記述できるため、組み込み関数では実装が難しい複雑な計算を SQL で表現し、豊富な Python エコシステムを再利用できます。

このドキュメントでは、典型的な利用シナリオから始めて、三種類の関数それぞれの使い方、パラメータ、データ型の対応、性能上の推奨事項、制限事項、複数バージョンの Python 環境のデプロイ方法を説明します。

## Python UDF/UDAF/UDTF の選び方

<!-- Knowledge type: Selection decision -->

| 利用シナリオ | 推奨する関数 | 入出力の関係 |
| --- | --- | --- |
| 行ごとの複雑な変換、クレンジング、マスキング、検証 | Python UDF（スカラー関数） | 一行の入力から一行を出力 |
| GROUP BY またはウィンドウ（OVER 句）による独自の集約指標 | Python UDAF（集約関数） | 複数行の入力から一行を出力 |
| CSV/JSON の解析や連番生成など、一行を複数行に展開 | Python UDTF（テーブル関数） | 一行の入力からゼロ行以上を出力 |

性能が重要な場合は、C++ で実装された Doris の組み込み関数を優先してください。Python UDF は、組み込み関数では要件を満たせず、データ量が中程度の場合に適しています。

## 共通の前提条件

<!-- Knowledge type: Pre-deployment check -->
<!-- Applicable scenario: First time enabling Python UDF -->

Python UDF/UDAF/UDTF を作成する前に、次の準備を完了してください。

1. **Python UDF の有効化と Python 環境の設定**：BE ノードの `be.conf` で関連パラメータを有効にし、Conda または venv を使って複数バージョンの Python 環境を設定します。詳細は[Python UDF/UDAF/UDTF の環境設定と複数バージョンの管理](#python-udfudafudtf-environment-configuration-and-multi-version-management)を参照してください。
2. **必須の依存ライブラリ**：すべての BE ノード上の該当する Python 環境に **`pandas`** と **`pyarrow`** を事前にインストールしてください。これらは Doris の Python UDF 機能に必須であり、欠けていると関数を実行できません。
3. **実行ログ**：Python UDF Server の実行ログは `output/be/log/python_udf_output.log` にあります。関数の実行状況やエラーメッセージを確認し、デバッグに利用できます。

:::tip ヒント
すべての CREATE 文で、`runtime_version` に完全なバージョン番号（例：`"3.10.12"`）を明示的に指定する必要があります。メジャー番号とマイナー番号だけ（例：`"3.10"`）を指定すると、関数呼び出しに失敗します。
:::

## Python UDF（スカラー関数）

<!-- Knowledge type: Operations guide -->

Python UDF（ユーザー定義関数）はデータを行ごとに処理します。関数は各行に対して一回呼び出され、単一の結果を返します。次の二つの実行モードをサポートします。

- **スカラーモード**：データを行ごとに処理します。単純な変換や計算に適しています。
- **ベクトル化モード**：Pandas を使ってデータをバッチ単位で処理し、高速に計算します。

### Python UDF の作成

Python UDF には、**インラインモード**と**モジュールモード**の二つの作成方法があります。

:::caution 注意
`file` パラメータと `AS $$` によるインライン Python コードの両方を指定した場合、Doris は**インライン Python コードを優先**し、インラインモードで関数を実行します。
:::

#### インラインモード

インラインモードでは、SQL に Python コードを直接記述します。単純なロジックに適しています。

**構文**：

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

**例 1：整数の加算**

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

**例 2：文字列の連結（NULL の処理を含む）**

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

#### モジュールモード

モジュールモードは複雑なロジックに適しています。Python コードを `.zip` アーカイブにまとめ、関数作成時に `file` パラメータで参照します。

**ステップ 1：Python モジュールを作成する**

`python_udf_scalar_ops.py` というファイルを作成します。

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

**ステップ 2：Python モジュールをパッケージ化する**

Python ファイルが一つだけの場合も、**必ず** `.zip` 形式にパッケージ化してください。

```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py
```

Python ファイルが複数ある場合：

```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py utils.py helper.py ...
```

**ステップ 3：`.zip` パッケージのパスを設定する**

`.zip` パッケージのパスを `file` パラメータで指定します。次の二つの方法をサポートします。

| デプロイ方法 | 指定形式 | 利用シナリオ |
| --- | --- | --- |
| ローカルファイルシステム | `"file" = "file:///path/to/python_udf_scalar_ops.zip"` | `.zip` パッケージを BE ノードのローカルファイルシステムに保存する場合 |
| HTTP/HTTPS によるリモートダウンロード | `"file" = "http://example.com/udf/xx.zip"` または `"file" = "https://s3.amazonaws.com/bucket/xx.zip"` | オブジェクトストレージ（S3、OSS、COS など）または HTTP サーバーから `.zip` パッケージをダウンロードする場合。Doris は自動的にダウンロードし、ローカルにキャッシュします |

:::caution 注意
- リモートダウンロードを使う場合は、すべての BE ノードから URL にアクセスできることを確認してください。
- 初回の呼び出しでファイルがダウンロードされるため、遅延が生じることがあります。
- ファイルはキャッシュされるため、以降の呼び出しでは再ダウンロードされません。
:::

**ステップ 4：`symbol` パラメータを設定する**

モジュールモードでは、`symbol` で ZIP パッケージ内の対象関数の場所を指定します。形式は次のとおりです。

```
[package_name.]module_name.func_name
```

パラメータの説明：

- `package_name`（省略可能）：ZIP パッケージ内の最上位 Python パッケージ名です。関数がパッケージのルートモジュールにある場合、または ZIP パッケージに Python パッケージが含まれない場合は省略します。
- `module_name`（必須）：対象関数を含む Python モジュールのファイル名です（拡張子 `.py` を除く）。
- `func_name`（必須）：ユーザー定義関数の名前です。

名前の解決規則：

- Doris は `symbol` の文字列を `.` で分割します。
    - **二つ**の要素に分かれた場合、それぞれ `module_name` と `func_name` です。
    - **三つ以上**の要素に分かれた場合、最初が `package_name`、中間が `module_name`、最後が `func_name` です。
- `module_name` の部分は、`importlib` による動的インポート時のモジュールパスとして使われます。
- `package_name` を指定した場合、パス全体が有効な Python インポートパスである必要があり、ZIP パッケージの構造もそのパスと一致する必要があります。

:::caution 警告
名前空間は一意にしてください。Python 標準ライブラリや一般的なサードパーティライブラリと名前が衝突すると、モジュールのシャドーイングによる依存関係の競合や実行時例外が発生する可能性があります。
:::

**例 A：パッケージ構造なし（二要素）**

```
ZIP structure:
math_ops.py

symbol = "math_ops.add"
```

これは、関数 `add` が ZIP パッケージのルートにある `math_ops.py` で定義されていることを示します。

**例 B：パッケージ構造あり（三要素）**

```
ZIP structure:
mylib/
├── __init__.py
└── string_helper.py

symbol = "mylib.string_helper.split_text"
```

これは、関数 `split_text` が `mylib/string_helper.py` で定義されており、各要素が次の値であることを示します。

- `package_name` = `mylib`
- `module_name` = `string_helper`
- `func_name` = `split_text`

**例 C：ネストしたパッケージ構造（四要素）**

```
ZIP structure:
mylib/
├── __init__.py
└── utils/
    ├── __init__.py
    └── string_helper.py

symbol = "mylib.utils.string_helper.split_text"
```

これは、関数 `split_text` が `mylib/utils/string_helper.py` で定義されており、各要素が次の値であることを示します。

- `package_name` = `mylib`
- `module_name` = `utils.string_helper`
- `func_name` = `split_text`

> **注**：
> - `symbol` の形式が無効な場合（関数名、モジュール名、パスの構成要素のいずれかが空の場合など）、Doris は関数の呼び出し時にエラーを報告します。
> - ZIP パッケージ内のディレクトリ構造は、`symbol` で指定したパスと一致する必要があります。
> - 各パッケージディレクトリには、空でもよいので `__init__.py` ファイルが必要です。

**ステップ 5：UDF を作成する**

例 1：ローカルファイルを使用する（パッケージ構造なし）

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

例 2：HTTP/HTTPS 上のリモートファイルを使用する

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

例 3：パッケージ構造を使用する

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

**ステップ 6：関数を使用する**

```sql
SELECT py_add_three(10, 20, 30) AS sum_result; -- Result: 60
SELECT py_reverse('hello') AS reversed;        -- Result: olleh
SELECT py_is_prime(17) AS is_prime;            -- Result: true
```

### Python UDF の削除

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_type1, parameter_type2, ...);

-- Example
DROP FUNCTION IF EXISTS py_add_three(INT, INT, INT);
DROP FUNCTION IF EXISTS py_reverse(STRING);
DROP FUNCTION IF EXISTS py_is_prime(INT);
```

### パラメータリファレンス

#### CREATE FUNCTION のパラメータ

| パラメータ | 必須 | 説明 |
| --- | --- | --- |
| `function_name` | はい | 関数名。識別子の命名規則に従う必要があります |
| `parameter_type` | はい | パラメータの型の一覧。Doris の各種データ型をサポートします |
| `return_type` | はい | 戻り値の型 |

#### PROPERTIES のパラメータ

| パラメータ | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `type` | はい | - | 固定値 `"PYTHON_UDF"` |
| `symbol` | はい | - | Python 関数のエントリ名。<br/>• **インラインモード**：`"evaluate"` など、関数名を直接記述します。<br/>• **モジュールモード**：形式は `[package_name.]module_name.func_name` です。詳細はモジュールモードの説明を参照してください |
| `file` | いいえ | - | Python の `.zip` パッケージへのパス。モジュールモードでのみ必須です。次の三つのプロトコルをサポートします。<br/>• `file://`：ローカルファイルシステムのパス<br/>• `http://`：HTTP によるリモートダウンロード<br/>• `https://`：HTTPS によるリモートダウンロード |
| `runtime_version` | はい | - | `"3.10.12"` などの Python 実行環境のバージョン。完全なバージョン番号が必要です |
| `always_nullable` | いいえ | `true` | 関数が常に NULL を許容する結果を返すかどうか |
| `volatility` | いいえ | `volatile` | 関数の変動性。4.1.2 以降でサポートされます。有効な値は `immutable`、`stable`、`volatile` です。<br/>`immutable`：同じ入力に対して常に同じ出力を返します。決定的な UDF の多くは、プラン最適化のためにこの値を使用してください。<br/>`stable`：一つの SQL 文の中では結果が安定しますが、文の間では変化する場合があります。`now()` と同様です。SQL キャッシュとマテリアライズドビューの書き換えは無効になります。<br/>`volatile`：`random()` と同様に、呼び出すたびに結果が変わる場合があります。SQL キャッシュ、マテリアライズドビューの書き換え、および多くのオプティマイザーの書き換え規則が無効になります |

#### 実行環境のバージョンに関する注意事項

- Python 3.x をサポートします。
- 完全なバージョン番号（例：`"3.10.12"`）を指定する必要があります。メジャー番号とマイナー番号だけ（例：`"3.10"`）は指定できません。
- `runtime_version` を指定しない場合、関数の呼び出しに失敗します。

### データ型の対応 {#data-type-mapping}

<!-- Knowledge type: Reference -->

次の表に、Doris のデータ型と Python の型の対応を示します。

| 型の分類 | Doris の型 | Python の型 | 説明 |
| --- | --- | --- | --- |
| NULL 型 | `NULL` | `None` | NULL 値 |
| ブール型 | `BOOLEAN` | `bool` | ブール値 |
| 整数型 | `TINYINT` | `int` | 8 ビット整数 |
|  | `SMALLINT` | `int` | 16 ビット整数 |
|  | `INT` | `int` | 32 ビット整数 |
|  | `BIGINT` | `int` | 64 ビット整数 |
|  | `LARGEINT` | `int` | 128 ビット整数 |
| 浮動小数点型 | `FLOAT` | `float` | 32 ビット浮動小数点数 |
|  | `DOUBLE` | `float` | 64 ビット浮動小数点数 |
|  | `TIME` / `TIMEV2` | `float` | 時刻型（浮動小数点数で表現） |
| 文字列型 | `CHAR` | `str` | 固定長文字列 |
|  | `VARCHAR` | `str` | 可変長文字列 |
|  | `STRING` | `str` | 文字列 |
|  | `JSONB` | `str` | JSON のバイナリ形式（文字列に変換） |
|  | `VARIANT` | `str` | Variant 型（文字列に変換） |
|  | `DATE` | `str` | `'YYYY-MM-DD'` 形式の日付文字列 |
|  | `DATETIME` | `str` | `'YYYY-MM-DD HH:MM:SS'` 形式の日時文字列 |
| 日付・時刻型 | `DATEV2` | `datetime.date` | 日付オブジェクト |
|  | `DATETIMEV2` | `datetime.datetime` | 日時オブジェクト |
|  | `TIMESTAMPTZ` | `datetime.datetime` | タイムゾーン付き日時オブジェクト |
| 十進数型 | `DECIMAL` / `DECIMALV2` | `decimal.Decimal` | 高精度の十進数 |
|  | `DECIMAL32` | `decimal.Decimal` | 32 ビット固定小数点数 |
|  | `DECIMAL64` | `decimal.Decimal` | 64 ビット固定小数点数 |
|  | `DECIMAL128` | `decimal.Decimal` | 128 ビット固定小数点数 |
|  | `DECIMAL256` | `decimal.Decimal` | 256 ビット固定小数点数 |
| IP 型 | `IPV4` | `ipaddress.IPv4Address` | IPv4 アドレス |
|  | `IPV6` | `ipaddress.IPv6Address` | IPv6 アドレス |
| バイナリ型 | `BITMAP` | `bytes` | Bitmap データ（現在は未サポート） |
|  | `HLL` | `bytes` | HyperLogLog データ（現在は未サポート） |
|  | `QUANTILE_STATE` | `bytes` | Quantile state データ（現在は未サポート） |
| 複合データ型 | `ARRAY<T>` | `list` | 要素型が T の配列 |
|  | `MAP<K,V>` | `dict` | キー型が K、値型が V の辞書 |
|  | `STRUCT<f1:T1, f2:T2, ...>` | `dict` | フィールド名をキー、フィールド値を値とする構造体 |

#### NULL の処理

- Doris の `NULL` 値は Python の `None` に対応します。
- 関数の引数が `NULL` の場合、Python 関数は `None` を受け取ります。
- Python 関数が `None` を返した場合、Doris は `NULL` として扱います。
- 実行時エラーを避けるため、関数内で `None` 値を明示的に処理してください。

例：

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

### ベクトル化モード

<!-- Applicable scenario: Large-batch data computation / Performance optimization -->

ベクトル化モードでは Pandas を使ってデータをバッチ単位で処理し、スカラーモードより高い性能を得られます。関数の引数は `pandas.Series` オブジェクトであり、戻り値も `pandas.Series` にする必要があります。

:::caution 注意
システムがベクトル化モードを認識できるように、関数シグネチャで型注釈（例：`a: pd.Series`）を使い、関数内でバッチデータ構造を直接操作してください。ベクトル化型が明示されていない場合、システムはスカラーモードにフォールバックします。

関数シグネチャに `pd.Series` 型と通常の型が混在する場合、システムは通常の型のパラメータに対応する入力列を定数列として扱います（バッチ全体で同じ値を再利用します）。そのため、期待どおりの結果にならない場合があります。ベクトル化モードでは、すべてのパラメータに `pandas.Series` 型注釈を使うか、すべてを通常の型のパラメータにする（スカラーモード）か、スタイルを統一してください。
:::

```python
## Vectorized mode
def add(a: pd.Series, b: pd.Series) -> pd.Series:
    return a + b + 1

## Scalar mode
def add(a, b):
    return a + b + 1
```

#### 基本的な例

**例 1：ベクトル化された整数の加算**

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

**例 2：ベクトル化された文字列処理**

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

**例 3：ベクトル化された数値計算**

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

**例 4：関数シグネチャでの型の混在（`pd.Series` と通常の型）**

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

#### ベクトル化モードの利点

1. **性能の向上**：データをバッチ単位で処理し、Python と Doris の間のやり取りを減らします。
2. **Pandas/NumPy の活用**：ベクトル化計算を十分に活用できます。
3. **簡潔なコード**：Pandas API を使うと複雑なロジックをより簡潔に表現できます。

#### ベクトル化関数の使用

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

#### ARRAY 型

**例：配列要素の合計**

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

**例：配列のフィルタリング**

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

#### MAP 型

**例：MAP のキー数を取得する**

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

**例：MAP から値を取得する**

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

#### STRUCT 型

**例：STRUCT のフィールドにアクセスする**

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

### 実際の利用シナリオ

<!-- Knowledge type: Scenario examples -->

#### シナリオ 1：データのマスキング

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

#### シナリオ 2：文字列の類似度計算

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

#### シナリオ 3：日付計算

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

#### シナリオ 4：ID カード番号の検証

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

### 性能に関する推奨事項

#### 1. ベクトル化モードを優先する

ベクトル化モードは、スカラーモードより大幅に高い性能を発揮します。

```python
# Scalar mode: row-by-row processing
def scalar_process(x):
    return x * 2

# Vectorized mode: batch processing
import pandas as pd
def vector_process(x: pd.Series) -> pd.Series:
    return x * 2
```

#### 2. 複雑なロジックにはモジュールモードを使う

複雑な関数ロジックは独立した Python ファイルに置くと、保守や再利用が容易になります。

#### 3. 関数内での I/O 操作を避ける

UDF 内でのファイル I/O、ネットワーク要求、その他の I/O 操作は避けてください。性能に大きく影響します。

### 制限事項と注意事項

#### 1. Python バージョンのサポート

- Python 3.x のみをサポートします。
- Python 3.10 以降を推奨します。
- 対応する Python 実行環境が Doris クラスターにインストールされていることを確認してください。

#### 2. 依存ライブラリ

- Python 標準ライブラリはそのまま利用できます。
- サードパーティライブラリを使う場合は、あらかじめクラスター環境にインストールしてください。

#### 3. 性能上の考慮事項

- Python UDF は、C++ で実装された Doris の組み込み関数より性能が低くなります。
- 性能が重要な場合は、Doris の組み込み関数を優先してください。
- データ量が多い場合は、ベクトル化モードを使ってください。

#### 4. セキュリティ

- UDF コードは Doris プロセス内で実行されるため、安全で信頼できるコードを使用する必要があります。
- UDF 内でシステムコマンドの実行やファイルの削除など、危険な操作を避けてください。
- 本番環境では UDF コードをレビューしてください。

#### 5. リソース制限

- UDF の実行は BE ノードの CPU とメモリを消費します。
- UDF を多用すると、クラスター全体の性能に影響する場合があります。
- UDF のリソース消費量を監視してください。

### よくある質問

<!-- Knowledge type: FAQ -->

#### Q1：Python UDF でサードパーティライブラリを使うには？

A：対応する Python ライブラリをすべての BE ノードにインストールします。例：

```bash
pip3 install numpy pandas
conda install numpy pandas
```

#### Q2：Python UDF は再帰関数をサポートしますか？

A：はい。ただし、スタックオーバーフローを避けるため、再帰の深さに注意してください。

#### Q3：Python UDF をデバッグするには？

A：まずローカルの Python 環境で関数ロジックをデバッグし、正しいことを確認してから UDF を作成します。エラー情報は BE のログで確認してください。

#### Q4：Python UDF はグローバル変数をサポートしますか？

A：はい。ただし、推奨しません。分散環境ではグローバル変数の動作が期待と異なる場合があります。

#### Q5：既存の Python UDF を更新するには？

A：まず古い UDF を削除し、新しい UDF を作成します。

```sql
DROP FUNCTION IF EXISTS function_name(parameter_types);
CREATE FUNCTION function_name(...) ...;
```

#### Q6：Python UDF から外部リソースにアクセスできますか？

A：技術的には可能ですが、**強く非推奨**です。Python UDF 内で `requests` などのネットワークライブラリを使って外部 API やデータベースにアクセスできますが、性能と安定性に大きな影響があります。理由は次のとおりです。

- ネットワークの遅延によってクエリが遅くなります。
- 外部サービスを利用できないと UDF が失敗します。
- 同時要求が多いと、外部サービスに負荷がかかります。
- タイムアウトとエラー処理を制御するのが困難です。

## Python UDAF（集約関数）

<!-- Knowledge type: Operations guide -->

Python UDAF（ユーザー定義集約関数）では、グループ集約やウィンドウ計算に使う独自の集約関数を定義できます。統計分析、データ収集、独自の指標計算など、複雑な集約ロジックを柔軟に実装できます。

Python UDAF の主な特徴：

- **分散集約**：分散環境での集約をサポートし、データの分割、マージ、最終計算を自動的に処理します。
- **状態管理**：クラスインスタンスを通じて集約状態を保持し、複雑な状態オブジェクトをサポートします。
- **ウィンドウ関数のサポート**：ウィンドウ関数（OVER 句）と組み合わせ、移動集約、ランキングなどの高度な機能に利用できます。
- **高い柔軟性**：組み込み集約関数に制限されず、任意の複雑な集約ロジックを実装できます。

### UDAF の基本概念

#### 集約関数のライフサイクル

Python UDAF はクラスとして実装します。集約関数の実行には、次の段階があります。

1. **初期化（`__init__`）**：集約状態オブジェクトを作成し、状態変数を初期化します。
2. **蓄積（`accumulate`）**：一行を処理して集約状態を更新します。
3. **マージ（`merge`）**：複数のパーティションの集約状態をマージします（分散処理の場合）。
4. **終了（`finish`）**：最終的な集約結果を計算して返します。

#### 必須のクラスメソッドと属性

完全な Python UDAF クラスには、次の実装が必要です。

| メソッド・属性 | 説明 | 必須 |
| --- | --- | --- |
| `__init__(self)` | 集約状態を初期化します | はい |
| `accumulate(self, *args)` | 一行のデータを集約に加えます | はい |
| `merge(self, other_state)` | 他のパーティションの状態をマージします | はい |
| `finish(self)` | 最終的な集約結果を返します | はい |
| `aggregate_state`（属性） | シリアライズ可能な集約状態を返します。**pickle によるシリアライズに対応する必要があります** | はい |

### 基本構文

#### Python UDAF の作成

Python UDAF には、**インラインモード**と**モジュールモード**の二つの作成方法があります。

:::tip 注
`file` パラメータと `AS $$` によるインライン Python コードの両方を指定した場合、Doris は**インライン Python コードを優先**し、Python UDAF をインラインモードで実行します。
:::

##### インラインモード

インラインモードでは、SQL に Python クラスを直接記述します。単純な集約ロジックに適しています。

**構文**：

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

**例 1：合計の集約**

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

**例 2：平均の集約**

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

##### モジュールモード

モジュールモードは複雑な集約ロジックに適しています。Python コードを `.zip` アーカイブにまとめ、関数の作成時に参照します。

**ステップ 1：Python モジュールを作成する**

`stats_udaf.py` というファイルを作成します。

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

**ステップ 2：Python モジュールをパッケージ化する**

Python ファイルが一つだけの場合も、**必ず** `.zip` 形式にパッケージ化してください。

```bash
zip stats_udaf.zip stats_udaf.py
```

**ステップ 3：`.zip` パッケージのパスを設定する**

`.zip` パッケージのパスを `file` パラメータで指定します。

| デプロイ方法 | 指定形式 |
| --- | --- |
| ローカルファイルシステム（`file://` プロトコル） | `"file" = "file:///path/to/stats_udaf.zip"` |
| HTTP/HTTPS によるリモートダウンロード（`http://` または `https://` プロトコル） | `"file" = "http://example.com/udaf/stats_udaf.zip"`<br/>`"file" = "https://s3.amazonaws.com/bucket/stats_udaf.zip"` |

> **注**：
> - リモートダウンロードを使う場合は、すべての BE ノードから URL にアクセスできることを確認してください。
> - 初回の呼び出しでファイルがダウンロードされるため、遅延が生じることがあります。
> - ファイルはキャッシュされるため、以降の呼び出しでは再ダウンロードされません。

**ステップ 4：`symbol` パラメータを設定する**

モジュールモードでは、`symbol` で ZIP パッケージ内のクラスの場所を指定します。形式は次のとおりです。

```
[package_name.]module_name.ClassName
```

パラメータの説明：

- `package_name`（省略可能）：ZIP パッケージ内の最上位 Python パッケージ名です。
- `module_name`（必須）：対象クラスを含む Python モジュールのファイル名です（拡張子 `.py` を除く）。
- `ClassName`（必須）：UDAF クラスの名前です。

名前の解決規則：

- Doris は `symbol` の文字列を `.` で分割します。
    - **二つ**の要素に分かれた場合、それぞれ `module_name` と `ClassName` です。
    - **三つ以上**の要素に分かれた場合、最初が `package_name`、中間が `module_name`、最後が `ClassName` です。

:::caution 警告
名前空間は一意にしてください。Python 標準ライブラリや一般的なサードパーティライブラリと名前が衝突すると、モジュールのシャドーイングによる依存関係の競合や実行時例外が発生する可能性があります。
:::

**ステップ 5：UDAF を作成する**

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

**ステップ 6：関数を使用する**

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

#### Python UDAF の削除

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Example
DROP FUNCTION IF EXISTS py_sum(INT);
DROP FUNCTION IF EXISTS py_avg(DOUBLE);
DROP FUNCTION IF EXISTS py_variance(DOUBLE);
```

### パラメータリファレンス

#### CREATE AGGREGATE FUNCTION のパラメータ

| パラメータ | 説明 |
| --- | --- |
| `function_name` | 関数名。SQL 識別子の命名規則に従います |
| `parameter_types` | `INT`、`DOUBLE`、`STRING` など、パラメータの型の一覧 |
| `RETURNS return_type` | 戻り値の型 |

#### PROPERTIES のパラメータ

| パラメータ | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `type` | はい | - | 固定値 `"PYTHON_UDF"` |
| `symbol` | はい | - | Python クラス名。<br/>• **インラインモード**：`"SumUDAF"` など、クラス名を直接記述します。<br/>• **モジュールモード**：形式は `[package_name.]module_name.ClassName` です |
| `file` | いいえ | - | Python の `.zip` パッケージへのパス。モジュールモードでのみ必須です。次の三つのプロトコルをサポートします。<br/>• `file://`：ローカルファイルシステムのパス<br/>• `http://`：HTTP によるリモートダウンロード<br/>• `https://`：HTTPS によるリモートダウンロード |
| `runtime_version` | はい | - | `"3.10.12"` などの Python 実行環境のバージョン |
| `always_nullable` | いいえ | `true` | 関数が常に NULL を許容する結果を返すかどうか |
| `volatility` | いいえ | `immutable` | 関数の変動性。4.1.2 以降でサポートされます。有効な値は `immutable`、`stable`、`volatile` です。<br/>`immutable`：同じ入力に対して常に同じ出力を返します。決定的な UDF の多くは、プラン最適化のためにこの値を使用してください。<br/>`stable`：一つの SQL 文の中では結果が安定しますが、文の間では変化する場合があります。`now()` と同様です。SQL キャッシュとマテリアライズドビューの書き換えは無効になります。<br/>`volatile`：`random()` と同様に、呼び出すたびに結果が変わる場合があります。SQL キャッシュ、マテリアライズドビューの書き換え、および多くのオプティマイザーの書き換え規則が無効になります |

#### runtime_version に関する注意事項

- Python のバージョンは `x.x.x` または `x.x.xx` 形式の**完全なバージョン番号**で指定する必要があります。
- Doris は、設定済みの Python 環境からこのバージョンに一致するインタープリターを探します。

### ウィンドウ関数

Python UDAF はウィンドウ関数（OVER 句）と組み合わせて使用できます。

> ウィンドウ関数（OVER 句）で Python UDAF を使う場合、Doris は各ウィンドウフレームの計算後に UDAF の `reset` メソッドを呼び出します。集約状態を初期値に戻すため、このメソッドをクラスに実装してください。

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

### データ型の対応

Python UDAF は、整数、浮動小数点数、文字列、日時、十進数、ブール値を含め、Python UDF と同じデータ型の対応規則を使用します。

**データ型の対応の詳細は、[データ型の対応](#data-type-mapping)を参照してください。**

#### NULL の処理

- Doris は SQL の `NULL` 値を Python の `None` に対応付けます。
- `accumulate` メソッドでは、パラメータが `None` かどうかを確認してください。
- 集約関数は `None` を返して、結果が `NULL` であることを示せます。

### 実際の利用シナリオ

#### シナリオ 1：パーセンタイルの計算

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

#### シナリオ 2：重複を除いた文字列の収集

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

#### シナリオ 3：移動平均

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

### 性能に関する推奨事項

#### 1. 状態オブジェクトのサイズを最適化する

- 状態オブジェクトに大量の生データを保存しないでください。
- 可能であれば、完全なデータのリストではなく集約済みの統計値を使ってください。
- 中央値の計算など、データの保存が必要な場合は、サンプリングやデータ量の制限を検討してください。

**非推奨**：

```python
class BadMedianUDAF:
    def __init__(self):
        self.all_values = []  # Can be very large
    
    def accumulate(self, value):
        if value is not None:
            self.all_values.append(value)
```

#### 2. オブジェクトの生成を減らす

- 状態オブジェクトを再利用し、新しいオブジェクトの頻繁な生成を避けてください。
- 複雑なオブジェクトではなく基本データ型を使ってください。

#### 3. マージのロジックを簡潔にする

- `merge` メソッドは分散環境で頻繁に呼び出されます。
- マージ処理が効率的で正確であることを確認してください。

#### 4. 増分計算を使う

- 平均など増分計算が可能な指標では、すべてのデータを保存せず、増分計算を使ってください。

#### 5. 外部リソースを使用しない

- UDAF 内でデータベースや外部 API にアクセスしないでください。
- すべての計算は入力データと内部状態に基づいて行ってください。

### 制限事項と注意事項

#### 1. 性能上の考慮事項

- Python UDAF は組み込み集約関数より性能が低くなります。
- 複雑なロジックで、データ量が中程度の場合に使用してください。
- データ量が多い場合は、組み込み関数を優先するか、UDAF の実装を最適化してください。

#### 2. 状態のシリアライズ

- `aggregate_state` が返すオブジェクトは、**pickle によるシリアライズに対応する必要があります**。
- サポートされる型：基本データ型（int、float、str、bool）、リスト、辞書、タプル、集合、および pickle でシリアライズできる独自クラスのインスタンス。
- サポートされないもの：ファイルハンドル、データベース接続、ソケット接続、スレッドロックなど、pickle でシリアライズできないオブジェクト。
- 状態オブジェクトを pickle でシリアライズできない場合、関数は実行時に失敗します。
- 互換性と保守性を確保するため、状態オブジェクトには **組み込み型**（dict、list、tuple）を優先してください。

#### 3. メモリ制限

- 状態オブジェクトはメモリを消費します。大量のデータを保存しないでください。
- 大きな状態オブジェクトは性能と安定性に影響します。

#### 4. 関数の命名

- 同じ関数名を異なるデータベースで定義できます。
- 曖昧さを避けるため、呼び出し時に `db.func()` などのデータベース名を指定してください。

#### 5. 環境の一貫性

- すべての BE ノードで Python 環境を一致させる必要があります。
- Python のバージョン、依存パッケージのバージョン、環境設定も一致させてください。

### よくある質問

<!-- Knowledge type: FAQ -->

#### Q1：UDAF と UDF の違いは何ですか？

A：**UDF** は一行を処理して一つの結果を返し、行ごとに一回呼び出されます。**UDAF** は複数行を処理して一つの集約結果を返し、GROUP BY と組み合わせて使います。

```sql
-- UDF: invoked for each row
SELECT id, py_upper(name) FROM users;

-- UDAF: invoked once per group
SELECT category, py_sum(amount) FROM sales GROUP BY category;
```

#### Q2：`aggregate_state` 属性の役割は何ですか？

A：`aggregate_state` は、分散環境で集約状態をシリアライズして転送するために使います。

- **シリアライズ**：**pickle プロトコル**を使って状態オブジェクトを転送可能な形式に変換します。
- **マージ**：ノード間で部分的な集約結果をマージします。
- **pickle によるシリアライズへの対応が必須**：基本データ型、リスト、辞書、タプル、集合、pickle でシリアライズできる独自クラスのインスタンスを返せます。
- **返せないもの**：ファイルハンドル、データベース接続、ソケット接続、スレッドロックなど、pickle でシリアライズできないオブジェクト。返した場合、関数は実行時に失敗します。

#### Q3：UDAF をウィンドウ関数で使えますか？

A：はい。Python UDAF はウィンドウ関数（OVER 句）を完全にサポートします。

#### Q4：`merge` メソッドはいつ呼び出されますか？

A：`merge` は次の場合に呼び出されます。

- **分散集約**：異なる BE ノードからの部分的な集約結果をマージする場合。
- **並列処理**：同じノード上の異なるスレッドからの部分的な結果をマージする場合。
- **ウィンドウ関数**：ウィンドウフレーム内の部分的な結果をマージする場合。

したがって、`merge` を正しく実装する必要があります。誤った実装では結果も誤ります。

## Python UDTF（テーブル関数）

<!-- Knowledge type: Operations guide -->

Python UDTF（ユーザー定義テーブル関数）では、一行の入力を複数の出力行に変換する独自のテーブル関数を定義できます。データの分割、展開、生成に役立ちます。

Python UDTF の主な特徴：

- **一行から複数行へ**：一行を入力として受け取り、ゼロ行、一行、または複数行を出力します。
- **柔軟な出力構造**：単純型や複合型の STRUCT を使い、任意の数と型の出力列を定義できます。
- **LATERAL VIEW のサポート**：`LATERAL VIEW` と組み合わせて、データを展開して結合できます。
- **関数型の記述方法**：Python の関数と `yield` 文を使用するため、簡潔で直感的に記述できます。

### UDTF の基本概念

#### テーブル関数の実行方法

Python UDTF はクラスではなく、**関数**として実装します。実行の流れは次のとおりです。

1. **入力を受け取る**：関数は一行の列値をパラメータとして受け取ります。
2. **処理して値を生成する**：`yield` 文でゼロ行以上の出力行を生成します。
3. **状態を保持しない**：関数の各呼び出しは一行を独立して処理し、前の行の状態を保持しません。

#### 関数の要件

Python UDTF 関数は次の要件を満たす必要があります。

- **`yield` で結果を生成する**：`yield` 文を使って出力行を生成します。
- **パラメータの型を一致させる**：関数のパラメータは SQL で定義したパラメータの型に対応します。
- **出力形式を一致させる**：生成するデータの形式は `RETURNS ARRAY<...>` の定義と一致する必要があります。

#### 出力方法

- **単一列の出力**：`yield value` で一つの値を生成します。
- **複数列の出力**：`yield (value1, value2, ...)` で値のタプルを生成します。
- **条件に応じたスキップ**：`yield` を呼び出さない場合、その行の出力はありません。

### 基本構文

#### Python UDTF の作成

Python UDTF には、**インラインモード**と**モジュールモード**の二つの作成方法があります。

:::caution 注意
`file` パラメータと `AS $$` によるインライン Python コードの両方を指定した場合、Doris は**インライン Python コードを優先**し、Python UDTF をインラインモードで実行します。
:::

##### インラインモード

インラインモードでは、SQL に Python 関数を直接記述します。単純なテーブル関数のロジックに適しています。

**構文**：

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

> **構文に関する重要な注意事項**：
> - `CREATE TABLES FUNCTION` を使います（**TABLES** は複数形です）。
> - 単一列の出力：`ARRAY<type>`（例：`ARRAY<INT>`）。
> - 複数列の出力：`ARRAY<STRUCT<col1:type1, col2:type2, ...>>`。

**例 1：文字列の分割（単一列の出力）**

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

**例 2：連番の生成（単一列の出力）**

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

**例 3：複数列の出力（STRUCT）**

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

**例 4：直積（複数列の STRUCT）**

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

**例 5：JSON 配列の解析**

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

##### モジュールモード

モジュールモードは複雑なテーブル関数のロジックに適しています。Python コードを `.zip` アーカイブにまとめ、関数の作成時に参照します。

**ステップ 1：Python モジュールを作成する**

`text_udtf.py` というファイルを作成します。

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

**ステップ 2：Python モジュールをパッケージ化する**

Python ファイルが一つだけの場合も、**必ず** `.zip` 形式にパッケージ化してください。

```bash
zip text_udtf.zip text_udtf.py
```

**ステップ 3：`.zip` パッケージのパスを設定する**

`.zip` パッケージのパスを `file` パラメータで指定します。

| デプロイ方法 | 指定形式 |
| --- | --- |
| ローカルファイルシステム（`file://` プロトコル） | `"file" = "file:///path/to/text_udtf.zip"` |
| HTTP/HTTPS によるリモートダウンロード（`http://` または `https://` プロトコル） | `"file" = "http://example.com/udtf/text_udtf.zip"`<br/>`"file" = "https://s3.amazonaws.com/bucket/text_udtf.zip"` |

:::caution 注意
- リモートダウンロードを使う場合は、すべての BE ノードから URL にアクセスできることを確認してください。
- 初回の呼び出しでファイルがダウンロードされるため、遅延が生じることがあります。
- ファイルはキャッシュされるため、以降の呼び出しでは再ダウンロードされません。
:::

**ステップ 4：`symbol` パラメータを設定する**

モジュールモードでは、`symbol` で ZIP パッケージ内の関数の場所を指定します。形式は次のとおりです。

```
[package_name.]module_name.function_name
```

パラメータの説明：

- `package_name`（省略可能）：ZIP パッケージ内の最上位 Python パッケージ名です。
- `module_name`（必須）：対象関数を含む Python モジュールのファイル名です（拡張子 `.py` を除く）。
- `function_name`（必須）：UDTF 関数の名前です。

名前の解決規則：

- Doris は `symbol` の文字列を `.` で分割します。
    - **二つ**の要素に分かれた場合、それぞれ `module_name` と `function_name` です。
    - **三つ以上**の要素に分かれた場合、最初が `package_name`、中間が `module_name`、最後が `function_name` です。

:::caution 警告
名前空間は一意にしてください。Python 標準ライブラリや一般的なサードパーティライブラリと名前が衝突すると、モジュールのシャドーイングによる依存関係の競合や実行時例外が発生する可能性があります。
:::

**ステップ 5：UDTF を作成する**

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

**ステップ 6：関数を使用する**

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

#### Python UDTF の削除

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Example
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
DROP FUNCTION IF EXISTS py_range(INT, INT);
DROP FUNCTION IF EXISTS py_explode_json(STRING);
```

#### Python UDTF の変更

Doris は既存の関数を直接変更できません。まず削除してから再作成してください。

```sql
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
CREATE TABLES FUNCTION py_split(STRING, STRING) ...;
```

### パラメータリファレンス

#### CREATE TABLES FUNCTION のパラメータ

| パラメータ | 説明 |
| --- | --- |
| `function_name` | 関数名。SQL 識別子の命名規則に従います |
| `parameter_types` | `INT`、`STRING`、`DOUBLE` など、パラメータの型の一覧 |
| `RETURNS ARRAY<...>` | 出力構造を定義する戻り値の配列型。<br/>• 単一列：`ARRAY<type>`<br/>• 複数列：`ARRAY<STRUCT<col1:type1, col2:type2, ...>>` |

#### PROPERTIES のパラメータ

| パラメータ | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `type` | はい | - | 固定値 `"PYTHON_UDF"` |
| `symbol` | はい | - | Python 関数名。<br/>• **インラインモード**：`"split_string_udtf"` など、関数名を直接記述します。<br/>• **モジュールモード**：形式は `[package_name.]module_name.function_name` です |
| `file` | いいえ | - | Python の `.zip` パッケージへのパス。モジュールモードでのみ必須です。次の三つのプロトコルをサポートします。<br/>• `file://`：ローカルファイルシステムのパス<br/>• `http://`：HTTP によるリモートダウンロード<br/>• `https://`：HTTPS によるリモートダウンロード |
| `runtime_version` | はい | - | `"3.10.12"` などの Python 実行環境のバージョン |
| `always_nullable` | いいえ | `true` | 関数が常に NULL を許容する結果を返すかどうか |
| `volatility` | いいえ | `immutable` | 関数の変動性。4.1.2 以降でサポートされます。有効な値は `immutable`、`stable`、`volatile` です。<br/>`immutable`：同じ入力に対して常に同じ出力を返します。決定的な UDF の多くは、プラン最適化のためにこの値を使用してください。<br/>`stable`：一つの SQL 文の中では結果が安定しますが、文の間では変化する場合があります。`now()` と同様です。SQL キャッシュとマテリアライズドビューの書き換えは無効になります。<br/>`volatile`：`random()` と同様に、呼び出すたびに結果が変わる場合があります。SQL キャッシュ、マテリアライズドビューの書き換え、および多くのオプティマイザーの書き換え規則が無効になります |

#### runtime_version に関する注意事項

- Python のバージョンは `x.x.x` または `x.x.xx` 形式の**完全なバージョン番号**で指定する必要があります。
- Doris は、設定済みの Python 環境からこのバージョンに一致するインタープリターを探します。

### データ型の対応

Python UDTF は、整数、浮動小数点数、文字列、日時、十進数、ブール値、配列、STRUCT を含め、Python UDF と同じデータ型の対応規則を使用します。

**データ型の対応の詳細は、[データ型の対応](#data-type-mapping)を参照してください。**

#### NULL の処理

- Doris は SQL の `NULL` 値を Python の `None` に対応付けます。
- 関数内でパラメータが `None` かどうかを確認してください。
- `yield` で生成した値には `None` を含めることができ、その列が `NULL` であることを示します。

### 実際の利用シナリオ

#### シナリオ 1：CSV データの解析

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

#### シナリオ 2：日付範囲の生成

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

#### シナリオ 3：テキストのトークン化

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

#### シナリオ 4：URL パラメータの解析

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

#### シナリオ 5：IP アドレス範囲の展開

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

### 性能に関する推奨事項

#### 1. 出力行数を制御する

- 出力行数が多くなる可能性がある場合は、適切な上限を設けてください。
- 直積によって行数が爆発的に増えることを避けてください。

#### 2. 計算の繰り返しを避ける

同じ計算結果を複数回使う場合は、あらかじめ計算してください。

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

#### 3. ジェネレーター式を使う

Python のジェネレーターを活用し、中間リストの作成を避けてください。

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

#### 4. 外部リソースにアクセスしない

- UDTF 内でデータベース、ファイル、ネットワークにアクセスしないでください。
- すべての処理は入力パラメータに基づいて行ってください。

### 制限事項と注意事項

#### 1. 状態を保持できないという制限

- Python UDTF は**状態を保持しません**。関数の各呼び出しは一行を独立して処理します。
- 呼び出しをまたいで状態を保持することはできません。
- 行をまたぐ集約には UDAF を使ってください。

#### 2. 性能上の考慮事項

- Python UDTF は組み込みテーブル関数より性能が低くなります。
- 複雑なロジックで、データ量が中程度の場合に使用してください。
- データ量が多い場合は、最適化するか組み込み関数を優先してください。

#### 3. 固定された出力型

- `RETURNS ARRAY<...>` で定義する型は固定です。
- `yield` で生成する値は、その定義と一致する必要があります。
- 単一列：`yield value` または `yield (value,)`。複数列：`yield (value1, value2, ...)`。

#### 4. 関数の命名

- 同じ関数名を異なるデータベースで定義できます。
- 曖昧さを避けるため、呼び出し時にデータベース名を指定してください。

#### 5. 環境の一貫性

- すべての BE ノードで Python 環境を一致させる必要があります。
- Python のバージョン、依存パッケージのバージョン、環境設定も一致させてください。

### よくある質問

<!-- Knowledge type: FAQ -->

#### Q1：UDTF と UDF の違いは何ですか？

A：**UDF** は一行を入力して一行を出力する一対一の関係です。**UDTF** は一行を入力してゼロ行以上を出力する一対多の関係です。

例：

```sql
SELECT py_upper(name) FROM users;

SELECT tag FROM users LATERAL VIEW py_split(tags, ',') tmp AS tag;
```

#### Q2：複数列を出力するには？

A：戻り値の型に複数列の STRUCT を定義し、タプルを生成します。

```sql
CREATE TABLES FUNCTION func(...)
RETURNS ARRAY<STRUCT<col1:INT, col2:STRING>>
...

def func(...):
    yield (123, 'hello')  # Corresponds to col1 and col2
```

#### Q3：UDTF から何も出力されないのはなぜですか？

A：考えられる原因：

1. **`yield` が呼び出されていない**：関数が `yield` を呼び出しているか確認してください。
2. **フィルタリング**：すべてのデータが除外されています。
3. **例外が握りつぶされている**：try-except ブロックがエラーを握りつぶしていないか確認してください。
4. **NULL 入力**：入力が NULL で、関数がそのまま戻っています。

#### Q4：UDTF は状態を保持できますか？

A：いいえ。Python UDTF は状態を保持せず、各呼び出しで一行を独立して処理します。行をまたぐ集約や状態の保持には Python UDAF を使ってください。

#### Q5：UDTF の出力行数を制限するには？

A：関数にカウンターまたは条件チェックを追加します。

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

#### Q6：UDTF が生成できるデータ型に制限はありますか？

A：UDTF は基本型（INT、STRING、DOUBLE など）と複合型（ARRAY、STRUCT、MAP など）を含む、Doris のすべてのデータ型をサポートします。出力型は `RETURNS ARRAY<...>` で明示的に定義する必要があります。

#### Q7：UDTF から外部リソースにアクセスできますか？

A：技術的には可能ですが、**強く非推奨**です。UDTF は入力パラメータだけを処理する純粋な関数にしてください。データベース、ファイル、ネットワークなどの外部リソースへのアクセスは、性能上の問題や予測できない動作につながります。

## Python UDF/UDAF/UDTF の環境設定と複数バージョンの管理 {#python-udfudafudtf-environment-configuration-and-multi-version-management}

<!-- Knowledge type: Deployment and configuration -->
<!-- Applicable scenario: Cluster initialization / Coexistence of multiple Python UDF versions -->

### Python 環境の管理

Python UDF/UDAF/UDTF を使用する前に、Doris Backend（BE）ノードで Python 実行環境が正しく設定されていることを確認してください。Doris は **Conda** または **Python 仮想環境（venv）**による環境管理をサポートし、UDF ごとに異なるバージョンの Python インタープリターと依存ライブラリを使用できます。

Doris には、Python 環境を管理する方法が二つあります。

- **Conda モード**：Conda で複数バージョンの環境を管理します。以降の例では Miniforge を使います。Miniconda や Anaconda など、他の Conda ディストリビューションもサポートします。
- **Venv モード**：Python 標準の仮想環境（venv）で複数バージョンの環境を管理します。

### サードパーティライブラリのインストールと使用

Python UDF、UDAF、UDTF はいずれもサードパーティライブラリを使用できます。Doris は分散システムであるため、**すべての BE ノード**に同じライブラリをインストールする必要があります。ノード間で異なると、一部のノードで実行に失敗します。

#### インストール手順

1. **各 BE ノードに依存ライブラリをインストールする**：

    ```bash
    # Install with pip
    pip install numpy pandas requests
    
    # Or install with conda
    conda install numpy pandas requests -y
    ```

2. **関数内でインポートして使用する**：

    ```python
    import numpy as np
    import pandas as pd
    
    # Use them in a UDF/UDAF/UDTF function
    def my_function(x):
        return np.sqrt(x)
    ```

#### 注意事項

- **`pandas` と `pyarrow` は必須の依存ライブラリです**。すべての Python 環境に事前にインストールしてください。欠けていると Python UDF/UDAF/UDTF を実行できません。
- **すべての BE ノード**に同じバージョンの依存ライブラリをインストールしてください。異なると一部のノードで実行に失敗します。
- インストール先は、該当する UDF/UDAF/UDTF が使用する Python 実行環境と一致させる必要があります。
- 仮想環境または Conda 環境で依存ライブラリを管理し、システムの Python 環境との競合を避けてください。

### BE の設定パラメータ

各 BE ノードの `be.conf` に次のパラメータを設定し、設定を反映するために **BE を再起動**してください。

#### 設定パラメータのリファレンス

| パラメータ | 型 | 指定可能な値 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| `enable_python_udf_support` | bool | `true` / `false` | `false` | Python UDF 機能を有効にするかどうか |
| `python_env_mode` | string | `conda` / `venv` | `""` | 複数バージョンの Python 環境の管理モード |
| `python_conda_root_path` | string | ディレクトリパス | `""` | Conda のインストール先のルートディレクトリ。<br/>`python_env_mode = conda` の場合のみ有効 |
| `python_venv_root_path` | string | ディレクトリパス | `${DORIS_HOME}/lib/udf/python` | venv による複数バージョン管理のルートディレクトリ。<br/>`python_env_mode = venv` の場合のみ有効 |
| `python_venv_interpreter_paths` | string | パスの一覧（`:` 区切り） | `""` | 利用可能な Python インタープリターのディレクトリの一覧。<br/>`python_env_mode = venv` の場合のみ有効 |
| `max_python_process_num` | int32 | 整数 | `0` | Python Server のプロセスプール内の最大プロセス数。<br/>`0` の場合、CPU コア数をデフォルトとして使います。別の正の整数で上書きできます |

### 方法 1：Conda で Python 環境を管理する

#### 1. BE を設定する

`be.conf` に次の設定を追加します。

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = conda
python_conda_root_path = /path/to/miniforge3
```

#### 2. 環境の検索規則

Doris は `${python_conda_root_path}/envs/` 以下から、UDF で指定した `runtime_version` に一致する Conda 環境を探します。

**照合規則**：

- `runtime_version` には、`x.x.x` または `x.x.xx` 形式の**完全な Python バージョン番号**（例：`"3.9.18"` や `"3.12.11"`）を指定する必要があります。
- Doris はすべての Conda 環境を調べ、各環境の Python インタープリターの実際のバージョンが `runtime_version` と完全に一致するか確認します。
- 一致する環境が見つからない場合、Doris は `Python environment with version x.x.x not found` エラーを報告します。

**例**：

- UDF で `runtime_version = "3.9.18"` を指定した場合、Doris は Python バージョンが 3.9.18 の環境を探します。
- 環境名は `py39`、`my-env`、`data-science` など任意に設定できます。その環境の Python バージョンが 3.9.18 であれば一致します。
- 完全なバージョン番号が必要です。`"3.9"` や `"3.12"` のようなバージョンの接頭辞は使用できません。

#### 3. ディレクトリ構造の図

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

#### 4. Conda 環境を作成する

:::caution 注意
Doris の Python UDF/UDAF/UDTF 機能には、`pandas` と `pyarrow` が**必須の依存ライブラリ**です。すべての Python 環境に両方を**事前にインストール**してください。欠けていると UDF が正しく動作しません。
:::

次のコマンドを**すべての BE ノード**で実行して、Python 環境を作成します。

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

#### 5. UDF で使用する

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

### 方法 2：Venv で Python 環境を管理する

#### 1. BE を設定する

`be.conf` に次の設定を追加します。

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = venv
python_venv_root_path = /doris/python_envs
python_venv_interpreter_paths = /opt/python3.9/bin/python3.9:/opt/python3.12/bin/python3.12
```

#### 2. 設定パラメータに関する注意事項

- **`python_venv_root_path`**：仮想環境のルートディレクトリです。すべての venv 環境はこのディレクトリ以下に作成されます。
- **`python_venv_interpreter_paths`**：`:` で区切った Python インタープリターへの絶対パスの一覧です。Doris は各インタープリターのバージョンを確認し、UDF で指定された `runtime_version`（`"3.9.18"` などの完全なバージョン番号）と照合します。

#### 3. ディレクトリ構造の図

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

#### 4. Venv 環境を作成する

:::caution 注意
Doris の Python UDF/UDAF/UDTF 機能には、`pandas` と `pyarrow` が**必須の依存ライブラリ**です。すべての Python 環境に両方を**事前にインストール**してください。欠けていると UDF が正しく動作しません。
:::

次のコマンドを**すべての BE ノード**で実行します。

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

#### 5. UDF で使用する

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

### 環境管理のベストプラクティス

#### 1. 適切な管理方法を選ぶ

| シナリオ | 推奨 | 理由 |
| --- | --- | --- |
| Python バージョンを頻繁に切り替える | Conda | 環境の分離が強く、依存ライブラリを簡単に管理できます |
| 既存の Conda 環境がある | Conda | 既存の環境をそのまま再利用できます |
| システムリソースが限られている | Venv | 使用する容量が小さく、起動が速くなります |
| 既存のシステム Python 環境がある | Venv | Conda を別途インストールする必要がありません |

#### 2. 環境の一貫性に関する要件

:::caution 注意
すべての BE ノードの Python 環境は、次の点を含めて**完全に同一**である必要があります。

- Python のバージョンを同じにする必要があります。
- インストール済みの依存パッケージとそのバージョンを同じにする必要があります。
- 環境ディレクトリのパスを同じにする必要があります。
:::

### 注意事項

#### 1. 設定変更を反映する

- `be.conf` を変更した後は、変更を反映するために **BE プロセスを再起動する必要があります**。
- サービスへの影響を避けるため、再起動前に設定が正しいことを確認してください。

#### 2. パスを確認する

設定前にパスが正しいことを確認してください。

```bash
# Conda mode: verify the conda path
ls -la /opt/miniforge3/bin/conda
/opt/miniforge3/bin/conda env list

# Venv mode: verify interpreter paths
/opt/python3.9/bin/python3.9 --version
/opt/python3.12/bin/python3.12 --version
```

#### 3. 権限を設定する

Doris の BE プロセスが Python 環境のディレクトリにアクセスできることを確認してください。

```bash
# Conda mode
chmod -R 755 /opt/miniforge3

# Venv mode
chmod -R 755 /doris/python_envs
chown -R doris:doris /doris/python_envs  # Assume the BE process user is doris
```

#### 4. リソース制限

必要に応じて Python プロセスプールのパラメータを調整してください。

```properties
## Use the CPU core count (recommended, max_python_process_num = 0)
max_python_process_num = 0

## High concurrency: specify the process count manually
max_python_process_num = 128

## Resource-constrained: limit the process count
max_python_process_num = 32
```

### 環境の確認

#### 各 BE ノードの環境を確認する

```bash
# Conda mode
/opt/miniforge3/envs/py39/bin/python --version
/opt/miniforge3/envs/py39/bin/python -c "import pandas; print(pandas.__version__)"

# Venv mode
/doris/python_envs/python3.9.18/bin/python --version
/doris/python_envs/python3.9.18/bin/python -c "import pandas; print(pandas.__version__)"
```

#### すべての BE ノードに共通する Python バージョンを表示する

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

#### 指定バージョンにインストールされている依存パッケージを表示する

`SHOW PYTHON PACKAGES IN '<version>'` を使うと、指定したバージョンのインストール済み依存パッケージを表示できます。BE ノード間で依存パッケージが異なる場合、その差異が一覧表示されます。

```sql
SHOW PYTHON PACKAGES IN '3.9.18'
```

すべての BE ノードで依存パッケージが同じ場合：

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

BE ノード間で依存パッケージが異なる場合：

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

### よくある問題と対処方法

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Errors after Python UDF deployment -->

#### Q1：UDF の呼び出し時に「Python environment not found」と報告される

**原因**：

- `runtime_version` で指定したバージョンがシステムに存在しません。
- 環境のパスが正しく設定されていません。

**対処方法**：

```bash
# Check the Conda environment list
conda env list

# Check whether the venv interpreter exists
ls -la /opt/python3.9/bin/python3.9

# Check the BE configuration
grep python /path/to/be.conf
```

#### Q2：UDF の呼び出し時に「ModuleNotFoundError: No module named 'xxx'」と報告される

**原因**：必要な依存パッケージが Python 環境にインストールされていません。

#### Q3：BE ノードによって結果が異なる

**原因**：BE ノード間で Python 環境または依存パッケージのバージョンが異なります。

**対処方法**：

1. すべてのノードで Python と依存パッケージのバージョンを確認します。
2. すべてのノードで環境が一致していることを確認します。
3. `requirements.txt`（pip）または `environment.yml`（Conda）を使い、環境を統一してデプロイします。一般的な使用例：

- `requirements.txt`（pip）を使う場合：

    ```bash
    # Export dependencies in the development environment
    pip freeze > requirements.txt
    # Install dependencies on a BE node using the target Python
    /path/to/python -m pip install -r requirements.txt
    ```

- `environment.yml`（Conda）を使う場合：

    ```bash
    # Export dependencies
    conda env export --from-history -n py312 -f environment.yml
    # Create the environment on a BE node
    conda env create -f environment.yml -n py312
    # Or update an existing environment
    conda env update -f environment.yml -n py312
    ```

:::caution 注意
- 依存関係ファイルに `pandas` と `pyarrow` が含まれ、すべての BE ノードに同じバージョンがインストールされていることを確認してください。
- インストール時には、Doris の設定と一致する Python インタープリターまたは Conda のパス（`/opt/miniforge3/bin/conda` や指定された venv インタープリターなど）を使用してください。
- 運用担当者がすべての BE ノードに同じファイルを配布できるように、依存関係ファイルをバージョン管理するか共有ストレージに置いてください。
- 詳細：[pip の公式ドキュメント](https://pip.pypa.io/en/stable/cli/pip/)、[Conda の環境エクスポート・インポートガイド](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#exporting-the-environment)。
:::

#### Q4：be.conf の変更が反映されない

**考えられる原因**：BE プロセスが再起動されていません。

### 使用上の制限

1. **性能上の考慮事項**：
    - Python UDF は組み込み関数より性能が低くなります。複雑なロジックでデータ量が少ない場合に使用してください。
    - データ量が多い場合は、ベクトル化モードを優先してください。

2. **型の制限**：
    - HLL や Bitmap などの特殊な型はサポートされません。

3. **環境の分離**：
    - 同じ関数名を異なるデータベースで定義できます。
    - 曖昧さを避けるため、呼び出し時に `db.func()` などのデータベース名を指定してください。

4. **同時実行数の制限**：
    - Python UDF はプロセスプールを通じて実行されます。同時実行数は `max_python_process_num` によって制限されます。
    - 同時実行数が多い場合は、このパラメータを増やしてください。
