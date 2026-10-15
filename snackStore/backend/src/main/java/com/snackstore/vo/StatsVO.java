package com.snackstore.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class StatsVO {
    private Long todayOrderCount;
    private BigDecimal todaySales;
    private Long totalUsers;
    private Long totalProducts;
    private Long pendingShipCount;
    private List<Map<String, Object>> lowStockProducts;
}
