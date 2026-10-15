package com.snackstore.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.snackstore.common.Result;
import com.snackstore.dto.CategoryDTO;
import com.snackstore.entity.Category;
import com.snackstore.mapper.CategoryMapper;
import com.snackstore.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
public class AdminCategoryController {

    private final AdminService adminService;
    private final CategoryMapper categoryMapper;

    public AdminCategoryController(AdminService adminService, CategoryMapper categoryMapper) {
        this.adminService = adminService;
        this.categoryMapper = categoryMapper;
    }

    @GetMapping
    public Result<List<Category>> list() {
        return Result.ok(categoryMapper.selectList(
                new LambdaQueryWrapper<Category>().orderByAsc(Category::getSort)));
    }

    @PostMapping
    public Result<Void> create(@Valid @RequestBody CategoryDTO dto) {
        adminService.createCategory(dto);
        return Result.ok(null);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody CategoryDTO dto) {
        adminService.updateCategory(id, dto);
        return Result.ok(null);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        adminService.deleteCategory(id);
        return Result.ok(null);
    }
}
