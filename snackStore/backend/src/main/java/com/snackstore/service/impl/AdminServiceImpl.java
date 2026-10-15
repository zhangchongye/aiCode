package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.common.BusinessException;
import com.snackstore.dto.CategoryDTO;
import com.snackstore.dto.ProductDTO;
import com.snackstore.entity.Category;
import com.snackstore.entity.Order;
import com.snackstore.entity.Product;
import com.snackstore.entity.User;
import com.snackstore.mapper.CategoryMapper;
import com.snackstore.mapper.OrderMapper;
import com.snackstore.mapper.ProductMapper;
import com.snackstore.mapper.UserMapper;
import com.snackstore.service.AdminService;
import com.snackstore.vo.OrderVO;
import com.snackstore.vo.StatsVO;
import com.snackstore.vo.UserVO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminServiceImpl implements AdminService {

    private final ProductMapper productMapper;
    private final CategoryMapper categoryMapper;
    private final UserMapper userMapper;
    private final OrderMapper orderMapper;

    public AdminServiceImpl(ProductMapper productMapper, CategoryMapper categoryMapper,
                            UserMapper userMapper, OrderMapper orderMapper) {
        this.productMapper = productMapper;
        this.categoryMapper = categoryMapper;
        this.userMapper = userMapper;
        this.orderMapper = orderMapper;
    }

    @Override
    public Page<Product> listProducts(int page, int size, String keyword, Integer status) {
        LambdaQueryWrapper<Product> qw = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) qw.like(Product::getName, keyword);
        if (status != null) qw.eq(Product::getStatus, status);
        qw.orderByDesc(Product::getId);
        return productMapper.selectPage(new Page<>(page, size), qw);
    }

    @Override
    public Product createProduct(ProductDTO dto) {
        Product p = new Product();
        copy(p, dto);
        p.setSales(0);
        if (p.getStatus() == null) p.setStatus(1);
        productMapper.insert(p);
        return p;
    }

    @Override
    public void updateProduct(Long id, ProductDTO dto) {
        Product p = productMapper.selectById(id);
        if (p == null) throw new BusinessException("商品不存在");
        copy(p, dto);
        productMapper.updateById(p);
    }

    @Override
    public void updateProductStatus(Long id, Integer status) {
        Product p = productMapper.selectById(id);
        if (p == null) throw new BusinessException("商品不存在");
        p.setStatus(status);
        productMapper.updateById(p);
    }

    @Override
    public void deleteProduct(Long id) {
        productMapper.deleteById(id);
    }

    @Override
    public void createCategory(CategoryDTO dto) {
        Category c = new Category();
        c.setName(dto.getName());
        c.setSort(dto.getSort() == null ? 0 : dto.getSort());
        c.setStatus(1);
        categoryMapper.insert(c);
    }

    @Override
    public void updateCategory(Long id, CategoryDTO dto) {
        Category c = categoryMapper.selectById(id);
        if (c == null) throw new BusinessException("分类不存在");
        c.setName(dto.getName());
        if (dto.getSort() != null) c.setSort(dto.getSort());
        if (dto.getStatus() != null) c.setStatus(dto.getStatus());
        categoryMapper.updateById(c);
    }

    @Override
    public void deleteCategory(Long id) {
        Long count = productMapper.selectCount(
                new LambdaQueryWrapper<Product>().eq(Product::getCategoryId, id));
        if (count > 0) {
            throw new BusinessException("该分类下还有商品，不能删除");
        }
        categoryMapper.deleteById(id);
    }

    // 订单分页（含状态筛选），items 不加载（列表不需要明细，前端发货操作只依赖 id 和 status）
    @Override
    public Page<OrderVO> listOrders(int page, int size, Integer status) {
        LambdaQueryWrapper<Order> qw = new LambdaQueryWrapper<Order>().orderByDesc(Order::getId);
        if (status != null) qw.eq(Order::getStatus, status);
        Page<Order> result = orderMapper.selectPage(new Page<>(page, size), qw);
        Page<OrderVO> voPage = new Page<>(page, size, result.getTotal());
        voPage.setRecords(result.getRecords().stream()
                .map(o -> {
                    OrderVO vo = new OrderVO();
                    vo.setId(o.getId());
                    vo.setOrderNo(o.getOrderNo());
                    vo.setReceiver(o.getReceiver());
                    vo.setPhone(o.getPhone());
                    vo.setAddress(o.getAddress());
                    vo.setTotalAmount(o.getTotalAmount());
                    vo.setStatus(o.getStatus());
                    vo.setPaymentTime(o.getPaymentTime());
                    vo.setCreatedAt(o.getCreatedAt());
                    return vo;
                }).toList());
        return voPage;
    }

    // 发货：status 1 -> 2
    @Override
    public void shipOrder(Long id) {
        Order order = orderMapper.selectById(id);
        if (order == null) throw new BusinessException("订单不存在");
        if (order.getStatus() != 1) throw new BusinessException("只有待发货订单可以发货");
        order.setStatus(2);
        orderMapper.updateById(order);
    }

    // 用户分页（username 关键词）
    @Override
    public Page<UserVO> listUsers(int page, int size, String keyword) {
        LambdaQueryWrapper<User> qw = new LambdaQueryWrapper<User>().orderByDesc(User::getId);
        if (keyword != null && !keyword.isBlank()) qw.like(User::getUsername, keyword);
        Page<User> result = userMapper.selectPage(new Page<>(page, size), qw);
        Page<UserVO> voPage = new Page<>(page, size, result.getTotal());
        voPage.setRecords(result.getRecords().stream().map(u -> {
            UserVO vo = new UserVO();
            vo.setId(u.getId());
            vo.setUsername(u.getUsername());
            vo.setNickname(u.getNickname());
            vo.setPhone(u.getPhone());
            vo.setRole(u.getRole());
            vo.setStatus(u.getStatus());
            vo.setCreatedAt(u.getCreatedAt());
            return vo;
        }).toList());
        return voPage;
    }

    // 禁用/启用用户
    @Override
    public void updateUserStatus(Long id, Integer status) {
        User user = userMapper.selectById(id);
        if (user == null) throw new BusinessException("用户不存在");
        user.setStatus(status);
        userMapper.updateById(user);
    }

    @Override
    public StatsVO stats() {
        StatsVO vo = new StatsVO();
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        vo.setTodayOrderCount(orderMapper.selectCount(new LambdaQueryWrapper<Order>()
                .ge(Order::getCreatedAt, start).lt(Order::getCreatedAt, end)));
        // 今日销售额 = 今日已支付订单金额合计（status 1/2/3）
        List<Order> paidToday = orderMapper.selectList(new LambdaQueryWrapper<Order>()
                .ge(Order::getPaymentTime, start).lt(Order::getPaymentTime, end)
                .in(Order::getStatus, 1, 2, 3));
        vo.setTodaySales(paidToday.stream().map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        vo.setTotalUsers(userMapper.selectCount(null));
        vo.setTotalProducts(productMapper.selectCount(null));
        vo.setPendingShipCount(orderMapper.selectCount(
                new LambdaQueryWrapper<Order>().eq(Order::getStatus, 1)));
        vo.setLowStockProducts(productMapper.selectList(
                new LambdaQueryWrapper<Product>().lt(Product::getStock, 10)
                        .orderByAsc(Product::getStock)).stream().limit(10)
                .map(p -> Map.<String, Object>of("name", p.getName(), "stock", p.getStock()))
                .collect(Collectors.toList()));
        return vo;
    }

    private void copy(Product p, ProductDTO dto) {
        p.setCategoryId(dto.getCategoryId());
        p.setName(dto.getName());
        p.setDescription(dto.getDescription());
        p.setImage(dto.getImage());
        p.setPrice(dto.getPrice());
        p.setStock(dto.getStock());
        if (dto.getStatus() != null) p.setStatus(dto.getStatus());
    }
}
