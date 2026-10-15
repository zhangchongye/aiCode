package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.snackstore.common.BusinessException;
import com.snackstore.dto.AddressDTO;
import com.snackstore.entity.Address;
import com.snackstore.mapper.AddressMapper;
import com.snackstore.service.AddressService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressServiceImpl implements AddressService {

    private final AddressMapper addressMapper;

    public AddressServiceImpl(AddressMapper addressMapper) {
        this.addressMapper = addressMapper;
    }

    @Override
    public List<Address> list(Long userId) {
        return addressMapper.selectList(new LambdaQueryWrapper<Address>()
                .eq(Address::getUserId, userId)
                .orderByDesc(Address::getIsDefault).orderByDesc(Address::getId));
    }

    @Override
    @Transactional
    public void create(Long userId, AddressDTO dto) {
        // 第一个地址自动设为默认
        Long count = addressMapper.selectCount(
                new LambdaQueryWrapper<Address>().eq(Address::getUserId, userId));
        Address addr = new Address();
        copy(addr, dto);
        addr.setUserId(userId);
        addr.setIsDefault(count == 0 ? 1 : (dto.getIsDefault() != null && dto.getIsDefault() == 1 ? 1 : 0));
        if (addr.getIsDefault() == 1) clearDefault(userId);
        addressMapper.insert(addr);
    }

    @Override
    @Transactional
    public void update(Long userId, Long id, AddressDTO dto) {
        Address addr = getOwned(userId, id);
        copy(addr, dto);
        if (dto.getIsDefault() != null && dto.getIsDefault() == 1 && addr.getIsDefault() != 1) {
            clearDefault(userId);
            addr.setIsDefault(1);
        }
        addressMapper.updateById(addr);
    }

    @Override
    public void delete(Long userId, Long id) {
        getOwned(userId, id);
        addressMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void setDefault(Long userId, Long id) {
        Address addr = getOwned(userId, id);
        clearDefault(userId);
        addr.setIsDefault(1);
        addressMapper.updateById(addr);
    }

    private void clearDefault(Long userId) {
        Address update = new Address();
        update.setIsDefault(0);
        addressMapper.update(update, new LambdaQueryWrapper<Address>()
                .eq(Address::getUserId, userId).eq(Address::getIsDefault, 1));
    }

    private Address getOwned(Long userId, Long id) {
        Address addr = addressMapper.selectOne(new LambdaQueryWrapper<Address>()
                .eq(Address::getId, id).eq(Address::getUserId, userId));
        if (addr == null) {
            throw new BusinessException("地址不存在");
        }
        return addr;
    }

    private void copy(Address addr, AddressDTO dto) {
        addr.setReceiver(dto.getReceiver());
        addr.setPhone(dto.getPhone());
        addr.setProvince(dto.getProvince());
        addr.setCity(dto.getCity());
        addr.setDistrict(dto.getDistrict());
        addr.setDetail(dto.getDetail());
    }
}
