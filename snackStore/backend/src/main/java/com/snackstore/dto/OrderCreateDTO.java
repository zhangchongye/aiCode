package com.snackstore.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderCreateDTO {
    @NotNull(message = "请选择收货地址")
    private Long addressId;
}
