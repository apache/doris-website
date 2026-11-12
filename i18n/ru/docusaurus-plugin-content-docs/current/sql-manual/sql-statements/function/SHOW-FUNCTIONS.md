---
{
    "title": "SHOW FUNCTIONS",
    "language": "ru",
    "description": "Просмотр всех пользовательских и системных функций в базе данных."
}
---

## Описание {#description}

Просмотр всех пользовательских и системных функций в базе данных.

## Синтаксис {#syntax}

```sql
SHOW [ FULL ] [ BUILTIN ] FUNCTIONS [ { IN | FROM } <db> ]  [ LIKE '<function_pattern>' ]
```
## Альтернативный синтаксис {#varaint-syntax}

```sql
SHOW GLOBAL [ FULL ] FUNCTIONS [ LIKE '<function_pattern>' ]
```

## Обязательные параметры {#required-parameters}

**1. `<function_pattern>`**

> Правила сопоставления с шаблоном, используемые для фильтрации имён функций

## Необязательные параметры {#optional-parameters}

**1. `FULL`**

> FULL является необязательным параметром.
>
> Этот параметр включает отображение подробной информации о функции.

**2. `BUILTIN`**

> BUILTIN является необязательным параметром.
>
> Этот параметр включает отображение функций, предоставляемых системой

**3. `<db>`**

> db является необязательным параметром.
>
> Этот параметр указывает базу данных, в которой выполняется запрос

## Возвращаемое значение {#return-value}

| Столбец | Описание         |
| -- |------------|
| Сигнатура | Имя функции и типы параметров   |
| Тип возвращаемого значения | Тип данных значения, возвращаемого функцией |
| Тип функции | Тип функции      |
| Тип промежуточного результата | Тип промежуточного результата     |
| Свойства | Подробные свойства функции    |

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие права:

| Право доступа  | Объект   | Примечания       |
|:--------------|:---------|:--------------|
| SHOW_PRIV    | Функция | Необходимо иметь право на просмотр этой функции |

## Примеры {#examples}

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
