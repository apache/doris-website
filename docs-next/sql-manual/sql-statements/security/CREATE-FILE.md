---
{
    "title": "CREATE FILE",
    "language": "en",
    "description": "This statement is used to create and upload a file to the Doris cluster."
}
---

## Description

This statement is used to create and upload a file to the Doris cluster.
This function is usually used to manage files that need to be used in some other commands, such as certificates, public
and private keys, and so on.

## Syntax

```sql
CREATE FILE <file_name>
        [ { FROM | IN } <database_name>] PROPERTIES ("<key>"="<value>" [ , ... ]);
```

## Required Parameters

**<file_name>**

**1. `<file_name>`**

> Custom file name.

**2. `<key>`**

> File attribute key.
> - **url**: Required. Specifies an unauthenticated HTTP download URL. After successful execution, the file will be
    stored
    in Doris and this URL will no longer be required.
> - **catalog**: Required. Category name for file classification (user-defined). Used to locate files in specific
    commands (
    e.g., searches for files under 'kafka' catalog when Kafka is the data source in scheduled imports).
> - **md5**: Optional. MD5 checksum of the file. If provided, verification will be performed after download.

**3. `<value>`**

> File attribute value.

## Optional Parameters

**1. `<database_name>`**

> Specifies the database to which the file belongs. Uses current session's database if not specified.

## Access Control Requirements

The user executing this SQL command must possess at least the following privileges:

| Privilege    | Object      | Notes                                                                           |
|:-------------|:------------|:--------------------------------------------------------------------------------|
| `ADMIN_PRIV` | User / Role | The user or role must hold the `ADMIN_PRIV` privilege to execute this operation |

## Usage Notes

- File Access Rules

> Each file belongs to a specific database (Database). Users with access privileges to the database can access all files
> within it.

- File Size and Quantity Limits

> This feature is primarily designed for managing small files such as certificates.  
> **Size limit**: Individual file size is restricted to 1MB  
> **Quantity limit**: A Doris cluster supports uploading up to 100 files maximum

## Example

- Create a file ca.pem , classified as kafka

   ```sql
   CREATE FILE "ca.pem"
   PROPERTIES
   (
       "url" = "https://test.bj.bcebos.com/kafka-key/ca.pem",
       "catalog" = "kafka"
   );
   ```

- Create a file client.key, classified as my_catalog

   ```sql
   CREATE FILE "client.key"
   IN my_database
   PROPERTIES
   (
       "url" = "https://test.bj.bcebos.com/kafka-key/client.key",
       "catalog" = "my_catalog",
       "md5" = "b5bb901bf10f99205b39a46ac3557dd9"
   );
   ```

- Create a file client_1.key, classified as my_catalog

  ```sql
    CREATE FILE "client_1.key"
    FROM my_database
    PROPERTIES
    (
       "url" = "https://test.bj.bcebos.com/kafka-key/client.key",
       "catalog" = "my_catalog",
       "md5" = "b5bb901bf10f99205b39a46ac3557dd9"
    );
    ```

