---
{
"title": "ALTER RESOURCE",
"language": "en"
}

---

## Description

This statement is used to modify an existing resource. Only the root or admin user can modify resources.

## Syntax

```sql
ALTER RESOURCE '<resource_name>'
PROPERTIES (
  `<property>`, 
  [ , ... ]
);
```

## Parameters

1.`<property>`

The `<property>` format is `<key>` = `<value>`, and modifying the `<value>` where `<key>` equals 'type' is not supported.

The modified properties parameters can be referenced in the [CREATE-RESOURCE](./CREATE-RESOURCE.md) section.


## Examples

1. Modify the working directory of the Spark resource named spark0:

```sql
ALTER RESOURCE 'spark0' PROPERTIES ("working_dir" = "hdfs://127.0.0.1:10000/tmp/doris_new");
```

2. Modify the maximum number of connections to the S3 resource named remote_s3:

```sql
ALTER RESOURCE 'remote_s3' PROPERTIES ("s3.connection.maximum" = "100");
```

3. Modify information related to cold and hot separation S3 resources

- Support
  - `s3.access_key`  s3 ak
  - `s3.secret_key`  s3 sk
  - `s3.session_token` s3 token
  - `s3.connection.maximum` default 50
  - `s3.connection.timeout` default 1000ms
  - `s3.connection.request.timeout` default 3000ms
- Not Support
  - `s3.region`
  - `s3.bucket"`
  - `s3.root.path`
  - `s3.endpoint`

```sql
  ALTER RESOURCE "showPolicy_1_resource" PROPERTIES("s3.connection.maximum" = "1111");
```