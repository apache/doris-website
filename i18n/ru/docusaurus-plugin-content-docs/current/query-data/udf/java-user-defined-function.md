---
{
    "title": "Java UDF, UDAF, UDWF, UDTF",
    "language": "ru",
    "description": "Как писать пользовательские функции UDF, UDAF, UDWF и UDTF на Java в Apache Doris: сопоставление типов, синтаксис регистрации, рекомендации и примеры.",
    "keywords": [
        "Doris Java UDF",
        "Java UDAF",
        "Java UDWF",
        "Java UDTF",
        "собственная функция",
        "пользовательская функция",
        "миграция UDF из Hive",
        "CREATE FUNCTION",
        "Lateral View",
        "static_load",
        "expiration_time"
    ]
}
---

<!-- Knowledge type: Capability definition / Operational steps -->
<!-- Applicable scenario: Extend Doris SQL capabilities with Java, migrate Hive UDFs -->

## Обзор {#overview}

Java UDF предоставляет интерфейс для написания пользовательских функций на Java, позволяя удобно реализовывать бизнес-логику, которую невозможно выразить непосредственно на SQL. Apache Doris поддерживает четыре типа пользовательских функций на Java: UDF, UDAF, UDWF и UDTF. Если не указано иное, ниже термин UDF обозначает все пользовательские функции.

Определения и типичные примеры этих четырёх типов пользовательских функций приведены в таблице:

| Тип | Полное название | Поведение | Типичные примеры функций | Первая поддерживаемая версия |
| --- | --- | --- | --- | --- |
| UDF | Скалярная функция | Возвращает одну строку результата для каждой входной строки | ABS, LENGTH | Все версии |
| UDAF | Агрегатная функция | Агрегирует несколько входных строк и возвращает одну строку результата | MIN, MAX, COUNT | Все версии |
| UDWF | Оконная функция | Возвращает значение для каждой строки в пределах окна (одна или несколько строк) | ROW_NUMBER, RANK, DENSE_RANK | Все версии |
| UDTF | Табличная функция | Возвращает одну или несколько строк для каждой входной строки; должна использоваться с Lateral View, позволяет преобразовывать строки в столбцы | EXPLODE, EXPLODE_SPLIT | Doris 3.0 и новее |

Если у вас уже накоплено большое количество пользовательских функций в Hive, Java UDF можно перенести непосредственно в Doris без переписывания.

## Сценарии применения {#applicable-scenarios}

- Бизнес-задача требует скалярных вычислений, агрегации или развёртывания строк в SQL, которые не покрываются встроенными функциями Doris.
- Существующие Java UDF из Hive необходимо беспрепятственно перенести в Doris.
- Пользовательским функциям требуется загружать большие файлы ресурсов (например, словари или модели) либо повторно использовать ресурсы, существующие в единственном экземпляре, такие как глобальный пул соединений.

## Сопоставление типов данных {#data-type-mapping}

В следующей таблице приведено соответствие между типами данных Doris и типами входных параметров и возвращаемых значений Java UDF:

| Тип данных Doris | Тип параметра Java UDF |
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
| `array<Type>` | `ArrayList<Type>`, `List<Type>` (поддерживается вложенность) |
| `map<Type1,Type2>` | `HashMap<Type1,Type2>`, `Map<Type1,Type2>` (поддерживается вложенность) |
| `struct<Type...>` | `ArrayList<Object>` (поддерживается начиная с 3.0.0), `List<Type>` |
| VarBinary | `byte[]`, `Byte[]` (тип VarBinary поддерживается начиная с 4.0; рекомендуется использовать `byte[]`, поскольку это позволяет избежать дополнительного преобразования) |

:::tip Совет
Типы `array`, `map` и `struct` могут содержать вложенные значения других типов. Например, типу `array<array<int>>` в Doris соответствует тип параметра Java UDF `ArrayList<ArrayList<Integer>>`; для других типов действует тот же принцип. Формы `List<Type>` и `Map<Type1,Type2>` поддерживаются начиная с версии 3.1.0.
:::

:::caution Примечание
При создании функции всегда используйте тип `string` вместо `varchar`, иначе выполнение функции может завершиться ошибкой.
:::

## Ограничения использования {#usage-limitations}

<!-- Knowledge type: Limitation -->

1. Сложные типы данных HLL и Bitmap не поддерживаются.
2. Максимальный размер кучи JVM можно задать самостоятельно с помощью параметра `-Xmx` в `JAVA_OPTS` файла `be.conf`; значение по умолчанию составляет 1024 МБ. При большом объёме агрегируемых данных увеличьте это значение, чтобы повысить производительность и снизить риск ошибок нехватки памяти.
3. Из-за ограничения JVM на загрузку классов с одинаковыми именами нельзя одновременно использовать несколько одноимённых классов в качестве реализаций UDF. Чтобы обновить UDF, сохранив имя класса, перезапустите BE для повторной загрузки classpath.
4. Правила обработки функций с одинаковыми именами:

    - Можно создавать пользовательские функции с сигнатурами, полностью совпадающими с сигнатурами встроенных функций. По умолчанию система сначала ищет соответствие среди встроенных функций.
    - Если при вызове явно указана `database` (например, `db.function()`), вызов принудительно распознаётся как вызов пользовательской функции.
    - Переменная сеанса `prefer_udf_over_builtin` добавлена в версии 3.0.7. Если она установлена в `true`, соответствие сначала ищется среди пользовательских функций. Это позволяет при миграции в Doris сохранить исходное поведение функций других систем без изменения их имён.

## Быстрый старт {#quick-start}

В этом разделе описывается разработка и регистрация Java UDF. Примеры кода находятся в каталоге `samples/doris-demo/java-udf-demo/`; их также можно посмотреть в [демонстрационном проекте](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo) на GitHub.

UDF используются так же, как обычные функции, с одним отличием:

- Область видимости встроенных функций глобальная.
- Область видимости UDF ограничена базой данных (DB).

Поэтому, если в текущем сеансе выбрана база данных, при указании только имени UDF соответствующая функция ищется в текущей DB. В противном случае необходимо явно указать имя базы данных, в которой находится UDF, например `dbName.funcName`.

Для удобства все приведённые ниже примеры проверены на таблице `test_table`. Оператор CREATE TABLE выглядит следующим образом:

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

### Пример Java UDF {#java-udf-example}

При написании UDF на Java основной точкой входа должна быть функция `evaluate`, как и в других движках, например Hive. В следующем примере создаётся UDF `AddOne`, которая прибавляет единицу к входному целому числу.

1. Напишите код на Java и упакуйте его в JAR-файл:

    ```java
    public class AddOne extends UDF {
        public Integer evaluate(Integer value) {
            return value == null ? null : value + 1;
        }
    }
    ```

2. Зарегистрируйте Java UDF в Doris. Подробнее о синтаксисе см. в разделе [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION).

    ```sql
    CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
        "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
        "symbol"="org.apache.doris.udf.AddOne",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

:::caution Примечание
При использовании `file://` Doris читает JAR-файл на узле FE во время выполнения `CREATE FUNCTION` для вычисления контрольной суммы, а во время выполнения функции читает JAR-файл на узлах BE. Поэтому один и тот же JAR-файл должен находиться по одинаковому абсолютному пути на всех узлах FE и BE, а его содержимое должно быть идентичным. Если файл существует только на узлах BE, выполнение `CREATE FUNCTION` завершится ошибкой. Если содержимое файла на узлах FE и BE различается, выполнение функции завершится ошибкой из-за несовпадения контрольных сумм.
:::

3. Вызовите UDF. Для вызова UDF требуется право `SELECT` на соответствующую базу данных. Чтобы просмотреть зарегистрированные UDF, используйте команду [SHOW FUNCTIONS](../../sql-manual/sql-statements/function/SHOW-FUNCTIONS).

    ```sql
    select id,java_udf_add_one(id) from test_table;
    +------+----------------------+
    | id   | java_udf_add_one(id) |
    +------+----------------------+
    |    1 |                    2 |
    |    6 |                    7 |
    +------+----------------------+
    ```

4. Когда UDF больше не нужна, удалите её с помощью команды [DROP FUNCTION](../../sql-manual/sql-statements/function/DROP-FUNCTION).

Если UDF требуется загружать большие файлы ресурсов или вам нужно определить глобальные статические переменные, см. раздел «Рекомендации» ниже.

### Пример Java UDAF {#java-udaf-example}

При написании UDAF на Java необходимо реализовать набор обязательных функций (помеченных как обязательные) и внутренний класс `State`. Это показано в двух примерах ниже.

1. Напишите код Java UDAF и упакуйте его в JAR-файл.

<details>
<summary>Пример 1: SimpleDemo реализует простую агрегатную функцию, аналогичную sum, с входным параметром типа INT и выходным параметром типа INT</summary>

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
<summary>Пример 2: MedianUDAF вычисляет медиану, принимая входные параметры типов (DOUBLE, INT) и возвращая значение типа DOUBLE</summary>

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

2. Зарегистрируйте Java UDAF в Doris. Подробнее о синтаксисе см. в разделе [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION).

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Вызовите Java UDAF. Можно выполнить агрегацию по группам или по всему набору результатов:

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

### Пример Java UDWF {#java-udwf-example}

Структура кода Java UDWF полностью совпадает со структурой Java UDAF; необходимо лишь дополнительно реализовать интерфейс `reset`, чтобы вернуть всё состояние `state` к начальному значению:

```java
void reset(State state)
```

1. Напишите и упакуйте код Java UDWF (как показано выше).

2. Зарегистрируйте Java UDWF в Doris. Регистрация выполняется так же, как для Java UDAF. Подробнее о синтаксисе см. в разделе [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION).

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo_window(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Вызовите Java UDWF для вычисления результатов в пределах заданного окна. Подробнее о синтаксисе см. в разделе [Оконные функции](../window-function.md):

    ```sql
    select id, simple_demo_window(id) over(partition by id order by d1 rows between 1 preceding and 1 following) as res from test_table;
    +------+------+
    | id   | res  |
    +------+------+
    |    1 |    1 |
    |    6 |    6 |
    +------+------+
    ```

### Пример Java UDTF {#java-udtf-example}

:::tip
UDTF поддерживаются начиная с Doris 3.0.
:::

Как и для UDF, для UDTF необходимо реализовать метод `evaluate`, но возвращаемое значение UDTF должно иметь тип Array.

1. Напишите код Java UDTF и упакуйте его в JAR-файл:

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

2. Зарегистрируйте Java UDTF в Doris. При регистрации одновременно создаются две UDTF: версия с суффиксом `_outer`, добавленным к имени функции, особым образом обрабатывает случай, когда результат содержит ноль строк. Подробнее см. в разделе о [комбинаторе OUTER](../../sql-manual/sql-functions/table-functions/explode-numbers). Подробнее о синтаксисе см. в разделе [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION).

    ```sql
    CREATE TABLES FUNCTION java_utdf(string, string) RETURNS array<string> PROPERTIES (
        "file"="file:///pathTo/java-udtf.jar",
        "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

3. Вызовите Java UDTF. Для преобразования строк в столбцы UDTF в Doris необходимо использовать совместно с [Lateral View](../lateral-view.md):

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

## Рекомендации: загрузка статических переменных {#best-practice-loading-static-variables}

<!-- Knowledge type: Best practice -->
<!-- Applicable scenario: UDFs that load large resource files / reuse singleton resources such as connection pools -->

При выполнении UDF в Doris (например, `select udf(col) from table`) каждый параллельно работающий Instance один раз загружает пакет `udf.jar` и выгружает его после завершения своей работы.

Это приводит к двум распространённым проблемам:

- Если файл `udf.jar` должен загружать несколько сотен МБ файлов ресурсов, при параллельном выполнении расход памяти быстро растёт, что легко приводит к OOM.
- При текущей модели параллельного выполнения невозможно использовать такие объекты, как пул соединений, которые требуется инициализировать только один раз в блоке `static`.

Ниже приведены два решения. Решение 2 требует Doris версии branch-3.0 или новее.

### Решение 1: выделение ресурсов в отдельный JAR {#solution-1-split-out-a-resource-jar}

Вынесите код загрузки ресурсов в отдельный JAR, на который будут ссылаться другие JAR-файлы с бизнес-логикой.

Предположим, что код разделён на два файла: `DictLibrary` (класс ресурсов) и `FunctionUdf` (класс бизнес-логики).

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

Выполните следующие шаги:

1. Скомпилируйте файл `DictLibrary` отдельно, чтобы получить самостоятельный JAR-файл ресурсов `DictLibrary.jar`:

    ```shell
    javac   ./DictLibrary.java
    jar -cf ./DictLibrary.jar ./DictLibrary.class
    ```

2. Скомпилируйте файл `FunctionUdf`, указав пакет ресурсов из предыдущего шага в качестве зависимости, чтобы получить пакет бизнес-логики UDF `FunctionUdf.jar`:

    ```shell
    javac -cp ./DictLibrary.jar  ./FunctionUdf.java
    jar  -cvf ./FunctionUdf.jar  ./FunctionUdf.class
    ```

3. Чтобы все параллельно работающие Instance совместно использовали JAR-файл ресурсов, настройте его загрузку непосредственно JVM. Поместите его в каталог `be/custom_lib`. После перезапуска службы BE он будет загружаться при запуске JVM и освобождаться при остановке службы.

4. Наконец, создайте UDF с помощью оператора `CREATE FUNCTION`. При выгрузке экземпляра будет выгружаться только `FunctionUdf.jar`:

    ```sql
    CREATE FUNCTION java_udf_dict(string) RETURNS string PROPERTIES (
        "file"="file:///pathTo/FunctionUdf.jar",
        "symbol"="org.apache.doris.udf.FunctionUdf",
        "always_nullable"="true",
        "type"="JAVA_UDF",
        "volatility"="immutable"
    );
    ```

### Решение 2: глобальный кеш JAR в BE {#solution-2-be-global-jar-cache}

BE кеширует JAR-файлы глобально и позволяет настраивать срок их хранения. При выполнении `CREATE FUNCTION` добавьте следующие два свойства:

| Свойство | Описание | Значение по умолчанию |
| --- | --- | --- |
| `static_load` | Использовать ли загрузку со статическим кешированием | `false` |
| `expiration_time` | Срок хранения JAR-файла в кеше, в минутах | `360` |

- Параметр `expiration_time` будет удалён после версии 4.1.1.

Принцип работы:

- После включения загрузки со статическим кешированием экземпляр UDF помещается в кеш по завершении инициализации при первом вызове.
- При последующих вызовах UDF сначала проверяется кеш; если нужного экземпляра в нём нет, выполняется соответствующая инициализация.
- При выполнении Drop Function функция удаляется из кеша.

Пример кода:

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

Результат выполнения продолжает увеличиваться, что показывает: загруженный JAR не выгружается и не загружается повторно (иначе переменная снова инициализировалась бы значением 0):

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
