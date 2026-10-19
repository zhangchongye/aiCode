package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.common.BusinessException;
import com.snackstore.dto.OrderCreateDTO;
import com.snackstore.entity.*;
import com.snackstore.mapper.*;
import com.snackstore.service.OrderService;
import com.snackstore.vo.OrderItemVO;
import com.snackstore.vo.OrderVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final CartItemMapper cartItemMapper;
    private final ProductMapper productMapper;
    private final AddressMapper addressMapper;

    public OrderServiceImpl(OrderMapper orderMapper, OrderItemMapper orderItemMapper,
                            CartItemMapper cartItemMapper, ProductMapper productMapper,
                            AddressMapper addressMapper) {
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
        this.cartItemMapper = cartItemMapper;
        this.productMapper = productMapper;
        this.addressMapper = addressMapper;
    }

    @Override
    @Transactional
    public OrderVO create(Long userId, OrderCreateDTO dto) {
        List<CartItem> items = cartItemMapper.selectList(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId).eq(CartItem::getChecked, 1));
        if (items.isEmpty()) {
            throw new BusinessException("请先选择要结算的商品");
        }
        Address address = addressMapper.selectOne(new LambdaQueryWrapper<Address>()
                .eq(Address::getId, dto.getAddressId()).eq(Address::getUserId, userId));
        if (address == null) {
            throw new BusinessException("收货地址不存在");
        }
        // 逐项扣库存：条件更新，不足即失败
        for (CartItem item : items) {
            int updated = productMapper.update(null, new LambdaUpdateWrapper<Product>()
                    .setSql("sales = sales + " + item.getQuantity())
                    .setSql("stock = stock - " + item.getQuantity())
                    .eq(Product::getId, item.getProductId())
                    .ge(Product::getStock, item.getQuantity()));
            if (updated == 0) {
                throw new BusinessException("商品库存不足，请调整数量后重试");
            }
        }
        // 订单快照
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setReceiver(address.getReceiver());
        order.setPhone(address.getPhone());
        order.setAddress(String.join(" ",
                address.getProvince(), address.getCity(), address.getDistrict(), address.getDetail()));
        order.setStatus(0);
        order.setTotalAmount(BigDecimal.ZERO); // total_amount NOT NULL 无默认值，先占位，插入明细后更新真实总额
        orderMapper.insert(order);

        List<Long> productIds = items.stream().map(CartItem::getProductId).toList();
        Map<Long, Product> products = productMapper.selectBatchIds(productIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));
        BigDecimal total = BigDecimal.ZERO;
        for (CartItem item : items) {
            Product p = products.get(item.getProductId());
            OrderItem oi = new OrderItem();
            oi.setOrderId(order.getId());
            oi.setProductId(p.getId());
            oi.setProductName(p.getName());
            oi.setProductImage(p.getImage());
            oi.setPrice(p.getPrice());
            oi.setQuantity(item.getQuantity());
            oi.setSubtotal(p.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            total = total.add(oi.getSubtotal());
            orderItemMapper.insert(oi);
        }
        order.setTotalAmount(total);
        orderMapper.updateById(order);
        // 删除已结算购物车项
        cartItemMapper.delete(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId).eq(CartItem::getChecked, 1));
        return detail(userId, order.getId());
    }

    @Override
    public void pay(Long userId, Long id) {
        Order order = getOwned(userId, id);
        if (order.getStatus() != 0) {
            throw new BusinessException("订单状态不允许支付");
        }
        order.setStatus(1);
        order.setPaymentTime(LocalDateTime.now());
        orderMapper.updateById(order);
    }

    @Override
    @Transactional
    public void cancel(Long userId, Long id) {
        Order order = getOwned(userId, id);
        if (order.getStatus() != 0) {
            throw new BusinessException("只有待付款订单可以取消");
        }
        order.setStatus(4);
        orderMapper.updateById(order);
        // 回滚库存和销量
        List<OrderItem> items = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>().eq(OrderItem::getOrderId, id));
        for (OrderItem oi : items) {
            productMapper.update(null, new LambdaUpdateWrapper<Product>()
                    .setSql("stock = stock + " + oi.getQuantity())
                    .setSql("sales = sales - " + oi.getQuantity())
                    .eq(Product::getId, oi.getProductId()));
        }
    }

    @Override
    public Page<OrderVO> list(Long userId, Integer status, int page, int size) {
        LambdaQueryWrapper<Order> qw = new LambdaQueryWrapper<Order>()
                .eq(Order::getUserId, userId).orderByDesc(Order::getId);
        if (status != null) qw.eq(Order::getStatus, status);
        Page<Order> result = orderMapper.selectPage(new Page<>(page, size), qw);
        return (Page<OrderVO>) result.convert(o -> toVO(o, null));
    }

    @Override
    public OrderVO detail(Long userId, Long id) {
        Order order = getOwned(userId, id);
        List<OrderItem> items = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>().eq(OrderItem::getOrderId, id));
        return toVO(order, items);
    }

    private Order getOwned(Long userId, Long id) {
        Order order = orderMapper.selectOne(new LambdaQueryWrapper<Order>()
                .eq(Order::getId, id).eq(Order::getUserId, userId));
        if (order == null) throw new BusinessException("订单不存在");
        return order;
    }

    private OrderVO toVO(Order order, List<OrderItem> items) {
        OrderVO vo = new OrderVO();
        vo.setId(order.getId());
        vo.setOrderNo(order.getOrderNo());
        vo.setReceiver(order.getReceiver());
        vo.setPhone(order.getPhone());
        vo.setAddress(order.getAddress());
        vo.setTotalAmount(order.getTotalAmount());
        vo.setStatus(order.getStatus());
        vo.setPaymentTime(order.getPaymentTime());
        vo.setCreatedAt(order.getCreatedAt());
        if (items != null) {
            vo.setItems(items.stream().map(oi -> {
                OrderItemVO iv = new OrderItemVO();
                iv.setProductId(oi.getProductId());
                iv.setProductName(oi.getProductName());
                iv.setProductImage(oi.getProductImage());
                iv.setPrice(oi.getPrice());
                iv.setQuantity(oi.getQuantity());
                iv.setSubtotal(oi.getSubtotal());
                return iv;
            }).toList());
        }
        return vo;
    }

    private String generateOrderNo() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
