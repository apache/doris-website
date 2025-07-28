---
{
    "title": "ALTER-SYSTEM-MODIFY-BACKEND",
    "language": "zh-CN"
}

---

## ALTER-SYSTEM-MODIFY-BACKEND

### Name

ALTER SYSTEM MKDIFY BACKEND

## 描述

修改 BE 节点属性（仅管理员使用！）

语法：

```sql
ALTER SYSTEM MODIFY BACKEND "host:heartbeat_port" SET ("key" = "value"[, ...]);
```

 说明：

1. host 可以是主机名或者ip地址
2. heartbeat_port 为该节点的心跳端口
3. 修改 BE 节点属性目前支持以下属性：

- tag.xxx：资源标签
- disable_query: 查询禁用属性
- disable_load: 导入禁用属性        

注：
1. 可以给一个 Backend 设置多种资源标签。但必须包含 "tag.location"。

## 举例

1. 修改 BE 的资源标签

   ```sql
   ALTER SYSTEM MODIFY BACKEND "host1:heartbeat_port" SET ("tag.location" = "group_a");
   ALTER SYSTEM MODIFY BACKEND "host1:heartbeat_port" SET ("tag.location" = "group_a", "tag.compute" = "c1");
   ```

2. 修改 BE 的查询禁用属性
   
   ```sql
   ALTER SYSTEM MODIFY BACKEND "host1:heartbeat_port" SET ("disable_query" = "true");
   ```
3. 修改 BE 的导入禁用属性
   
   ```sql
   ALTER SYSTEM MODIFY BACKEND "host1:heartbeat_port" SET ("disable_load" = "true");
   ```
### Keywords

    ALTER, SYSTEM, ADD, BACKEND, ALTER SYSTEM

### Best Practice

