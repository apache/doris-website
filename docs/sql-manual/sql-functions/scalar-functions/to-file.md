---
{
    "title": "TO_FILE",
    "language": "en",
    "description": "Query remote file metadata using a resource and return FILE."
}
---

## Description

Queries remote file metadata using an S3 resource and returns a FILE value. A NULL URI returns NULL without a remote request. The resource must still exist and the caller must have USAGE privilege.

## Syntax

```sql
TO_FILE(<resource_name>, <uri>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<resource_name>` | Required non-NULL string literal naming an existing S3 resource. The caller needs USAGE privilege. The resource provides S3-compatible connection properties and credentials. |
| `<uri>` | Required CHAR/VARCHAR/STRING expression or NULL. Accepts `s3://bucket/key` or path-style `http(s)://host/bucket/key`. The complete object key is used without encoding or decoding. |

## Return Value

Returns nullable `FILE`. For a non-NULL URI, metadata access failures fail the query; they do not return NULL.

| Field | Returned value |
| --- | --- |
| uri | Original input URI, unchanged. |
| offset | NULL. |
| size | Remote length in bytes; 0 is a valid empty file. |
| content_type | Valid remote MIME type, or a type inferred from the filename in the complete raw object key; fallback is `application/octet-stream`. |
| checksum | Uses the HEAD ETag; one pair of surrounding double quotes is removed before storing `ETAG:<etag>`, matching LIST_FILES. Missing or empty values after conversion yield NULL. SHA/CRC digest values are not retrieved. |
| inline | NULL; file contents are not downloaded. |

## Example

### S3-compatible storage

Create the resource as a user with resource-administration privileges. Replace the endpoint, region, bucket, and credentials with those of your storage service. The bucket and files must already exist. Other callers need USAGE privilege on this resource.

```sql
CREATE RESOURCE 'file_test_s3_resource' PROPERTIES (
    "type" = "s3",
    "s3.endpoint" = "<endpoint>",
    "s3.region" = "<region>",
    "s3.bucket" = "linrrzqqq",
    "s3.root.path" = "",
    "s3.access_key" = "<access_key>",
    "s3.secret_key" = "<secret_key>"
);
```

Successful execution creates the resource. The example reads `doris-file-type-test/my-github-avatar.jpg`; size and other metadata depend on the actual object.

```sql
SELECT ELEMENT_AT(f, 'uri') AS uri, ELEMENT_AT(f, 'size') AS size
FROM (SELECT TO_FILE('file_test_s3_resource', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg') AS f) t;
```

```text
+----------------------------------------------------------+--------+
| uri                                                      | size   |
+----------------------------------------------------------+--------+
| s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg | 158663 |
+----------------------------------------------------------+--------+
```

```sql
SELECT TO_FILE('file_test_s3_resource', NULL) AS res;
```
```text
+------+
| res  |
+------+
| NULL |
+------+
```
