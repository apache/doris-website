---
{
  "title": "Java UDF、UDAF、UDWF、UDTF",
  "description": "Java UDFは、ユーザーがJavaプログラミング言語を使用してユーザー定義関数（UDF）を便利に実装するためのJavaインターフェースを提供します。",
  "language": "ja"
}
---
## 概要
Java UDFは、Javaプログラミング言語を使用してユーザー定義関数（UDF）を便利に実装するためのJavaインターフェースを提供します。
DorisはJavaを使用してUDF、UDAF、UDTFの開発をサポートします。特に指定がない限り、以下のテキストの「UDF」はすべての種類のユーザー定義関数を指します。

1. Java UDF：Java UDFは一般的に使用されるスカラー関数で、各入力行に対応する出力行を生成します。一般的な例にはABSやLENGTHがあります。特に、Hive UDFはDorisに直接移行できるため、ユーザーにとって便利です。

2. Java UDAF：Java UDAFは複数の入力行を単一の出力行に集約するユーザー定義集約関数です。一般的な例にはMIN、MAX、COUNTがあります。

3. Java UDWF：User-Defined Window Functionの略で、ウィンドウ（1つまたは複数の行）に基づいて各行の計算値を返します。一般的な例にはROW_NUMBER、RANK、DENSE_RANKがあります。

4. Java UDTF：Java UDTFはユーザー定義table関数で、単一の入力行から1つまたは複数の出力行を生成できます。DorisではUDTFはLateral Viewと組み合わせて使用し、行から列への変換を実現する必要があります。一般的な例にはEXPLODEやEXPLODE_SPLITがあります。**Java UDTFはバージョン3.0.0以降で利用可能です。**

## 型の対応

| タイプ                  | UDF Argument タイプ            |
|-----------------------|------------------------------|
| Bool                  | Boolean                      |
| TinyInt               | Byte                         |
| SmallInt              | Short                        |
| Int                   | Integer                      |
| BigInt                | Long                         |
| LargeInt              | BigInteger                   |
| Float                 | Float                        |
| Double                | Double                       |
| Date                  | LocalDate                    |
| Datetime              | LocalDateTime                |
| IPV4/IPV6             | InetAddress                  |
| String                | String                       |
| Decimal               | BigDecimal                   |
| `array<Type>`         | `ArrayList<Type>` or `List<Type>`          |
| `map<Type1,Type2>`    | `HashMap<Type1,Type2>`or`Map<Type1,Type2>`     |
| `struct<Type...>`     | `ArrayList<Object>` (from version 3.0.0) or`List<Object>`|
| VarBinary     | byte[], Byte[] (The VARBINARY type is supported starting from version 4.0; prefer using byte[] to avoid an extra conversion layer.) |

:::tip
`array/map/struct`型は他の型とネストできます。例えば、Doris：`array<array<int>>`はJAVA UDF Argument タイプ：`ArrayList<ArrayList<Integer>>`に対応します。他の型も同様のパターンに従います。
また、`List`、`Map`クラスはバージョン3.1.0からサポートされています
:::

:::caution Warning
関数を作成する際は、`string`の代わりに`varchar`を使用することを避けてください。これにより関数が失敗する可能性があります。
:::

## 使用上の注意

1. 複合データ型（HLL、Bitmap）はサポートされていません。

2. ユーザーは現在、JVMヒープサイズの最大値を指定できます。設定項目は`be.conf`の`JAVA_OPTS`の`-Xmx`部分です。デフォルトは1024mです。データを集約する必要がある場合は、パフォーマンスを向上させ、メモリオーバーフローのリスクを減らすために、この値を増やすことをお勧めします。

3. 同名のクラスをロードするJVMの問題により、同じ名前の複数のクラスをUDF実装として同時に使用しないでください。同じ名前のクラスでUDFを更新したい場合は、BEを再起動してclasspathを再ロードする必要があります。

4. 同名関数

    ユーザーはビルトイン関数とまったく同じシグネチャを持つUDFを作成できます。デフォルトでは、システムはビルトイン関数を優先してマッチングします。ただし、関数を使用する際に`database`を指定した場合（つまり、`db.function()`）、強制的にユーザー定義関数として扱われます。

    バージョン3.0.7では、新しいセッション変数`prefer_udf_over_builtin`が追加されました。これを`true`に設定すると、ユーザー定義関数を優先してマッチングし、ユーザーが他のシステムからDorisに移行する際に、関数名を変更することなくカスタム関数を通じて元のシステムの関数動作を維持することが容易になります。

## 開始方法
このセクションでは主にJava UDFの開発方法を紹介します。例は参考用に`samples/doris-demo/java-udf-demo/`で提供されています。詳細を確認するには[こちら](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo)をクリックしてください。

UDFの使用方法は標準関数と同じですが、主な違いはビルトイン関数がグローバルスコープを持つのに対し、UDFはDB内でスコープされることです。

セッションがデータベース内でリンクされている場合、UDF名を直接使用すると、現在のDB内で対応するUDFを検索します。そうでない場合、ユーザーはUDFのデータベース名を明示的に指定する必要があります。例：`dbName.funcName`。

以下のセクションでは、例として`test_table`tableを使用します。対応するtable作成スクリプトは次のとおりです：

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
### Java-UDF Example の紹介
JavaでUDFを書く際、メインエントリーポイントは`evaluate`関数である必要があります。これはHiveなどの他のエンジンと一致しています。この例では、整数入力に対してインクリメント演算を実行する`AddOne` UDFを書きます。

1. 対応するJavaコードを書き、JARファイルにパッケージ化します。

    ```java
    public class AddOne extends UDF {
        public Integer evaluate(Integer value) {
            return value == null ? null : value + 1;
        }
    }
    ```
2. DorisでJava-UDF関数を登録・作成します。構文の詳細については、[CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)を参照してください。

    ```sql
    CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
        "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
        "symbol"="org.apache.doris.udf.AddOne",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```
3. UDFを利用するには、ユーザーは対応するデータベースに対する`SELECT`権限を持つ必要があります。また、UDFの登録が成功したことを確認するには、[SHOW FUNCTIONS](../../sql-manual/sql-statements/function/SHOW-FUNCTIONS)コマンドを使用できます。

    ``` sql
    select id,java_udf_add_one(id) from test_table;
    +------+----------------------+
    | id   | java_udf_add_one(id) |
    +------+----------------------+
    |    1 |                    2 |
    |    6 |                    7 |
    +------+----------------------+
    ```
4. UDFが不要になった場合は、[DROP FUNCTION](../../sql-manual/sql-statements/function/DROP-FUNCTION)で詳しく説明されているように、以下のコマンドを使用して削除できます。

さらに、UDFで大きなリソースファイルの読み込みやグローバル静的変数の定義が必要な場合は、このドキュメントの後半で説明されている静的変数の読み込み方法を参照できます。

### Java-UDAF例の紹介

Javaを使用して`UDAF`を記述する場合、実装する必要がある関数（必須としてマークされている）と内部クラスStateがいくつかあります。以下の例では、それらの実装方法を説明します。

1. 対応するJava UDAFコードを記述し、JARファイルにパッケージ化します。

<details>
<summary> 例1：SimpleDemoはsumに似た単純な関数を実装します。入力パラメータはINTで、出力パラメータはINTです。</summary>

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
    public void serialize(State state, DataOutputStream out) throws Exception {
        /* serialize some data into buffer */
        out.writeInt(state.sum);
    }

    /*required*/
    public void deserialize(State state, DataInputStream in) throws Exception {
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
<summary> 例2: MedianUDAFは中央値を計算する関数です。入力型は (DOUBLE, INT) で、出力型は DOUBLE です。 </summary>

```java
package org.apache.doris.udf.demo;  

import java.io.DataInputStream;  
import java.io.DataOutputStream;
import java.io.IOException;
import java.math.BigDecimal;  
import java.util.Arrays;  
import java.util.logging.Logger;  

/* UDAF to calculate the median */  
public class MedianUDAF {  
    Logger log = Logger.getLogger("MedianUDAF");  

    // State storage  
    public static class State {  
        // Precision of the return result  
        int scale = 0;  
        // Whether it is the first time to execute the add method for a certain aggregation condition under a certain tablet  
        boolean isFirst = true;  
        // Data storage  
        public StringBuilder stringBuilder;  
    }  

    // Initialize the state  
    public State create() {  
        State state = new State();  
        // Pre-initialize based on the amount of data that needs to be aggregated under each aggregation condition of each tablet to increase performance  
        state.stringBuilder = new StringBuilder(1000);  
        return state;  
    }  

    // Process each data under respective aggregation conditions for each tablet  
    public void add(State state, Double val, int scale) {  
        if (val != null && state.isFirst) {  
            state.stringBuilder.append(scale).append(",").append(val).append(",");  
            state.isFirst = false;  
        } else if (val != null) {  
            state.stringBuilder.append(val).append(",");  
        }  
    }  

    // Data needs to be output for aggregation after processing  
    public void serialize(State state, DataOutputStream out) throws IOException {  
        // Currently, only DataOutputStream is provided. If serialization of objects is required, methods such as concatenating strings, converting to JSON, or serializing into byte arrays can be considered  
        // If the State object needs to be serialized, it may be necessary to implement a serialization interface for the State inner class  
        // Ultimately, everything needs to be transmitted via DataOutputStream  
        out.writeUTF(state.stringBuilder.toString());  
    }  

    // Obtain the output data from the data processing execution unit  
    public void deserialize(State state, DataInputStream in) throws IOException {  
        String string = in.readUTF();  
        state.scale = Integer.parseInt(String.valueOf(string.charAt(0)));  
        StringBuilder stringBuilder = new StringBuilder(string.substring(2));  
        state.stringBuilder = stringBuilder;   
    }  

    // The aggregation execution unit merges the processing results of data under certain aggregation conditions for a given key. The state1 parameter is the initialized instance during the first merge of each key  
    public void merge(State state1, State state2) {  
        state1.scale = state2.scale;  
        state1.stringBuilder.append(state2.stringBuilder.toString());  
    }  

    // Output the final result after merging the data for each key  
    public Double getValue(State state) {  
        String[] strings = state.stringBuilder.toString().split(",");  
        double[] doubles = new double[strings.length];  
        for (int i = 0; i < strings.length - 1; i++) {  
            doubles[i] = Double.parseDouble(strings[i + 1]);  
        }  

        Arrays.sort(doubles);  
        double n = doubles.length;  
        if (n == 0) {  
            return 0.0;  
        }  
        double index = (n - 1) / 2.0;  

        int low = (int) Math.floor(index);  
        int high = (int) Math.ceil(index);  

        double value = low == high ? (doubles[low] + doubles[high]) / 2 : doubles[high];  

        BigDecimal decimal = new BigDecimal(value);  
        return decimal.setScale(state.scale, BigDecimal.ROUND_HALF_UP).doubleValue();  
    }  

    // Executed after each execution unit completes  
    public void destroy(State state) {  
    }  
}
```
</details>


2. DorisでJava-UDAF関数を登録・作成します。詳細な構文については、[CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)を参照してください。

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```
3. Java-UDAFを使用する場合、グループ化による集約、またはすべての結果を集約することで集約を実行できます：

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
### Java-UDTF例の紹介

### Java-UDWF例の紹介

1. 実装はJava UDAFと似ていますが、状態をクリアするための追加のreset()メソッドが必要です。

    ```JAVA
    void reset(State state)
    ```
2. DorisのUDAFと同様にJava-UDWF関数を登録・作成します。構文の詳細については、[CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)を参照してください。

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo_window(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```
3. Java UDWFは特定のウィンドウフレーム内で計算結果をクエリすることを可能にします。詳細な構文については、[Window ファンクション](../window-function.md)を参照してください。

    ```sql
    select id, simple_demo_window(id) over(partition by id order by d1 rows between 1 preceding and 1 following) as res from test_table;
        +------+------+
        | id   | res  |
        +------+------+
        |    1 |    1 |
        |    6 |    6 |
        +------+------+
    ```
:::tip
UDTFはDorisバージョン3.0から対応しています。
:::

1. UDFと同様に、UDTFではユーザーが`evaluate`メソッドを実装する必要があります。ただし、UDTFの戻り値はArray型である必要があります。

    ```JAVA
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
2. DorisでJava-UDTF関数を登録・作成します。2つのUDTF関数が登録されます。DorisのTable関数は`_outer`サフィックスにより異なる動作を示す場合があります。詳細については、[OUTER combinator](../../sql-manual/sql-functions/table-functions/explode-numbers)を参照してください。
構文の詳細については、[CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)を参照してください。

    ```sql
    CREATE TABLES FUNCTION java-utdf(string, string) RETURNS array<string> PROPERTIES (
        "file"="file:///pathTo/java-udtf.jar",
        "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```
3. Java-UDTFを使用する場合、DorisではUDTFは行から列への変換効果を実現するために[`Lateral View`](../lateral-view.md)と組み合わせて使用する必要があります：

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
## ベストプラクティス

*静的変数の読み込み*

現在、Dorisでは、UDF関数の実行、例えば `select udf(col) from table` では、各並行インスタンスに対してudf.jarパッケージを読み込み、インスタンスが終了するときにudf.jarパッケージをアンロードします。

udf.jarファイルが数百MBのファイルを読み込む必要がある場合、並行性により メモリ使用量が急激に増加し、OOM (Out of Memory) を引き起こす可能性があります。

また、コネクションプールを使用したい場合、このアプローチでは静的領域で一度だけ初期化することができません。

2つの解決策があります。2番目の解決策にはDorisバージョンbranch-3.0以上が必要です。

*解決策1:*

解決策は、リソース読み込みコードを分割し、別個のjarパッケージを生成し、他のパッケージがこのリソースjarパッケージを直接参照するようにすることです。

ファイルが `DictLibrary` と `FunctionUdfAR` に分割されたと仮定します。

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
1. DictLibraryファイルを個別にコンパイルして独立したjarパッケージを生成し、リソースファイルDictLibrary.jarを作成します：

    ```shell
    javac ./DictLibrary.java
    jar -cf ./DictLibrary.jar ./DictLibrary.class
    ```
2. 次に、前のステップのリソースパッケージを直接参照してFunctionUdfファイルをコンパイルし、FunctionUdf.jarパッケージを生成します：

    ```shell
    javac -cp ./DictLibrary.jar ./FunctionUdf.java
    jar -cvf ./FunctionUdf.jar ./FunctionUdf.class
    ```
3. 上記の2つのステップの後、2つのjarパッケージが取得されます。リソースjarパッケージがすべての並行インスタンスから参照できるようにするため、デプロイメントパス`be/custom_lib`に配置してください。再起動後、JVM起動時にロードされます。その結果、サービス開始時にリソースがロードされ、サービス停止時に解放されます。

4. 最後に、`create function`文を使用してUDF関数を作成します。

   ```sql
   CREATE FUNCTION java_udf_dict(string) RETURNS string PROPERTIES (
    "file"="file:///pathTo/FunctionUdf.jar",
    "symbol"="org.apache.doris.udf.FunctionUdf",
    "always_nullable"="true",
    "type"="JAVA_UDF"
   );
   ```
*解決方法2:*

BE（Backend）はJARファイルをグローバルにキャッシュし、有効期限と削除時間をカスタマイズします。関数を作成する際、2つの追加プロパティが追加されます：

static_load：静的キャッシュローディング方法を使用するかどうかを定義します。
expiration_time：JARファイルの有効期限を分単位で定義します。

静的キャッシュローディング方法が使用される場合、UDFインスタンスは最初の呼び出しと初期化後にキャッシュされます。その後のUDF呼び出しでは、システムは最初にキャッシュを検索します。見つからない場合、初期化プロセスがトリガーされます。

さらに、バックグラウンドスレッドが定期的にキャッシュをチェックします。設定された有効期限内に関数が呼び出されていない場合、キャッシュから削除されます。関数が呼び出された場合、キャッシュのタイムスタンプが自動的に更新されます。

```sql
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
ご覧のとおり、結果は増加し続けており、これは読み込まれたJARファイルがアンロードおよび再ロードされていないことを証明しています。代わりに、変数が0に再初期化されています。

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
