---
{
    "title": "Remote User Defined Function Service",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->


## Remote UDF

Remote UDF Service supports accessing user-provided UDF Services via RPC to execute user-defined functions. Compared to native UDF implementation, Remote UDF Service has the following advantages and limitations:

**1. Advantages**

* Cross-language: UDF Services can be written in various languages supported by Protobuf.

* Security: UDF failures or crashes only affect the UDF Service itself and do not cause Doris process crashes.

* Flexibility: UDF Services can invoke any other services or library classes to meet diverse business requirements.

**2. Usage Limitations**

* Performance: Compared to native UDFs, UDF Service introduces additional network overhead, resulting in lower performance. Additionally, the UDF Service implementation itself can impact function execution efficiency, and users need to handle issues like high concurrency and thread safety.

* Single-row mode and batch processing mode: In Doris' original row-based query execution framework, UDF RPC calls are made for each row of data, resulting in poor performance. However, in the new vectorized execution framework, UDF RPC calls are made for each batch of data (default: 2048 rows), leading to significant performance improvements. In actual testing, the performance of Remote UDF based on vectorization and batch processing is comparable to that of native UDF based on row storage.

## Writing UDF Functions

This section provides instructions on how to develop a Remote RPC service. A Java version example is provided in `samples/doris-demo/udf-demo/` for reference.

### Copying the Proto Files

Copy `gensrc/proto/function_service.proto` and `gensrc/proto/types.proto` to the RPC service.

**function_service.proto**

- PFunctionCallRequest

   - function_name: Function name, corresponding to the symbol specified during function creation.

   - args: Arguments passed to the method.

   - context: Query context information.

- PFunctionCallResponse

   - result: Result.

   - status: Status, where 0 represents normal.

- PCheckFunctionRequest

   - function: Function-related information.

   - match_type: Matching type.

- PCheckFunctionResponse

   - status: Status, where 0 represents normal.

### Generating Interfaces

Generate code using protoc. Refer to `protoc -h` for specific parameters.

### Implementing Interfaces

The following three methods need to be implemented:

- fnCall: Used to write the calculation logic.

- checkFn: Used for UDF creation validation, checking if the function name, parameters, return values, etc., are valid.

- handShake: Used for interface probing.


--- 

## Creating UDF

Currently, UDTF is not supported.

```sql
CREATE FUNCTION 
name ([,...])
[RETURNS] rettype
PROPERTIES (["key"="value"][,...])	
```

Note:

1. The `symbol` in the PROPERTIES represents the method name passed in the RPC call, and this parameter must be set.

2. The `object_file` in the PROPERTIES represents the RPC service address. Currently, it supports a single address and cluster addresses in the brpc-compatible format. For cluster connection methods, refer to the [Format Specification](https://github.com/apache/incubator-brpc/blob/master/docs/cn/client.md#%E8%BF%9E%E6%8E%A5%E6%9C%8D%E5%8A%A1%E9%9B%86%E7%BE%A4) (Chinese).

3. The `type` in the PROPERTIES represents the UDF invocation type, which is set to Native by default. Use RPC to pass when using RPC UDF.

4. `name`: A function belongs to a specific database. The name is in the form of `dbName`.`funcName`. When `dbName` is not explicitly specified, the current session's database is used as `dbName`.

Example:

```sql
CREATE FUNCTION rpc_add_two(INT,INT) RETURNS INT PROPERTIES (
  "SYMBOL"="add_int_two",
  "OBJECT_FILE"="127.0.0.1:9114",
  "TYPE"="RPC"
);
CREATE FUNCTION rpc_add_one(INT) RETURNS INT PROPERTIES (
  "SYMBOL"="add_int_one",
  "OBJECT_FILE"="127.0.0.1:9114",
  "TYPE"="RPC"
);
CREATE FUNCTION rpc_add_string(varchar(30)) RETURNS varchar(30) PROPERTIES (
  "SYMBOL"="add_string",
  "OBJECT_FILE"="127.0.0.1:9114",
  "TYPE"="RPC"
);
```

## Using UDF

Users must have the `SELECT` privilege on the corresponding database to use UDF.

The usage of UDF is similar to regular functions, with the only difference being that the scope of built-in functions is global, while the scope of UDF is within the database. When the session is connected to a database, simply use the UDF name to search for the corresponding UDF within the current database. Otherwise, the user needs to explicitly specify the database name of the UDF, such as `dbName`.`funcName`.

## Deleting UDF

When you no longer need a UDF function, you can delete it using the `DROP FUNCTION` command.

## Example

The `samples/doris-demo/` directory provides examples of RPC server implementations in CPP, Java, and Python languages. Please refer to the `README.md` file in each directory for specific usage instructions.
For example, `rpc_add_string`:

```sql
mysql >select rpc_add_string('doris');
+-------------------------+
| rpc_add_string('doris') |
+-------------------------+
| doris_rpc_test          |
+-------------------------+
```
The log will display:

```json
INFO: fnCall request=function_name: "add_string"
args {
  type {
    id: STRING
  }
  has_null: false
  string_value: "doris"
}
INFO: fnCall res=result {
  type {
    id: STRING
  }
  has_null: false
  string_value: "doris_rpc_test"
}
status {
  status_code: 0
}
```
