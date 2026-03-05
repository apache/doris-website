---
{
    "title": "DATE",
    "language": "zh-CN"
}
---

## DATE
## 描述
    DATE函数
        Syntax:
            DATE(expr) 
        将输入的类型转化为DATE类型
    DATE类型
        日期类型，目前的取值范围是['0000-01-01', '9999-12-31'], 默认的打印形式是'yyyy-MM-dd'

### note
    如果您使用1.2及以上版本，强烈推荐您使用DATEV2类型替代DATE类型。相比DATE类型，DATEV2更加高效。
    我们打算在2024年删除这个类型，目前阶段，Doris默认禁止创建含有DATE类型的表，如果需要使用需要在FE的config中添加`disable_datev1 = false`，并重启FE。

## 举例
    mysql> SELECT DATE('2003-12-31 01:02:03');
        -> '2003-12-31'

### keywords

    DATE
