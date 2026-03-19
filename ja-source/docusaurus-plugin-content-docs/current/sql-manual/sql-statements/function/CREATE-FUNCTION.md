---
{
  "title": "CREATE FUNCTION",
  "language": "ja",
  "description": "このステートメントはカスタム関数を作成するために使用されます。"
}
---
## 説明

このステートメントはカスタム関数を作成するために使用されます。

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
## 必須パラメータ

**1. `<function_name>`**

> `function_name`が`db1.my_func`のようにデータベース名を含む場合、カスタム関数は対応するデータベースに作成されます。そうでない場合、関数は現在のセッションのデータベースに作成されます。新しい関数の名前とパラメータは、現在の名前空間内の既存の関数と同一であってはなりません。そうでない場合、作成は失敗します。

**2. `<arg_type>`**

> 関数の入力パラメータ型。可変長パラメータの場合は、`, ...`を使用してそれらを示します。可変長型の場合、可変長パラメータの型は最後の非可変長パラメータの型と一致している必要があります。

**3. `<ret_type>`**

> 関数の戻りパラメータ型。これは新しい関数を作成するために必須のパラメータです。既存の関数のエイリアスを作成する場合、このパラメータは必要ありません。

## オプションパラメータ

**1. `GLOBAL`**

> 指定された場合、作成された関数はグローバルに有効になります。

**2. `AGGREGATE`**

> 指定された場合、作成された関数は集約関数になります。

**3. `TABLES`**

> 指定された場合、作成された関数はテーブル関数になります。

**4. `ALIAS`**

> 指定された場合、作成された関数はエイリアス関数になります。

> 関数型を表す上記のパラメータのいずれも選択されていない場合、作成された関数はスカラー関数であることを示します。

**5. `<inter_type>`**

> 集約関数の中間段階でのデータ型を示すために使用されます。

**6. `<param>`**

> エイリアス関数のパラメータを示すために使用され、少なくとも1つのパラメータが必要です。

**7. `<origin_function>`**

> エイリアス関数に対応する元の関数を示すために使用されます。

**8. `<properties>`**

> - `file`: ユーザー定義関数（UDF）を含むJARパッケージを示します。マルチマシン環境では、HTTPを介してダウンロードすることもできます。このパラメータは必須です。
> - `symbol`: UDFクラスを含むクラス名を示します。このパラメータは必須です。
> - `type`: UDF呼び出しタイプを示します。デフォルトはNativeです。Java UDFを使用する場合はJAVA_UDFを使用してください。
> - `always_nullable`: UDFの結果にNULL値が含まれる可能性があるかどうかを示します。これはオプションパラメータで、デフォルト値はtrueです。

## アクセス制御要件

このコマンドを実行するには、ユーザーは`ADMIN_PRIV`権限を持っている必要があります。

## 例

1. カスタムUDF関数を作成します。詳細については、[JAVA-UDF](../../../query-data/udf/java-user-defined-function)を参照してください。

   ```sql
   CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
       "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
       "symbol"="org.apache.doris.udf.AddOne",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```
2. カスタムUDAF関数を作成します。

   ```sql
   CREATE AGGREGATE FUNCTION simple_sum(INT) RETURNS INT PROPERTIES (
       "file"="file:///pathTo/java-udaf.jar",
       "symbol"="org.apache.doris.udf.demo.SimpleDemo",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```
3. カスタムUDTF関数を作成する。

   ```sql
   CREATE TABLES FUNCTION java_udtf(string, string) RETURNS array<string> PROPERTIES (
       "file"="file:///pathTo/java-udaf.jar",
       "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```
4. カスタムエイリアス関数を作成します。詳細については、[Alias Function](../../../query-data/udf/alias-function)を参照してください。

   ```sql
   CREATE ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
   ```
5. グローバルなカスタムエイリアス関数を作成する。

   ```sql
   CREATE GLOBAL ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
   ```
