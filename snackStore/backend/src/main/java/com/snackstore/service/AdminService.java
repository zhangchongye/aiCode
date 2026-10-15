package com.snackstore.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.dto.CategoryDTO;
import com.snackstore.dto.ProductDTO;
import com.snackstore.entity.Product;

public interface AdminService {

    Page<Product> listProducts(int page, int size, String keyword, Integer status);

    Product createProduct(ProductDTO dto);

    void updateProduct(Long id, ProductDTO dto);

    void updateProductStatus(Long id, Integer status);

    void deleteProduct(Long id);

    void createCategory(CategoryDTO dto);

    void updateCategory(Long id, CategoryDTO dto);

    void deleteCategory(Long id);
}
