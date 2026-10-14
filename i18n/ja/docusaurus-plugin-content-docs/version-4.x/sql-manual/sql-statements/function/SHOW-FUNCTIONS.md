---
{
    "title": "SHOW FUNCTIONS",
    "language": "ja",
    "description": "データベース内のすべてのユーザー定義関数とシステム提供関数を表示します。"
}
---

## 説明

データベース内のすべてのユーザー定義関数とシステム提供関数を表示します。

## 構文

```sql
SHOW [ FULL ] [ BUILTIN ] FUNCTIONS [ { IN | FROM } <db> ]  [ LIKE '<function_pattern>' ]
```
## 別の構文

```sql
SHOW GLOBAL [ FULL ] FUNCTIONS [ LIKE '<function_pattern>' ]
```

## 必須パラメータ

**1. `<function_pattern>`**

> 関数名を絞り込むために使用する一致パターンの規則。

## 省略可能なパラメータ

**1. `FULL`**

> FULL は省略可能なパラメータです。
>
> 指定すると、関数の詳細情報が表示されます。

**2. `BUILTIN`**

> BUILTIN は省略可能なパラメータです。
>
> 指定すると、システムが提供する関数が表示されます。

**3. `<db>`**

> db は省略可能なパラメータです。
>
> 指定すると、指定したデータベース内の関数を照会します。

## 戻り値

| 列 | 説明         |
| -- |------------|
| Signature | 関数名とパラメータの型   |
| Return Type | 関数が返す値のデータ型 |
| Function Type | 関数の種類      |
| Intermediate Type | 中間結果の型     |
| Properties | 関数の詳細なプロパティ    |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限  | オブジェクト   | 備考       |
|:--------------|:---------|:--------------|
| SHOW_PRIV    | 関数 | この関数に対する表示権限が必要です |

## 例

```sql
show full functions in testDb
```

```text
*************************** 1. row ***************************
Signature: my_add(INT,INT)
Return Type: INT
Function Type: Scalar
Intermediate Type: NULL
Properties: {"symbol":"_ZN9doris_udf6AddUdfEPNS_15FunctionContextERKNS_6IntValES4_","object_file":"http://host:port/libudfsample.so","md5":"cfe7a362d10f3aaf6c49974ee0f1f878"}
*************************** 2. row ***************************
Signature: my_count(BIGINT)
Return Type: BIGINT
Function Type: Aggregate
Intermediate Type: NULL
Properties: {"object_file":"http://host:port/libudasample.so","finalize_fn":"_ZN9doris_udf13CountFinalizeEPNS_15FunctionContextERKNS_9BigIntValE","init_fn":"_ZN9doris_udf9CountInitEPNS_15FunctionContextEPNS_9BigIntValE","merge_fn":"_ZN9doris_udf10CountMergeEPNS_15FunctionContextERKNS_9BigIntValEPS2_","md5":"37d185f80f95569e2676da3d5b5b9d2f","update_fn":"_ZN9doris_udf11CountUpdateEPNS_15FunctionContextERKNS_6IntValEPNS_9BigIntValE"}
*************************** 3. row ***************************
Signature: id_masking(BIGINT)
Return Type: VARCHAR
Function Type: Alias
Intermediate Type: NULL
Properties: {"parameter":"id","origin_function":"concat(left(`id`, 3), `****`, right(`id`, 4))"}
```

```sql
show builtin functions in testDb like 'year%';
```

```text
+---------------+
| Function Name |
+---------------+
| year          |
| years_add     |
| years_diff    |
| years_sub     |
+---------------+
```

```sql
show global full functions
```

```text
*************************** 1. row ***************************
        Signature: decimal(ALL, INT, INT)
      Return Type: VARCHAR
    Function Type: Alias
Intermediate Type: NULL
       Properties: {"parameter":"col, precision, scale","origin_function":"CAST(`col` AS decimal(`precision`, `scale`))"}
*************************** 2. row ***************************
        Signature: id_masking(BIGINT)
      Return Type: VARCHAR
    Function Type: Alias
Intermediate Type: NULL
       Properties: {"parameter":"id","origin_function":"concat(left(`id`, 3), `****`, right(`id`, 4))"}
```

```sql
show global functions
```

```text
+---------------+
| Function Name |
+---------------+
| decimal       |
| id_masking    |
+---------------+
```
