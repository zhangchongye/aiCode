package com.snackstore.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderVO {
    private Long id;
    private String orderNo;
    private String receiver;
    private String phone;
    private String address;
    private BigDecimal totalAmount;
    private Integer status;
    private LocalDateTime paymentTime;
    private LocalDateTime createdAt;
    private List<OrderItemVO> items;
}
