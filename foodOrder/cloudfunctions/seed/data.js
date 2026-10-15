// 种子数据:8 个分类 + 约 20 个示例菜品。
// 分类使用固定 _id,便于菜品引用;价格为整数"分"。

const categories = [
  { _id: 'cat-hot', name: '热菜', sort: 1 },
  { _id: 'cat-cold', name: '凉菜', sort: 2 },
  { _id: 'cat-soup', name: '汤品', sort: 3 },
  { _id: 'cat-staple', name: '主食', sort: 4 },
  { _id: 'cat-drink', name: '饮品', sort: 5 },
  { _id: 'cat-dessert', name: '甜品', sort: 6 },
  { _id: 'cat-alcohol', name: '酒水', sort: 7 },
  { _id: 'cat-special', name: '特色', sort: 8 },
];

const products = [
  { categoryId: 'cat-hot', name: '红烧肉', price: 3800, description: '肥而不腻,入口即化' },
  { categoryId: 'cat-hot', name: '宫保鸡丁', price: 2800, description: '经典川味,微辣' },
  { categoryId: 'cat-hot', name: '清蒸鲈鱼', price: 4800, description: '鲜嫩清淡,现蒸' },
  { categoryId: 'cat-cold', name: '拍黄瓜', price: 1200, description: '爽口开胃' },
  { categoryId: 'cat-cold', name: '凉拌木耳', price: 1500, description: '酸辣脆爽' },
  { categoryId: 'cat-soup', name: '番茄蛋汤', price: 1000, description: '家常味道' },
  { categoryId: 'cat-soup', name: '冬瓜排骨汤', price: 2200, description: '小火慢炖' },
  { categoryId: 'cat-staple', name: '米饭', price: 200, description: '东北大米' },
  { categoryId: 'cat-staple', name: '蛋炒饭', price: 1200, description: '粒粒分明' },
  { categoryId: 'cat-staple', name: '手工水饺', price: 1800, description: '猪肉白菜馅,12 只' },
  { categoryId: 'cat-drink', name: '可乐', price: 500, description: '330ml 罐装' },
  { categoryId: 'cat-drink', name: '鲜榨橙汁', price: 1500, description: '无添加' },
  { categoryId: 'cat-drink', name: '酸梅汤', price: 800, description: '冰镇解腻' },
  { categoryId: 'cat-dessert', name: '红糖糍粑', price: 1200, description: '外酥里糯' },
  { categoryId: 'cat-dessert', name: '银耳莲子羹', price: 1000, description: '清甜滋润' },
  { categoryId: 'cat-alcohol', name: '精酿啤酒', price: 1800, description: '500ml' },
  { categoryId: 'cat-alcohol', name: '青梅酒', price: 2600, description: '自酿,300ml' },
  { categoryId: 'cat-special', name: '招牌烤鱼', price: 6800, description: '本店必点,配菜丰富' },
  { categoryId: 'cat-special', name: '农家小炒肉', price: 2600, description: '下饭神器' },
  { categoryId: 'cat-special', name: '时令蔬菜', price: 1600, description: '每日新鲜采购' },
];

module.exports = { categories, products };
