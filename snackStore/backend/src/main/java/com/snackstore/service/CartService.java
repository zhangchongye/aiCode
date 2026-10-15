package com.snackstore.service;

import com.snackstore.dto.CartAddDTO;
import com.snackstore.dto.CartUpdateDTO;
import com.snackstore.vo.CartItemVO;

import java.util.List;

public interface CartService {

    void add(Long userId, CartAddDTO dto);

    List<CartItemVO> list(Long userId);

    void update(Long userId, Long id, CartUpdateDTO dto);

    void delete(Long userId, Long id);
}
