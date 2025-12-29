---
{
    "title": "INSTALL PLUGIN",
    "language": "zh-CN",
    "description": "该语句用于安装一个插件"
}
---

## 描述

该语句用于安装一个插件

## 语法

```sql
INSTALL PLUGIN FROM <source> [PROPERTIES ("<key>"="<value>", ...)]
```

## 必选参数

** 1. `<source>`**
> 待安装插件路径，支持三种类型：
>  1. 指向一个 zip 文件的绝对路径。
>  2. 指向一个插件目录的绝对路径。
>  3. 指向一个 http 或 https 协议的 zip 文件下载路径
 
## 可选参数

** 1. `[PROPERTIES ("<key>"="<value>", ...)]`**
> 用于指定安装插件时的属性或参数

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象   | 说明            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | 整个集群 | 需要对整个集群具有管理权限 |

## 注意事项

注意需要放置一个和 .zip 文件同名的 md5 文件，如 http://mywebsite.com/plugin.zip.md5。其中内容为 .zip 文件的 MD5 值。

## 示例

- 安装一个本地 zip 文件插件：

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo.zip";
    ```

- 安装一个本地目录中的插件：

    ```sql
    INSTALL PLUGIN FROM "/home/users/doris/auditdemo/";
    ```

- 下载并安装一个插件：

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip";
    ```

- 下载并安装一个插件，同时设置了 zip 文件的 md5sum 的值：

    ```sql
    INSTALL PLUGIN FROM "http://mywebsite.com/plugin.zip" PROPERTIES("md5sum" = "73877f6029216f4314d712086a146570");
    ```
