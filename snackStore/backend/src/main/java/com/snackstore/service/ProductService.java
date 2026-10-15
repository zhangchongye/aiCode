package com.snackstore.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.vo.ProductVO;

public interface ProductService {

    Page<ProductVO> list(int page, int size, Long categoryId, String keyword, String sort);

    ProductVO detail(Long id);
}
