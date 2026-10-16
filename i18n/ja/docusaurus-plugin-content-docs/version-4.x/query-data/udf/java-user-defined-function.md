---
{
    "title": "Java UDF、UDAF、UDWF、UDTF",
    "language": "ja",
    "description": "Apache DorisでJavaを使用してUDF、UDAF、UDWF、UDTFのカスタム関数を作成する方法。型の対応関係、登録構文、ベストプラクティス、例を説明します。",
    "keywords": [
        "Doris Java UDF",
        "Java UDAF",
        "Java UDWF",
        "Java UDTF",
        "カスタム関数",
        "ユーザー定義関数",
        "Hive UDFの移行",
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

Java UDFは、Javaでカスタム関数を作成するためのインターフェースを提供します。これにより、SQLでは直接表現できないビジネスロジックをJavaで実装できます。Apache Dorisは、Javaで記述するUDF、UDAF、UDWF、UDTFの四種類のカスタム関数をサポートします。以下では、特に断りがない限り、UDFという用語をすべてのユーザー定義関数の総称として使用します。

四種類のカスタム関数の定義と代表例を次に示します。

| 種類 | 正式名称 | 動作 | 代表的な関数 | 最初にサポートされたバージョン |
| --- | --- | --- | --- | --- |
| UDF | スカラー関数 | 入力行ごとに一行の結果を返す | ABS, LENGTH | すべてのバージョン |
| UDAF | 集約関数 | 複数の入力行を集約し、一行の結果を返す | MIN, MAX, COUNT | すべてのバージョン |
| UDWF | ウィンドウ関数 | ウィンドウ範囲内の各行に対して値を返す（範囲は一行以上） | ROW_NUMBER, RANK, DENSE_RANK | すべてのバージョン |
| UDTF | テーブル関数 | 入力行ごとに一行以上を返す。Lateral Viewと組み合わせて使用する必要があり、行から列への変換を実装できる | EXPLODE, EXPLODE_SPLIT | Doris 3.0以降 |

Hive上に多数のカスタム関数がすでにある場合、Java UDFは書き直さずにDorisへ直接移行できます。

## 適用シナリオ

- Dorisの組み込み関数では対応できないスカラー計算、集約、行展開のロジックをSQLで実行する場合。
- 既存のHive Java UDFをDorisへ移行する場合。
- カスタム関数で辞書やモデルなどの大きなリソースファイルを読み込む場合、またはグローバルな接続プールなどのシングルトンリソースを再利用する場合。

## データ型の対応関係

Dorisのデータ型と、Java UDFの入力型および戻り値の型との対応を次の表に示します。

| Dorisのデータ型 | Java UDFのパラメータ型 |
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
| `array<Type>` | `ArrayList<Type>`, `List<Type>`（ネスト可能） |
| `map<Type1,Type2>` | `HashMap<Type1,Type2>`, `Map<Type1,Type2>`（ネスト可能） |
| `struct<Type...>` | `ArrayList<Object>`（3.0.0以降でサポート）、`List<Type>` |
| VarBinary | `byte[]`, `Byte[]`（VarBinary型は4.0以降でサポート。変換処理が一段階少ないため、`byte[]`を推奨） |

:::tip ヒント
`array`、`map`、`struct`型には、ほかの型をネストできます。たとえば、Dorisの`array<array<int>>`に対応するJava UDFのパラメータ型は`ArrayList<ArrayList<Integer>>`です。ほかの型も同様です。`List<Type>`形式と`Map<Type1,Type2>`形式は、バージョン3.1.0以降でサポートされます。
:::

:::caution 注意
関数を作成する際は、必ず`string`型を使用し、`varchar`型は使用しないでください。そうしないと、関数の実行に失敗する場合があります。
:::

## 使用上の制限

<!-- Knowledge type: Limitation -->

1. 複合データ型のHLLとBitmapはサポートされません。
2. JVMの最大ヒープサイズは、`-Xmx`を`JAVA_OPTS`（`be.conf`内）に指定して設定できます。デフォルトは1024 MBです。集約するデータ量が多い場合は、パフォーマンスを改善し、メモリ不足エラーのリスクを減らすために、適切に増やしてください。
3. JVMでは同じ名前のクラスを読み込む際に制約があるため、同名の複数のクラスをUDFの実装として同時に使用しないでください。同じクラス名を使うUDFを更新する場合は、クラスパスを再読み込みするためにBEを再起動してください。
4. 同名の関数を扱う際の規則は次のとおりです。

    - 組み込み関数とシグネチャが同じカスタム関数を作成できます。デフォルトでは、組み込み関数が優先して照合されます。
    - 呼び出し時に`database`を明示すると（例：`db.function()`）、ユーザー定義関数として識別されます。
    - セッション変数`prefer_udf_over_builtin`はバージョン3.0.7で追加されました。`true`に設定すると、ユーザー定義関数が優先して照合されます。これにより、関数名を変更せずにほかのシステムからDorisへ移行する際、元の関数の動作を維持できます。

## クイックスタート

このセクションでは、Java UDFの開発と登録の方法を説明します。参考用のサンプルコードは`samples/doris-demo/java-udf-demo/`ディレクトリにあり、GitHubの[デモ](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo)でも確認できます。

UDFの使い方は通常の関数と同じですが、適用範囲が異なります。

- 組み込み関数の適用範囲はグローバルです。
- UDFの適用範囲はデータベース（DB）内です。

そのため、現在のセッションでデータベースを選択している場合は、UDF名だけで現在のDB内の対応するUDFを参照できます。データベースを選択していない場合は、`dbName.funcName`のように、UDFが属するデータベース名を明示する必要があります。

以下の例はすべて`test_table`で動作確認しています。CREATE TABLE文は次のとおりです。

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

### Java UDFの例

JavaでUDFを作成する場合、主なエントリーポイントは`evaluate`関数でなければなりません。これはHiveなどのほかのエンジンと同じです。次の例では、入力した整数を一つ増やす`AddOne` UDFを作成します。

1. Javaコードを作成し、JARファイルにパッケージ化します。

    ```java
    public class AddOne extends UDF {
        public Integer evaluate(Integer value) {
            return value == null ? null : value + 1;
        }
    }
    ```

2. Java UDFをDorisに登録します。構文の詳細は[CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)を参照してください。

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
`file://`を使用する場合、Dorisは`CREATE FUNCTION`の実行時にFEノード上のJARファイルを読み込んでチェックサムを計算し、関数の実行時にBEノード上のJARファイルを読み込みます。そのため、すべてのFEノードとBEノードの同じ絶対パスに、内容が同一のJARファイルを配置する必要があります。BEノードにしかファイルがない場合、`CREATE FUNCTION`は失敗します。FEノードとBEノードでファイルの内容が異なる場合、チェックサムの不一致によって実行に失敗します。
:::

3. UDFを呼び出します。UDFを呼び出すには、対応するデータベースの`SELECT`権限が必要です。登録済みのUDFを確認するには、[SHOW FUNCTIONS](../../sql-manual/sql-statements/function/SHOW-FUNCTIONS)コマンドを使用します。

    ```sql
    select id,java_udf_add_one(id) from test_table;
    +------+----------------------+
    | id   | java_udf_add_one(id) |
    +------+----------------------+
    |    1 |                    2 |
    |    6 |                    7 |
    +------+----------------------+
    ```

4. UDFが不要になったら、[DROP FUNCTION](../../sql-manual/sql-statements/function/DROP-FUNCTION)コマンドで削除します。

UDFで大きなリソースファイルを読み込む場合や、グローバルな静的変数を定義する場合は、後述の「ベストプラクティス」を参照してください。

### Java UDAFの例

JavaでUDAFを作成する場合は、必須と示された一連の関数と内部クラス`State`を実装する必要があります。次の二つの例で説明します。

1. 対応するJava UDAFコードを作成し、JARファイルにパッケージ化します。

<details>
<summary>例1：SimpleDemoは、入力パラメータがINT、出力パラメータがINTの、sumに似た単純な集約関数を実装します</summary>

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
<summary>例2：MedianUDAFは中央値を計算します。入力型は（DOUBLE, INT）、出力型はDOUBLEです</summary>

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

2. Java UDAFをDorisに登録します。構文の詳細は[CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)を参照してください。

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Java UDAFを呼び出します。グループごとに集約することも、結果全体を集約することもできます。

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

### Java UDWFの例

Java UDWFのコード構造はJava UDAFとまったく同じです。追加で`reset`インターフェースを実装し、すべての`state`を初期値に戻す必要があります。

```java
void reset(State state)
```

1. Java UDWFコードを作成してパッケージ化します（上記と同様）。

2. Java UDWFをDorisに登録します。登録方法はJava UDAFと同じです。構文の詳細は[CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)を参照してください。

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo_window(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Java UDWFを呼び出し、指定したウィンドウ範囲内の結果を計算します。構文の詳細は[ウィンドウ関数](../window-function.md)を参照してください。

    ```sql
    select id, simple_demo_window(id) over(partition by id order by d1 rows between 1 preceding and 1 following) as res from test_table;
    +------+------+
    | id   | res  |
    +------+------+
    |    1 |    1 |
    |    6 |    6 |
    +------+------+
    ```

### Java UDTFの例

:::tip
UDTFはDoris 3.0以降でサポートされます。
:::

UDFと同様に、UDTFでも`evaluate`メソッドを実装する必要があります。ただし、UDTFの戻り値はArray型でなければなりません。

1. 対応するJava UDTFコードを作成し、JARファイルにパッケージ化します。

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

2. Java UDTFをDorisに登録します。登録時には二つのUDTFが同時に作成されます。関数名に`_outer`サフィックスが付いたものは、結果が空になる場合を特別に処理します。詳細は[OUTERコンビネータ](../../sql-manual/sql-functions/table-functions/explode-numbers)を参照してください。構文の詳細は[CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)を参照してください。

    ```sql
    CREATE TABLES FUNCTION java_utdf(string, string) RETURNS array<string> PROPERTIES (
        "file"="file:///pathTo/java-udtf.jar",
        "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Java UDTFを呼び出します。DorisでUDTFを使用するには、[Lateral View](../lateral-view.md)と組み合わせて行から列への変換を行う必要があります。

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

DorisでUDFを実行すると（例：`select udf(col) from table`）、並列実行される各Instanceは`udf.jar`を一度読み込み、そのInstanceが終了したときにアンロードします。

これにより、主に次の二つの問題が生じます。

- `udf.jar`が数百MBのリソースファイルを読み込む場合、並列実行によってメモリ使用量が急増し、OOMが発生しやすくなります。
- 接続プールなどのオブジェクトを`static`ブロックで一度だけ初期化したい場合、現在の並列実行モデルでは実現できません。

以下に二つの解決方法を示します。方法2には、Dorisのbranch-3.0以降が必要です。

### 方法1：リソースJARを分離する

リソースを読み込むコードを別のJARに分離し、ほかの業務用JARからそのリソースJARを参照します。

コードを`DictLibrary`（リソースクラス）と`FunctionUdf`（業務用クラス）の二つのファイルに分けたとします。

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

1. `DictLibrary`ファイルを個別にコンパイルし、独立したリソースJAR `DictLibrary.jar`を生成します。

    ```shell
    javac   ./DictLibrary.java
    jar -cf ./DictLibrary.jar ./DictLibrary.class
    ```

2. 前の手順で作成したリソースパッケージを依存関係として参照し、`FunctionUdf`ファイルをコンパイルして、UDFの業務用パッケージ`FunctionUdf.jar`を作成します。

    ```shell
    javac -cp ./DictLibrary.jar  ./FunctionUdf.java
    jar  -cvf ./FunctionUdf.jar  ./FunctionUdf.class
    ```

3. 並列実行されるすべてのInstanceでリソースJARを共有できるよう、JVMに直接読み込ませます。指定されたパス`be/custom_lib`に配置してください。BEサービスの再起動後、JVMの起動時に読み込まれ、サービスの停止時に解放されます。

4. 最後に、`CREATE FUNCTION`文でUDFを作成します。Instanceが終了するたびに、`FunctionUdf.jar`だけがアンロードされます。

    ```sql
    CREATE FUNCTION java_udf_dict(string) RETURNS string PROPERTIES (
        "file"="file:///pathTo/FunctionUdf.jar",
        "symbol"="org.apache.doris.udf.FunctionUdf",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

### 方法2：BEのグローバルJARキャッシュ

BEはJARをグローバルにキャッシュし、有効期限を設定できます。`CREATE FUNCTION`を実行するときに、次の二つのプロパティを追加します。

| プロパティ | 説明 | デフォルト値 |
| --- | --- | --- |
| `static_load` | 静的キャッシュ読み込み方式を使用するかどうか | `false` |
| `expiration_time` | JARの有効期限（分） | `360` |

- `expiration_time`はバージョン4.1.1より後に削除されます。

動作は次のとおりです。

- 静的キャッシュ読み込みを有効にすると、最初の呼び出しで初期化された後、UDFのInstanceがキャッシュされます。
- 以降のUDF呼び出しでは、まずキャッシュを確認し、見つからなければ必要な初期化を実行します。
- DROP FUNCTIONを実行すると、キャッシュから削除されます。

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
    "static_load" = "true", // default value is false
    "expiration_time" = "60" // default value is 360 minutes
);
```

実行結果の値が増え続けることから、読み込まれたJARがアンロードされず、再読み込みもされていないことが分かります。再読み込みされていれば、変数は0に初期化されます。

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
