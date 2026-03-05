---
{
    "title": "triggers",
    "language": "zh-CN",
    "description": "此表仅用于兼容 MySQL 行为。永远为空。"
}
---

## Overview

`triggers` 表提供了关于触发器的信息。
目前，Apache Doris 支持此表是为了兼容 MySQL，但不支持用户自定义触发器。此表始终为空。

## Database

`information_schema`

## Table Information

| Column Name | Type | Description |
|---|---|---|
| TRIGGER_CATALOG | varchar(512) | 触发器所属的目录名称。始终为 'def'。 |
| TRIGGER_SCHEMA | varchar(64) | 触发器所属的模式（数据库）名称。 |
| TRIGGER_NAME | varchar(64) | 触发器名称。 |
| EVENT_MANIPULATION | varchar(6) | 触发器事件 (INSERT, UPDATE, DELETE)。 |
| EVENT_OBJECT_CATALOG | varchar(512) | 与触发器关联的表的目录名称。始终为 'def'。 |
| EVENT_OBJECT_SCHEMA | varchar(64) | 与触发器关联的表的模式（数据库）名称。 |
| EVENT_OBJECT_TABLE | varchar(64) | 与触发器关联的表的名称。 |
| ACTION_ORDER | bigint | 触发器的序号定义顺序。 |
| ACTION_CONDITION | varchar(512) | null |
| ACTION_STATEMENT | varchar(512) | 触发器主体。 |
| ACTION_ORIENTATION | varchar(9) | 始终为 'ROW'。 |
| ACTION_TIMING | varchar(6) | 触发器时机 (BEFORE, AFTER)。 |
| ACTION_REFERENCE_OLD_TABLE | varchar(64) | null |
| ACTION_REFERENCE_NEW_TABLE | varchar(64) | null |
| ACTION_REFERENCE_OLD_ROW | varchar(3) | 始终为 'OLD'。 |
| ACTION_REFERENCE_NEW_ROW | varchar(3) | 始终为 'NEW'。 |
| CREATED | datetime | 触发器创建时间。 |
| SQL_MODE | varchar(8192) | 触发器创建时生效的 SQL 模式。 |
| DEFINER | varchar(77) | 创建触发器的账户。 |
| CHARACTER_SET_CLIENT | varchar(32) | 触发器创建时 character_set_client 系统变量的会话值。 |
| COLLATION_CONNECTION | varchar(32) | 触发器创建时 collation_connection 系统变量的会话值。 |
| DATABASE_COLLATION | varchar(32) | 与触发器关联的数据库的排序规则。 |