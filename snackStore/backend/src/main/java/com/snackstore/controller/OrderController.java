package com.snackstore.controller;

import com.snackstore.common.Result;
import com.snackstore.common.UserContext;
import com.snackstore.dto.OrderCreateDTO;
import com.snackstore.service.OrderService;
import com.snackstore.vo.OrderVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public Result<OrderVO> create(@Valid @RequestBody OrderCreateDTO dto) {
        return Result.ok(orderService.create(UserContext.getUserId(), dto));
    }

    @GetMapping
    public Result<List<OrderVO>> list(@RequestParam(required = false) Integer status) {
        return Result.ok(orderService.list(UserContext.getUserId(), status));
    }

    @GetMapping("/{id}")
    public Result<OrderVO> detail(@PathVariable Long id) {
        return Result.ok(orderService.detail(UserContext.getUserId(), id));
    }

    @PostMapping("/{id}/pay")
    public Result<Void> pay(@PathVariable Long id) {
        orderService.pay(UserContext.getUserId(), id);
        return Result.ok(null);
    }

    @PostMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Long id) {
        orderService.cancel(UserContext.getUserId(), id);
        return Result.ok(null);
    }
}
