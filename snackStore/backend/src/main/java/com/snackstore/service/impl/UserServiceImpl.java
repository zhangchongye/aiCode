package com.snackstore.service.impl;

import com.snackstore.common.BusinessException;
import com.snackstore.common.UserContext;
import com.snackstore.dto.PasswordUpdateDTO;
import com.snackstore.dto.UserProfileDTO;
import com.snackstore.entity.User;
import com.snackstore.mapper.UserMapper;
import com.snackstore.service.UserService;
import com.snackstore.vo.UserVO;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public UserServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public UserVO getMe() {
        return toVO(userMapper.selectById(UserContext.getUserId()));
    }

    @Override
    public void updateProfile(UserProfileDTO dto) {
        User user = userMapper.selectById(UserContext.getUserId());
        if (dto.getNickname() != null && !dto.getNickname().isBlank()) {
            user.setNickname(dto.getNickname());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        userMapper.updateById(user);
    }

    @Override
    public void updatePassword(PasswordUpdateDTO dto) {
        User user = userMapper.selectById(UserContext.getUserId());
        if (!encoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new BusinessException("原密码错误");
        }
        user.setPassword(encoder.encode(dto.getNewPassword()));
        userMapper.updateById(user);
    }

    private UserVO toVO(User user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setPhone(user.getPhone());
        vo.setRole(user.getRole());
        return vo;
    }
}
