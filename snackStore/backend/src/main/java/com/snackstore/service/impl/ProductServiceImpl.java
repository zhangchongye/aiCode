package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.entity.Product;
import com.snackstore.mapper.ProductMapper;
import com.snackstore.service.ProductService;
import com.snackstore.vo.ProductVO;
import org.springframework.stereotype.Service;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductMapper productMapper;

    public ProductServiceImpl(ProductMapper productMapper) {
        this.productMapper = productMapper;
    }

    @Override
    public Page<ProductVO> list(int page, int size, Long categoryId, String keyword, String sort) {
        LambdaQueryWrapper<Product> qw = new LambdaQueryWrapper<>();
        qw.eq(Product::getStatus, 1);
        if (categoryId != null) {
            qw.eq(Product::getCategoryId, categoryId);
        }
        if (keyword != null && !keyword.isBlank()) {
            qw.like(Product::getName, keyword);
        }
        switch (sort == null ? "" : sort) {
            case "sales_desc" -> qw.orderByDesc(Product::getSales);
            case "price_asc" -> qw.orderByAsc(Product::getPrice);
            case "price_desc" -> qw.orderByDesc(Product::getPrice);
            default -> qw.orderByDesc(Product::getId);
        }
        Page<Product> result = productMapper.selectPage(new Page<>(page, size), qw);
        return (Page<ProductVO>) result.convert(this::toVO);
    }

    @Override
    public ProductVO detail(Long id) {
        Product p = productMapper.selectById(id);
        if (p == null || p.getStatus() == 0) {
            throw new com.snackstore.common.BusinessException("商品不存在或已下架");
        }
        return toVO(p);
    }

    private ProductVO toVO(Product p) {
        ProductVO vo = new ProductVO();
        vo.setId(p.getId());
        vo.setCategoryId(p.getCategoryId());
        vo.setName(p.getName());
        vo.setDescription(p.getDescription());
        vo.setImage(p.getImage());
        vo.setPrice(p.getPrice());
        vo.setStock(p.getStock());
        vo.setSales(p.getSales());
        return vo;
    }
}
