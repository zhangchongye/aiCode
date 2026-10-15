package com.snackstore.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.common.Result;
import com.snackstore.dto.ProductDTO;
import com.snackstore.entity.Product;
import com.snackstore.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final AdminService adminService;

    public AdminProductController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    public Result<Page<Product>> list(@RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "10") int size,
                                      @RequestParam(required = false) String keyword,
                                      @RequestParam(required = false) Integer status) {
        return Result.ok(adminService.listProducts(page, size, keyword, status));
    }

    @PostMapping
    public Result<Product> create(@Valid @RequestBody ProductDTO dto) {
        return Result.ok(adminService.createProduct(dto));
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody ProductDTO dto) {
        adminService.updateProduct(id, dto);
        return Result.ok(null);
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        adminService.updateProductStatus(id, body.get("status"));
        return Result.ok(null);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminService.deleteProduct(id);
        return Result.ok(null);
    }
}
