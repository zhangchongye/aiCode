package com.snackstore.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.common.Result;
import com.snackstore.service.AdminService;
import com.snackstore.vo.OrderVO;
import com.snackstore.vo.StatsVO;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminOrderController {

    private final AdminService adminService;

    public AdminOrderController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/orders")
    public Result<Page<OrderVO>> list(@RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "10") int size,
                                      @RequestParam(required = false) Integer status) {
        return Result.ok(adminService.listOrders(page, size, status));
    }

    @PostMapping("/orders/{id}/ship")
    public Result<Void> ship(@PathVariable Long id) {
        adminService.shipOrder(id);
        return Result.ok(null);
    }

    @GetMapping("/stats")
    public Result<StatsVO> stats() {
        return Result.ok(adminService.stats());
    }
}
