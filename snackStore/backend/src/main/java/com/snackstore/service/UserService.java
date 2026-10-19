package com.snackstore.service;

import com.snackstore.dto.PasswordUpdateDTO;
import com.snackstore.dto.UserProfileDTO;
import com.snackstore.vo.UserVO;

public interface UserService {

    UserVO getMe();

    void updateProfile(UserProfileDTO dto);

    void updatePassword(PasswordUpdateDTO dto);
}
