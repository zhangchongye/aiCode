package com.snackstore.service;

import com.snackstore.dto.AddressDTO;
import com.snackstore.entity.Address;

import java.util.List;

public interface AddressService {

    List<Address> list(Long userId);

    void create(Long userId, AddressDTO dto);

    void update(Long userId, Long id, AddressDTO dto);

    void delete(Long userId, Long id);

    void setDefault(Long userId, Long id);
}
