package com.snackstore.controller;

import com.snackstore.common.Result;
import com.snackstore.dto.PasswordUpdateDTO;
import com.snackstore.dto.UserProfileDTO;
import com.snackstore.service.UserService;
import com.snackstore.vo.UserVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public Result<UserVO> me() {
        return Result.ok(userService.getMe());
    }

    @PutMapping("/me")
    public Result<Void> updateProfile(@Valid @RequestBody UserProfileDTO dto) {
        userService.updateProfile(dto);
        return Result.ok(null);
    }

    @PutMapping("/password")
    public Result<Void> updatePassword(@Valid @RequestBody PasswordUpdateDTO dto) {
        userService.updatePassword(dto);
        return Result.ok(null);
    }
}
