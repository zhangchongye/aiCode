package com.snackstore.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.dto.OrderCreateDTO;
import com.snackstore.vo.OrderVO;

public interface OrderService {

    OrderVO create(Long userId, OrderCreateDTO dto);

    void pay(Long userId, Long id);

    void cancel(Long userId, Long id);

    Page<OrderVO> list(Long userId, Integer status, int page, int size);

    OrderVO detail(Long userId, Long id);
}
