# Zcy Food Order

微信小程序堂食扫码点餐系统:顾客扫桌码 → 点餐 → 模拟支付 → 商家接单 → 出餐 → 完成。

- 技术栈:原生微信小程序(WXML/WXSS/JS)+ 微信云开发(云函数 / 云数据库 / 云存储)
- 双角色同一小程序:顾客默认,商家 = `users` 集合中 `role='merchant'`
- 架构:商品/分类读直连数据库(安全规则控制),订单/支付/管理写走云函数(状态机 + CAS 校验),购物车存本地 storage
- 订单状态机:`UNPAID → PAID → PREPARING → READY → COMPLETED`(取消规则见 `cloudfunctions/order/stateMachine.js`)

## 目录结构

```
foodOrder/
├── project.config.json      # 开发者工具项目配置(需替换 appid)
├── tests/                   # node --test 单测(状态机/金额/购物车/校验/scene)
├── miniprogram/             # 小程序端:pages(顾客 8 页 + 商家 6 页)/components/utils
└── cloudfunctions/          # login / order / productAdmin / seed
```

## 初始化步骤(首次部署)

1. **注册小程序 AppID**:mp.weixin.qq.com 注册(个人主体可开发调试;餐饮类目上架需个体户/企业主体)。用**微信开发者工具**导入本目录,把 `project.config.json` 中 `appid` 的 `touristappid` 替换为你的 AppID。
2. **开通云开发**:开发者工具工具栏点"云开发" → 开通环境(免费额度)。代码使用 `DYNAMIC_CURRENT_ENV`,无需写死环境 ID。
3. **创建集合**:云开发控制台 → 数据库 → 新建集合 `users`、`categories`、`products`、`orders`。**必须手动预创建**,不存在时写入会报错。建议索引:orders 的 `openid+createdAt`(降序)、`status+createdAt`(降序);products 的 `categoryId+status+sort`。
4. **设置安全规则**(每个集合 → 权限设置 → 自定义规则):
   - `products` / `categories`:`{ "read": true, "write": false }`
   - `users`:`{ "read": "doc._id == auth.openid", "write": false }`
   - `orders`:`{ "read": false, "write": false }`
5. **部署云函数**:在 `cloudfunctions` 下对 `login`、`order`、`productAdmin`、`seed` 逐个右键"上传并部署:云端安装依赖"。
6. **初始化菜单数据**:编译运行小程序 → "我的"页 → 点"初始化菜单数据"(seed 幂等;配置商家后仅商家可执行,上线前建议在控制台禁用 seed 函数)。
7. **配置商家账号**:用**开发者工具**登录的微信账号打开小程序一次(此时 `users` 集合会生成该账号的记录)→ 云开发控制台 → 数据库 → `users` → 找到该记录 → 手动补字段 `role: "merchant"` → "我的"页下拉重新进入即显示"商家中心"。

## 双身份联调

**openid 按账号隔离**:开发者工具登录账号 = 商家;真机预览的手机微信账号 = 顾客。

- 顾客流程:扫码/手动选桌 → 点餐 → 购物车 → 下单 → 模拟支付(约 1.2s 延迟)→ 商家接单 → 出餐 → 确认取餐
- 商家流程:商家中心 → 订单管理(10s 轮询 + 下拉刷新)/ 商品管理 / 分类管理 / 桌码生成

## 桌码

- 商家中心 → 桌码生成 → 输入桌号 → 生成小程序码(scene=`t=桌号`)→ 长按保存打印
- **小程序码需小程序发布后扫码才有效**;开发期模拟:开发者工具"编译模式"→ 启动参数 `scene=t%3D3`(表示桌号 3),或直接在 URL 加 `?tableNo=3`

## 测试

```bash
node --test tests/*.test.js   # 39 个用例:状态机矩阵/金额双拷贝一致性/下单校验/购物车/scene/状态映射
```

## 常见问题

- **集合写入报错**:检查集合是否已创建、安全规则是否放行(云函数写入不受规则限制)。
- **接单/拒单提示"仅商家可操作"**:商家 openid 配置不对——必须用当前云环境下实际登录产生的 openid(工具与真机 openid 不同)。
- **生成桌码报错**:小程序未发布时 `getUnlimited` 可能失败,发布后可用。
- **金额显示**:库内一律整数"分",展示时换算为元,避免浮点误差。
