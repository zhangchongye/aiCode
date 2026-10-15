package com.snackstore.service;

import com.snackstore.dto.OrderCreateDTO;
import com.snackstore.vo.OrderVO;

import java.util.List;

public interface OrderService {

    OrderVO create(Long userId, OrderCreateDTO dto);

    void pay(Long userId, Long id);

    void cancel(Long userId, Long id);

    List<OrderVO> list(Long userId, Integer status);

    OrderVO detail(Long userId, Long id);
}
