package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.snackstore.common.BusinessException;
import com.snackstore.dto.CartAddDTO;
import com.snackstore.dto.CartUpdateDTO;
import com.snackstore.entity.CartItem;
import com.snackstore.entity.Product;
import com.snackstore.mapper.CartItemMapper;
import com.snackstore.mapper.ProductMapper;
import com.snackstore.service.CartService;
import com.snackstore.vo.CartItemVO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    private final CartItemMapper cartItemMapper;
    private final ProductMapper productMapper;

    public CartServiceImpl(CartItemMapper cartItemMapper, ProductMapper productMapper) {
        this.cartItemMapper = cartItemMapper;
        this.productMapper = productMapper;
    }

    @Override
    public void add(Long userId, CartAddDTO dto) {
        Product product = productMapper.selectById(dto.getProductId());
        if (product == null || product.getStatus() == 0) {
            throw new BusinessException("商品不存在或已下架");
        }
        CartItem existing = cartItemMapper.selectOne(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .eq(CartItem::getProductId, dto.getProductId()));
        int newQuantity = dto.getQuantity() + (existing == null ? 0 : existing.getQuantity());
        if (newQuantity > product.getStock()) {
            throw new BusinessException("库存不足，当前库存 " + product.getStock());
        }
        if (existing == null) {
            CartItem item = new CartItem();
            item.setUserId(userId);
            item.setProductId(dto.getProductId());
            item.setQuantity(dto.getQuantity());
            item.setChecked(1);
            cartItemMapper.insert(item);
        } else {
            existing.setQuantity(newQuantity);
            cartItemMapper.updateById(existing);
        }
    }

    @Override
    public List<CartItemVO> list(Long userId) {
        List<CartItem> items = cartItemMapper.selectList(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId).orderByDesc(CartItem::getId));
        if (items.isEmpty()) return new ArrayList<>();
        List<Long> productIds = items.stream().map(CartItem::getProductId).toList();
        Map<Long, Product> products = productMapper.selectBatchIds(productIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));
        List<CartItemVO> vos = new ArrayList<>();
        for (CartItem item : items) {
            Product p = products.get(item.getProductId());
            if (p == null) continue;
            CartItemVO vo = new CartItemVO();
            vo.setId(item.getId());
            vo.setProductId(p.getId());
            vo.setProductName(p.getName());
            vo.setProductImage(p.getImage());
            vo.setPrice(p.getPrice());
            vo.setStock(p.getStock());
            vo.setQuantity(item.getQuantity());
            vo.setChecked(item.getChecked());
            vos.add(vo);
        }
        return vos;
    }

    @Override
    public void update(Long userId, Long id, CartUpdateDTO dto) {
        CartItem item = getOwned(userId, id);
        if (dto.getQuantity() != null) {
            Product p = productMapper.selectById(item.getProductId());
            if (dto.getQuantity() > p.getStock()) {
                throw new BusinessException("库存不足，当前库存 " + p.getStock());
            }
            item.setQuantity(dto.getQuantity());
        }
        if (dto.getChecked() != null) {
            item.setChecked(dto.getChecked());
        }
        cartItemMapper.updateById(item);
    }

    @Override
    public void delete(Long userId, Long id) {
        getOwned(userId, id);
        cartItemMapper.deleteById(id);
    }

    private CartItem getOwned(Long userId, Long id) {
        CartItem item = cartItemMapper.selectOne(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getId, id).eq(CartItem::getUserId, userId));
        if (item == null) {
            throw new BusinessException("购物车项不存在");
        }
        return item;
    }
}
