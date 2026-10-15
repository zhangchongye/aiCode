package com.snackstore.service;

import com.snackstore.dto.LoginDTO;
import com.snackstore.dto.RegisterDTO;
import com.snackstore.vo.LoginVO;

public interface AuthService {

    void register(RegisterDTO dto);

    LoginVO login(LoginDTO dto);
}
