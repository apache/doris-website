---
{
    "title": "CREATE FUNCTION",
    "language": "ja",
    "description": "このステートメントは、カスタム関数の作成に使用します。"
}
---

## 説明

このステートメントは、カスタム関数の作成に使用します。

## 構文


```sql
CREATE [ GLOBAL ] 
    [{AGGREGATE | TABLES | ALIAS }] FUNCTION <function_name>
    (<arg_type> [, ...])
    [ RETURNS <ret_type> ]
    [ INTERMEDIATE <inter_type> ]
    [ WITH PARAMETER(<param> [,...]) AS <origin_function> ]
    [ PROPERTIES ("<key>" = "<value>" [, ...]) ]
```

## 必須パラメーター

**1. `<function_name>`**

> `function_name` に `db1.my_func` のようなデータベース名が含まれる場合、カスタム関数はそのデータベースに作成されます。含まれない場合は、現在のセッションのデータベースに作成されます。新しい関数の名前と引数が、現在の名前空間にある既存の関数と同一であってはなりません。同一の場合、作成は失敗します。

**2. `<arg_type>`**

> 関数の入力パラメーターの型です。個数が固定された引数を一つ以上宣言できます。**バージョン 4.1.5 以降、`...` を使った可変長引数の関数宣言はサポートされません。可変個の値を受け取るには、代わりに `ARRAY` パラメーターを使用してください。**

**3. `<ret_type>`**

> 関数の戻り値の型です。新しい関数を作成する場合は必須です。既存の関数のエイリアスを作成する場合は不要です。

## オプションパラメーター

**1. `GLOBAL`**

> 指定すると、作成した関数はグローバルに有効になります。

**2. `AGGREGATE`**

> 指定すると、集約関数が作成されます。

**3. `TABLES`**

> 指定すると、テーブル関数が作成されます。

**4. `ALIAS`**

> 指定すると、エイリアス関数が作成されます。

> 上記の関数種別を表すパラメーターをいずれも指定しない場合、スカラー関数が作成されます。

**5. `<inter_type>`**

> 集約関数の中間処理段階で使用するデータ型を指定します。

**6. `<param>`**

> エイリアス関数のパラメーターを指定します。少なくとも一つ必要です。

**7. `<origin_function>`**

> エイリアス関数に対応する元の関数を指定します。

**8. `<properties>`**

> - `file`：ユーザー定義関数（UDF）を含む JAR パッケージを指定します。複数マシンの環境では、HTTP 経由でダウンロードすることもできます。このパラメーターは必須です。
> - `symbol`：UDF のクラス名を指定します。このパラメーターは必須です。
> - `type`：UDF の呼び出し種別を指定します。デフォルトは Native です。Java UDF を使用する場合は JAVA_UDF を指定します。
> - `always_nullable`：UDF の結果に NULL 値が含まれる可能性があるかを指定します。省略可能で、デフォルト値は true です。
> - `volatility`：関数の結果がどの程度安定しているかを指定します。このパラメーターは 4.1.2 以降でサポートされます。省略可能です。デフォルト値はスカラー UDF では `volatile`、UDAF/UDTF では `immutable` です。有効な値は次のとおりです。
>   - `immutable`：同じ入力からは常に同じ結果が得られます。ほとんどの決定的な UDF は `immutable` に設定すると、オプティマイザーがより多くのプラン最適化を適用できます。
>   - `stable`：結果は単一の SQL ステートメント内では安定していますが、ステートメント間では変わる可能性があります。`now()` と同様です。この種別の関数では、SQL キャッシュとマテリアライズドビューの書き換えが無効になります。
>   - `volatile`：`random()` と同様に、呼び出しごとに結果が変わる可能性があります。この種別の関数では、SQL キャッシュ、マテリアライズドビューの書き換え、および多くのオプティマイザーの書き換えルールが無効になります。

## アクセス制御要件

このコマンドを実行するには、`ADMIN_PRIV` 権限が必要です。

## 例

1. カスタム UDF 関数を作成します。詳しくは、[JAVA-UDF](../../../query-data/udf/java-user-defined-function) を参照してください。

   

   ```sql
   CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
       "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
       "symbol"="org.apache.doris.udf.AddOne",
       "always_nullable"="true",
       "type"="JAVA_UDF",
       "volatility"="immutable"
   );
   ```

2. カスタム UDAF 関数を作成します。

   

   ```sql
   CREATE AGGREGATE FUNCTION simple_sum(INT) RETURNS INT PROPERTIES (
       "file"="file:///pathTo/java-udaf.jar",
       "symbol"="org.apache.doris.udf.demo.SimpleDemo",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```

3. カスタム UDTF 関数を作成します。

   

   ```sql
   CREATE TABLES FUNCTION java_udtf(string, string) RETURNS array<string> PROPERTIES (
       "file"="file:///pathTo/java-udaf.jar",
       "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```

4. カスタムエイリアス関数を作成します。詳しくは、[エイリアス関数](../../../query-data/udf/alias-function) を参照してください。

   

   ```sql
   CREATE ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
   ```

5. グローバルなカスタムエイリアス関数を作成します。

   

   ```sql
   CREATE GLOBAL ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
   ```

6. volatile な Python UDF を作成します。`uuid.uuid4()` のようにランダム性に依存する関数では、デフォルトの `volatility = volatile` を維持し、誤って `immutable` に設定しないでください。

   ```sql
   CREATE TABLE cte_uuid_seed (id INT) ENGINE=OLAP DUPLICATE KEY(id)
   DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES ("replication_num" = "1");
   INSERT INTO cte_uuid_seed VALUES (1),(2),(3);

   DROP FUNCTION IF EXISTS py_uuid_token(INT);
   CREATE FUNCTION py_uuid_token(INT)
   RETURNS STRING
   PROPERTIES (
       "type" = "PYTHON_UDF",
       "symbol" = "py_uuid_token_impl",
       "always_nullable" = "false",
       "runtime_version" = "3.12.11",
       "volatility" = "volatile"
   )
   AS $$
   import uuid
   def py_uuid_token_impl(x):
       return f"{x}-{uuid.uuid4()}"
   $$;

   SET enable_cte_materialize = true;
   SET inline_cte_referenced_threshold = 10;

   WITH cte AS (SELECT id, py_uuid_token(id) AS token FROM cte_uuid_seed)
   SELECT id, COUNT(DISTINCT token) AS distinct_tokens
   FROM (SELECT id, token FROM cte UNION ALL SELECT id, token FROM cte) u
   GROUP BY id ORDER BY id;
   ```

   正しい結果：

   ```text
   +------+-----------------+
   | id   | distinct_tokens |
   +------+-----------------+
   |    1 |               1 |
   |    2 |               1 |
   |    3 |               1 |
   +------+-----------------+
   ```

   この関数について、次の定義は誤りです。

   ```sql
   DROP FUNCTION IF EXISTS py_uuid_token(INT);
   CREATE FUNCTION py_uuid_token(INT)
   RETURNS STRING
   PROPERTIES (
       "type" = "PYTHON_UDF",
       "symbol" = "py_uuid_token_impl",
       "always_nullable" = "false",
       "runtime_version" = "3.12.11",
       "volatility" = "immutable"
   )
   AS $$
   import uuid
   def py_uuid_token_impl(x):
       return f"{x}-{uuid.uuid4()}"
   $$;
   ```

   同じクエリを再実行します。

   ```sql
   WITH cte AS (SELECT id, py_uuid_token(id) AS token FROM cte_uuid_seed)
   SELECT id, COUNT(DISTINCT token) AS distinct_tokens
   FROM (SELECT id, token FROM cte UNION ALL SELECT id, token FROM cte) u
   GROUP BY id ORDER BY id;
   ```

   誤った結果：

   ```text
   +------+-----------------+
   | id   | distinct_tokens |
   +------+-----------------+
   |    1 |               2 |
   |    2 |               2 |
   |    3 |               2 |
   +------+-----------------+
   ```

   この結果が誤りとなる理由：
   `py_uuid_token` は volatile な関数であり、`uuid.uuid4()` を呼び出すたびに新しい値が生成されます。関数を誤って `volatility = immutable` に設定すると、オプティマイザーは繰り返しの参照を書き換えても安全だと判断し、`UNION ALL` の両側で UDF を個別に評価するプランを選択する可能性があります。その結果、同じ `id` から異なる二つの `token` 値が生成され、`COUNT(DISTINCT token)` が `1` から `2` に変わります。
