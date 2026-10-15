package com.snackstore.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.common.Result;
import com.snackstore.dto.UserStatusDTO;
import com.snackstore.service.AdminService;
import com.snackstore.vo.UserVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    private final AdminService adminService;

    public AdminUserController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public Result<Page<UserVO>> list(@RequestParam(defaultValue = "1") int page,
                                     @RequestParam(defaultValue = "10") int size,
                                     @RequestParam(required = false) String keyword) {
        return Result.ok(adminService.listUsers(page, size, keyword));
    }

    @PutMapping("/users/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @Valid @RequestBody UserStatusDTO dto) {
        adminService.updateUserStatus(id, dto.getStatus());
        return Result.ok(null);
    }
}
