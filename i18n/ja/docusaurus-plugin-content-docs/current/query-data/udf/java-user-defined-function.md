---
{
    "title": "Java UDF, UDAF, UDWF, UDTF",
    "language": "ja",
    "description": "Apache Doris で Java を使用して UDF、UDAF、UDWF、UDTF のカスタム関数を作成する方法。型の対応、登録構文、ベストプラクティス、使用例を説明します。",
    "keywords": [
        "Doris Java UDF",
        "Java UDAF",
        "Java UDWF",
        "Java UDTF",
        "custom function",
        "User Defined Function",
        "Hive UDF migration",
        "CREATE FUNCTION",
        "Lateral View",
        "static_load",
        "expiration_time"
    ]
}
---

<!-- Knowledge type: Capability definition / Operational steps -->
<!-- Applicable scenario: Extend Doris SQL capabilities with Java, migrate Hive UDFs -->

## 概要

Java UDF は、SQL だけでは直接表現できないビジネスロジックを Java で実装するためのインターフェースです。Apache Doris は、Java で記述する UDF、UDAF、UDWF、UDTF の四種類のカスタム関数をサポートしています。特に断りがない限り、以下ではこれらすべてのユーザー定義関数を UDF と呼びます。

四種類のカスタム関数の定義と代表的な例を以下に示します。

| 種類 | 正式名称 | 動作 | 代表的な関数の例 | 最初にサポートされたバージョン |
| --- | --- | --- | --- | --- |
| UDF | スカラー関数 | 入力行ごとに結果を一行出力する | ABS, LENGTH | すべてのバージョン |
| UDAF | 集約関数 | 複数の入力行を集約し、結果を一行出力する | MIN, MAX, COUNT | すべてのバージョン |
| UDWF | ウィンドウ関数 | ウィンドウ範囲（一行以上）内の各行に対して値を返す | ROW_NUMBER, RANK, DENSE_RANK | すべてのバージョン |
| UDTF | テーブル関数 | 入力行ごとに一行以上を出力する。Lateral View と併用する必要があり、行から列への変換を実装できる | EXPLODE, EXPLODE_SPLIT | Doris 3.0 以降 |

Hive 上にすでに多数のカスタム関数がある場合、Java UDF は書き直さずに Doris へ直接移行できます。

## 適用シナリオ

- ビジネス上、Doris の組み込み関数では対応できないスカラー計算、集約、または行の展開ロジックを SQL で使用する必要がある場合。
- 既存の Hive Java UDF を Doris へ円滑に移行する必要がある場合。
- カスタム関数で辞書やモデルなどの大きなリソースファイルを読み込むか、グローバルな接続プールなどのシングルトンリソースを再利用する場合。

## データ型の対応

Doris のデータ型と Java UDF の入力型・戻り値の型の対応を以下に示します。

| Doris のデータ型 | Java UDF のパラメータ型 |
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
| TimestampNs | LocalDateTime |
| IPV4 / IPV6 | InetAddress |
| UUID | `java.util.UUID` |
| String | String |
| Decimal | BigDecimal |
| `array<Type>` | `ArrayList<Type>`, `List<Type>`（ネスト可能） |
| `map<Type1,Type2>` | `HashMap<Type1,Type2>`, `Map<Type1,Type2>`（ネスト可能） |
| `struct<Type...>` | `ArrayList<Object>`（3.0.0 以降でサポート）、`List<Type>` |
| VarBinary | `byte[]`, `Byte[]`（VarBinary 型は 4.0 以降でサポート。変換を一段階省けるため `byte[]` を推奨） |

:::tip ヒント
`array`、`map`、`struct` 型には、ほかの型をネストできます。たとえば、Doris の `array<array<int>>` に対応する Java UDF のパラメータ型は `ArrayList<ArrayList<Integer>>` です。ほかの型も同様です。`List<Type>` と `Map<Type1,Type2>` の形式は、バージョン 3.1.0 以降でサポートされます。
:::

:::caution 注意
関数を作成するときは、必ず `string` 型を使用し、`varchar` は使用しないでください。そうしないと、関数の実行に失敗する可能性があります。
:::

## 使用上の制限

<!-- Knowledge type: Limitation -->

1. 複合データ型の HLL と Bitmap はサポートされません。
2. `-Xmx` オプションを `JAVA_OPTS` に設定することで、`be.conf` から JVM の最大ヒープサイズを指定できます。デフォルトは 1024 MB です。集約するデータ量が多い場合は、この値を適切に増やしてパフォーマンスを改善し、メモリ不足エラーのリスクを減らしてください。
3. 同じ名前のクラスを読み込む際の JVM の制約により、同名の複数のクラスを UDF の実装として同時に使用しないでください。同じクラス名を使用する UDF を更新するには、クラスパスを再読み込みするために BE を再起動してください。
4. 同名の関数を扱う際の規則は次のとおりです。

    - 組み込み関数とシグネチャが同じカスタム関数を作成できます。デフォルトでは、システムは組み込み関数を優先してマッチングします。
    - 呼び出し時に `database` を明示的に指定した場合（例：`db.function()`）、ユーザー定義関数として識別されます。
    - セッション変数 `prefer_udf_over_builtin` はバージョン 3.0.7 で追加されました。`true` に設定するとユーザー定義関数が優先してマッチングされるため、ほかのシステムから Doris に移行する際に関数名を変更せずに元の動作を維持できます。

## クイックスタート

このセクションでは、Java UDF の開発と登録方法を説明します。参考用のサンプルコードは `samples/doris-demo/java-udf-demo/` ディレクトリにあります。GitHub の [デモ](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo) からも確認できます。

UDF は通常の関数と同じように使用しますが、適用範囲が異なります。

- 組み込み関数の適用範囲はグローバルです。
- UDF の適用範囲はデータベース（DB）内です。

したがって、現在のセッションでデータベースを選択している場合は、UDF 名だけで現在の DB 内の該当する UDF を検索します。選択していない場合は、`dbName.funcName` のように UDF が属するデータベース名を明示する必要があります。

以下の例はすべて `test_table` で確認しています。CREATE TABLE 文は次のとおりです。

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

### Java UDF の例

Java で UDF を記述する場合、主なエントリーポイントは `evaluate` 関数でなければなりません。これは Hive などのほかのエンジンと同じです。次の例では、整数の入力値を一だけ増やす `AddOne` UDF を記述します。

1. Java コードを記述し、JAR ファイルにパッケージ化します。

    ```java
    public class AddOne extends UDF {
        public Integer evaluate(Integer value) {
            return value == null ? null : value + 1;
        }
    }
    ```

2. Doris に Java UDF を登録します。詳しい構文については [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION) を参照してください。

    ```sql
    CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
        "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
        "symbol"="org.apache.doris.udf.AddOne",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

:::caution 注意
`file://` を使用する場合、Doris は `CREATE FUNCTION` 時に FE ノード上の JAR ファイルを読み込んでチェックサムを計算し、実行時には BE ノード上の JAR ファイルを読み込みます。そのため、すべての FE ノードと BE ノードで同じ絶対パスに同じ内容の JAR ファイルを配置する必要があります。ファイルが BE ノードにしかない場合、`CREATE FUNCTION` は失敗します。FE と BE でファイルの内容が異なる場合、実行時にチェックサムの不一致で失敗します。
:::

3. UDF を呼び出します。UDF の呼び出しには、対応するデータベースに対する `SELECT` 権限が必要です。登録済みの UDF を表示するには、[SHOW FUNCTIONS](../../sql-manual/sql-statements/function/SHOW-FUNCTIONS) コマンドを使用します。

    ```sql
    select id,java_udf_add_one(id) from test_table;
    +------+----------------------+
    | id   | java_udf_add_one(id) |
    +------+----------------------+
    |    1 |                    2 |
    |    6 |                    7 |
    +------+----------------------+
    ```

4. UDF が不要になったら、[DROP FUNCTION](../../sql-manual/sql-statements/function/DROP-FUNCTION) コマンドで削除します。

UDF で大きなリソースファイルを読み込む場合や、グローバルな静的変数を定義する場合は、以下の「ベストプラクティス」を参照してください。

### Java UDAF の例

Java で UDAF を記述する場合、必須と記された一連の関数と内部クラス `State` を実装する必要があります。次の二つの例で説明します。

1. 対応する Java UDAF コードを記述し、JAR ファイルにパッケージ化します。

<details>
<summary>例 1：SimpleDemo は sum に似た単純な集約関数を実装します。入力パラメータは INT、出力パラメータは INT です</summary>

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
<summary>例 2：MedianUDAF は中央値を計算します。入力型は (DOUBLE, INT)、出力型は DOUBLE です</summary>

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

2. Doris に Java UDAF を登録します。詳しい構文については [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION) を参照してください。

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Java UDAF を呼び出します。グループごとに集約することも、結果全体を集約することもできます。

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

### Java UDWF の例

Java UDWF のコード構造は Java UDAF とまったく同じです。`reset` インターフェースを追加で実装し、すべての `state` を初期値に戻す必要があります。

```java
void reset(State state)
```

1. Java UDWF のコードを記述し、パッケージ化します（上記と同じ）。

2. Doris に Java UDWF を登録します。登録方法は Java UDAF と同じです。詳しい構文については [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION) を参照してください。

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo_window(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Java UDWF を呼び出し、指定したウィンドウ範囲内の結果を計算します。詳しい構文については [ウィンドウ関数](../window-function.md) を参照してください。

    ```sql
    select id, simple_demo_window(id) over(partition by id order by d1 rows between 1 preceding and 1 following) as res from test_table;
    +------+------+
    | id   | res  |
    +------+------+
    |    1 |    1 |
    |    6 |    6 |
    +------+------+
    ```

### Java UDTF の例

:::tip
UDTF は Doris 3.0 以降でサポートされます。
:::

UDF と同様に、UDTF では `evaluate` メソッドを実装する必要があります。ただし、UDTF の戻り値は Array 型でなければなりません。

1. 対応する Java UDTF コードを記述し、JAR ファイルにパッケージ化します。

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

2. Doris に Java UDTF を登録します。登録すると同時に二つの UDTF が作成されます。関数名に `_outer` サフィックスが付いたものは、結果がゼロ行になる場合を特別に処理します。詳しくは [OUTER コンビネーター](../../sql-manual/sql-functions/table-functions/explode-numbers) を参照してください。構文の詳細については [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION) を参照してください。

    ```sql
    CREATE TABLES FUNCTION java_utdf(string, string) RETURNS array<string> PROPERTIES (
        "file"="file:///pathTo/java-udtf.jar",
        "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Java UDTF を呼び出します。Doris で UDTF を使用するには、[Lateral View](../lateral-view.md) と組み合わせて行から列への変換を行う必要があります。

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

## ベストプラクティス：静的変数の読み込み

<!-- Knowledge type: Best practice -->
<!-- Applicable scenario: UDFs that load large resource files / reuse singleton resources such as connection pools -->

Doris で UDF を実行する際（例：`select udf(col) from table`）、並列に動作する各 Instance は `udf.jar` を一回読み込み、Instance の終了時にアンロードします。

この動作により、主に次の二つの問題が生じます。

- `udf.jar` が数百 MB のリソースファイルを読み込む場合、並列実行によってメモリ使用量が急増し、OOM が発生しやすくなります。
- 接続プールなど、`static` ブロックで一回だけ初期化する必要があるオブジェクトを使用したくても、現在の並列実行モデルでは実現できません。

以下に二つの解決策を示します。解決策 2 には Doris の branch-3.0 以降が必要です。

### 解決策 1：リソース JAR を分離する

リソースを読み込むコードを別の JAR に分離し、ほかのビジネスロジック用 JAR からそのリソース JAR を参照します。

コードを `DictLibrary`（リソースクラス）と `FunctionUdf`（ビジネスクラス）の二つのファイルに分割したとします。

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

手順は次のとおりです。

1. `DictLibrary` ファイルを個別にコンパイルし、独立したリソース JAR `DictLibrary.jar` を生成します。

    ```shell
    javac   ./DictLibrary.java
    jar -cf ./DictLibrary.jar ./DictLibrary.class
    ```

2. 前の手順で作成したリソースパッケージを依存関係として参照しながら `FunctionUdf` ファイルをコンパイルし、UDF のビジネスロジック用パッケージ `FunctionUdf.jar` を生成します。

    ```shell
    javac -cp ./DictLibrary.jar  ./FunctionUdf.java
    jar  -cvf ./FunctionUdf.jar  ./FunctionUdf.class
    ```

3. 並列実行するすべての Instance でリソース JAR を共有するため、JVM から直接読み込ませます。指定のパス `be/custom_lib` に配置してください。BE サービスの再起動後、JVM の起動時に読み込まれ、サービスの停止時に解放されます。

4. 最後に `CREATE FUNCTION` 文で UDF を作成します。Instance がアンロードされるたびに、`FunctionUdf.jar` だけがアンロードされます。

    ```sql
    CREATE FUNCTION java_udf_dict(string) RETURNS string PROPERTIES (
        "file"="file:///pathTo/FunctionUdf.jar",
        "symbol"="org.apache.doris.udf.FunctionUdf",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

### 解決策 2：BE のグローバル JAR キャッシュ

BE は JAR をグローバルにキャッシュし、有効期限をカスタマイズできます。`CREATE FUNCTION` の実行時に、次の二つのプロパティを追加します。

| プロパティ | 説明 | デフォルト値 |
| --- | --- | --- |
| `static_load` | 静的キャッシュによる読み込みを使用するかどうか | `false` |
| `expiration_time` | JAR の有効期限（分） | `360` |

- `expiration_time` はバージョン 4.1.1 より後に削除されます。

動作の仕組みは次のとおりです。

- 静的キャッシュによる読み込みを有効にすると、初回呼び出し時の初期化が完了した後、UDF の Instance がキャッシュされます。
- 以降の UDF 呼び出しでは、最初にキャッシュを確認します。キャッシュにない場合は、必要な初期化を実行します。
- Drop Function を実行すると、キャッシュから削除されます。

コード例：

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
    "static_load" = "true" // default value is false
);
```

実行結果の値は増え続けます。これは読み込んだ JAR がアンロードも再読み込みもされていないことを示します（再読み込みされた場合、変数は 0 に再初期化されます）。

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
