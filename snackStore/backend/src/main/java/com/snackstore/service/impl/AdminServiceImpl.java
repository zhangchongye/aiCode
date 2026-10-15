package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.common.BusinessException;
import com.snackstore.dto.CategoryDTO;
import com.snackstore.dto.ProductDTO;
import com.snackstore.entity.Category;
import com.snackstore.entity.Product;
import com.snackstore.mapper.CategoryMapper;
import com.snackstore.mapper.ProductMapper;
import com.snackstore.service.AdminService;
import org.springframework.stereotype.Service;

@Service
public class AdminServiceImpl implements AdminService {

    private final ProductMapper productMapper;
    private final CategoryMapper categoryMapper;

    public AdminServiceImpl(ProductMapper productMapper, CategoryMapper categoryMapper) {
        this.productMapper = productMapper;
        this.categoryMapper = categoryMapper;
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
