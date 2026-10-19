---
{
    "title": "Python UDF, UDAF, UDWF, UDTF",
    "language": "ko",
    "description": "Apache Doris에서 Python으로 UDF, UDAF, UDTF를 작성하는 방법을 설명합니다. 생성, 벡터화, 환경 구성, 일반적인 문제 해결 방법을 다룹니다.",
    "keywords": [
        "Doris Python UDF",
        "Python UDAF",
        "Python UDTF",
        "벡터화 UDF",
        "Pandas UDF",
        "PYTHON_UDF runtime_version",
        "Conda Python 환경",
        "venv Python 환경",
        "Python 환경을 찾을 수 없음"
    ]
}
---

<!-- Knowledge type: Feature overview + Operations guide + Configuration parameters -->
<!-- Applicable scenario: Extending SQL capability in Doris / Implementing custom scalar, aggregate, and table functions in Python -->

:::caution 실험적 기능
Python UDF/UDAF/UDTF는 Apache Doris 4.1.3에서 출시된 실험적 기능입니다.
:::

Python UDF/UDAF/UDTF는 Apache Doris가 제공하는 사용자 정의 함수 확장 메커니즘입니다. Python으로 스칼라 함수, 집계 함수, 테이블 함수를 작성하여 기본 제공 함수로 구현하기 어려운 복잡한 계산 로직을 SQL로 표현하고, 풍부한 Python 생태계를 재사용할 수 있습니다.

이 문서는 일반적인 사용 시나리오를 바탕으로 세 가지 함수 유형 각각의 사용법, 매개변수, 데이터 타입 매핑, 성능 권장 사항, 제한 사항, 여러 버전의 Python 환경 배포 방법을 설명합니다.

## Python UDF/UDAF/UDTF를 선택해야 하는 경우 {#when-to-choose-python-udfudafudtf}

<!-- Knowledge type: Selection decision -->

| 시나리오 | 권장 기능 | 입출력 관계 |
| --- | --- | --- |
| 행별 복잡한 변환, 정제, 마스킹 또는 검증 | Python UDF(스칼라 함수) | 한 행을 입력받아 한 행 출력 |
| GROUP BY 또는 윈도우(OVER 절)에 대한 사용자 정의 집계 지표 | Python UDAF(집계 함수) | 여러 행을 입력받아 한 행 출력 |
| CSV/JSON 파싱이나 시퀀스 생성처럼 한 행을 여러 행으로 확장 | Python UDTF(테이블 함수) | 한 행을 입력받아 출력 행이 없거나 여러 행 출력 |

성능이 중요하다면 C++로 구현된 Doris 기본 제공 함수를 우선 사용하세요. Python UDF는 기본 제공 함수로 요구 사항을 충족할 수 없고 데이터 양이 적당한 시나리오에 적합합니다.

## 공통 사전 요구 사항 {#general-prerequisites}

<!-- Knowledge type: Pre-deployment check -->
<!-- Applicable scenario: First time enabling Python UDF -->

Python UDF/UDAF/UDTF를 생성하기 전에 다음 준비를 완료하세요.

1. **Python UDF 활성화 및 Python 환경 구성**: BE 노드의 `be.conf`에서 관련 매개변수를 활성화하고, Conda 또는 venv를 사용하여 여러 버전의 Python 환경을 구성합니다. 자세한 내용은 [Python UDF/UDAF/UDTF 환경 구성 및 다중 버전 관리](#python-udfudafudtf-environment-configuration-and-multi-version-management)를 참조하세요.
2. **필수 종속성**: 모든 BE 노드의 해당 Python 환경에 **`pandas`**와 **`pyarrow`**를 미리 설치합니다. 이 두 라이브러리는 Doris Python UDF 기능의 필수 종속성이며, 설치되어 있지 않으면 함수를 실행할 수 없습니다.
3. **런타임 로그**: Python UDF Server의 런타임 로그는 `output/be/log/python_udf_output.log`에 있습니다. 이 로그에서 함수 실행 정보와 오류 메시지를 확인하여 디버깅할 수 있습니다.

:::tip 팁
모든 CREATE 문에서 `runtime_version`을 완전한 버전 번호(예: `"3.10.12"`)로 명시해야 합니다. 메이저 및 마이너 버전만 지정하면(예: `"3.10"`) 함수 호출이 실패합니다.
:::

## Python UDF(스칼라 함수) {#python-udf-scalar-function}

<!-- Knowledge type: Operations guide -->

Python UDF(User Defined Function)는 데이터를 행별로 처리합니다. 각 행마다 함수를 한 번 호출하고 단일 결과를 반환합니다. 다음 두 가지 실행 모드를 지원합니다.

- **스칼라 모드**: 데이터를 행별로 처리합니다. 간단한 변환과 계산에 적합합니다.
- **벡터화 모드**: Pandas를 사용하여 데이터를 배치 단위로 처리하므로 높은 계산 성능을 제공합니다.

### Python UDF 생성 {#creating-a-python-udf}

Python UDF는 **인라인 모드**와 **모듈 모드**의 두 가지 생성 방식을 지원합니다.

:::caution 주의
`file` 매개변수와 `AS $$` 인라인 Python 코드를 모두 지정하면 Doris는 **인라인 Python 코드를 우선 사용**하고 인라인 모드로 함수를 실행합니다.
:::

#### 인라인 모드 {#inline-mode}

인라인 모드에서는 SQL에 Python 코드를 직접 작성할 수 있습니다. 간단한 로직에 적합합니다.

**구문**:

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

**예제 1: 정수 덧셈**

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

**예제 2: 문자열 연결(NULL 처리 포함)**

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

#### 모듈 모드 {#module-mode}

모듈 모드는 복잡한 로직에 적합합니다. Python 코드를 `.zip` 압축 파일로 패키징하고 함수를 생성할 때 `file` 매개변수에서 참조합니다.

**1단계: Python 모듈 작성**

`python_udf_scalar_ops.py`라는 파일을 생성합니다.

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

**2단계: Python 모듈 패키징**

파일이 하나뿐이더라도 Python 파일을 **반드시** `.zip` 형식으로 패키징해야 합니다.

```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py
```

Python 파일이 여러 개인 경우:

```bash
zip python_udf_scalar_ops.zip python_udf_scalar_ops.py utils.py helper.py ...
```

**3단계: `.zip` 패키지 경로 설정**

`.zip` 패키지 경로를 `file` 매개변수로 지정합니다. 다음 두 가지 방식을 지원합니다.

| 배포 방식 | 형식 | 적용 시나리오 |
| --- | --- | --- |
| 로컬 파일 시스템 | `"file" = "file:///path/to/python_udf_scalar_ops.zip"` | `.zip` 패키지가 BE 노드의 로컬 파일 시스템에 저장되어 있는 경우 |
| HTTP/HTTPS 원격 다운로드 | `"file" = "http://example.com/udf/xx.zip"` 또는 `"file" = "https://s3.amazonaws.com/bucket/xx.zip"` | 객체 스토리지(S3, OSS, COS 등) 또는 HTTP 서버에서 `.zip` 패키지를 다운로드합니다. Doris가 자동으로 다운로드하여 로컬에 캐시합니다 |

:::caution 주의
- 원격 다운로드를 사용할 때는 모든 BE 노드에서 해당 URL에 접근할 수 있는지 확인하세요.
- 최초 호출 시 파일을 다운로드하므로 지연이 발생할 수 있습니다.
- 파일이 캐시되므로 이후 호출에서는 다시 다운로드하지 않습니다.
:::

**4단계: `symbol` 매개변수 설정**

모듈 모드에서 `symbol`은 ZIP 패키지 내 대상 함수의 위치를 지정합니다. 형식은 다음과 같습니다.

```
[package_name.]module_name.func_name
```

매개변수 설명:

- `package_name`(선택 사항): ZIP 패키지 내 최상위 Python 패키지의 이름입니다. 함수가 패키지의 루트 모듈에 있거나 ZIP 패키지에 패키지가 없으면 생략합니다.
- `module_name`(필수): 대상 함수가 포함된 Python 모듈 파일 이름입니다(`.py` 접미사 제외).
- `func_name`(필수): 사용자 정의 함수 이름입니다.

해석 규칙:

- Doris는 `symbol` 문자열을 `.`으로 분리합니다.
    - 결과가 **두 개**의 부분 문자열이면 각각 `module_name`과 `func_name`입니다.
    - 결과가 **세 개 이상**의 부분 문자열이면 첫 번째는 `package_name`, 중간은 `module_name`, 마지막은 `func_name`입니다.
- `module_name` 부분은 `importlib`를 통한 동적 임포트의 모듈 경로로 사용됩니다.
- `package_name`을 지정하면 전체 경로가 유효한 Python 임포트 경로여야 하며, ZIP 패키지 구조가 해당 경로와 일치해야 합니다.

:::caution 경고
네임스페이스는 고유해야 합니다. 모듈 이름 가림으로 인한 종속성 충돌과 런타임 예외를 방지하려면 Python 표준 라이브러리나 자주 사용하는 서드파티 라이브러리와 충돌하는 이름을 피하세요.
:::

**예제 A: 패키지 구조 없음(두 부분)**

```
ZIP structure:
math_ops.py

symbol = "math_ops.add"
```

이는 `add` 함수가 ZIP 패키지 루트의 `math_ops.py`에 정의되어 있음을 나타냅니다.

**예제 B: 패키지 구조 있음(세 부분)**

```
ZIP structure:
mylib/
├── __init__.py
└── string_helper.py

symbol = "mylib.string_helper.split_text"
```

이는 `split_text` 함수가 `mylib/string_helper.py`에 정의되어 있음을 나타내며, 각 부분은 다음과 같습니다.

- `package_name` = `mylib`
- `module_name` = `string_helper`
- `func_name` = `split_text`

**예제 C: 중첩 패키지 구조(네 부분)**

```
ZIP structure:
mylib/
├── __init__.py
└── utils/
    ├── __init__.py
    └── string_helper.py

symbol = "mylib.utils.string_helper.split_text"
```

이는 `split_text` 함수가 `mylib/utils/string_helper.py`에 정의되어 있음을 나타내며, 각 부분은 다음과 같습니다.

- `package_name` = `mylib`
- `module_name` = `utils.string_helper`
- `func_name` = `split_text`

> **참고**:
> - `symbol` 형식이 유효하지 않으면(예: 함수 이름 누락, 빈 모듈 이름 또는 빈 경로 구성 요소) 함수 호출 시 Doris가 오류를 보고합니다.
> - ZIP 패키지 내 디렉터리 구조는 `symbol`로 지정한 경로와 일치해야 합니다.
> - 각 패키지 디렉터리에 `__init__.py` 파일이 있어야 합니다. 이 파일은 비어 있어도 됩니다.

**5단계: UDF 생성**

예제 1: 로컬 파일 사용(패키지 구조 없음)

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

예제 2: HTTP/HTTPS 원격 파일 사용

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

예제 3: 패키지 구조 사용

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

**6단계: 함수 사용**

```sql
SELECT py_add_three(10, 20, 30) AS sum_result; -- Result: 60
SELECT py_reverse('hello') AS reversed;        -- Result: olleh
SELECT py_is_prime(17) AS is_prime;            -- Result: true
```

### Python UDF 삭제 {#dropping-a-python-udf}

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_type1, parameter_type2, ...);

-- Example
DROP FUNCTION IF EXISTS py_add_three(INT, INT, INT);
DROP FUNCTION IF EXISTS py_reverse(STRING);
DROP FUNCTION IF EXISTS py_is_prime(INT);
```

### 매개변수 참조 {#parameter-reference}

#### CREATE FUNCTION 매개변수 {#create-function-parameters}

| 매개변수 | 필수 여부 | 설명 |
| --- | --- | --- |
| `function_name` | 예 | 함수 이름. 식별자 명명 규칙을 따라야 합니다 |
| `parameter_type` | 예 | 매개변수 타입 목록. 다양한 Doris 데이터 타입을 지원합니다 |
| `return_type` | 예 | 반환값 타입 |

#### PROPERTIES 매개변수 {#properties-parameters}

| 매개변수 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `type` | 예 | - | 고정값 `"PYTHON_UDF"` |
| `symbol` | 예 | - | Python 함수 진입점 이름.<br/>• **인라인 모드**: 함수 이름을 직접 작성합니다. 예: `"evaluate"`<br/>• **모듈 모드**: 형식은 `[package_name.]module_name.func_name`입니다. 자세한 내용은 모듈 모드 설명을 참조하세요 |
| `file` | 아니요 | - | Python `.zip` 패키지 경로. 모듈 모드에서만 필수입니다. 세 가지 프로토콜을 지원합니다.<br/>• `file://`: 로컬 파일 시스템 경로<br/>• `http://`: HTTP 원격 다운로드<br/>• `https://`: HTTPS 원격 다운로드 |
| `runtime_version` | 예 | - | Python 런타임 버전. 예: `"3.10.12"`. 완전한 버전 번호가 필요합니다 |
| `always_nullable` | 아니요 | `true` | 함수가 항상 NULL을 허용하는 결과를 반환하는지 여부 |
| `volatility` | 아니요 | `volatile` | 함수의 변동성. 4.1.2부터 지원합니다. 유효한 값은 `immutable`, `stable`, `volatile`입니다.<br/>`immutable`: 동일한 입력은 항상 동일한 출력을 생성합니다. 대부분의 결정적 UDF는 실행 계획 최적화를 개선하기 위해 이 값을 사용하는 것이 좋습니다.<br/>`stable`: 하나의 SQL 문 내에서는 결과가 일정하지만 문 사이에서는 바뀔 수 있습니다. `now()`와 유사합니다. SQL 캐시와 구체화된 뷰 재작성이 비활성화됩니다.<br/>`volatile`: 호출할 때마다 결과가 바뀔 수 있습니다. `random()`과 유사합니다. SQL 캐시, 구체화된 뷰 재작성 및 다수의 옵티마이저 재작성 규칙이 비활성화됩니다. |

#### 런타임 버전 참고 사항 {#runtime-version-notes}

- Python 3.x를 지원합니다.
- 완전한 버전 번호(예: `"3.10.12"`)를 지정해야 합니다. 메이저 및 마이너 버전만 지정하는 것(예: `"3.10"`)은 허용되지 않습니다.
- `runtime_version`을 지정하지 않으면 함수 호출이 실패합니다.

### 데이터 타입 매핑 {#data-type-mapping}

<!-- Knowledge type: Reference -->

다음 테이블은 Doris 데이터 타입과 Python 타입 간의 매핑을 보여줍니다.

| 타입 범주 | Doris 타입 | Python 타입 | 설명 |
| --- | --- | --- | --- |
| NULL 타입 | `NULL` | `None` | NULL 값 |
| 불리언 타입 | `BOOLEAN` | `bool` | 불리언 값 |
| 정수 타입 | `TINYINT` | `int` | 8비트 정수 |
|  | `SMALLINT` | `int` | 16비트 정수 |
|  | `INT` | `int` | 32비트 정수 |
|  | `BIGINT` | `int` | 64비트 정수 |
|  | `LARGEINT` | `int` | 128비트 정수 |
| 부동소수점 타입 | `FLOAT` | `float` | 32비트 부동소수점 |
|  | `DOUBLE` | `float` | 64비트 부동소수점 |
|  | `TIME` / `TIMEV2` | `float` | 시간 타입(부동소수점으로 표현) |
| 문자열 타입 | `CHAR` | `str` | 고정 길이 문자열 |
|  | `VARCHAR` | `str` | 가변 길이 문자열 |
|  | `STRING` | `str` | 문자열 |
|  | `JSONB` | `str` | JSON 바이너리 형식(문자열로 변환) |
|  | `VARIANT` | `str` | Variant 타입(문자열로 변환) |
|  | `DATE` | `str` | `'YYYY-MM-DD'` 형식의 날짜 문자열 |
|  | `DATETIME` | `str` | `'YYYY-MM-DD HH:MM:SS'` 형식의 날짜/시간 문자열 |
| 날짜/시간 타입 | `DATEV2` | `datetime.date` | 날짜 객체 |
|  | `DATETIMEV2` | `datetime.datetime` | 날짜/시간 객체 |
|  | `TIMESTAMPTZ` | `datetime.datetime` | 시간대가 포함된 날짜/시간 객체 |
| 십진수 타입 | `DECIMAL` / `DECIMALV2` | `decimal.Decimal` | 고정밀 십진수 |
|  | `DECIMAL32` | `decimal.Decimal` | 32비트 고정소수점 |
|  | `DECIMAL64` | `decimal.Decimal` | 64비트 고정소수점 |
|  | `DECIMAL128` | `decimal.Decimal` | 128비트 고정소수점 |
|  | `DECIMAL256` | `decimal.Decimal` | 256비트 고정소수점 |
| IP 타입 | `IPV4` | `ipaddress.IPv4Address` | IPv4 주소 |
|  | `IPV6` | `ipaddress.IPv6Address` | IPv6 주소 |
| 바이너리 타입 | `BITMAP` | `bytes` | Bitmap 데이터(아직 지원하지 않음) |
|  | `HLL` | `bytes` | HyperLogLog 데이터(아직 지원하지 않음) |
|  | `QUANTILE_STATE` | `bytes` | 분위수 상태 데이터(아직 지원하지 않음) |
| 복합 데이터 타입 | `ARRAY<T>` | `list` | 요소 타입이 T인 배열 |
|  | `MAP<K,V>` | `dict` | 키 타입이 K이고 값 타입이 V인 딕셔너리 |
|  | `STRUCT<f1:T1, f2:T2, ...>` | `dict` | 필드 이름을 키로, 필드 값을 값으로 사용하는 구조체 |

#### NULL 처리 {#null-handling}

- Doris의 `NULL` 값은 Python의 `None`에 매핑됩니다.
- 함수 인수가 `NULL`이면 Python 함수는 `None`을 받습니다.
- Python 함수가 `None`을 반환하면 Doris는 이를 `NULL`로 처리합니다.
- 런타임 오류를 방지하려면 함수에서 `None` 값을 명시적으로 처리하세요.

예제:

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

### 벡터화 모드 {#vectorized-mode}

<!-- Applicable scenario: Large-batch data computation / Performance optimization -->

벡터화 모드는 Pandas를 사용하여 데이터를 배치 단위로 처리하며 스칼라 모드보다 성능이 뛰어납니다. 벡터화 모드에서 함수 인수는 `pandas.Series` 객체이며, 반환값도 `pandas.Series`여야 합니다.

:::caution 주의
시스템이 벡터화 모드로 인식할 수 있도록 함수 시그니처에 타입 어노테이션(예: `a: pd.Series`)을 사용하고 함수 내에서 배치 데이터 구조를 직접 처리하세요. 벡터화 타입을 명시하지 않으면 시스템은 스칼라 모드로 실행합니다.

함수 시그니처에 `pd.Series` 타입과 일반 타입이 혼합되어 있으면 시스템은 일반 타입 매개변수에 해당하는 입력 열을 상수 열로 처리합니다. 즉, 배치 전체에 동일한 값을 재사용하므로 예상과 다른 결과가 나올 수 있습니다. 벡터화 모드에서는 매개변수 스타일을 일관되게 유지하세요. 모든 매개변수에 `pandas.Series` 타입 어노테이션을 사용하거나, 모든 매개변수에 일반 타입을 사용해야 합니다(스칼라 모드).
:::

```python
## Vectorized mode
def add(a: pd.Series, b: pd.Series) -> pd.Series:
    return a + b + 1

## Scalar mode
def add(a, b):
    return a + b + 1
```

#### 기본 예제 {#basic-examples}

**예제 1: 벡터화 정수 덧셈**

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

**예제 2: 벡터화 문자열 처리**

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

**예제 3: 벡터화 수학 연산**

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

**예제 4: 함수 시그니처의 혼합 매개변수 타입(`pd.Series`와 일반 타입을 함께 사용)**

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

#### 벡터화 모드의 장점 {#advantages-of-vectorized-mode}

1. **성능 최적화**: 데이터를 배치 단위로 처리하여 Python과 Doris 간 상호 작용 횟수를 줄입니다.
2. **Pandas/NumPy 활용**: 벡터화 연산을 최대한 활용합니다.
3. **간결한 코드**: Pandas API를 사용하여 복잡한 로직을 더 간결하게 표현합니다.

#### 벡터화 함수 사용 {#using-vectorized-functions}

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

### 복합 데이터 타입 처리 {#handling-complex-data-types}

#### ARRAY 타입 {#array-type}

**예제: 배열 요소의 합계 계산**

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

**예제: 배열 필터링**

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

#### MAP 타입 {#map-type}

**예제: MAP의 키 개수 가져오기**

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

**예제: MAP에서 값 가져오기**

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

#### STRUCT 타입 {#struct-type}

**예제: STRUCT 필드 접근**

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

### 실무 시나리오 {#real-world-scenarios}

<!-- Knowledge type: Scenario examples -->

#### 시나리오 1: 데이터 마스킹 {#scenario-1-data-masking}

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

#### 시나리오 2: 문자열 유사도 계산 {#scenario-2-string-similarity-calculation}

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

#### 시나리오 3: 날짜 계산 {#scenario-3-date-calculation}

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

#### 시나리오 4: 신분증 번호 검증 {#scenario-4-id-card-number-validation}

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

### 성능 권장 사항 {#performance-recommendations}

#### 1. 벡터화 모드 우선 사용 {#1-prefer-vectorized-mode}

벡터화 모드는 스칼라 모드보다 성능이 훨씬 뛰어납니다.

```python
# Scalar mode: row-by-row processing
def scalar_process(x):
    return x * 2

# Vectorized mode: batch processing
import pandas as pd
def vector_process(x: pd.Series) -> pd.Series:
    return x * 2
```

#### 2. 복잡한 로직에는 모듈 모드 사용 {#2-use-module-mode-for-complex-logic}

유지보수와 재사용이 쉽도록 복잡한 함수 로직을 독립된 Python 파일에 작성하세요.

#### 3. 함수 내 I/O 작업 피하기 {#3-avoid-io-operations-inside-functions}

UDF에서 파일 I/O, 네트워크 요청 및 기타 I/O 작업을 피하세요. 이러한 작업은 성능에 큰 영향을 줍니다.

### 제한 사항 및 참고 사항 {#limitations-and-notes}

#### 1. Python 버전 지원 {#1-python-version-support}

- Python 3.x만 지원합니다.
- Python 3.10 이상을 권장합니다.
- Doris 클러스터에 해당 Python 런타임이 설치되어 있는지 확인하세요.

#### 2. 종속 라이브러리 {#2-dependency-libraries}

- Python 표준 라이브러리는 별도 설정 없이 지원합니다.
- 서드파티 라이브러리를 사용하려면 클러스터 환경에 미리 설치하세요.

#### 3. 성능 고려 사항 {#3-performance-considerations}

- Python UDF는 C++로 구현된 Doris 기본 제공 함수보다 성능이 낮습니다.
- 성능에 민감한 시나리오에서는 Doris 기본 제공 함수를 우선 사용하세요.
- 데이터 양이 많으면 벡터화 모드를 사용하세요.

#### 4. 보안 {#4-security}

- UDF 코드는 Doris 프로세스 내에서 실행되므로 안전하고 신뢰할 수 있어야 합니다.
- UDF에서 시스템 명령이나 파일 삭제와 같은 위험한 작업을 피하세요.
- 프로덕션 환경에서는 UDF 코드를 검토하세요.

#### 5. 리소스 제한 {#5-resource-limits}

- UDF 실행은 BE 노드의 CPU와 메모리 리소스를 사용합니다.
- UDF를 과도하게 사용하면 전체 클러스터 성능에 영향을 줄 수 있습니다.
- UDF의 리소스 사용량을 모니터링하세요.

### 자주 묻는 질문 {#frequently-asked-questions}

<!-- Knowledge type: FAQ -->

#### Q1: Python UDF에서 서드파티 라이브러리를 사용하려면 어떻게 해야 하나요? {#q1-how-do-i-use-a-third-party-library-in-a-python-udf}

답변: 모든 BE 노드에 해당 Python 라이브러리를 설치하세요. 예를 들면 다음과 같습니다.

```bash
pip3 install numpy pandas
conda install numpy pandas
```

#### Q2: Python UDF는 재귀 함수를 지원하나요? {#q2-does-python-udf-support-recursive-functions}

답변: 지원합니다. 다만 스택 오버플로를 방지하도록 재귀 깊이에 주의하세요.

#### Q3: Python UDF를 디버깅하려면 어떻게 해야 하나요? {#q3-how-do-i-debug-a-python-udf}

답변: 먼저 로컬 Python 환경에서 함수 로직을 디버깅하여 올바르게 동작하는지 확인한 후 UDF를 생성하세요. 오류 정보는 BE 로그에서 확인할 수 있습니다.

#### Q4: Python UDF는 전역 변수를 지원하나요? {#q4-does-python-udf-support-global-variables}

답변: 지원하지만 권장하지 않습니다. 분산 환경에서는 전역 변수의 동작이 예상과 다를 수 있습니다.

#### Q5: 기존 Python UDF를 업데이트하려면 어떻게 해야 하나요? {#q5-how-do-i-update-an-existing-python-udf}

답변: 기존 UDF를 먼저 삭제한 후 새로 생성하세요.

```sql
DROP FUNCTION IF EXISTS function_name(parameter_types);
CREATE FUNCTION function_name(...) ...;
```

#### Q6: Python UDF에서 외부 리소스에 접근할 수 있나요? {#q6-can-a-python-udf-access-external-resources}

답변: 기술적으로는 가능하지만 **사용하지 않을 것을 강력히 권장합니다**. Python UDF 내에서 네트워크 라이브러리(예: `requests`)를 사용하여 외부 API나 데이터베이스에 접근할 수 있지만, 성능과 안정성에 큰 영향을 줍니다. 이유는 다음과 같습니다.

- 네트워크 지연으로 쿼리가 느려집니다.
- 외부 서비스를 사용할 수 없으면 UDF가 실패합니다.
- 동시 요청이 많으면 외부 서비스에 부하를 줄 수 있습니다.
- 타임아웃과 오류 처리를 제어하기 어렵습니다.

## Python UDAF(집계 함수) {#python-udaf-aggregate-function}

<!-- Knowledge type: Operations guide -->

Python UDAF(User Defined Aggregate Function)를 사용하면 그룹별 집계와 윈도우 연산을 위한 사용자 정의 집계 함수를 정의할 수 있습니다. Python UDAF로 통계 분석, 데이터 수집, 사용자 정의 지표 계산과 같은 복잡한 집계 로직을 유연하게 구현할 수 있습니다.

Python UDAF의 주요 특징:

- **분산 집계**: 분산 환경의 집계를 지원하며 데이터 분할, 병합, 최종 계산을 자동으로 처리합니다.
- **상태 관리**: 클래스 인스턴스를 통해 집계 상태를 유지하며 복잡한 상태 객체를 지원합니다.
- **윈도우 함수 지원**: 윈도우 함수(OVER 절)와 함께 사용하여 이동 집계, 순위 계산 및 기타 고급 기능을 구현할 수 있습니다.
- **높은 유연성**: 기본 제공 집계 함수의 제약 없이 원하는 복잡도의 집계 로직을 구현할 수 있습니다.

### UDAF 기본 개념 {#udaf-basic-concepts}

#### 집계 함수의 수명 주기 {#aggregate-function-lifecycle}

Python UDAF는 클래스로 구현합니다. 집계 함수의 실행은 다음 단계로 이루어집니다.

1. **초기화(`__init__`)**: 집계 상태 객체를 생성하고 상태 변수를 초기화합니다.
2. **누적(`accumulate`)**: 단일 행을 처리하고 집계 상태를 업데이트합니다.
3. **병합(`merge`)**: 여러 파티션의 집계 상태를 병합합니다(분산 시나리오).
4. **완료(`finish`)**: 최종 집계 결과를 계산하여 반환합니다.

#### 필수 클래스 메서드 및 속성 {#required-class-methods-and-attributes}

완전한 Python UDAF 클래스는 다음 항목을 구현해야 합니다.

| 메서드/속성 | 설명 | 필수 여부 |
| --- | --- | --- |
| `__init__(self)` | 집계 상태를 초기화합니다 | 예 |
| `accumulate(self, *args)` | 단일 행의 데이터를 누적합니다 | 예 |
| `merge(self, other_state)` | 다른 파티션의 상태를 병합합니다 | 예 |
| `finish(self)` | 최종 집계 결과를 반환합니다 | 예 |
| `aggregate_state`(속성) | 직렬화 가능한 집계 상태를 반환합니다. **pickle 직렬화를 지원해야 합니다** | 예 |

### 기본 구문 {#basic-syntax}

#### Python UDAF 생성 {#creating-a-python-udaf}

Python UDAF는 **인라인 모드**와 **모듈 모드**의 두 가지 생성 방식을 지원합니다.

:::tip 참고
`file` 매개변수와 `AS $$` 인라인 Python 코드를 모두 지정하면 Doris는 **인라인 Python 코드를 우선 사용**하고 인라인 모드로 Python UDAF를 실행합니다.
:::

##### 인라인 모드 {#inline-mode-1}

인라인 모드에서는 SQL에 Python 클래스를 직접 작성할 수 있습니다. 간단한 집계 로직에 적합합니다.

**구문**:

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

**예제 1: 합계 집계**

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

**예제 2: 평균 집계**

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

##### 모듈 모드 {#module-mode-1}

모듈 모드는 복잡한 집계 로직에 적합합니다. Python 코드를 `.zip` 압축 파일로 패키징하고 함수를 생성할 때 참조합니다.

**1단계: Python 모듈 작성**

`stats_udaf.py`라는 파일을 생성합니다.

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

**2단계: Python 모듈 패키징**

파일이 하나뿐이더라도 Python 파일을 **반드시** `.zip` 형식으로 패키징해야 합니다.

```bash
zip stats_udaf.zip stats_udaf.py
```

**3단계: `.zip` 패키지 경로 설정**

`.zip` 패키지 경로를 `file` 매개변수로 지정합니다.

| 배포 방식 | 형식 |
| --- | --- |
| 로컬 파일 시스템(`file://` 프로토콜) | `"file" = "file:///path/to/stats_udaf.zip"` |
| HTTP/HTTPS 원격 다운로드(`http://` 또는 `https://` 프로토콜) | `"file" = "http://example.com/udaf/stats_udaf.zip"`<br/>`"file" = "https://s3.amazonaws.com/bucket/stats_udaf.zip"` |

> **참고**:
> - 원격 다운로드를 사용할 때는 모든 BE 노드에서 해당 URL에 접근할 수 있는지 확인하세요.
> - 최초 호출 시 파일을 다운로드하므로 지연이 발생할 수 있습니다.
> - 파일이 캐시되므로 이후 호출에서는 다시 다운로드하지 않습니다.

**4단계: `symbol` 매개변수 설정**

모듈 모드에서 `symbol`은 ZIP 패키지 내 클래스의 위치를 지정합니다. 형식은 다음과 같습니다.

```
[package_name.]module_name.ClassName
```

매개변수 설명:

- `package_name`(선택 사항): ZIP 패키지 내 최상위 Python 패키지의 이름입니다.
- `module_name`(필수): 대상 클래스가 포함된 Python 모듈 파일 이름입니다(`.py` 접미사 제외).
- `ClassName`(필수): UDAF 클래스 이름입니다.

해석 규칙:

- Doris는 `symbol` 문자열을 `.`으로 분리합니다.
    - 결과가 **두 개**의 부분 문자열이면 각각 `module_name`과 `ClassName`입니다.
    - 결과가 **세 개 이상**의 부분 문자열이면 첫 번째는 `package_name`, 중간은 `module_name`, 마지막은 `ClassName`입니다.

:::caution 경고
네임스페이스는 고유해야 합니다. 모듈 이름 가림으로 인한 종속성 충돌과 런타임 예외를 방지하려면 Python 표준 라이브러리나 자주 사용하는 서드파티 라이브러리와 충돌하는 이름을 피하세요.
:::

**5단계: UDAF 생성**

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

**6단계: 함수 사용**

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

#### Python UDAF 삭제 {#dropping-a-python-udaf}

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Example
DROP FUNCTION IF EXISTS py_sum(INT);
DROP FUNCTION IF EXISTS py_avg(DOUBLE);
DROP FUNCTION IF EXISTS py_variance(DOUBLE);
```

### 매개변수 참조 {#parameter-reference-1}

#### CREATE AGGREGATE FUNCTION 매개변수 {#create-aggregate-function-parameters}

| 매개변수 | 설명 |
| --- | --- |
| `function_name` | 함수 이름. SQL 식별자 명명 규칙을 따릅니다 |
| `parameter_types` | 매개변수 타입 목록. 예: `INT`, `DOUBLE`, `STRING` |
| `RETURNS return_type` | 반환값 타입 |

#### PROPERTIES 매개변수 {#properties-parameters-1}

| 매개변수 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `type` | 예 | - | 고정값 `"PYTHON_UDF"` |
| `symbol` | 예 | - | Python 클래스 이름.<br/>• **인라인 모드**: 클래스 이름을 직접 작성합니다. 예: `"SumUDAF"`<br/>• **모듈 모드**: 형식은 `[package_name.]module_name.ClassName`입니다 |
| `file` | 아니요 | - | Python `.zip` 패키지 경로. 모듈 모드에서만 필수입니다. 세 가지 프로토콜을 지원합니다.<br/>• `file://`: 로컬 파일 시스템 경로<br/>• `http://`: HTTP 원격 다운로드<br/>• `https://`: HTTPS 원격 다운로드 |
| `runtime_version` | 예 | - | Python 런타임 버전. 예: `"3.10.12"` |
| `always_nullable` | 아니요 | `true` | 함수가 항상 NULL을 허용하는 결과를 반환하는지 여부 |
| `volatility` | 아니요 | `immutable` | 함수의 변동성. 4.1.2부터 지원합니다. 유효한 값은 `immutable`, `stable`, `volatile`입니다.<br/>`immutable`: 동일한 입력은 항상 동일한 출력을 생성합니다. 대부분의 결정적 UDF는 실행 계획 최적화를 개선하기 위해 이 값을 사용하는 것이 좋습니다.<br/>`stable`: 하나의 SQL 문 내에서는 결과가 일정하지만 문 사이에서는 바뀔 수 있습니다. `now()`와 유사합니다. SQL 캐시와 구체화된 뷰 재작성이 비활성화됩니다.<br/>`volatile`: 호출할 때마다 결과가 바뀔 수 있습니다. `random()`과 유사합니다. SQL 캐시, 구체화된 뷰 재작성 및 다수의 옵티마이저 재작성 규칙이 비활성화됩니다. |

#### runtime_version 참고 사항 {#runtime_version-notes}

- Python 버전은 `x.x.x` 또는 `x.x.xx` 형식의 **완전한 버전 번호**로 지정해야 합니다.
- Doris는 구성된 Python 환경에서 이 버전과 일치하는 인터프리터를 찾습니다.

### 윈도우 함수 {#window-functions}

Python UDAF를 윈도우 함수(OVER 절)와 함께 사용할 수 있습니다.

> Python UDAF를 윈도우 함수(OVER 절)에서 사용하면 Doris는 각 윈도우 프레임 계산 후 UDAF의 `reset` 메서드를 호출합니다. 클래스에 이 메서드를 구현하여 집계 상태를 초기값으로 재설정하세요.

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

### 데이터 타입 매핑 {#data-type-mapping-1}

Python UDAF는 Python UDF와 동일한 데이터 타입 매핑 규칙을 사용하며, 모든 정수, 부동소수점, 문자열, 날짜/시간, 십진수 및 불리언 타입을 포함합니다.

**자세한 타입 매핑은 다음을 참조하세요**: [데이터 타입 매핑](#data-type-mapping).

#### NULL 처리 {#null-handling-1}

- Doris는 SQL의 `NULL` 값을 Python의 `None`에 매핑합니다.
- `accumulate` 메서드에서 매개변수가 `None`인지 확인하세요.
- 집계 함수는 `None`을 반환하여 결과가 `NULL`임을 나타낼 수 있습니다.

### 실무 시나리오 {#real-world-scenarios-1}

#### 시나리오 1: 백분위수 계산 {#scenario-1-compute-percentiles}

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

#### 시나리오 2: 중복을 제거한 문자열 수집 {#scenario-2-deduplicated-string-collection}

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

#### 시나리오 3: 이동 평균 {#scenario-3-moving-average}

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

### 성능 권장 사항 {#performance-recommendations-1}

#### 1. 상태 객체 크기 최적화 {#1-optimize-the-size-of-the-state-object}

- 상태 객체에 대량의 원시 데이터를 저장하지 마세요.
- 가능하면 전체 데이터 목록 대신 집계된 통계값을 사용하세요.
- 중앙값 계산처럼 데이터를 저장해야 하는 시나리오에서는 샘플링하거나 데이터 양을 제한하는 방법을 고려하세요.

**권장하지 않는 방식**:

```python
class BadMedianUDAF:
    def __init__(self):
        self.all_values = []  # Can be very large
    
    def accumulate(self, value):
        if value is not None:
            self.all_values.append(value)
```

#### 2. 객체 생성 줄이기 {#2-reduce-object-creation}

- 상태 객체를 재사용하고 새 객체를 자주 생성하지 마세요.
- 복잡한 객체 대신 기본 데이터 타입을 사용하세요.

#### 3. 병합 로직 단순화 {#3-simplify-merge-logic}

- `merge` 메서드는 분산 환경에서 자주 호출됩니다.
- 병합 연산이 효율적이고 정확하게 동작하도록 구현하세요.

#### 4. 증분 계산 사용 {#4-use-incremental-computation}

- 평균과 같이 증분 계산이 가능한 지표는 모든 데이터를 저장하는 대신 증분 계산을 사용하세요.

#### 5. 외부 리소스 사용 피하기 {#5-avoid-using-external-resources}

- UDAF에서 데이터베이스나 외부 API에 접근하지 마세요.
- 모든 계산은 입력 데이터와 내부 상태를 기반으로 수행해야 합니다.

### 제한 사항 및 참고 사항 {#limitations-and-notes-1}

#### 1. 성능 고려 사항 {#1-performance-considerations}

- Python UDAF는 기본 제공 집계 함수보다 성능이 낮습니다.
- 로직이 복잡하고 데이터 양이 적당한 시나리오에 사용하세요.
- 데이터 양이 많으면 기본 제공 함수를 우선 사용하거나 UDAF 구현을 최적화하세요.

#### 2. 상태 직렬화 {#2-state-serialization}

- `aggregate_state`가 반환하는 객체는 **pickle 직렬화를 지원해야 합니다**.
- 지원하는 타입: 기본 타입(int, float, str, bool), 리스트, 딕셔너리, 튜플, 집합, pickle 직렬화를 지원하는 사용자 정의 클래스 인스턴스.
- 지원하지 않는 타입: 파일 핸들, 데이터베이스 연결, 소켓 연결, 스레드 잠금 및 pickle로 직렬화할 수 없는 기타 객체.
- 상태 객체를 pickle로 직렬화할 수 없으면 함수 실행 시 실패합니다.
- 호환성과 유지보수성을 위해 상태 객체에 **기본 제공 타입**(dict, list, tuple)을 우선 사용하세요.

#### 3. 메모리 제한 {#3-memory-limits}

- 상태 객체는 메모리를 사용합니다. 너무 많은 데이터를 저장하지 마세요.
- 큰 상태 객체는 성능과 안정성에 영향을 줍니다.

#### 4. 함수 명명 {#4-function-naming}

- 서로 다른 데이터베이스에 동일한 함수 이름을 정의할 수 있습니다.
- 모호함을 피하려면 호출 시 데이터베이스 이름을 지정하세요(예: `db.func()`).

#### 5. 환경 일관성 {#5-environment-consistency}

- 모든 BE 노드의 Python 환경이 일관되어야 합니다.
- Python 버전, 종속 패키지 버전 및 환경 구성이 모두 포함됩니다.

### 자주 묻는 질문 {#frequently-asked-questions-1}

<!-- Knowledge type: FAQ -->

#### Q1: UDAF와 UDF의 차이점은 무엇인가요? {#q1-what-is-the-difference-between-udaf-and-udf}

답변: **UDF**는 단일 행을 처리하고 단일 결과를 반환하며, 행마다 함수를 한 번 호출합니다. **UDAF**는 여러 행을 처리하고 하나의 집계 결과를 반환하며, GROUP BY와 함께 사용합니다.

```sql
-- UDF: invoked for each row
SELECT id, py_upper(name) FROM users;

-- UDAF: invoked once per group
SELECT category, py_sum(amount) FROM sales GROUP BY category;
```

#### Q2: `aggregate_state` 속성은 어떤 역할을 하나요? {#q2-what-does-the-aggregate_state-attribute-do}

답변: `aggregate_state`는 분산 환경에서 집계 상태를 직렬화하고 전송하는 데 사용합니다.

- **직렬화**: **pickle 프로토콜**을 사용하여 상태 객체를 전송 가능한 형식으로 변환합니다.
- **병합**: 여러 노드의 부분 집계 결과를 병합합니다.
- **pickle 직렬화 지원 필수**: 기본 타입, 리스트, 딕셔너리, 튜플, 집합 및 pickle 직렬화를 지원하는 사용자 정의 클래스 인스턴스를 반환할 수 있습니다.
- **반환할 수 없는 객체**: 파일 핸들, 데이터베이스 연결, 소켓 연결, 스레드 잠금 및 pickle로 직렬화할 수 없는 기타 객체입니다. 이러한 객체를 반환하면 함수 실행 시 실패합니다.

#### Q3: UDAF를 윈도우 함수에서 사용할 수 있나요? {#q3-can-a-udaf-be-used-in-window-functions}

답변: 사용할 수 있습니다. Python UDAF는 윈도우 함수(OVER 절)를 완전히 지원합니다.

#### Q4: `merge` 메서드는 언제 호출되나요? {#q4-when-is-the-merge-method-called}

답변: `merge`는 다음 상황에서 호출됩니다.

- **분산 집계**: 서로 다른 BE 노드의 부분 집계 결과를 병합할 때.
- **병렬 처리**: 동일 노드의 서로 다른 스레드에서 계산한 부분 결과를 병합할 때.
- **윈도우 함수**: 윈도우 프레임 내의 부분 결과를 병합할 때.

따라서 `merge`를 정확하게 구현해야 합니다. 그렇지 않으면 잘못된 결과가 나옵니다.

## Python UDTF(테이블 함수) {#python-udtf-table-function}

<!-- Knowledge type: Operations guide -->

Python UDTF(User Defined Table Function)를 사용하면 단일 행을 여러 출력 행으로 변환하는 사용자 정의 테이블 함수를 정의할 수 있습니다. 데이터 분할, 확장 및 생성에 유용합니다.

Python UDTF의 주요 특징:

- **한 행을 여러 행으로 변환**: 단일 행을 입력받아 출력 행이 없거나, 한 행 또는 여러 행을 생성합니다.
- **유연한 출력 구조**: 출력 열의 개수와 타입을 자유롭게 지정할 수 있으며, 단순 타입과 복합 STRUCT 타입을 지원합니다.
- **Lateral view 지원**: `LATERAL VIEW`와 함께 사용하여 데이터를 확장하고 조인할 수 있습니다.
- **함수형 스타일**: Python 함수와 `yield` 문을 사용하므로 간결하고 직관적입니다.

### UDTF 기본 개념 {#udtf-basic-concepts}

#### 테이블 함수의 실행 방식 {#how-a-table-function-executes}

Python UDTF는 클래스가 아닌 **함수**로 구현합니다. 실행 흐름은 다음과 같습니다.

1. **입력 수신**: 단일 행의 열 값을 매개변수로 받습니다.
2. **처리 및 출력**: `yield` 문으로 출력 행을 생성합니다. 출력 행이 없을 수도 있습니다.
3. **상태 없음**: 각 함수 호출은 한 행을 독립적으로 처리하며 이전 행의 상태를 유지하지 않습니다.

#### 함수 요구 사항 {#function-requirements}

Python UDTF 함수는 다음 요구 사항을 충족해야 합니다.

- **`yield`로 결과 출력**: `yield` 문을 사용하여 출력 행을 생성합니다.
- **매개변수 타입 일치**: 함수 매개변수는 SQL에서 정의한 매개변수 타입에 대응해야 합니다.
- **출력 형식 일치**: 출력하는 데이터 형식은 `RETURNS ARRAY<...>` 정의와 일치해야 합니다.

#### 출력 방식 {#output-methods}

- **단일 열 출력**: `yield value`는 단일 값을 출력합니다.
- **다중 열 출력**: `yield (value1, value2, ...)`는 값의 튜플을 출력합니다.
- **조건부 건너뛰기**: `yield`를 호출하지 않으면 해당 행은 출력되지 않습니다.

### 기본 구문 {#basic-syntax-1}

#### Python UDTF 생성 {#creating-a-python-udtf}

Python UDTF는 **인라인 모드**와 **모듈 모드**의 두 가지 생성 방식을 지원합니다.

:::caution 주의
`file` 매개변수와 `AS $$` 인라인 Python 코드를 모두 지정하면 Doris는 **인라인 Python 코드를 우선 사용**하고 인라인 모드로 Python UDTF를 실행합니다.
:::

##### 인라인 모드 {#inline-mode-2}

인라인 모드에서는 SQL에 Python 함수를 직접 작성할 수 있습니다. 간단한 테이블 함수 로직에 적합합니다.

**구문**:

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

> **중요한 구문 참고 사항**:
> - `CREATE TABLES FUNCTION`을 사용합니다(**TABLES**가 복수형임에 유의하세요).
> - 단일 열 출력: `ARRAY<type>`. 예: `ARRAY<INT>`.
> - 다중 열 출력: `ARRAY<STRUCT<col1:type1, col2:type2, ...>>`.

**예제 1: 문자열 분할(단일 열 출력)**

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

**예제 2: 숫자 시퀀스 생성(단일 열 출력)**

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

**예제 3: 다중 열 출력(STRUCT)**

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

**예제 4: 카테시안 곱(다중 열 STRUCT)**

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

**예제 5: JSON 배열 파싱**

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

##### 모듈 모드 {#module-mode-2}

모듈 모드는 복잡한 테이블 함수 로직에 적합합니다. Python 코드를 `.zip` 압축 파일로 패키징하고 함수를 생성할 때 참조합니다.

**1단계: Python 모듈 작성**

`text_udtf.py`라는 파일을 생성합니다.

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

**2단계: Python 모듈 패키징**

파일이 하나뿐이더라도 Python 파일을 **반드시** `.zip` 형식으로 패키징해야 합니다.

```bash
zip text_udtf.zip text_udtf.py
```

**3단계: `.zip` 패키지 경로 설정**

`.zip` 패키지 경로를 `file` 매개변수로 지정합니다.

| 배포 방식 | 형식 |
| --- | --- |
| 로컬 파일 시스템(`file://` 프로토콜) | `"file" = "file:///path/to/text_udtf.zip"` |
| HTTP/HTTPS 원격 다운로드(`http://` 또는 `https://` 프로토콜) | `"file" = "http://example.com/udtf/text_udtf.zip"`<br/>`"file" = "https://s3.amazonaws.com/bucket/text_udtf.zip"` |

:::caution 주의
- 원격 다운로드를 사용할 때는 모든 BE 노드에서 해당 URL에 접근할 수 있는지 확인하세요.
- 최초 호출 시 파일을 다운로드하므로 지연이 발생할 수 있습니다.
- 파일이 캐시되므로 이후 호출에서는 다시 다운로드하지 않습니다.
:::

**4단계: `symbol` 매개변수 설정**

모듈 모드에서 `symbol`은 ZIP 패키지 내 함수의 위치를 지정합니다. 형식은 다음과 같습니다.

```
[package_name.]module_name.function_name
```

매개변수 설명:

- `package_name`(선택 사항): ZIP 패키지 내 최상위 Python 패키지의 이름입니다.
- `module_name`(필수): 대상 함수가 포함된 Python 모듈 파일 이름입니다(`.py` 접미사 제외).
- `function_name`(필수): UDTF 함수 이름입니다.

해석 규칙:

- Doris는 `symbol` 문자열을 `.`으로 분리합니다.
    - 결과가 **두 개**의 부분 문자열이면 각각 `module_name`과 `function_name`입니다.
    - 결과가 **세 개 이상**의 부분 문자열이면 첫 번째는 `package_name`, 중간은 `module_name`, 마지막은 `function_name`입니다.

:::caution 경고
네임스페이스는 고유해야 합니다. 모듈 이름 가림으로 인한 종속성 충돌과 런타임 예외를 방지하려면 Python 표준 라이브러리나 자주 사용하는 서드파티 라이브러리와 충돌하는 이름을 피하세요.
:::

**5단계: UDTF 생성**

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

**6단계: 함수 사용**

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

#### Python UDTF 삭제 {#dropping-a-python-udtf}

```sql
-- Syntax
DROP FUNCTION IF EXISTS function_name(parameter_types);

-- Example
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
DROP FUNCTION IF EXISTS py_range(INT, INT);
DROP FUNCTION IF EXISTS py_explode_json(STRING);
```

#### Python UDTF 수정 {#modifying-a-python-udtf}

Doris는 기존 함수를 직접 수정하는 기능을 지원하지 않습니다. 먼저 삭제한 후 다시 생성하세요.

```sql
DROP FUNCTION IF EXISTS py_split(STRING, STRING);
CREATE TABLES FUNCTION py_split(STRING, STRING) ...;
```

### 매개변수 참조 {#parameter-reference-2}

#### CREATE TABLES FUNCTION 매개변수 {#create-tables-function-parameters}

| 매개변수 | 설명 |
| --- | --- |
| `function_name` | 함수 이름. SQL 식별자 명명 규칙을 따릅니다 |
| `parameter_types` | 매개변수 타입 목록. 예: `INT`, `STRING`, `DOUBLE` |
| `RETURNS ARRAY<...>` | 출력 구조를 정의하는 반환 배열 타입<br/>• 단일 열: `ARRAY<type>`<br/>• 다중 열: `ARRAY<STRUCT<col1:type1, col2:type2, ...>>` |

#### PROPERTIES 매개변수 {#properties-parameters-2}

| 매개변수 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `type` | 예 | - | 고정값 `"PYTHON_UDF"` |
| `symbol` | 예 | - | Python 함수 이름.<br/>• **인라인 모드**: 함수 이름을 직접 작성합니다. 예: `"split_string_udtf"`<br/>• **모듈 모드**: 형식은 `[package_name.]module_name.function_name`입니다 |
| `file` | 아니요 | - | Python `.zip` 패키지 경로. 모듈 모드에서만 필수입니다. 세 가지 프로토콜을 지원합니다.<br/>• `file://`: 로컬 파일 시스템 경로<br/>• `http://`: HTTP 원격 다운로드<br/>• `https://`: HTTPS 원격 다운로드 |
| `runtime_version` | 예 | - | Python 런타임 버전. 예: `"3.10.12"` |
| `always_nullable` | 아니요 | `true` | 함수가 항상 NULL을 허용하는 결과를 반환하는지 여부 |
| `volatility` | 아니요 | `immutable` | 함수의 변동성. 4.1.2부터 지원합니다. 유효한 값은 `immutable`, `stable`, `volatile`입니다.<br/>`immutable`: 동일한 입력은 항상 동일한 출력을 생성합니다. 대부분의 결정적 UDF는 실행 계획 최적화를 개선하기 위해 이 값을 사용하는 것이 좋습니다.<br/>`stable`: 하나의 SQL 문 내에서는 결과가 일정하지만 문 사이에서는 바뀔 수 있습니다. `now()`와 유사합니다. SQL 캐시와 구체화된 뷰 재작성이 비활성화됩니다.<br/>`volatile`: 호출할 때마다 결과가 바뀔 수 있습니다. `random()`과 유사합니다. SQL 캐시, 구체화된 뷰 재작성 및 다수의 옵티마이저 재작성 규칙이 비활성화됩니다. |

#### runtime_version 참고 사항 {#runtime_version-notes-1}

- Python 버전은 `x.x.x` 또는 `x.x.xx` 형식의 **완전한 버전 번호**로 지정해야 합니다.
- Doris는 구성된 Python 환경에서 이 버전과 일치하는 인터프리터를 찾습니다.

### 데이터 타입 매핑 {#data-type-mapping-2}

Python UDTF는 Python UDF와 동일한 데이터 타입 매핑 규칙을 사용하며, 모든 정수, 부동소수점, 문자열, 날짜/시간, 십진수, 불리언, 배열 및 STRUCT 타입을 포함합니다.

**자세한 타입 매핑은 다음을 참조하세요**: [데이터 타입 매핑](#data-type-mapping).

#### NULL 처리 {#null-handling-2}

- Doris는 SQL의 `NULL` 값을 Python의 `None`에 매핑합니다.
- 함수에서 매개변수가 `None`인지 확인하세요.
- `yield`로 출력하는 값에는 `None`이 포함될 수 있으며, 이는 해당 열이 `NULL`임을 나타냅니다.

### 실무 시나리오 {#real-world-scenarios-2}

#### 시나리오 1: CSV 데이터 파싱 {#scenario-1-csv-data-parsing}

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

#### 시나리오 2: 날짜 범위 생성 {#scenario-2-date-range-generation}

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

#### 시나리오 3: 텍스트 토큰화 {#scenario-3-text-tokenization}

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

#### 시나리오 4: URL 매개변수 파싱 {#scenario-4-url-parameter-parsing}

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

#### 시나리오 5: IP 범위 확장 {#scenario-5-ip-range-expansion}

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

### 성능 권장 사항 {#performance-recommendations-2}

#### 1. 출력 행 수 제어 {#1-control-the-output-row-count}

- 대량의 출력 행이 생성될 수 있는 시나리오에서는 적절한 상한을 설정하세요.
- 카테시안 곱으로 인한 행 수의 폭증을 피하세요.

#### 2. 반복 계산 피하기 {#2-avoid-repeated-computation}

동일한 계산 결과를 여러 번 사용해야 한다면 미리 계산하세요.

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

#### 3. 제너레이터 표현식 사용 {#3-use-generator-expressions}

Python 제너레이터를 활용하여 중간 리스트 생성을 피하세요.

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

#### 4. 외부 리소스 접근 피하기 {#4-avoid-accessing-external-resources}

- UDTF에서 데이터베이스, 파일 또는 네트워크에 접근하지 마세요.
- 모든 처리는 입력 매개변수를 기반으로 수행해야 합니다.

### 제한 사항 및 참고 사항 {#limitations-and-notes-2}

#### 1. 상태를 유지할 수 없음 {#1-stateless-restriction}

- Python UDTF는 **상태를 유지하지 않습니다**. 각 함수 호출은 한 행을 독립적으로 처리합니다.
- 호출 사이에 상태를 유지할 수 없습니다.
- 여러 행에 걸친 집계에는 UDAF를 사용하세요.

#### 2. 성능 고려 사항 {#2-performance-considerations}

- Python UDTF는 기본 제공 테이블 함수보다 성능이 낮습니다.
- 로직이 복잡하고 데이터 양이 적당한 시나리오에 사용하세요.
- 데이터 양이 많으면 최적화하거나 기본 제공 함수를 우선 사용하세요.

#### 3. 고정된 출력 타입 {#3-fixed-output-type}

- `RETURNS ARRAY<...>`에 정의한 타입은 고정됩니다.
- `yield`로 출력하는 값은 해당 정의와 일치해야 합니다.
- 단일 열: `yield value` 또는 `yield (value,)`. 다중 열: `yield (value1, value2, ...)`.

#### 4. 함수 명명 {#4-function-naming-1}

- 서로 다른 데이터베이스에 동일한 함수 이름을 정의할 수 있습니다.
- 모호함을 피하려면 호출 시 데이터베이스 이름을 지정하세요.

#### 5. 환경 일관성 {#5-environment-consistency-1}

- 모든 BE 노드의 Python 환경이 일관되어야 합니다.
- Python 버전, 종속 패키지 버전 및 환경 구성이 모두 포함됩니다.

### 자주 묻는 질문 {#frequently-asked-questions-2}

<!-- Knowledge type: FAQ -->

#### Q1: UDTF와 UDF의 차이점은 무엇인가요? {#q1-what-is-the-difference-between-udtf-and-udf}

답변: **UDF**는 한 행을 입력받아 한 행을 출력하는 일대일 관계입니다. **UDTF**는 한 행을 입력받아 출력 행이 없거나 여러 행을 출력하는 일대다 관계입니다.

예제:

```sql
SELECT py_upper(name) FROM users;

SELECT tag FROM users LATERAL VIEW py_split(tags, ',') tmp AS tag;
```

#### Q2: 여러 열을 출력하려면 어떻게 해야 하나요? {#q2-how-do-i-output-multiple-columns}

답변: 다중 열 출력을 위해 STRUCT로 반환 타입을 정의하고 튜플을 출력하세요.

```sql
CREATE TABLES FUNCTION func(...)
RETURNS ARRAY<STRUCT<col1:INT, col2:STRING>>
...

def func(...):
    yield (123, 'hello')  # Corresponds to col1 and col2
```

#### Q3: UDTF가 아무것도 출력하지 않는 이유는 무엇인가요? {#q3-why-does-my-udtf-produce-no-output}

답변: 가능한 원인은 다음과 같습니다.

1. **`yield`가 호출되지 않음**: 함수에서 `yield`를 호출하는지 확인하세요.
2. **필터링**: 모든 데이터가 필터링되었습니다.
3. **예외가 무시됨**: try-except 블록에서 오류를 무시했는지 확인하세요.
4. **NULL 입력**: 입력이 NULL이어서 함수가 즉시 반환합니다.

#### Q4: UDTF가 상태를 유지할 수 있나요? {#q4-can-a-udtf-maintain-state}

답변: 유지할 수 없습니다. Python UDTF는 상태를 유지하지 않으며 각 함수 호출은 한 행을 독립적으로 처리합니다. 여러 행에 걸친 집계나 상태 유지가 필요하면 Python UDAF를 사용하세요.

#### Q5: UDTF의 출력 행 수를 제한하려면 어떻게 해야 하나요? {#q5-how-do-i-limit-the-output-row-count-of-a-udtf}

답변: 함수에 카운터나 조건 검사를 추가하세요.

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

#### Q6: UDTF로 출력하는 데이터 타입에 제한이 있나요? {#q6-are-there-limitations-on-the-data-types-yielded-by-udtf}

답변: UDTF는 기본 타입(INT, STRING, DOUBLE 등)과 복합 타입(ARRAY, STRUCT, MAP 등)을 포함한 모든 Doris 데이터 타입을 지원합니다. 출력 타입은 `RETURNS ARRAY<...>`에 명시적으로 정의해야 합니다.

#### Q7: UDTF에서 외부 리소스에 접근할 수 있나요? {#q7-can-i-access-external-resources-in-a-udtf}

답변: 기술적으로는 가능하지만 **사용하지 않을 것을 강력히 권장합니다**. UDTF는 순수 함수로 작성하여 입력 매개변수만 처리해야 합니다. 외부 리소스(데이터베이스, 파일, 네트워크)에 접근하면 성능 문제와 예측할 수 없는 동작이 발생합니다.

## Python UDF/UDAF/UDTF 환경 구성 및 다중 버전 관리 {#python-udfudafudtf-environment-configuration-and-multi-version-management}

<!-- Knowledge type: Deployment and configuration -->
<!-- Applicable scenario: Cluster initialization / Coexistence of multiple Python UDF versions -->

### Python 환경 관리 {#python-environment-management}

Python UDF/UDAF/UDTF를 사용하기 전에 Doris Backend(BE) 노드에 Python 런타임 환경이 올바르게 구성되어 있는지 확인하세요. Doris는 **Conda** 또는 **가상 환경(venv)**을 통한 Python 환경 관리를 지원합니다. 이를 통해 UDF마다 서로 다른 버전의 Python 인터프리터와 종속성을 사용할 수 있습니다.

Doris는 Python 환경을 관리하는 두 가지 방식을 제공합니다.

- **Conda 모드**: Conda로 여러 버전의 환경을 관리합니다. 이후의 모든 예제는 Miniforge를 사용합니다. Miniconda와 Anaconda를 비롯한 다른 Conda 배포판도 지원합니다.
- **Venv 모드**: Python 기본 제공 가상 환경(venv)으로 여러 버전의 환경을 관리합니다.

### 서드파티 라이브러리 설치 및 사용 {#installing-and-using-third-party-libraries}

Python UDF, UDAF, UDTF는 모두 서드파티 라이브러리를 사용할 수 있습니다. Doris는 분산 시스템이므로 **모든 BE 노드**에 서드파티 라이브러리를 동일하게 설치해야 합니다. 그렇지 않으면 일부 노드에서 실행이 실패합니다.

#### 설치 단계 {#installation-steps}

1. **각 BE 노드에 종속성 설치**:

    ```bash
    # Install with pip
    pip install numpy pandas requests
    
    # Or install with conda
    conda install numpy pandas requests -y
    ```

2. **함수에서 임포트하여 사용**:

    ```python
    import numpy as np
    import pandas as pd
    
    # Use them in a UDF/UDAF/UDTF function
    def my_function(x):
        return np.sqrt(x)
    ```

#### 참고 사항 {#notes}

- **`pandas`와 `pyarrow`는 필수 종속성입니다**. 모든 Python 환경에 미리 설치해야 하며, 그렇지 않으면 Python UDF/UDAF/UDTF를 실행할 수 없습니다.
- **모든 BE 노드**에 동일한 버전의 종속성을 설치하세요. 그렇지 않으면 일부 노드에서 실행이 실패합니다.
- 설치 경로는 해당 UDF/UDAF/UDTF가 사용하는 Python 런타임 환경과 일치해야 합니다.
- 가상 환경이나 Conda 환경으로 종속성을 관리하여 시스템 Python 환경과의 충돌을 방지하세요.

### BE 구성 매개변수 {#be-configuration-parameters}

모든 BE 노드의 `be.conf` 구성 파일에 다음 매개변수를 설정하고 **BE를 재시작**하여 구성을 적용하세요.

#### 구성 매개변수 참조 {#configuration-parameter-reference}

| 매개변수 | 타입 | 허용값 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `enable_python_udf_support` | bool | `true` / `false` | `false` | Python UDF 기능 활성화 여부 |
| `python_env_mode` | string | `conda` / `venv` | `""` | Python 다중 버전 환경 관리 모드 |
| `python_conda_root_path` | string | 디렉터리 경로 | `""` | Conda 설치 루트 디렉터리<br/>`python_env_mode = conda`인 경우에만 적용됩니다 |
| `python_venv_root_path` | string | 디렉터리 경로 | `${DORIS_HOME}/lib/udf/python` | venv 다중 버전 관리의 루트 디렉터리<br/>`python_env_mode = venv`인 경우에만 적용됩니다 |
| `python_venv_interpreter_paths` | string | 경로 목록(`:`으로 구분) | `""` | 사용 가능한 Python 인터프리터 디렉터리 목록<br/>`python_env_mode = venv`인 경우에만 적용됩니다 |
| `max_python_process_num` | int32 | 정수 | `0` | Python Server 프로세스 풀의 최대 프로세스 수<br/>`0`은 CPU 코어 수를 기본값으로 사용한다는 의미입니다. 다른 양의 정수를 설정하여 기본값을 재정의할 수 있습니다 |

### 방법 1: Conda로 Python 환경 관리 {#method-1-manage-python-environments-with-conda}

#### 1. BE 구성 {#1-configure-be}

`be.conf`에 다음 구성을 추가합니다.

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = conda
python_conda_root_path = /path/to/miniforge3
```

#### 2. 환경 검색 규칙 {#2-environment-lookup-rules}

Doris는 `${python_conda_root_path}/envs/`에서 UDF에 지정된 `runtime_version`과 일치하는 Conda 환경을 찾습니다.

**일치 규칙**:

- `runtime_version`은 **완전한 Python 버전 번호여야 하며**, `x.x.x` 또는 `x.x.xx` 형식을 사용합니다. 예: `"3.9.18"`, `"3.12.11"`.
- Doris는 모든 Conda 환경을 순회하며 각 환경의 실제 Python 인터프리터 버전이 `runtime_version`과 정확히 일치하는지 확인합니다.
- 일치하는 환경을 찾지 못하면 Doris는 `Python environment with version x.x.x not found` 오류를 보고합니다.

**예제**:

- UDF에서 `runtime_version = "3.9.18"`을 지정하면 Doris는 Python 버전이 3.9.18인 환경을 검색합니다.
- 환경 이름은 자유롭게 지정할 수 있습니다(예: `py39`, `my-env`, `data-science`). 해당 환경의 Python 버전이 3.9.18이기만 하면 됩니다.
- 완전한 버전 번호가 필요합니다. `"3.9"` 또는 `"3.12"`와 같은 버전 접두사는 허용되지 않습니다.

#### 3. 디렉터리 구조 다이어그램 {#3-directory-structure-diagram}

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

#### 4. Conda 환경 생성 {#4-create-conda-environments}

:::caution 주의
Doris Python UDF/UDAF/UDTF 기능은 `pandas`와 `pyarrow`를 **필수 종속성**으로 요구합니다. 모든 Python 환경에 두 라이브러리를 **반드시** 미리 설치해야 합니다. 그렇지 않으면 UDF가 올바르게 실행되지 않습니다.
:::

**모든 BE 노드에서** 다음 명령을 실행하여 Python 환경을 생성합니다.

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

#### 5. UDF에서 사용 {#5-use-in-a-udf}

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

### 방법 2: Venv로 Python 환경 관리 {#method-2-manage-python-environments-with-venv}

#### 1. BE 구성 {#1-configure-be-1}

`be.conf`에 다음 구성을 추가합니다.

```properties
## be.conf
enable_python_udf_support = true
python_env_mode = venv
python_venv_root_path = /doris/python_envs
python_venv_interpreter_paths = /opt/python3.9/bin/python3.9:/opt/python3.12/bin/python3.12
```

#### 2. 구성 매개변수 참고 사항 {#2-configuration-parameter-notes}

- **`python_venv_root_path`**: 가상 환경의 루트 디렉터리입니다. 모든 venv 환경이 이 디렉터리 아래에 생성됩니다.
- **`python_venv_interpreter_paths`**: Python 인터프리터의 절대 경로를 콜론(`:`)으로 구분한 목록입니다. Doris는 각 인터프리터의 버전을 확인하여 UDF에 지정된 `runtime_version`(완전한 버전 번호, 예: `"3.9.18"`)과 일치하는지 검사합니다.

#### 3. 디렉터리 구조 다이어그램 {#3-directory-structure-diagram-1}

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

#### 4. Venv 환경 생성 {#4-create-venv-environments}

:::caution 주의
Doris Python UDF/UDAF/UDTF 기능은 `pandas`와 `pyarrow`를 **필수 종속성**으로 요구합니다. 모든 Python 환경에 두 라이브러리를 **반드시** 미리 설치해야 합니다. 그렇지 않으면 UDF가 올바르게 실행되지 않습니다.
:::

**모든 BE 노드에서** 다음 명령을 실행합니다.

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

#### 5. UDF에서 사용 {#5-use-in-a-udf-1}

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

### 환경 관리 모범 사례 {#best-practices-for-environment-management}

#### 1. 적절한 관리 방식 선택 {#1-choose-the-right-management-method}

| 시나리오 | 권장 방식 | 이유 |
| --- | --- | --- |
| Python 버전을 자주 전환하는 경우 | Conda | 환경 격리가 강력하고 종속성 관리가 간단함 |
| 기존 Conda 환경이 있는 경우 | Conda | 기존 환경을 바로 재사용할 수 있음 |
| 시스템 리소스가 제한된 경우 | Venv | 리소스 사용량이 적고 시작 속도가 빠름 |
| 기존 시스템 Python 환경이 있는 경우 | Venv | Conda를 별도로 설치할 필요가 없음 |

#### 2. 환경 일관성 요구 사항 {#2-environment-consistency-requirements}

:::caution 주의
모든 BE 노드의 Python 환경은 다음 사항을 포함하여 **완전히 동일**해야 합니다.

- Python 버전이 같아야 합니다.
- 설치된 종속 패키지와 해당 버전이 같아야 합니다.
- 환경 디렉터리 경로가 같아야 합니다.
:::

### 참고 사항 {#notes-1}

#### 1. 구성 변경 적용 {#1-configuration-changes-take-effect}

- `be.conf`를 수정한 후에는 **BE 프로세스를 반드시 재시작해야** 변경 사항이 적용됩니다.
- 서비스 중단을 방지하려면 재시작 전에 구성이 올바른지 확인하세요.

#### 2. 경로 확인 {#2-path-verification}

구성하기 전에 경로가 올바른지 확인하세요.

```bash
# Conda mode: verify the conda path
ls -la /opt/miniforge3/bin/conda
/opt/miniforge3/bin/conda env list

# Venv mode: verify interpreter paths
/opt/python3.9/bin/python3.9 --version
/opt/python3.12/bin/python3.12 --version
```

#### 3. 권한 설정 {#3-permission-settings}

Doris BE 프로세스에 Python 환경 디렉터리 접근 권한이 있는지 확인하세요.

```bash
# Conda mode
chmod -R 755 /opt/miniforge3

# Venv mode
chmod -R 755 /doris/python_envs
chown -R doris:doris /doris/python_envs  # Assume the BE process user is doris
```

#### 4. 리소스 제한 {#4-resource-limits}

실제 요구 사항에 맞게 Python 프로세스 풀 매개변수를 조정하세요.

```properties
## Use the CPU core count (recommended, max_python_process_num = 0)
max_python_process_num = 0

## High concurrency: specify the process count manually
max_python_process_num = 128

## Resource-constrained: limit the process count
max_python_process_num = 32
```

### 환경 검증 {#environment-verification}

#### 각 BE 노드의 환경 확인 {#verify-the-environment-on-each-be-node}

```bash
# Conda mode
/opt/miniforge3/envs/py39/bin/python --version
/opt/miniforge3/envs/py39/bin/python -c "import pandas; print(pandas.__version__)"

# Venv mode
/doris/python_envs/python3.9.18/bin/python --version
/doris/python_envs/python3.9.18/bin/python -c "import pandas; print(pandas.__version__)"
```

#### 모든 BE 노드에 공통으로 설치된 Python 버전 조회 {#show-python-versions-common-to-all-be-nodes}

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

#### 특정 버전에 설치된 종속성 조회 {#show-installed-dependencies-for-a-given-version}

`SHOW PYTHON PACKAGES IN '<version>'`을 사용하여 지정한 버전에 설치된 종속성을 조회합니다. BE 노드 간에 종속성이 다르면 차이가 있는 항목을 표시합니다.

```sql
SHOW PYTHON PACKAGES IN '3.9.18'
```

모든 BE 노드의 종속성이 동일한 경우:

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

BE 노드의 종속성이 서로 다른 경우:

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

### 일반적인 문제 해결 {#common-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Errors after Python UDF deployment -->

#### Q1: UDF 호출 시 "Python environment not found" 오류가 발생함 {#q1-udf-call-reports-python-environment-not-found}

**원인**:

- `runtime_version`으로 지정한 버전이 시스템에 없습니다.
- 환경 경로가 잘못 구성되어 있습니다.

**해결 방법**:

```bash
# Check the Conda environment list
conda env list

# Check whether the venv interpreter exists
ls -la /opt/python3.9/bin/python3.9

# Check the BE configuration
grep python /path/to/be.conf
```

#### Q2: UDF 호출 시 "ModuleNotFoundError: No module named 'xxx'" 오류가 발생함 {#q2-udf-call-reports-modulenotfounderror-no-module-named-xxx}

**원인**: 필요한 종속 패키지가 Python 환경에 설치되어 있지 않습니다.

#### Q3: BE 노드마다 다른 결과를 반환함 {#q3-different-be-nodes-return-different-results}

**원인**: BE 노드 간에 Python 환경 또는 종속성 버전이 다릅니다.

**해결 방법**:

1. 모든 노드의 Python 버전과 종속성 버전을 확인합니다.
2. 모든 노드의 환경이 일관적인지 확인합니다.
3. `requirements.txt`(pip) 또는 `environment.yml`(Conda)을 사용하여 환경을 동일하게 배포합니다. 일반적인 사용 예제는 다음과 같습니다.

- `requirements.txt`(pip) 사용:

    ```bash
    # Export dependencies in the development environment
    pip freeze > requirements.txt
    # Install dependencies on a BE node using the target Python
    /path/to/python -m pip install -r requirements.txt
    ```

- `environment.yml`(Conda) 사용:

    ```bash
    # Export dependencies
    conda env export --from-history -n py312 -f environment.yml
    # Create the environment on a BE node
    conda env create -f environment.yml -n py312
    # Or update an existing environment
    conda env update -f environment.yml -n py312
    ```

:::caution 주의
- 종속성 파일에 `pandas`와 `pyarrow`가 포함되어 있고 모든 BE 노드에 동일한 버전이 설치되어 있는지 확인하세요.
- 설치 시 Doris 구성과 일치하는 Python 인터프리터 또는 Conda 경로(예: `/opt/miniforge3/bin/conda` 또는 지정된 venv 인터프리터)를 사용하세요.
- 운영 담당자가 모든 BE 노드에 동일하게 배포할 수 있도록 종속성 파일을 버전 관리 시스템이나 공유 스토리지에 보관하세요.
- 추가 참고 자료: [pip 공식 문서](https://pip.pypa.io/en/stable/cli/pip/), [Conda 환경 내보내기/가져오기 가이드](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#exporting-the-environment).
:::

#### Q4: be.conf 변경 사항이 적용되지 않음 {#q4-changes-to-beconf-do-not-take-effect}

**가능한 원인**: BE 프로세스를 재시작하지 않았습니다.

### 사용 제한 사항 {#usage-limitations}

1. **성능 고려 사항**:
    - Python UDF는 기본 제공 함수보다 성능이 낮습니다. 로직이 복잡하고 데이터 양이 적은 시나리오에 사용하세요.
    - 데이터 양이 많으면 벡터화 모드를 우선 사용하세요.

2. **타입 제한**:
    - HLL, Bitmap과 같은 특수 타입은 지원하지 않습니다.

3. **환경 격리**:
    - 서로 다른 데이터베이스에 동일한 함수 이름을 정의할 수 있습니다.
    - 모호함을 피하려면 호출 시 데이터베이스 이름을 지정하세요(예: `db.func()`).

4. **동시성 제한**:
    - Python UDF는 프로세스 풀을 통해 실행됩니다. 동시성은 `max_python_process_num`으로 제한됩니다.
    - 동시성이 높은 시나리오에서는 이 매개변수를 늘리세요.
