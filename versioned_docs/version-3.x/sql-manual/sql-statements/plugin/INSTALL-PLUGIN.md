---
{
    "title": "INSTALL PLUGIN",
    "language": "en",
    "description": "This statement is used to install a plug-in"
}
---

## Description

This statement is used to install a plug-in

## Syntax

```sql
INSTALL PLUGIN FROM <source> [PROPERTIES ("<key>"="<value>", ...)]
```

## Required parameters

** 1. `<source>`**
>  The plugin path to be installed, supports three types：
>   1. An absolute path to a zip file
>   2. An absolute path to a plugin directory
>   3. Points to a zip file download path with http or https protocol

## Optional parameters

** 1. `[PROPERTIES ("<key>"="<value>", ...)]`**
>  Used to specify properties or parameters when installing a plug-in

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Permissions         | Object   | Notes            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | The entire cluster | Requires administrative privileges for the entire cluster |

## Precautions

Note that you need to place an md5 file with the same name as the .zip file, such as http://mywebsite.com/plugin.zip.md5 . The content is the MD5 value of the .zip file.

## Example

- Install a local zip file plugin:

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo.zip";
    ```

- Install the plugin in a local directory:

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo/";
    ```

- Download and install a plugin:

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip";
    ```

- Download and install a plugin, and set the md5sum value of the zip file:

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip" PROPERTIES("md5sum" = "73877f6029216f4314d712086a146570");
    ```
