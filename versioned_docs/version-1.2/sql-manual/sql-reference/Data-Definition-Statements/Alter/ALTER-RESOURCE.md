---
{
"title": "ALTER-RESOURCE",
"language": "en"
}
---

## ALTER-RESOURCE

<version since="1.2.0"></version>

### Name

ALTER RESOURCE

### Description

This statement is used to modify an existing resource. Only the root or admin user can modify resources.
Syntax:
```sql
ALTER RESOURCE 'resource_name'
PROPERTIES ("key"="value", ...);
```

Note: The resource type does not support modification.

### Example

1. Modify the working directory of the Spark resource named spark0:

```sql
ALTER RESOURCE 'spark0' PROPERTIES ("working_dir" = "hdfs://127.0.0.1:10000/tmp/doris_new");
```
2. Modify the maximum number of connections to the S3 resource named remote_s3:

```sql
ALTER RESOURCE 'remote_s3' PROPERTIES ("AWS_MAX_CONNECTIONS" = "100");
```

3. Modify information related to cold and hot separation S3 resources
- Support
  - `AWS_MAX_CONNECTIONS` : default 50
  - `AWS_CONNECTION_TIMEOUT_MS` : default 1000ms
  - `AWS_SECRET_KEY` : s3 sk 
  - `AWS_ACCESS_KEY` : s3 ak
  - `AWS_REQUEST_TIMEOUT_MS` : default 3000ms
- Not Support
  - `AWS_REGION`
  - `AWS_BUCKET`
  - `AWS_ROOT_PATH`
  - `AWS_ENDPOINT`

```sql
  ALTER RESOURCE "showPolicy_1_resource" PROPERTIES("AWS_MAX_CONNECTIONS" = "1111");
```
### Keywords

```text
ALTER, RESOURCE
```

### Best Practice
