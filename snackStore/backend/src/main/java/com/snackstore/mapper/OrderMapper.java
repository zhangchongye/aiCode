package com.snackstore.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snackstore.entity.Order;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OrderMapper extends BaseMapper<Order> {
}
