---
{
    "title": "Java UDF, UDAF, UDWF, UDTF",
    "language": "ko",
    "description": "Java를 사용하여 Apache Doris에서 UDF, UDAF, UDWF, UDTF 사용자 정의 함수를 작성하는 방법을 설명합니다. 타입 매핑, 등록 구문, 모범 사례, 예제를 포함합니다.",
    "keywords": [
        "Doris Java UDF",
        "Java UDAF",
        "Java UDWF",
        "Java UDTF",
        "사용자 정의 함수",
        "사용자 정의 함수",
        "Hive UDF 마이그레이션",
        "CREATE FUNCTION",
        "Lateral View",
        "static_load",
        "expiration_time"
    ]
}
---

<!-- Knowledge type: Capability definition / Operational steps -->
<!-- Applicable scenario: Extend Doris SQL capabilities with Java, migrate Hive UDFs -->

## 개요 {#overview}

Java UDF는 사용자가 Java로 사용자 정의 함수를 작성할 수 있는 인터페이스를 제공합니다. 이를 통해 SQL로 직접 표현할 수 없는 비즈니스 로직을 Java로 편리하게 구현할 수 있습니다. Apache Doris는 Java로 작성하는 사용자 정의 함수로 UDF, UDAF, UDWF, UDTF의 네 가지 유형을 지원합니다. 별도로 명시하지 않는 한, 아래에서 UDF는 모든 사용자 정의 함수를 통칭합니다.

네 가지 사용자 정의 함수 유형의 정의와 대표적인 예는 다음과 같습니다.

| 유형 | 전체 이름 | 동작 | 대표 함수 예 | 최초 지원 버전 |
| --- | --- | --- | --- | --- |
| UDF | 스칼라 함수 | 입력 행마다 하나의 결과 행을 출력 | ABS, LENGTH | 모든 버전 |
| UDAF | 집계 함수 | 여러 입력 행을 집계하여 하나의 결과 행을 출력 | MIN, MAX, COUNT | 모든 버전 |
| UDWF | 윈도우 함수 | 윈도우 범위(하나 이상의 행) 내의 각 행에 대해 값을 반환 | ROW_NUMBER, RANK, DENSE_RANK | 모든 버전 |
| UDTF | 테이블 함수 | 입력 행마다 하나 이상의 행을 출력하며, Lateral View와 함께 사용해야 함. 행을 열로 변환하는 기능을 구현할 수 있음 | EXPLODE, EXPLODE_SPLIT | Doris 3.0 이상 |

Hive에서 이미 많은 사용자 정의 함수를 사용하고 있다면, Java UDF를 다시 작성하지 않고 Doris로 직접 마이그레이션할 수 있습니다.

## 적용 시나리오 {#applicable-scenarios}

- SQL에서 Doris 내장 함수로 처리할 수 없는 스칼라 연산, 집계 또는 행 확장 로직이 필요한 경우.
- 기존 Hive Java UDF를 Doris로 원활하게 마이그레이션해야 하는 경우.
- 사용자 정의 함수에서 대용량 리소스 파일(예: 사전 또는 모델)을 로드해야 하거나, 전역 연결 풀과 같은 싱글턴 리소스를 재사용하려는 경우.

## 데이터 타입 매핑 {#data-type-mapping}

다음 테이블은 Doris 데이터 타입과 Java UDF의 입력 및 반환 타입 간의 대응 관계를 보여줍니다.

| Doris 데이터 타입 | Java UDF 매개변수 타입 |
| --- | --- |
| Bool | Boolean |
| TinyInt | Byte |
| SmallInt | Short |
| Int | Integer |
| BigInt | Long |
| LargeInt | BigInteger |
| Float | Float |
| Double | Double |
| Date | LocalDate |
| Datetime | LocalDateTime |
| IPV4 / IPV6 | InetAddress |
| String | String |
| Decimal | BigDecimal |
| `array<Type>` | `ArrayList<Type>`, `List<Type>` (중첩 지원) |
| `map<Type1,Type2>` | `HashMap<Type1,Type2>`, `Map<Type1,Type2>` (중첩 지원) |
| `struct<Type...>` | `ArrayList<Object>` (3.0.0부터 지원), `List<Type>` |
| VarBinary | `byte[]`, `Byte[]` (VarBinary 타입은 4.0부터 지원하며, 변환 단계를 하나 줄일 수 있는 `byte[]` 사용을 권장) |

:::tip 팁
`array`, `map`, `struct` 타입에는 다른 타입을 중첩할 수 있습니다. 예를 들어 Doris의 `array<array<int>>`에 해당하는 Java UDF 매개변수 타입은 `ArrayList<ArrayList<Integer>>`이며, 다른 타입도 같은 방식을 따릅니다. `List<Type>` 및 `Map<Type1,Type2>` 형식은 버전 3.1.0부터 지원합니다.
:::

:::caution 참고
함수를 생성할 때는 항상 `string` 타입을 사용하고 `varchar`는 사용하지 마세요. 그렇지 않으면 함수 실행이 실패할 수 있습니다.
:::

## 사용 제한 사항 {#usage-limitations}

<!-- Knowledge type: Limitation -->

1. 복합 데이터 타입인 HLL과 Bitmap은 지원하지 않습니다.
2. 사용자는 `-Xmx`를 설정하여 JVM의 최대 힙 크기를 직접 지정할 수 있습니다. 이 옵션은 `JAVA_OPTS`에 포함되며 `be.conf`에서 설정합니다. 기본값은 1024 MB입니다. 집계할 데이터가 많다면 이 값을 적절히 늘려 성능을 개선하고 메모리 부족 오류의 위험을 줄이세요.
3. 이름이 같은 클래스를 로드하는 데 대한 JVM의 제약으로 인해, 이름이 같은 여러 클래스를 UDF 구현으로 동시에 사용하면 안 됩니다. 동일한 클래스 이름을 사용하는 UDF를 업데이트하려면 BE를 재시작하여 클래스 경로를 다시 로드하세요.
4. 이름이 같은 함수의 처리 규칙:

    - 사용자는 내장 함수와 시그니처가 동일한 사용자 정의 함수를 생성할 수 있습니다. 기본적으로 시스템은 내장 함수를 먼저 매칭합니다.
    - 호출 시 `database`를 명시적으로 지정하면(예: `db.function()`), 해당 호출은 강제로 사용자 정의 함수로 인식됩니다.
    - 세션 변수 `prefer_udf_over_builtin`은 버전 3.0.7에서 추가되었습니다. 이 변수를 `true`로 설정하면 사용자 정의 함수를 먼저 매칭하므로, 다른 시스템에서 Doris로 마이그레이션할 때 함수 이름을 바꾸지 않고 기존 함수의 동작을 유지할 수 있습니다.

## 빠른 시작 {#quick-start}

이 절에서는 Java UDF를 개발하고 등록하는 방법을 설명합니다. 참고할 수 있는 예제 코드는 `samples/doris-demo/java-udf-demo/` 디렉터리에 있으며, GitHub의 [데모](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo)에서도 확인할 수 있습니다.

UDF는 일반 함수와 같은 방식으로 사용하지만, 적용 범위에 차이가 있습니다.

- 내장 함수의 적용 범위는 전역입니다.
- UDF의 적용 범위는 데이터베이스(DB) 내입니다.

따라서 현재 세션에서 데이터베이스를 사용 중이라면 UDF 이름을 직접 사용하여 현재 DB에서 해당 UDF를 찾습니다. 그렇지 않으면 UDF가 속한 데이터베이스 이름을 명시적으로 지정해야 합니다. 예를 들면 `dbName.funcName`과 같습니다.

편의를 위해 다음 예제는 모두 `test_table`에서 테스트합니다. CREATE TABLE 문은 다음과 같습니다.

```sql
CREATE TABLE `test_table` (
    id int NULL,
    d1 double NULL,
    str string NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_num" = "1");

insert into test_table values (1, 111.11, "a,b,c");
insert into test_table values (6, 666.66, "d,e");
```

### Java UDF 예제 {#java-udf-example}

Java로 UDF를 작성할 때는 Hive 등의 다른 엔진과 마찬가지로 `evaluate` 함수가 주 진입점이어야 합니다. 다음 예제에서는 정수 입력값에 하나를 더하는 `AddOne` UDF를 작성합니다.

1. Java 코드를 작성하고 JAR 파일로 패키징합니다.

    ```java
    public class AddOne extends UDF {
        public Integer evaluate(Integer value) {
            return value == null ? null : value + 1;
        }
    }
    ```

2. Doris에 Java UDF를 등록합니다. 자세한 구문은 [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)을 참조하세요.

    ```sql
    CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
        "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
        "symbol"="org.apache.doris.udf.AddOne",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

:::caution 참고
`file://`를 사용하면 Doris는 `CREATE FUNCTION` 실행 중 FE 노드의 JAR 파일을 읽어 체크섬을 계산하고, 실행 시에는 BE 노드의 JAR 파일을 읽습니다. 따라서 모든 FE 및 BE 노드의 동일한 절대 경로에 같은 JAR 파일이 있어야 하며, 파일 내용도 동일해야 합니다. 파일이 BE 노드에만 있으면 `CREATE FUNCTION`이 실패합니다. FE 노드와 BE 노드의 파일 내용이 다르면 체크섬 불일치로 실행이 실패합니다.
:::

3. UDF를 호출합니다. UDF를 호출하려면 해당 데이터베이스에 대한 `SELECT` 권한이 필요합니다. 등록된 UDF를 확인하려면 [SHOW FUNCTIONS](../../sql-manual/sql-statements/function/SHOW-FUNCTIONS) 명령을 사용하세요.

    ```sql
    select id,java_udf_add_one(id) from test_table;
    +------+----------------------+
    | id   | java_udf_add_one(id) |
    +------+----------------------+
    |    1 |                    2 |
    |    6 |                    7 |
    +------+----------------------+
    ```

4. UDF가 더 이상 필요하지 않으면 [DROP FUNCTION](../../sql-manual/sql-statements/function/DROP-FUNCTION) 명령으로 삭제합니다.

UDF에서 대용량 리소스 파일을 로드해야 하거나 전역 정적 변수를 정의하려면 아래의 "모범 사례" 절을 참조하세요.

### Java UDAF 예제 {#java-udaf-example}

Java로 UDAF를 작성하려면 필수 함수(required로 표시됨)들과 내부 클래스 `State`를 구현해야 합니다. 다음 두 예제에서 이를 설명합니다.

1. Java UDAF 코드를 작성하고 JAR 파일로 패키징합니다.

<details>
<summary>예제 1: SimpleDemo는 sum과 유사한 간단한 집계 함수를 구현하며, 입력 매개변수와 출력 매개변수의 타입은 모두 INT입니다</summary>

```java
package org.apache.doris.udf;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.util.logging.Logger;

public class SimpleDemo  {

Logger log = Logger.getLogger("SimpleDemo");

//Need an inner class to store data
/*required*/
public static class State {
    /*some variables if you need */
    public int sum = 0;
}

/*required*/
public State create() {
    /* here could do some init work if needed */
    return new State();
}

/*required*/
public void destroy(State state) {
    /* here could do some destroy work if needed */
}

/*Not Required*/
public void reset(State state) {
    /*if you want this udaf function can work with window function.*/
    /*Must impl this, it will be reset to init state after calculate every window frame*/
    state.sum = 0;
}

/*required*/
//first argument is State, then other types your input
public void add(State state, Integer val) throws Exception {
    /* here doing update work when input data*/
    if (val != null) {
        state.sum += val;
    }
}

/*required*/
public void serialize(State state, DataOutputStream out) throws IOException {
    /* serialize some data into buffer */
    out.writeInt(state.sum);
}

/*required*/
public void deserialize(State state, DataInputStream in) throws IOException {
    /* deserialize get data from buffer before you put */
    int val = in.readInt();
    state.sum = val;
}

/*required*/
public void merge(State state, State rhs) throws Exception {
    /* merge data from state */
    state.sum += rhs.sum;
}

/*required*/
//return Type you defined
public Integer getValue(State state) throws Exception {
    /* return finally result */
    return state.sum;
}
}
```

</details>

<details>
<summary>예제 2: MedianUDAF는 중앙값 계산을 구현하며, 입력 타입은 (DOUBLE, INT)이고 출력 타입은 DOUBLE입니다</summary>

```java
package org.apache.doris.udf.demo;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.logging.Logger;

/*UDAF that calculates the median*/
public class MedianUDAF {
Logger log = Logger.getLogger("MedianUDAF");

// State storage
public static class State {
    // Precision of the returned result
    int scale = 0;
    // Whether this is the first time the add method is executed for the data under a certain aggregation condition of a tablet
    boolean isFirst = true;
    // Data storage
    public StringBuilder stringBuilder;
}

// State initialization
public State create() {
    State state = new State();
    // Pre-initialize the buffer based on the volume of data to be aggregated under each aggregation condition of each tablet, to improve performance
    state.stringBuilder = new StringBuilder(1000);
    return state;
}


// The execution unit processes each piece of data under each aggregation condition of each tablet
public void add(State state, Double val, int scale) throws IOException {
    if (val != null && state.isFirst) {
        state.stringBuilder.append(scale).append(",").append(val).append(",");
        state.isFirst = false;
    } else if (val != null) {
        state.stringBuilder.append(val).append(",");
    }
}

// Output data after processing, waiting for aggregation
public void serialize(State state, DataOutputStream out) throws IOException {
    // Currently only DataOutputStream is provided. To serialize an object, consider concatenating strings, converting to JSON, or serializing into a byte array.
    // To serialize the State object, you may need to implement the Serializable interface on the State inner class yourself.
    // Ultimately, everything must be transmitted via DataOutputStream.
    out.writeUTF(state.stringBuilder.toString());
}

// Get the data output by the data-processing execution unit
public void deserialize(State state, DataInputStream in) throws IOException {
    String string = in.readUTF();
    state.scale = Integer.parseInt(String.valueOf(string.charAt(0)));
    StringBuilder stringBuilder = new StringBuilder(string.substring(2));
    state.stringBuilder = stringBuilder;
}

// The aggregation execution unit merges the processing results of data under a certain key according to the aggregation condition. The first time each key is merged, the state1 parameter is the initialized instance.
public void merge(State state1, State state2) throws IOException {
    state1.scale = state2.scale;
    state1.stringBuilder.append(state2.stringBuilder.toString());
}

// Process the merged data for each key and output the final result
public Double getValue(State state) throws IOException {
    String[] strings = state.stringBuilder.toString().split(",");
    double[] doubles = new double[strings.length + 1];
    doubles = Arrays.stream(strings).mapToDouble(Double::parseDouble).toArray();

    Arrays.sort(doubles);
    double n = doubles.length - 1;
    double index = n * 0.5;

    int low = (int) Math.floor(index);
    int high = (int) Math.ceil(index);

    double value = low == high ? (doubles[low] + doubles[high]) * 0.5 : doubles[high];

    BigDecimal decimal = new BigDecimal(value);
    return decimal.setScale(state.scale, BigDecimal.ROUND_HALF_UP).doubleValue();
}

// Executed after each execution unit finishes
public void destroy(State state) {
}

}
```

</details>

2. Doris에 Java UDAF를 등록합니다. 자세한 구문은 [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)을 참조하세요.

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Java UDAF를 호출합니다. 그룹별로 집계하거나 전체 결과를 집계할 수 있습니다.

    ```sql
    select simple_demo(id) from test_table group by id;
    +-----------------+
    | simple_demo(id) |
    +-----------------+
    |               1 |
    |               6 |
    +-----------------+
    ```

    ```sql
    select simple_demo(id) from test_table;
    +-----------------+
    | simple_demo(id) |
    +-----------------+
    |               7 |
    +-----------------+
    ```

### Java UDWF 예제 {#java-udwf-example}

Java UDWF의 코드 구조는 Java UDAF와 완전히 같습니다. `reset` 인터페이스를 추가로 구현하여 모든 `state`를 초기값으로 재설정하면 됩니다.

```java
void reset(State state)
```

1. Java UDWF 코드를 작성하고 패키징합니다(위와 동일).

2. Doris에 Java UDWF를 등록합니다. 등록 방법은 Java UDAF와 같습니다. 자세한 구문은 [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)을 참조하세요.

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo_window(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Java UDWF를 호출하여 지정된 윈도우 범위 내에서 결과를 계산합니다. 자세한 구문은 [윈도우 함수](../window-function.md)를 참조하세요.

    ```sql
    select id, simple_demo_window(id) over(partition by id order by d1 rows between 1 preceding and 1 following) as res from test_table;
    +------+------+
    | id   | res  |
    +------+------+
    |    1 |    1 |
    |    6 |    6 |
    +------+------+
    ```

### Java UDTF 예제 {#java-udtf-example}

:::tip
UDTF는 Doris 3.0부터 지원합니다.
:::

UDTF는 UDF와 마찬가지로 `evaluate` 메서드를 구현해야 하지만, 반환값은 반드시 Array 타입이어야 합니다.

1. Java UDTF 코드를 작성하고 JAR 파일로 패키징합니다.

    ```java
    public class UDTFStringTest {
        public ArrayList<String> evaluate(String value, String separator) {
            if (value == null || separator == null) {
                return null;
            } else {
                return new ArrayList<>(Arrays.asList(value.split(separator)));
            }
        }
    }
    ```

2. Doris에 Java UDTF를 등록합니다. 등록 시 두 개의 UDTF가 동시에 생성됩니다. 함수 이름에 `_outer` 접미사가 붙은 버전은 결과 행이 없는 경우를 별도로 처리합니다. 자세한 내용은 [OUTER 조합자](../../sql-manual/sql-functions/table-functions/explode-numbers)를 참조하세요. 자세한 구문은 [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)을 참조하세요.

    ```sql
    CREATE TABLES FUNCTION java_utdf(string, string) RETURNS array<string> PROPERTIES (
        "file"="file:///pathTo/java-udtf.jar",
        "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Java UDTF를 호출합니다. Doris에서 UDTF를 사용하여 행을 열로 변환하려면 [Lateral View](../lateral-view.md)와 함께 사용해야 합니다.

    ```sql
    select id, str, e1 from test_table lateral view java_utdf(str,',') tmp as e1;
    +------+-------+------+
    | id   | str   | e1   |
    +------+-------+------+
    |    1 | a,b,c | a    |
    |    1 | a,b,c | b    |
    |    1 | a,b,c | c    |
    |    6 | d,e   | d    |
    |    6 | d,e   | e    |
    +------+-------+------+
    ```

## 모범 사례: 정적 변수 로드 {#best-practice-loading-static-variables}

<!-- Knowledge type: Best practice -->
<!-- Applicable scenario: UDFs that load large resource files / reuse singleton resources such as connection pools -->

Doris에서 UDF를 실행하면(예: `select udf(col) from table`), 동시에 실행되는 각 Instance가 `udf.jar` 패키지를 한 번 로드하고 Instance가 종료될 때 언로드합니다.

이로 인해 다음과 같은 두 가지 문제가 흔히 발생합니다.

- `udf.jar` 파일에서 수백 MB의 리소스 파일을 로드해야 할 경우, 동시 실행으로 메모리 사용량이 급격히 증가하여 OOM이 발생하기 쉽습니다.
- `static` 블록에서 한 번만 초기화해야 하는 연결 풀 등의 객체를 사용하려 해도, 현재 동시 실행 모델에서는 불가능합니다.

아래에 두 가지 해결 방법을 제시합니다. 해결 방법 2는 Doris branch-3.0 이상의 버전이 필요합니다.

### 해결 방법 1: 리소스 JAR 분리 {#solution-1-split-out-a-resource-jar}

리소스를 로드하는 코드를 별도의 JAR로 분리하고, 다른 비즈니스 JAR에서 이 리소스 JAR을 참조하도록 합니다.

코드를 `DictLibrary`(리소스 클래스)와 `FunctionUdf`(비즈니스 클래스)의 두 파일로 분리했다고 가정합니다.

```java
public class DictLibrary {
    private static HashMap<String, String> res = new HashMap<>();

    static {
        // suppose we built this dictionary from a certain local file.
        res.put("key1", "value1");
        res.put("key2", "value2");
        res.put("key3", "value3");
        res.put("0", "value4");
        res.put("1", "value5");
        res.put("2", "value6");
    }

    public static String evaluate(String key) {
        if (key == null) {
            return null;
        }
        return res.get(key);
    }
}
```

```java
public class FunctionUdf {
    public String evaluate(String key) {
        String value = DictLibrary.evaluate(key);
        return value;
    }
}
```

절차는 다음과 같습니다.

1. `DictLibrary` 파일을 별도로 컴파일하여 독립적인 리소스 JAR인 `DictLibrary.jar`를 생성합니다.

    ```shell
    javac   ./DictLibrary.java
    jar -cf ./DictLibrary.jar ./DictLibrary.class
    ```

2. `FunctionUdf` 파일을 컴파일할 때 이전 단계의 리소스 패키지를 의존성으로 참조하여 UDF 비즈니스 패키지인 `FunctionUdf.jar`를 생성합니다.

    ```shell
    javac -cp ./DictLibrary.jar  ./FunctionUdf.java
    jar  -cvf ./FunctionUdf.jar  ./FunctionUdf.class
    ```

3. 동시에 실행되는 모든 Instance가 리소스 JAR을 공유하도록 JVM에서 직접 로드하게 합니다. 지정된 경로인 `be/custom_lib`에 리소스 JAR을 배치하세요. BE 서비스를 재시작하면 JVM 시작과 함께 로드되며, 서비스가 중지될 때 해제됩니다.

4. 마지막으로 `CREATE FUNCTION` 문으로 UDF를 생성합니다. 인스턴스가 언로드될 때마다 `FunctionUdf.jar`만 언로드됩니다.

    ```sql
    CREATE FUNCTION java_udf_dict(string) RETURNS string PROPERTIES (
        "file"="file:///pathTo/FunctionUdf.jar",
        "symbol"="org.apache.doris.udf.FunctionUdf",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

### 해결 방법 2: BE 전역 JAR 캐시 {#solution-2-be-global-jar-cache}

BE는 JAR을 전역으로 캐시하며, 만료 시간을 사용자 지정할 수 있습니다. `CREATE FUNCTION` 실행 시 다음 두 속성 필드를 추가하세요.

| 속성 | 설명 | 기본값 |
| --- | --- | --- |
| `static_load` | 정적 캐시 로드 방식을 사용할지 여부 | `false` |
| `expiration_time` | JAR 만료 시간(분 단위) | `360` |

- `expiration_time`은 4.1.1 버전 이후 제거될 예정입니다.

동작 방식:

- 정적 캐시 로드를 활성화하면 첫 호출에서 초기화가 완료된 UDF 인스턴스를 캐시에 저장합니다.
- 이후 UDF를 호출할 때는 먼저 캐시를 확인하고, 캐시에 없으면 관련 초기화를 실행합니다.
- Drop Function 실행 시 캐시에서 제거됩니다.

예제 코드:

```java
public class Print extends UDF {
    static Integer val = 0;
    public Integer evaluate() {
        val = val + 1;
        return val;
    }
}
```

```sql
CREATE FUNCTION print_12() RETURNS int 
PROPERTIES (
    "file" = "file:///path/to/java-udf-demo-jar-with-dependencies.jar",
    "symbol" = "org.apache.doris.udf.Print", 
    "always_nullable"="true",
    "type" = "JAVA_UDF",
    "static_load" = "true", // default value is false
    "expiration_time" = "60" // default value is 360 minutes
);
```

실행 결과가 계속 증가하는 것을 보면 로드된 JAR이 언로드된 후 다시 로드되지 않는다는 것을 알 수 있습니다(그렇지 않으면 변수가 0으로 다시 초기화됩니다).

```sql
mysql [test_query_qa]>select print_12();
+------------+
| print_12() |
+------------+
|          1 |
+------------+
1 row in set (0.40 sec)

mysql [test_query_qa]>select print_12();
+------------+
| print_12() |
+------------+
|          2 |
+------------+
1 row in set (0.03 sec)

mysql [test_query_qa]>select print_12();
+------------+
| print_12() |
+------------+
|          3 |
+------------+
1 row in set (0.04 sec)
```
